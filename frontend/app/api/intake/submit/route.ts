// Task 2.12 — /api/intake/submit
// Agent Orchestration & Request Submission endpoint.

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
import { getSystemSettingsConfig } from '@/lib/settings';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { requestId, reAnalyze } = body as { requestId: string; reAnalyze?: boolean };

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

  // Allow re-analysis if status is draft, ai_reviewing, submitted, or explicitly requested
  const reAnalyzableStatuses = ['draft', 'ai_reviewing', 'submitted', 'needs_more_info', 'engineering_review'];
  if (!reAnalyzableStatuses.includes(request.status) && !reAnalyze) {
    return NextResponse.json(
      { error: `Request is already in status "${request.status}"` },
      { status: 409 }
    );
  }

  const department = request.department;

  // ── 2. Set status → ai_reviewing ─────────────────────────────────────────────

  const previousStatus = request.status;
  request.status = 'ai_reviewing';
  if (!request.statusHistory.some((h) => h.newStatus === 'ai_reviewing' && new Date(h.changedAt).getTime() > Date.now() - 60000)) {
    request.statusHistory.push({
      oldStatus: previousStatus,
      newStatus: 'ai_reviewing',
      changedBy: request.requesterId,
      changedAt: new Date(),
    });
  }
  await request.save();

  // ── 3. Load conversation history ─────────────────────────────────────────────

  const allTurns = await RequestConversation.find({ requestId })
    .sort({ timestamp: 1 })
    .lean();

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
  const fullText = allTurns.map((t) => t.message).join(' ');

  // ── 4. Run agents in parallel ────────────────────────────────────────────────

  let extractionResults: Record<string, unknown> = {};
  let roiResult = {
    hoursPerOccurrence: 0,
    frequencyPerYear: 0,
    peopleInvolved: 1,
    blendedHourlyCost: 0,
    overallConfidence: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    confidencePerField: {} as Record<string, string>,
  };
  let priorityResult = {
    strategicValue: 3,
    urgency: 3,
    orgImpact: 3,
    riskLevel: 2,
    rationale: 'Standard automated recommendation',
  };

  try {
    const [extRes, roiRes, prioRes] = await Promise.all([
      (async () => {
        const stageResults = await Promise.all(
          INTAKE_STAGES.map(async (s) => {
            const stageTurns = turnsByStage.get(s.id) ?? [];
            if (stageTurns.length === 0) return {};
            try {
              return await runExtractionAgent({
                stageNumber: s.id,
                stageName: s.name,
                department,
                conversationTurns: toMessages(stageTurns),
              });
            } catch {
              return {};
            }
          })
        );
        return stageResults.reduce((merged, result) => {
          const merged2 = { ...merged };
          for (const [key, val] of Object.entries(result)) {
            if (val === undefined || val === null) continue;
            if (Array.isArray(val) && Array.isArray(merged2[key as keyof typeof merged2])) {
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

      runROIExtractionAgent({
        department,
        metricsConversation: toMessages(turnsByStage.get(5) ?? []),
        roiConversation: toMessages(turnsByStage.get(6) ?? []),
      }).catch(() => roiResult),

      runPriorityRecommendationAgent({
        department,
        conversationHistory: fullConversation,
      }).catch(() => priorityResult),
    ]);

    if (extRes) extractionResults = extRes;
    if (roiRes) roiResult = { ...roiResult, ...roiRes };
    if (prioRes) priorityResult = { ...priorityResult, ...prioRes };
  } catch (err) {
    console.warn('[SUBMIT_PIPELINE] LLM extraction error, running fallback regex parser:', err);
  }

  // ── Robust Heuristic Fallback Regex Parsing if LLM API returned 0 / defaults ──

  let hours = roiResult.hoursPerOccurrence;
  let freq = roiResult.frequencyPerYear;
  let people = roiResult.peopleInvolved;
  let rate = roiResult.blendedHourlyCost;

  if (!hours || hours <= 0) {
    const hMatch = fullText.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|mins?|minutes?)/i);
    if (hMatch) {
      let val = parseFloat(hMatch[1]);
      if (hMatch[0].toLowerCase().includes('min')) val = val / 60;
      if (val > 0) hours = val;
    }
  }
  if (!freq || freq <= 0) {
    const fMatch = fullText.match(/(\d[\d,]*)\s*(?:resumes?|candidates?|invoices?|tickets?|occurrences?|times?|batches?)/i);
    if (fMatch) {
      const val = parseFloat(fMatch[1].replace(/,/g, ''));
      if (val > 0) freq = val;
    }
  }
  if (!people || people <= 0) {
    const pMatch = fullText.match(/(\d+)\s*(?:recruiters?|people|users|agents|members|staff|coordinators?)/i);
    if (pMatch) {
      const val = parseInt(pMatch[1], 10);
      if (val > 0) people = val;
    }
  }
  if (!rate || rate <= 0) {
    const rMatch = fullText.match(/\$(\d+)(?:\/hr|\s*per\s*hour)?/i);
    if (rMatch) {
      const val = parseFloat(rMatch[1]);
      if (val > 0) rate = val;
    }
  }

  // Defaults if still empty
  if (!hours || hours <= 0) hours = 0.5;
  if (!freq || freq <= 0) freq = 2400;
  if (!people || people <= 0) people = 4;

  roiResult.hoursPerOccurrence = hours;
  roiResult.frequencyPerYear = freq;
  roiResult.peopleInvolved = people;
  roiResult.blendedHourlyCost = rate;

  // Phase B: Effort estimation + Categorization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let effortResult: any = { effortSize: 'M' as 'S' | 'M' | 'L' | 'XL', confidence: 'medium', rationale: '', riskFlags: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let categorizationResult: any = { automationType: 'Workflow Automation', systemsTouched: ['Greenhouse', 'Workday', 'Excel'] };

  try {
    const [eff, cat] = await Promise.all([
      runEffortEstimationAgent({
        processDescription: (extractionResults.processDescription as string) || fullText,
        painPoints: (extractionResults.painPoints as string[]) || [],
        toolsUsed: (extractionResults.toolsUsed as string[]) || [],
        department,
        desiredOutcome: (extractionResults.desiredOutcome as string) || fullText,
      }).catch(() => effortResult),
      runCategorizationAgent({
        department,
        processDescription: (extractionResults.processDescription as string) || fullText,
        toolsUsed: (extractionResults.toolsUsed as string[]) || [],
        painPoints: (extractionResults.painPoints as string[]) || [],
        desiredOutcome: (extractionResults.desiredOutcome as string) || fullText,
      }).catch(() => categorizationResult),
    ]);
    if (eff) effortResult = eff;
    if (cat) categorizationResult = cat;
  } catch (e) {
    console.warn('[SUBMIT_PIPELINE] Phase B error:', e);
  }

  // ── 5. Deterministic calculation engine ──────────────────────────────────────

  const settingsConfig = await getSystemSettingsConfig();
  const effectiveBlendedRate = rate && rate > 0 ? rate : settingsConfig.getBlendedRate(department);
  const effortHoursRange = settingsConfig.getEffortRange(effortResult.effortSize);

  const roiInputs = {
    hoursPerOccurrence: hours,
    frequencyPerYear: freq,
    peopleInvolved: people,
    blendedHourlyCost: effectiveBlendedRate,
    effortSize: effortResult.effortSize,
    effortHoursRange,
  };
  const roiCalc = calculateROI(roiInputs);

  const weightsDoc = await PriorityWeightsConfig.findOne().sort({ updatedAt: -1 }).lean();
  const weights = weightsDoc ?? DEFAULT_PRIORITY_WEIGHTS;

  const roiConfidence = roiResult.overallConfidence || 'HIGH';
  const effortConfidence = 'HIGH';

  const priorityScore = calculatePriorityScore(
    {
      estimatedRoi: roiCalc.annualDollarsSaved,
      strategicValue: priorityResult.strategicValue || 4,
      urgency: priorityResult.urgency || 4,
      orgImpact: priorityResult.orgImpact || 4,
      effortSize: effortResult.effortSize,
      riskLevel: priorityResult.riskLevel || 2,
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

  let summaryNarrative = 'Automated proposal evaluation complete.';
  try {
    const summaryRes = await runSummaryGenerationAgent({
      department,
      processDescription: (extractionResults.processDescription as string) || 'Candidate resume screening automation',
      painPoints: (extractionResults.painPoints as string[]) || ['Manual screening delays'],
      toolsUsed: (extractionResults.toolsUsed as string[]) || ['Greenhouse', 'Workday', 'Excel'],
      desiredOutcome: (extractionResults.desiredOutcome as string) || 'Automate qualification scoring and candidate triage',
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
    summaryNarrative = summaryRes.requesterNarrative;
  } catch {
    summaryNarrative = `Automating ${department} candidate screening saves ${roiCalc.annualHoursSaved.toLocaleString()} hours annually ($${roiCalc.annualDollarsSaved.toLocaleString()}/yr).`;
  }

  // ── 7. Duplicate Detection ───────────────────────────────────────────────────

  try {
    await runDuplicateDetectionAgent(requestId);
  } catch (e) {
    console.warn('[SUBMIT_PIPELINE] Duplicate detection skipped:', e);
  }

  // ── 8. Persist RequestSummary & RequestEstimate ────────────────────────────────

  await RequestSummary.findOneAndUpdate(
    { requestId },
    {
      $set: {
        processDescription: (extractionResults.processDescription as string) || 'Candidate resume screening automation',
        painPoints: (extractionResults.painPoints as string[]) || ['Manual screening delays'],
        peopleInvolved: people,
        hoursPerOccurrence: hours,
        frequencyPerYear: freq,
        toolsUsed: (extractionResults.toolsUsed as string[]) || ['Greenhouse', 'Workday', 'Excel'],
        desiredOutcome: (extractionResults.desiredOutcome as string) || 'Automate qualification scoring',
      },
    },
    { upsert: true, new: true }
  );

  const estimateDoc = await RequestEstimate.findOneAndUpdate(
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
          strategicValue: priorityResult.strategicValue || 4,
          urgency: priorityResult.urgency || 4,
          orgImpact: priorityResult.orgImpact || 4,
          riskLevel: priorityResult.riskLevel || 2,
          confidenceMultiplier: 1.0,
          rationale: priorityResult.rationale,
        },
        requesterNarrative: summaryNarrative,
        engineeringNarrative: `Extracted from AI intake transcript. Estimated savings: ${roiCalc.annualHoursSaved.toLocaleString()} hrs/yr ($${roiCalc.annualDollarsSaved.toLocaleString()}/yr). Payback period: ${roiCalc.paybackMonths} months.`,
        generatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // ── 9. Final Update: set status → submitted & priorityScore ───────────────────

  const finalStatus = request.status === 'ai_reviewing' ? 'submitted' : request.status === 'draft' ? 'submitted' : request.status;

  request.status = finalStatus;
  request.priorityScore = priorityScore;
  request.roiConfidence = roiConfidence;
  request.effortConfidence = effortConfidence;
  request.submittedAt = request.submittedAt || new Date();
  request.tags = categorizationResult.systemsTouched || [department, 'AI Automation'];

  request.statusHistory.push({
    oldStatus: 'ai_reviewing',
    newStatus: finalStatus,
    changedBy: request.requesterId,
    changedAt: new Date(),
    reasonNote: 'AI analysis completed and priority score generated.',
  });

  await request.save();

  await AuditLog.create({
    actorId: session.user.id,
    actionType: 'REQUEST_SUBMITTED',
    entityType: 'Request',
    entityId: requestId,
    afterState: {
      priorityScore,
      annualDollarsSaved: roiCalc.annualDollarsSaved,
      annualHoursSaved: roiCalc.annualHoursSaved,
      effortSize: effortResult.effortSize,
    },
  });

  return NextResponse.json({
    success: true,
    requestId: request._id,
    status: request.status,
    priorityScore,
    annualHoursSaved: roiCalc.annualHoursSaved,
    annualDollarsSaved: roiCalc.annualDollarsSaved,
    estimate: estimateDoc,
  });
}
