// /api/admin/requests/bulk-status — PATCH: bulk status update
// Task 4.4: Bulk Status Update

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { AuditLog } from '@/models/AuditLog';
import { REQUEST_STATUSES, RequestStatus } from '@/constants';
import mongoose from 'mongoose';

const REASON_REQUIRED: RequestStatus[] = ['rejected', 'needs_more_info'];

function requireAdmin(session: { user?: { id?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { requestIds, newStatus, reasonNote } = body as {
    requestIds: string[];
    newStatus: string;
    reasonNote?: string;
  };

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return NextResponse.json({ error: 'requestIds must be a non-empty array' }, { status: 400 });
  }
  if (requestIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 requests per bulk action' }, { status: 400 });
  }
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

  const actorId = new mongoose.Types.ObjectId(session.user.id);
  const target = newStatus as RequestStatus;
  const now = new Date();
  const note = reasonNote?.trim();

  // Fetch all targeted requests
  const requests = await Request.find({ _id: { $in: requestIds }, deletedAt: null });

  const auditDocs: mongoose.AnyObject[] = [];

  for (const request of requests) {
    const before = request.status;
    request.status = target;
    request.statusHistory.push({
      oldStatus: before as RequestStatus,
      newStatus: target,
      changedBy: actorId,
      changedAt: now,
      reasonNote: note,
    });

    auditDocs.push({
      actorId,
      actionType: 'BULK_STATUS_CHANGED',
      entityType: 'Request',
      entityId: request._id,
      beforeState: { status: before },
      afterState: { status: target, reasonNote: note },
      timestamp: now,
    });
  }

  // Save all in parallel
  await Promise.all([
    ...requests.map((r) => r.save()),
    AuditLog.insertMany(auditDocs),
  ]);

  return NextResponse.json({
    updated: requests.length,
    skipped: requestIds.length - requests.length,
    newStatus: target,
  });
}
