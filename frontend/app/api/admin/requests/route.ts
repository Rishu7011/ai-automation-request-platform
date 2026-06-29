// /api/admin/requests — List all automation requests for sys_admin & eng_admin
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Request from '@/models/Request';
import User from '@/models/User';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'sys_admin' && role !== 'eng_admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  await connectToDatabase();

  const requests = await Request.find({ deletedAt: null })
    .populate({ path: 'requesterId', select: 'name email department username', model: User })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ requests });
}
