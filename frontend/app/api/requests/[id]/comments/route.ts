// /api/requests/[id]/comments — Comment thread API
// Task 4.6: Comment System — create, list, soft-delete, edit

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestComment } from '@/models/RequestComment';
import mongoose from 'mongoose';

function canViewRequest(session: { user?: { id?: string; role?: string } | null } | null, requesterId: string) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return (
    session?.user?.id === requesterId ||
    role === 'eng_admin' ||
    role === 'sys_admin' ||
    role === 'dept_reviewer'
  );
}

function isAdmin(session: { user?: { role?: string } | null } | null) {
  const role = (session?.user as unknown as { role?: string })?.role;
  return role === 'eng_admin' || role === 'sys_admin';
}

// GET — load all comments for a request
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDatabase();

  const request = await Request.findById(id).lean();
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!canViewRequest(session, request.requesterId.toString())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const comments = await RequestComment.find({ requestId: id, deletedAt: null })
    .sort({ createdAt: 1 })
    .populate('authorId', 'name username department')
    .lean();

  return NextResponse.json({ comments });
}

// POST — add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { content } = body as { content: string };

  if (!content?.trim() || content.trim().length > 2000) {
    return NextResponse.json(
      { error: 'Comment must be 1–2000 characters' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const request = await Request.findById(id).lean();
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!canViewRequest(session, request.requesterId.toString())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const comment = await RequestComment.create({
    requestId: new mongoose.Types.ObjectId(id),
    authorId: new mongoose.Types.ObjectId(session.user.id),
    content: content.trim(),
  });

  const populated = await comment.populate('authorId', 'name username department');

  return NextResponse.json({ comment: populated }, { status: 201 });
}

// PATCH — edit a comment (author only, or admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { commentId, content } = body as { commentId: string; content: string };

  if (!content?.trim() || content.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment must be 1–2000 characters' }, { status: 400 });
  }

  await connectToDatabase();

  const comment = await RequestComment.findOne({ _id: commentId, requestId: id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const isOwner = comment.authorId.toString() === session.user.id;
  const roleA = (session.user as unknown as { role?: string })?.role;
  if (!isOwner && roleA !== 'eng_admin' && roleA !== 'sys_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  comment.content = content.trim();
  comment.editedAt = new Date();
  await comment.save();

  return NextResponse.json({ comment });
}

// DELETE — soft-delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentId');

  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });

  await connectToDatabase();

  const comment = await RequestComment.findOne({ _id: commentId, requestId: id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const isOwnerD = comment.authorId.toString() === session.user.id;
  const roleD = (session.user as unknown as { role?: string })?.role;
  if (!isOwnerD && roleD !== 'eng_admin' && roleD !== 'sys_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  comment.deletedAt = new Date();
  await comment.save();

  return NextResponse.json({ success: true });
}
