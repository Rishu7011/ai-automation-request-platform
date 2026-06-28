import mongoose, { Schema, Document, Model } from 'mongoose';
import { CONFIDENCE_MULTIPLIERS, EffortSize } from '../constants';

export interface IPriorityInputs {
  estimatedRoi?: number;
  effortSize?: EffortSize;
  strategicValue?: number; // 1-5
  urgency?: number; // 1-5
  orgImpact?: number; // 1-5
  riskLevel?: number; // 1-5
  confidenceMultiplier?: number;
  urgencySignals?: string[];
  rationale?: string;
}

export interface IRequestEstimate extends Document {
  requestId: mongoose.Types.ObjectId;
  annualHoursSaved: number;
  annualDollarsSaved: number;
  effortSize: EffortSize;
  buildCostEstimate: number;
  roiConfidence: keyof typeof CONFIDENCE_MULTIPLIERS;
  effortConfidence: keyof typeof CONFIDENCE_MULTIPLIERS;
  priorityScore: number;
  priorityInputs: IPriorityInputs;
  requesterNarrative?: string;
  engineeringNarrative?: string;
  isOverridden: boolean;
  overriddenBy?: mongoose.Types.ObjectId;
  overriddenFields?: Record<string, unknown>;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriorityInputsSchema = new Schema<IPriorityInputs>(
  {
    estimatedRoi: { type: Number },
    effortSize: { type: String, enum: ['S', 'M', 'L', 'XL'] },
    strategicValue: { type: Number, min: 1, max: 5, default: 3 },
    urgency: { type: Number, min: 1, max: 5, default: 3 },
    orgImpact: { type: Number, min: 1, max: 5, default: 3 },
    riskLevel: { type: Number, min: 1, max: 5, default: 3 },
    confidenceMultiplier: { type: Number, default: 0.70 },
    urgencySignals: [{ type: String }],
    rationale: { type: String },
  },
  { _id: false }
);

const RequestEstimateSchema = new Schema<IRequestEstimate>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
    annualHoursSaved: { type: Number, default: 0 },
    annualDollarsSaved: { type: Number, default: 0 },
    effortSize: { type: String, enum: ['S', 'M', 'L', 'XL'], default: 'M' },
    buildCostEstimate: { type: Number, default: 0 },
    roiConfidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    effortConfidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
    priorityScore: { type: Number, default: 0 },
    priorityInputs: { type: PriorityInputsSchema, default: {} },
    requesterNarrative: { type: String },
    engineeringNarrative: { type: String },
    isOverridden: { type: Boolean, default: false },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overriddenFields: { type: Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RequestEstimateSchema.index({ requestId: 1 });

export const RequestEstimate: Model<IRequestEstimate> =
  mongoose.models.RequestEstimate ||
  mongoose.model<IRequestEstimate>('RequestEstimate', RequestEstimateSchema);

export default RequestEstimate;
