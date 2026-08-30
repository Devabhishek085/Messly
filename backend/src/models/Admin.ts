import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

const adminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now },
});

export const Admin = model<IAdmin>('Admin', adminSchema);
