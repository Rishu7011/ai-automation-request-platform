// /api/ledger — Company-Wide Request Ledger
// Returns all submitted (and beyond) requests with pagination, filters, and sort.
// All authenticated employees can access this. Priority score raw value is hidden from
// non-eng-admin users in v1; they see the Priority Tier instead.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { User } from '@/models/User';
import { getPriorityTier } from '@/lib/calculations';

const PAGE_SIZE = 20;

// Statuses visible in the ledger (submitted and beyond — excludes draft/ai_reviewing)
const LEDGER_STATUSES = [
  'submitted',
  'needs_more_info',
  'engineering_review',
  'approved',
  'rejected',
  'planned',
  'in_development',
  'testing',
  'completed',
  'archived',
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // ── Parse query params ────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const department = searchParams.get('department') ?? '';
  const status = searchParams.get('status') ?? '';
  const priorityTier = searchParams.get('priorityTier') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'newest'; // newest | priority

  const userRole = (session.user as unknown as { role: string }).role;
  const isEngAdmin = userRole === 'eng_admin' || userRole === 'sys_admin';

  await connectToDatabase();

  // ── Build filter ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {
    deletedAt: null,
    status: { $in: status && LEDGER_STATUSES.includes(status) ? [status] : LEDGER_STATUSES },
  };

  if (department) filter.department = department;

  if (dateFrom || dateTo) {
    filter.submittedAt = {};
    if (dateFrom) filter.submittedAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.submittedAt.$lte = to;
    }
  }

  // Priority tier filter: map tier to score ranges
  if (priorityTier) {
    const tierRanges: Record<string, { $gte: number; $lt?: number }> = {
      Critical: { $gte: 70 },
      High:     { $gte: 50, $lt: 70 },
      Medium:   { $gte: 30, $lt: 50 },
      Low:      { $gte: 0,  $lt: 30 },
    };
    if (tierRanges[priorityTier]) {
      filter.priorityScore = tierRanges[priorityTier];
    }
  }

  // ── Sort ─────────────────────────────────────────────────────────────────────
  const sort: Record<string, 1 | -1> =
    sortBy === 'priority'
      ? { priorityScore: -1, submittedAt: -1 }
      : { submittedAt: -1 };

  // ── Count + paginate ─────────────────────────────────────────────────────────
  const [totalCount, rawRequests] = await Promise.all([
    Request.countDocuments(filter),
    Request.find(filter)
      .sort(sort)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select('_id title department status priorityScore roiConfidence requesterId submittedAt createdAt')
      .populate('requesterId', 'username department')
      .lean(),
  ]);

  // ── Shape response (hide raw score from non-admins) ───────────────────────────
  const requests = rawRequests.map((r) => {
    const score = r.priorityScore ?? 0;
    const tier = getPriorityTier(score);
    const requester = r.requesterId as { username?: string; department?: string } | null;

    return {
      _id: r._id,
      title: r.title,
      department: r.department,
      status: r.status,
      requesterName: requester?.username ?? 'Unknown',
      priorityTier: tier,
      priorityScore: isEngAdmin ? score : undefined, // only expose raw score to admins
      roiConfidence: r.roiConfidence,
      submittedAt: r.submittedAt,
    };
  });

  return NextResponse.json({
    requests,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      hasNextPage: page * PAGE_SIZE < totalCount,
      hasPrevPage: page > 1,
    },
  });
}
