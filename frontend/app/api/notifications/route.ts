// Task 11.3 — Notification Feed API
// GET: Fetch user notifications + unread count
// PATCH: Mark notification(s) as read

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import { Notification } from '@/models/Notification';
import mongoose from 'mongoose';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Notification.countDocuments({ userId: session.user.id, isRead: false }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { notificationId, markAllRead } = body as {
    notificationId?: string;
    markAllRead?: boolean;
  };

  await connectToDatabase();

  if (markAllRead) {
    await Notification.updateMany(
      { userId: session.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await Notification.updateOne(
      { _id: new mongoose.Types.ObjectId(notificationId), userId: session.user.id },
      { $set: { isRead: true } }
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'notificationId or markAllRead is required' }, { status: 400 });
}
