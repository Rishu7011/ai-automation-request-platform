// Task 7.4 — Request Attachments List API
// Returns all files uploaded for a given request. Accessible by requester and admins.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';
import { RequestAttachment } from '@/models/RequestAttachment';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  const request = await Request.findById(id).lean();
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const role = (session.user as unknown as { role?: string })?.role;
  const isRequester = request.requesterId.toString() === session.user.id;
  const isAdmin = role === 'eng_admin' || role === 'sys_admin';

  if (!isRequester && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const attachments = await RequestAttachment.find({ requestId: id })
    .populate('uploadedBy', 'name username')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ attachments });
}
