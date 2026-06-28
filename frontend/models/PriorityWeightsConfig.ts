import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPriorityWeightsConfig extends Document {
  weightRoi: number;
  weightStrategicValue: number;
  weightUrgency: number;
  weightOrgImpact: number;
  weightEffort: number;
  weightRisk: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PriorityWeightsConfigSchema = new Schema<IPriorityWeightsConfig>(
  {
    weightRoi: { type: Number, required: true, default: 0.35 },
    weightStrategicValue: { type: Number, required: true, default: 0.15 },
    weightUrgency: { type: Number, required: true, default: 0.15 },
    weightOrgImpact: { type: Number, required: true, default: 0.10 },
    weightEffort: { type: Number, required: true, default: 0.15 },
    weightRisk: { type: Number, required: true, default: 0.10 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PriorityWeightsConfig: Model<IPriorityWeightsConfig> =
  mongoose.models.PriorityWeightsConfig ||
  mongoose.model<IPriorityWeightsConfig>('PriorityWeightsConfig', PriorityWeightsConfigSchema);

export default PriorityWeightsConfig;
