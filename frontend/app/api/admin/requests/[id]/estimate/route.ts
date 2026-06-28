// /api/admin/requests/[id]/estimate — GET estimate + summary, PATCH override fields
// Task 4.2: Engineering Review Panel backend

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestEstimate } from '@/models/RequestEstimate';
import { RequestSummary } from '@/models/RequestSummary';
import { AuditLog } from '@/models/AuditLog';
import { calculateROI, calculatePriorityScore } from '@/lib/calculations';
import { DEFAULT_PRIORITY_WEIGHTS } from '@/constants';
import { PriorityWeightsConfig } from '@/models/PriorityWeightsConfig';
import mongoose from 'mongoose';

function requireAdmin(session: { user?: { id?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

// GET — return full estimate + summary for engineering review
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();

  const [request, estimate, summary] = await Promise.all([
    Request.findById(id)
      .populate('requesterId', 'name email username department')
      .populate('assignedTo', 'name username')
      .lean(),
    RequestEstimate.findOne({ requestId: id }).lean(),
    RequestSummary.findOne({ requestId: id }).lean(),
  ]);

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ request, estimate, summary });
}

// PATCH — override estimate fields, recalculate ROI + priority
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const {
    hoursPerOccurrence,
    frequencyPerYear,
    peopleInvolved,
    blendedHourlyCost,
    effortSize,
    strategicValue,
    urgency,
    orgImpact,
    riskLevel,
  } = body as {
    hoursPerOccurrence?: number;
    frequencyPerYear?: number;
    peopleInvolved?: number;
    blendedHourlyCost?: number;
    effortSize?: 'S' | 'M' | 'L' | 'XL';
    strategicValue?: number;
    urgency?: number;
    orgImpact?: number;
    riskLevel?: number;
  };

  await connectToDatabase();

  const [existing, weightsDoc] = await Promise.all([
    RequestEstimate.findOne({ requestId: id }),
    PriorityWeightsConfig.findOne().sort({ updatedAt: -1 }).lean(),
  ]);

  if (!existing) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });

  // Track what changed for audit diff
  const overriddenFields: Record<string, { before: unknown; after: unknown }> = {};
  const track = <T>(key: string, before: T, after: T | undefined) => {
    if (after !== undefined && after !== before) {
      overriddenFields[key] = { before, after };
    }
  };

  // Merge overrides onto existing values
  const merged = {
    hoursPerOccurrence: hoursPerOccurrence ?? (existing.priorityInputs?.estimatedRoi ?? 0),
    frequencyPerYear: frequencyPerYear ?? 12,
    peopleInvolved: peopleInvolved ?? 1,
    blendedHourlyCost: blendedHourlyCost ?? 75,
    effortSize: effortSize ?? existing.effortSize,
  };

  // Build ROI summary to get annualDollarsSaved for priority score
  const summaryDoc = await RequestSummary.findOne({ requestId: id }).lean();
  const roiInputs = {
    hoursPerOccurrence: hoursPerOccurrence ?? (summaryDoc?.hoursPerOccurrence ?? 1),
    frequencyPerYear: frequencyPerYear ?? (summaryDoc?.frequencyPerYear ?? 12),
    peopleInvolved: peopleInvolved ?? (summaryDoc?.peopleInvolved ?? 1),
    blendedHourlyCost: blendedHourlyCost ?? 75,
    effortSize: effortSize ?? existing.effortSize,
  };

  track('hoursPerOccurrence', summaryDoc?.hoursPerOccurrence, hoursPerOccurrence);
  track('frequencyPerYear', summaryDoc?.frequencyPerYear, frequencyPerYear);
  track('peopleInvolved', summaryDoc?.peopleInvolved, peopleInvolved);
  track('blendedHourlyCost', blendedHourlyCost, blendedHourlyCost);
  track('effortSize', existing.effortSize, effortSize);
  track('strategicValue', existing.priorityInputs?.strategicValue, strategicValue);
  track('urgency', existing.priorityInputs?.urgency, urgency);
  track('orgImpact', existing.priorityInputs?.orgImpact, orgImpact);
  track('riskLevel', existing.priorityInputs?.riskLevel, riskLevel);

  const roiCalc = calculateROI(roiInputs);

  const weights = weightsDoc ?? DEFAULT_PRIORITY_WEIGHTS;
  const newPriorityScore = calculatePriorityScore(
    {
      estimatedRoi: roiCalc.annualDollarsSaved,
      strategicValue: strategicValue ?? existing.priorityInputs?.strategicValue ?? 3,
      urgency: urgency ?? existing.priorityInputs?.urgency ?? 3,
      orgImpact: orgImpact ?? existing.priorityInputs?.orgImpact ?? 3,
      effortSize: effortSize ?? existing.effortSize,
      riskLevel: riskLevel ?? existing.priorityInputs?.riskLevel ?? 2,
      roiConfidence: existing.roiConfidence,
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

  // Persist updated estimate
  const updatedEstimate = await RequestEstimate.findOneAndUpdate(
    { requestId: id },
    {
      $set: {
        annualHoursSaved: roiCalc.annualHoursSaved,
        annualDollarsSaved: roiCalc.annualDollarsSaved,
        buildCostEstimate: roiCalc.buildCostMid,
        effortSize: merged.effortSize,
        priorityScore: newPriorityScore,
        isOverridden: true,
        overriddenBy: new mongoose.Types.ObjectId(session.user.id),
        overriddenFields: {
          ...(existing.overriddenFields ?? {}),
          ...overriddenFields,
        },
        'priorityInputs.strategicValue': strategicValue ?? existing.priorityInputs?.strategicValue,
        'priorityInputs.urgency': urgency ?? existing.priorityInputs?.urgency,
        'priorityInputs.orgImpact': orgImpact ?? existing.priorityInputs?.orgImpact,
        'priorityInputs.riskLevel': riskLevel ?? existing.priorityInputs?.riskLevel,
        'priorityInputs.estimatedRoi': roiCalc.annualDollarsSaved,
        'priorityInputs.effortSize': merged.effortSize,
      },
    },
    { new: true }
  );

  // Update Request.priorityScore
  await Request.findByIdAndUpdate(id, { $set: { priorityScore: newPriorityScore } });

  // Write AuditLog
  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(session.user.id),
    actionType: 'ESTIMATE_OVERRIDE',
    entityType: 'RequestEstimate',
    entityId: existing._id,
    beforeState: { priorityScore: existing.priorityScore, effortSize: existing.effortSize },
    afterState: { priorityScore: newPriorityScore, effortSize: merged.effortSize, overriddenFields },
    timestamp: new Date(),
  });

  return NextResponse.json({ estimate: updatedEstimate, newPriorityScore, roiCalc });
}
