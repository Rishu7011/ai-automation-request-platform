import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequestConversation extends Document {
  requestId: mongoose.Types.ObjectId;
  stage: number;
  sender: 'user' | 'ai';
  agentName?: string;
  message: string;
  timestamp: Date;
}

const RequestConversationSchema = new Schema<IRequestConversation>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    stage: { type: Number, required: true, min: 1, max: 8 },
    sender: { type: String, required: true, enum: ['user', 'ai'] },
    agentName: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RequestConversationSchema.index({ requestId: 1, stage: 1 });

export const RequestConversation: Model<IRequestConversation> =
  mongoose.models.RequestConversation ||
  mongoose.model<IRequestConversation>('RequestConversation', RequestConversationSchema);

export default RequestConversation;
