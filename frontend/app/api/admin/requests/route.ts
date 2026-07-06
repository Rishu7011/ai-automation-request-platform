// /api/admin/requests — List all automation requests for sys_admin & eng_admin
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Request from '@/models/Request';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'sys_admin' && role !== 'eng_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'priority';

  let sortOption: Record<string, 1 | -1> = { priorityScore: -1, createdAt: -1 };
  if (sortBy === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sortBy === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sortBy === 'priority') {
    sortOption = { priorityScore: -1, createdAt: -1 };
  }

  await connectToDatabase();

  const requests = await Request.find({ deletedAt: null })
    .populate({ path: 'requesterId', select: 'name email department username', model: User })
    .sort(sortOption)
    .lean();

  return NextResponse.json({ requests });
}
