import mongoose, { Schema, Document, Model } from 'mongoose';

export type DuplicateResolution =
  | 'unreviewed'
  | 'confirmed_duplicate'
  | 'related'
  | 'not_duplicate';

export interface IDuplicateCandidate extends Document {
  requestId: mongoose.Types.ObjectId;
  candidateRequestId: mongoose.Types.ObjectId;
  similarityScore: number;
  reviewedBy?: mongoose.Types.ObjectId;
  resolution: DuplicateResolution;
  createdAt: Date;
  updatedAt: Date;
}

const DuplicateCandidateSchema = new Schema<IDuplicateCandidate>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    candidateRequestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    similarityScore: { type: Number, required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: {
      type: String,
      required: true,
      enum: ['unreviewed', 'confirmed_duplicate', 'related', 'not_duplicate'],
      default: 'unreviewed',
    },
  },
  { timestamps: true }
);

DuplicateCandidateSchema.index({ requestId: 1, candidateRequestId: 1 }, { unique: true });

export const DuplicateCandidate: Model<IDuplicateCandidate> =
  mongoose.models.DuplicateCandidate ||
  mongoose.model<IDuplicateCandidate>('DuplicateCandidate', DuplicateCandidateSchema);

export default DuplicateCandidate;
