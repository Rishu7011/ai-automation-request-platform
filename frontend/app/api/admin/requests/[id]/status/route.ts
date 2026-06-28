// /api/admin/requests/[id]/status — PATCH: status transition with reason note
// Task 4.3: Status Management

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { AuditLog } from '@/models/AuditLog';
import { REQUEST_STATUSES, RequestStatus } from '@/constants';
import mongoose from 'mongoose';

// Statuses that require a reason note
const REASON_REQUIRED: RequestStatus[] = ['rejected', 'needs_more_info'];

// Valid transitions from each status (admin can move freely but we still guard nonsense moves)
const VALID_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  draft:              ['ai_reviewing', 'archived'],
  ai_reviewing:       ['submitted', 'draft'],
  submitted:          ['needs_more_info', 'engineering_review', 'rejected', 'archived'],
  needs_more_info:    ['submitted', 'rejected', 'archived'],
  engineering_review: ['approved', 'rejected', 'needs_more_info', 'archived'],
  approved:           ['planned', 'rejected', 'archived'],
  planned:            ['in_development', 'archived'],
  in_development:     ['testing', 'planned', 'archived'],
  testing:            ['completed', 'in_development', 'archived'],
  completed:          ['archived'],
  rejected:           ['submitted', 'archived'],
  archived:           ['submitted'],
};

function requireAdmin(session: { user?: { id?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { newStatus, reasonNote } = body as { newStatus: string; reasonNote?: string };

  if (!newStatus || !REQUEST_STATUSES.includes(newStatus as RequestStatus)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  if (REASON_REQUIRED.includes(newStatus as RequestStatus) && !reasonNote?.trim()) {
    return NextResponse.json(
      { error: `A reason note is required when setting status to "${newStatus}"` },
      { status: 422 }
    );
  }

  await connectToDatabase();

  const request = await Request.findById(id);
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const currentStatus = request.status as RequestStatus;
  const target = newStatus as RequestStatus;

  const allowed = VALID_TRANSITIONS[currentStatus];
  if (allowed && !allowed.includes(target)) {
    return NextResponse.json(
      { error: `Transition from "${currentStatus}" to "${target}" is not permitted` },
      { status: 422 }
    );
  }

  request.status = target;
  request.statusHistory.push({
    oldStatus: currentStatus,
    newStatus: target,
    changedBy: new mongoose.Types.ObjectId(session.user.id),
    changedAt: new Date(),
    reasonNote: reasonNote?.trim(),
  });

  await request.save();

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(session.user.id),
    actionType: 'STATUS_CHANGED',
    entityType: 'Request',
    entityId: request._id,
    beforeState: { status: currentStatus },
    afterState: { status: target, reasonNote: reasonNote?.trim() },
    timestamp: new Date(),
  });

  return NextResponse.json({ status: target, statusHistory: request.statusHistory });
}
