import mongoose, { Schema, Document, Model } from 'mongoose';
import { USER_ROLES, DEPARTMENTS, USER_STATUSES, UserRole, Department, UserStatus } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  department: Department;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    department: { type: String, required: true, enum: DEPARTMENTS },
    role: { type: String, required: true, enum: USER_ROLES, default: 'requester' },
    status: { type: String, required: true, enum: USER_STATUSES, default: 'pending_approval' },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1, department: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
