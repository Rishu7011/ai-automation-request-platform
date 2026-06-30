import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'status_change'
  | 'comment'
  | 'mention'
  | 'assigned'
  | 'duplicate_flagged';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  requestId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['status_change', 'comment', 'mention', 'assigned', 'duplicate_flagged'],
    },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
