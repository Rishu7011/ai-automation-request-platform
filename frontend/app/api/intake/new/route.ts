// /api/intake/new — creates a new draft Request and redirects to the chat page
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Request } from '@/models/Request';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { department, title } = body;

  if (!department || !title) {
    return NextResponse.json({ error: 'department and title are required' }, { status: 400 });
  }

  await connectToDatabase();

  const request = await Request.create({
    requesterId: session.user.id,
    department,
    title,
    status: 'draft',
    statusHistory: [
      {
        newStatus: 'draft',
        changedBy: session.user.id,
        changedAt: new Date(),
      },
    ],
    activityLog: [
      {
        userId: session.user.id,
        action: 'REQUEST_CREATED',
        timestamp: new Date(),
      },
    ],
  });

  return NextResponse.json({ requestId: request._id.toString() }, { status: 201 });
}
