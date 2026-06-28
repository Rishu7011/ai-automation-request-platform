// /api/admin/requests/[id]/assign — PATCH: assign to an engineer
// Task 4.5: Assignee Management

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

function requireAdmin(session: { user?: { id?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

// GET — list assignable engineers
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectToDatabase();

  const engineers = await User.find({
    role: { $in: ['eng_admin', 'sys_admin'] },
    status: 'active',
    deletedAt: null,
  })
    .select('_id name username department')
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ engineers });
}

// PATCH — assign or unassign
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { assigneeId } = body as { assigneeId: string | null };

  await connectToDatabase();

  const request = await Request.findById(id);
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const beforeAssignee = request.assignedTo?.toString() ?? null;

  if (assigneeId) {
    // Validate engineer exists
    const engineer = await User.findById(assigneeId).lean();
    if (!engineer || !['eng_admin', 'sys_admin'].includes(engineer.role)) {
      return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 });
    }
    request.assignedTo = new mongoose.Types.ObjectId(assigneeId);
  } else {
    request.assignedTo = undefined;
  }

  await request.save();

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(session.user.id),
    actionType: 'REQUEST_ASSIGNED',
    entityType: 'Request',
    entityId: request._id,
    beforeState: { assignedTo: beforeAssignee },
    afterState: { assignedTo: assigneeId },
    timestamp: new Date(),
  });

  return NextResponse.json({ assignedTo: request.assignedTo });
}
