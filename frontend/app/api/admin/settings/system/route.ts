// /api/admin/settings/system — System Settings API for Effort Ranges and Blended Rates (Tasks 6.2 & 6.3)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import SystemSettings from '@/models/SystemSettings';
import { writeAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'key query parameter is required' }, { status: 400 });
  }

  await connectToDatabase();

  const setting = await SystemSettings.findOne({ key }).lean();
  return NextResponse.json({ setting });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== 'sys_admin' && role !== 'eng_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { key, value } = body as { key: string; value: Record<string, unknown> | unknown[] };

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }

  await connectToDatabase();

  const beforeSetting = await SystemSettings.findOne({ key }).lean();

  const updatedSetting = await SystemSettings.findOneAndUpdate(
    { key },
    {
      key,
      value,
      updatedBy: session.user.id,
    },
    { upsert: true, new: true }
  );

  const actionType =
    key === 'effortRanges'
      ? 'EFFORT_RANGES_UPDATED'
      : key === 'blendedRates'
      ? 'BLENDED_RATES_UPDATED'
      : 'SYSTEM_SETTINGS_UPDATED';

  await writeAuditLog({
    actorId: session.user.id,
    actionType,
    entityType: 'SystemSettings',
    entityId: updatedSetting._id.toString(),
    beforeState: beforeSetting ? (JSON.parse(JSON.stringify(beforeSetting)) as Record<string, unknown>) : undefined,
    afterState: updatedSetting ? (JSON.parse(JSON.stringify(updatedSetting)) as Record<string, unknown>) : undefined,
  });

  return NextResponse.json({
    message: `${key} settings updated successfully`,
    setting: updatedSetting,
  });
}
