import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequestAttachment extends Document {
  requestId: mongoose.Types.ObjectId;
  fileType: string;
  fileName: string;
  storageUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  extractedContentSummary?: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const RequestAttachmentSchema = new Schema<IRequestAttachment>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },
    storageUrl: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    extractedContentSummary: { type: String },
    scanStatus: {
      type: String,
      required: true,
      enum: ['pending', 'clean', 'infected', 'failed'],
      default: 'clean',
    },
  },
  { timestamps: true }
);

RequestAttachmentSchema.index({ requestId: 1 });

export const RequestAttachment: Model<IRequestAttachment> =
  mongoose.models.RequestAttachment ||
  mongoose.model<IRequestAttachment>('RequestAttachment', RequestAttachmentSchema);

export default RequestAttachment;
