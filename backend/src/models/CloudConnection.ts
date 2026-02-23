import mongoose, { Document, Schema } from 'mongoose';

export interface ICloudConnection extends Document {
    userId: mongoose.Types.ObjectId;
    provider: 'GOOGLE_DRIVE' | 'DROPBOX' | 'ONEDRIVE';
    providerAccountId: string; // The ID on the provider's side
    accessToken: string; // Encrypted in real impl
    refreshToken?: string; // Encrypted in real impl
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    totalStorageBytes: number;
    usedStorageBytes: number;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CloudConnectionSchema = new Schema<ICloudConnection>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        provider: { type: String, enum: ['GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE'], required: true },
        providerAccountId: { type: String, required: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String },
        status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' },
        totalStorageBytes: { type: Number, default: 0 },
        usedStorageBytes: { type: Number, default: 0 },
        lastSyncAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const CloudConnection = mongoose.model<ICloudConnection>('CloudConnection', CloudConnectionSchema);
