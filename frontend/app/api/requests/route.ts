// /api/requests — GET all automation requests created by the authenticated user
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Request from '@/models/Request';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const requests = await Request.find({
    requesterId: session.user.id,
    deletedAt: null,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ requests });
}
