import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequestSummary extends Document {
  requestId: mongoose.Types.ObjectId;
  processDescription?: string;
  painPoints?: string[];
  peopleInvolved?: number;
  hoursPerOccurrence?: number;
  frequencyPerYear?: number;
  toolsUsed?: string[];
  risks?: string[];
  desiredOutcome?: string;
  departmentSpecificFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSummarySchema = new Schema<IRequestSummary>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
    processDescription: { type: String },
    painPoints: [{ type: String }],
    peopleInvolved: { type: Number },
    hoursPerOccurrence: { type: Number },
    frequencyPerYear: { type: Number },
    toolsUsed: [{ type: String }],
    risks: [{ type: String }],
    desiredOutcome: { type: String },
    departmentSpecificFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

RequestSummarySchema.index({ requestId: 1 });

export const RequestSummary: Model<IRequestSummary> =
  mongoose.models.RequestSummary ||
  mongoose.model<IRequestSummary>('RequestSummary', RequestSummarySchema);

export default RequestSummary;
