import mongoose, { Schema, Document, Model } from 'mongoose';

export type DuplicateResolution =
  | 'unreviewed'
  | 'pending'
  | 'confirmed_duplicate'
  | 'related'
  | 'not_duplicate';

export interface IDuplicateCandidate extends Document {
  requestId: mongoose.Types.ObjectId;
  candidateRequestId: mongoose.Types.ObjectId;
  similarityScore: number;
  reason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolution: DuplicateResolution;
  createdAt: Date;
  updatedAt: Date;
}

const DuplicateCandidateSchema = new Schema<IDuplicateCandidate>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    candidateRequestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    similarityScore: { type: Number, required: true },
    reason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: {
      type: String,
      required: true,
      enum: ['unreviewed', 'pending', 'confirmed_duplicate', 'related', 'not_duplicate'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

DuplicateCandidateSchema.index({ requestId: 1, candidateRequestId: 1 }, { unique: true });

export const DuplicateCandidate: Model<IDuplicateCandidate> =
  mongoose.models.DuplicateCandidate ||
  mongoose.model<IDuplicateCandidate>('DuplicateCandidate', DuplicateCandidateSchema);

export default DuplicateCandidate;
