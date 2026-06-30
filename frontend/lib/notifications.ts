// Task 11.2 — In-App Notifications Helper
// Creates in-app notifications for users on key events (status change, comment, assignment, duplicate flag).

import { Notification, NotificationType } from '@/models/Notification';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  requestId?: string | mongoose.Types.ObjectId;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectToDatabase();
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(params.userId),
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link || '#',
      requestId: params.requestId ? new mongoose.Types.ObjectId(params.requestId) : undefined,
      isRead: false,
      createdAt: new Date(),
    });
    return notification;
  } catch (err) {
    console.error('[Notification] Failed to create notification:', err);
    return null;
  }
}
