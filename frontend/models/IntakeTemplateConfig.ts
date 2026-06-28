import mongoose, { Schema, Document, Model } from 'mongoose';
import { DEPARTMENTS, Department } from '../constants';

export interface IQuestionItem {
  key: string;
  prompt: string;
  helpText?: string;
  focusArea?: string;
}

export interface IIntakeTemplateConfig extends Document {
  department: Department;
  stage: number;
  questionSet: IQuestionItem[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionItemSchema = new Schema<IQuestionItem>(
  {
    key: { type: String, required: true },
    prompt: { type: String, required: true },
    helpText: { type: String },
    focusArea: { type: String },
  },
  { _id: false }
);

const IntakeTemplateConfigSchema = new Schema<IIntakeTemplateConfig>(
  {
    department: { type: String, required: true, enum: DEPARTMENTS },
    stage: { type: Number, required: true, min: 1, max: 8 },
    questionSet: [QuestionItemSchema],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

IntakeTemplateConfigSchema.index({ department: 1, stage: 1 }, { unique: true });

export const IntakeTemplateConfig: Model<IIntakeTemplateConfig> =
  mongoose.models.IntakeTemplateConfig ||
  mongoose.model<IIntakeTemplateConfig>('IntakeTemplateConfig', IntakeTemplateConfigSchema);

export default IntakeTemplateConfig;
