import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name?: string;
    role: 'USER' | 'ADMIN' | 'ENTERPRISE';
    subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE';
    passwordHash?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        name: { type: String },
        role: { type: String, enum: ['USER', 'ADMIN', 'ENTERPRISE'], default: 'USER' },
        subscriptionTier: { type: String, enum: ['FREE', 'PRO', 'ENTERPRISE'], default: 'FREE' },
        passwordHash: { type: String },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
