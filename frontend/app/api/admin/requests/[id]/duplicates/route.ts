// Task 8.2 — Duplicate Management API
// GET: Fetch candidate duplicate matches for a request
// PATCH: Resolve duplicate candidates (confirmed_duplicate, related, not_duplicate)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestSummary } from '@/models/RequestSummary';
import { DuplicateCandidate } from '@/models/DuplicateCandidate';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

function requireAdmin(session: { user?: { id?: string; role?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

// GET — List duplicate candidate pairs for a request
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await connectToDatabase();

  const candidates = await DuplicateCandidate.find({ requestId: id })
    .populate({
      path: 'candidateRequestId',
      select: 'title department status priorityScore requesterId createdAt',
      populate: { path: 'requesterId', select: 'name username department' },
    })
    .sort({ similarityScore: -1 })
    .lean();

  // Fetch summaries for candidate requests
  const candidateIds = candidates.map((c) =>
    (c.candidateRequestId as unknown as { _id: string })._id
  );

  const summaries = await RequestSummary.find({ requestId: { $in: candidateIds } }).lean();
  const summaryMap = new Map(summaries.map((s) => [s.requestId.toString(), s]));

  const enrichedCandidates = candidates.map((c) => {
    const candidateReq = c.candidateRequestId as unknown as { _id: string };
    const candIdStr = candidateReq._id.toString();
    return {
      ...c,
      candidateSummary: summaryMap.get(candIdStr) ?? null,
    };
  });

  return NextResponse.json({ candidates: enrichedCandidates });
}

// PATCH — Resolve duplicate candidate match
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { candidateId, resolution } = body as {
    candidateId: string;
    resolution: 'confirmed_duplicate' | 'related' | 'not_duplicate';
  };

  if (!candidateId || !['confirmed_duplicate', 'related', 'not_duplicate'].includes(resolution)) {
    return NextResponse.json({ error: 'candidateId and valid resolution are required' }, { status: 400 });
  }

  await connectToDatabase();

  const candidateRecord = await DuplicateCandidate.findById(candidateId);
  if (!candidateRecord) {
    return NextResponse.json({ error: 'Candidate record not found' }, { status: 404 });
  }

  const previousResolution = candidateRecord.resolution;
  candidateRecord.resolution = resolution;
  candidateRecord.resolvedBy = new mongoose.Types.ObjectId(session.user.id);
  candidateRecord.resolvedAt = new Date();
  await candidateRecord.save();

  const request = await Request.findById(id);

  if (request) {
    if (resolution === 'confirmed_duplicate') {
      // Archive request and unflag
      request.status = 'archived';
      request.isDuplicateFlagged = false;
      request.statusHistory.push({
        oldStatus: request.status,
        newStatus: 'archived',
        changedBy: new mongoose.Types.ObjectId(session.user.id),
        changedAt: new Date(),
        reasonNote: 'Archived as confirmed duplicate',
      });
      await request.save();
    } else {
      // Check if any high similarity pending candidates remain
      const remainingPending = await DuplicateCandidate.countDocuments({
        requestId: id,
        resolution: 'pending',
        similarityScore: { $gte: 0.75 },
      });
      if (remainingPending === 0) {
        request.isDuplicateFlagged = false;
        await request.save();
      }
    }
  }

  await AuditLog.create({
    actorId: new mongoose.Types.ObjectId(session.user.id),
    actionType: 'DUPLICATE_RESOLUTION_UPDATED',
    entityType: 'DuplicateCandidate',
    entityId: candidateRecord._id,
    beforeState: { resolution: previousResolution },
    afterState: { resolution, requestId: id },
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true, candidate: candidateRecord });
}
