// /api/admin/settings/priority-weights — Configurable priority weights API (Task 6.1)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import PriorityWeightsConfig from '@/models/PriorityWeightsConfig';
import { writeAuditLog } from '@/lib/audit';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  let config = await PriorityWeightsConfig.findOne().lean();
  if (!config) {
    // Default weights if none saved yet
    const created = await PriorityWeightsConfig.create({
      weightRoi: 0.35,
      weightStrategicValue: 0.15,
      weightUrgency: 0.15,
      weightOrgImpact: 0.10,
      weightEffort: 0.15,
      weightRisk: 0.10,
    });
    config = created.toObject();
  }

  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== 'sys_admin' && role !== 'eng_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const {
    weightRoi,
    weightStrategicValue,
    weightUrgency,
    weightOrgImpact,
    weightEffort,
    weightRisk,
  } = body as {
    weightRoi: number;
    weightStrategicValue: number;
    weightUrgency: number;
    weightOrgImpact: number;
    weightEffort: number;
    weightRisk: number;
  };

  // Validate weights sum to ~1.0 (with slight floating point tolerance)
  const sum = Number((weightRoi + weightStrategicValue + weightUrgency + weightOrgImpact + weightEffort + weightRisk).toFixed(4));
  if (Math.abs(sum - 1.0) > 0.01 && Math.abs(sum - 100) > 0.5) {
    return NextResponse.json(
      { error: `Weights must sum to 1.0 (or 100%). Current sum is ${sum}` },
      { status: 400 }
    );
  }

  // Normalise to 0–1 decimal format if passed as percentages
  const normalize = (val: number) => (val > 1 ? val / 100 : val);

  const normalizedWeights = {
    weightRoi: normalize(weightRoi),
    weightStrategicValue: normalize(weightStrategicValue),
    weightUrgency: normalize(weightUrgency),
    weightOrgImpact: normalize(weightOrgImpact),
    weightEffort: normalize(weightEffort),
    weightRisk: normalize(weightRisk),
  };

  await connectToDatabase();

  const beforeConfig = await PriorityWeightsConfig.findOne().lean();

  const updatedConfig = await PriorityWeightsConfig.findOneAndUpdate(
    {},
    {
      ...normalizedWeights,
      updatedBy: session.user.id,
    },
    { upsert: true, new: true }
  );

  // Write Audit Log
  await writeAuditLog({
    actorId: session.user.id,
    actionType: 'PRIORITY_WEIGHTS_UPDATED',
    entityType: 'PriorityWeightsConfig',
    entityId: updatedConfig._id.toString(),
    beforeState: beforeConfig ? (JSON.parse(JSON.stringify(beforeConfig)) as Record<string, unknown>) : undefined,
    afterState: updatedConfig ? (JSON.parse(JSON.stringify(updatedConfig)) as Record<string, unknown>) : undefined,
  });

  return NextResponse.json({
    message: 'Priority weights updated successfully',
    config: updatedConfig,
  });
}
