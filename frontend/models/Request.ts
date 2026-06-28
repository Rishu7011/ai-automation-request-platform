import mongoose, { Schema, Document, Model } from 'mongoose';
import { REQUEST_STATUSES, DEPARTMENTS, CONFIDENCE_MULTIPLIERS, RequestStatus, Department } from '../constants';

export interface IStatusHistoryItem {
  oldStatus?: RequestStatus;
  newStatus: RequestStatus;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
  reasonNote?: string;
}

export interface IActivityLogItem {
  userId: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface IRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  department: Department;
  title: string;
  status: RequestStatus;
  priorityScore: number;
  roiConfidence: keyof typeof CONFIDENCE_MULTIPLIERS;
  effortConfidence: keyof typeof CONFIDENCE_MULTIPLIERS;
  isDuplicateFlagged: boolean;
  assignedTo?: mongoose.Types.ObjectId;
  tags: string[];
  statusHistory: IStatusHistoryItem[];
  activityLog: IActivityLogItem[];
  submittedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    oldStatus: { type: String, enum: REQUEST_STATUSES },
    newStatus: { type: String, required: true, enum: REQUEST_STATUSES },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    reasonNote: { type: String },
  },
  { _id: false }
);

const ActivityLogSchema = new Schema<IActivityLogItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const RequestSchema = new Schema<IRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true, enum: DEPARTMENTS },
    title: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: REQUEST_STATUSES, default: 'draft' },
    priorityScore: { type: Number, default: 0 },
    roiConfidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    effortConfidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    isDuplicateFlagged: { type: Boolean, default: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: String }],
    statusHistory: [StatusHistorySchema],
    activityLog: [ActivityLogSchema],
    submittedAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RequestSchema.index({ priorityScore: -1 });
RequestSchema.index({ status: 1 });
RequestSchema.index({ requesterId: 1 });
RequestSchema.index({ department: 1 });

export const Request: Model<IRequest> =
  mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);

export default Request;
