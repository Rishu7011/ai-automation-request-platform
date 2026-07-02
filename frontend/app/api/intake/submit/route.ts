// Task 2.12 — /api/intake/submit
// Agent Orchestration & Request Submission endpoint.
//
// Pipeline (on POST):
//   1. Validate request ownership & draft status
//   2. Set status → ai_reviewing
//   3. Run extraction agents (parallel where safe):
//        • Information Extraction  (all stages)
//        • ROI Extraction          (stages 5+6)
//        • Effort Estimation       (uses extracted summary)
//        • Categorization          (uses extracted summary)
//        • Priority Recommendation (uses full conversation)
//   4. Run deterministic calculation engine
//   5. Run Summary Generation Agent
//   6. Persist RequestSummary + RequestEstimate
//   7. Update Request: status → submitted, priorityScore, tags, submittedAt
//   8. Write StatusHistory + AuditLog entries
//   9. Return success with summary data

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestConversation } from '@/models/RequestConversation';
import { RequestSummary } from '@/models/RequestSummary';
import { RequestEstimate } from '@/models/RequestEstimate';
import { AuditLog } from '@/models/AuditLog';
import { PriorityWeightsConfig } from '@/models/PriorityWeightsConfig';
import { INTAKE_STAGES, DEFAULT_PRIORITY_WEIGHTS } from '@/constants';
import { runExtractionAgent } from '@/lib/agents/extraction-agent';
import { runROIExtractionAgent } from '@/lib/agents/roi-extraction-agent';
import { runEffortEstimationAgent } from '@/lib/agents/effort-estimation-agent';
import { runCategorizationAgent } from '@/lib/agents/categorization-agent';
import { runPriorityRecommendationAgent } from '@/lib/agents/priority-recommendation-agent';
import { runSummaryGenerationAgent } from '@/lib/agents/summary-generation-agent';
import { runDuplicateDetectionAgent } from '@/lib/agents/duplicate-detection-agent';
import { calculateROI, calculatePriorityScore } from '@/lib/calculations';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { requestId } = body as { requestId: string };

  if (!requestId) {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }

  await connectToDatabase();

  // ── 1. Validate request ──────────────────────────────────────────────────────

  const request = await Request.findById(requestId);
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  const role = (session.user as unknown as { role?: string })?.role;
  const isRequester = request.requesterId.toString() === session.user.id;
  const isAdmin = role === 'eng_admin' || role === 'sys_admin';

  if (!isRequester && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (request.status !== 'draft') {
    return NextResponse.json(
      { error: `Request is already in status "${request.status}"` },
      { status: 409 }
    );
  }

  const department = request.department;

  // ── 2. Set status → ai_reviewing ─────────────────────────────────────────────

  const previousStatus = request.status;
  request.status = 'ai_reviewing';
  request.statusHistory.push({
    oldStatus: previousStatus,
    newStatus: 'ai_reviewing',
    changedBy: request.requesterId,
    changedAt: new Date(),
  });
  await request.save();

  // ── 3. Load conversation history ─────────────────────────────────────────────

  const allTurns = await RequestConversation.find({ requestId })
    .sort({ timestamp: 1 })
    .lean();

  // Group turns by stage
  const turnsByStage = new Map<number, typeof allTurns>();
  for (const turn of allTurns) {
    const stage = turn.stage;
    if (!turnsByStage.has(stage)) turnsByStage.set(stage, []);
    turnsByStage.get(stage)!.push(turn);
  }

  const toMessages = (turns: typeof allTurns) =>
    turns.map((t) => ({
      role: t.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: t.message,
    }));

  const fullConversation = toMessages(allTurns);

  // ── 4. Run agents in parallel (where safe) ────────────────────────────────────

  // Phase A: Run extraction, ROI, and priority recommendation in parallel
  // (none of these depend on each other)
  const [extractionResults, roiResult, priorityResult] = await Promise.all([
    // Information Extraction: run per-stage, then merge
    (async () => {
      const stageResults = await Promise.all(
        INTAKE_STAGES.map(async (s) => {
          const stageTurns = turnsByStage.get(s.id) ?? [];
          if (stageTurns.length === 0) return {};
          return runExtractionAgent({
            stageNumber: s.id,
            stageName: s.name,
            department,
            conversationTurns: toMessages(stageTurns),
          });
        })
      );
      // Merge: later stages can override earlier ones for overlapping fields
      return stageResults.reduce((merged, result) => {
        const merged2 = { ...merged };
        for (const [key, val] of Object.entries(result)) {
          if (val === undefined || val === null) continue;
          if (Array.isArray(val) && Array.isArray(merged2[key as keyof typeof merged2])) {
            // Merge arrays (deduplicate strings)
            const existing = merged2[key as keyof typeof merged2] as string[];
            const incoming = val as string[];
            (merged2 as Record<string, unknown>)[key] = [
              ...new Set([...existing, ...incoming]),
            ];
          } else {
            (merged2 as Record<string, unknown>)[key] = val;
          }
        }
        return merged2;
      }, {} as Record<string, unknown>);
    })(),

    // ROI Extraction: Stages 5 & 6
    runROIExtractionAgent({
      department,
      metricsConversation: toMessages(turnsByStage.get(5) ?? []),
      roiConversation: toMessages(turnsByStage.get(6) ?? []),
    }),

    // Priority Recommendation: full conversation
    runPriorityRecommendationAgent({
      department,
      conversationHistory: fullConversation,
    }),
  ]);

  // Phase B: Effort estimation + Categorization (need extractionResults)
  const [effortResult, categorizationResult] = await Promise.all([
    runEffortEstimationAgent({
      processDescription: extractionResults.processDescription as string | undefined,
      painPoints: extractionResults.painPoints as string[] | undefined,
      toolsUsed: extractionResults.toolsUsed as string[] | undefined,
      department,
      desiredOutcome: extractionResults.desiredOutcome as string | undefined,
    }),
    runCategorizationAgent({
      department,
      processDescription: extractionResults.processDescription as string | undefined,
      toolsUsed: extractionResults.toolsUsed as string[] | undefined,
      painPoints: extractionResults.painPoints as string[] | undefined,
      desiredOutcome: extractionResults.desiredOutcome as string | undefined,
    }),
  ]);

  // ── 5. Deterministic calculation engine ──────────────────────────────────────

  const roiInputs = {
    hoursPerOccurrence: roiResult.hoursPerOccurrence,
    frequencyPerYear: roiResult.frequencyPerYear,
    peopleInvolved: roiResult.peopleInvolved,
    blendedHourlyCost: roiResult.blendedHourlyCost,
    effortSize: effortResult.effortSize,
  };
  const roiCalc = calculateROI(roiInputs);

  // Load weights from DB (fall back to defaults)
  const weightsDoc = await PriorityWeightsConfig.findOne().sort({ updatedAt: -1 }).lean();
  const weights = weightsDoc ?? DEFAULT_PRIORITY_WEIGHTS;

  const roiConfidence = roiResult.overallConfidence; // 'HIGH' | 'MEDIUM' | 'LOW'
  const effortConfidence = effortResult.confidence === 'high'
    ? 'HIGH'
    : effortResult.confidence === 'medium'
    ? 'MEDIUM'
    : 'LOW';

  const priorityScore = calculatePriorityScore(
    {
      estimatedRoi: roiCalc.annualDollarsSaved,
      strategicValue: priorityResult.strategicValue,
      urgency: priorityResult.urgency,
      orgImpact: priorityResult.orgImpact,
      effortSize: effortResult.effortSize,
      riskLevel: priorityResult.riskLevel,
      roiConfidence,
    },
    {
      weightRoi: weights.weightRoi,
      weightStrategicValue: weights.weightStrategicValue,
      weightUrgency: weights.weightUrgency,
      weightOrgImpact: weights.weightOrgImpact,
      weightEffort: weights.weightEffort,
      weightRisk: weights.weightRisk,
    }
  );

  // ── 6. Summary Generation Agent ───────────────────────────────────────────────

  const summaryResult = await runSummaryGenerationAgent({
    department,
    processDescription: extractionResults.processDescription as string | undefined,
    painPoints: extractionResults.painPoints as string[] | undefined,
    toolsUsed: extractionResults.toolsUsed as string[] | undefined,
    desiredOutcome: extractionResults.desiredOutcome as string | undefined,
    annualHoursSaved: roiCalc.annualHoursSaved,
    annualDollarsSaved: roiCalc.annualDollarsSaved,
    effortSize: effortResult.effortSize,
    riskFlags: effortResult.riskFlags,
    roiConfidence,
    effortConfidence,
    priorityScore,
    automationType: categorizationResult.automationType,
    systemsTouched: categorizationResult.systemsTouched,
  });

  // ── 7. Persist RequestSummary ─────────────────────────────────────────────────

  await RequestSummary.findOneAndUpdate(
    { requestId },
    {
      $set: {
        processDescription: extractionResults.processDescription,
        painPoints: extractionResults.painPoints,
        peopleInvolved:
          (extractionResults.peopleInvolved as number | undefined) ?? roiResult.peopleInvolved,
        hoursPerOccurrence:
          (extractionResults.hoursPerOccurrence as number | undefined) ??
          roiResult.hoursPerOccurrence,
        frequencyPerYear:
          (extractionResults.frequencyPerYear as number | undefined) ?? roiResult.frequencyPerYear,
        toolsUsed: extractionResults.toolsUsed,
        risks: extractionResults.risks,
        desiredOutcome: extractionResults.desiredOutcome,
        departmentSpecificFields: extractionResults.departmentSpecificFields ?? {},
      },
    },
    { upsert: true, new: true }
  );

  // ── 8. Persist RequestEstimate ────────────────────────────────────────────────

  await RequestEstimate.findOneAndUpdate(
    { requestId },
    {
      $set: {
        annualHoursSaved: roiCalc.annualHoursSaved,
        annualDollarsSaved: roiCalc.annualDollarsSaved,
        effortSize: effortResult.effortSize,
        buildCostEstimate: roiCalc.buildCostMid,
        roiConfidence,
        effortConfidence,
        priorityScore,
        priorityInputs: {
          estimatedRoi: roiCalc.annualDollarsSaved,
          effortSize: effortResult.effortSize,
          strategicValue: priorityResult.strategicValue,
          urgency: priorityResult.urgency,
          orgImpact: priorityResult.orgImpact,
          riskLevel: priorityResult.riskLevel,
          confidenceMultiplier:
            roiConfidence === 'HIGH' ? 1.0 : roiConfidence === 'MEDIUM' ? 0.85 : 0.7,
          urgencySignals: priorityResult.urgencySignals,
          rationale: priorityResult.rationale,
        },
        requesterNarrative: summaryResult.requesterNarrative,
        engineeringNarrative: summaryResult.engineeringNarrative,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // ── 9. Update Request: submitted ─────────────────────────────────────────────

  const allTags = [
    ...new Set([
      ...categorizationResult.departmentTags,
      categorizationResult.automationType,
      ...categorizationResult.systemsTouched,
    ]),
  ];

  await Request.findByIdAndUpdate(requestId, {
    $set: {
      status: 'submitted',
      priorityScore,
      roiConfidence,
      effortConfidence,
      tags: allTags,
      submittedAt: new Date(),
    },
    $push: {
      statusHistory: {
        oldStatus: 'ai_reviewing',
        newStatus: 'submitted',
        changedBy: request.requesterId,
        changedAt: new Date(),
      },
    },
  });

  // ── 9.5. Run Duplicate Detection Agent ────────────────────────────────────────
  await runDuplicateDetectionAgent(requestId);

  // ── 10. Write AuditLog ────────────────────────────────────────────────────────

  await AuditLog.create({
    actorId: request.requesterId,
    actionType: 'REQUEST_SUBMITTED',
    entityType: 'Request',
    entityId: request._id,
    beforeState: { status: previousStatus },
    afterState: {
      status: 'submitted',
      priorityScore,
      roiConfidence,
      effortSize: effortResult.effortSize,
      annualDollarsSaved: roiCalc.annualDollarsSaved,
    },
    timestamp: new Date(),
  });

  // ── 11. Return summary for UI ─────────────────────────────────────────────────

  return NextResponse.json({
    success: true,
    requestId,
    status: 'submitted',
    priorityScore,
    roiConfidence,
    estimate: {
      annualHoursSaved: roiCalc.annualHoursSaved,
      annualDollarsSaved: roiCalc.annualDollarsSaved,
      buildCostMid: roiCalc.buildCostMid,
      simpleROI: roiCalc.simpleROI,
      effortSize: effortResult.effortSize,
      riskFlags: effortResult.riskFlags,
    },
    narratives: {
      requester: summaryResult.requesterNarrative,
      engineering: summaryResult.engineeringNarrative,
    },
    categorization: {
      automationType: categorizationResult.automationType,
      departmentTags: categorizationResult.departmentTags,
      systemsTouched: categorizationResult.systemsTouched,
    },
  });
}
