// RequestComment — per-request comment thread (Task 4.6)

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequestComment extends Document {
  requestId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;       // supports @mention as plain text
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RequestCommentSchema = new Schema<IRequestComment>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    authorId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:   { type: String, required: true, trim: true, maxlength: 2000 },
    editedAt:  { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RequestCommentSchema.index({ requestId: 1, deletedAt: 1 });
RequestCommentSchema.index({ authorId: 1 });

export const RequestComment: Model<IRequestComment> =
  mongoose.models.RequestComment ||
  mongoose.model<IRequestComment>('RequestComment', RequestCommentSchema);

export default RequestComment;
