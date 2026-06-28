// /api/admin/audit-log — Paginated audit log retrieval API (Task 5.2)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'sys_admin' && role !== 'eng_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const actionType = searchParams.get('actionType');
  const entityType = searchParams.get('entityType');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  await connectToDatabase();

  const filter: Record<string, unknown> = {};

  if (actionType && actionType !== 'all') {
    filter.actionType = actionType;
  }
  if (entityType && entityType !== 'all') {
    filter.entityType = entityType;
  }
  if (startDate || endDate) {
    const timestampFilter: Record<string, Date> = {};
    if (startDate) timestampFilter.$gte = new Date(startDate);
    if (endDate) timestampFilter.$lte = new Date(endDate);
    filter.timestamp = timestampFilter;
  }

  const skip = (page - 1) * limit;

  const [logs, totalLogs] = await Promise.all([
    AuditLog.find(filter)
      .populate({ path: 'actorId', select: 'name email username role', model: User })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalLogs / limit) || 1;

  return NextResponse.json({
    logs,
    totalLogs,
    totalPages,
    currentPage: page,
  });
}
