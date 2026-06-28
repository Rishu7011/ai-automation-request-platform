import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  requestId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    editedAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommentSchema.index({ requestId: 1, createdAt: 1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
