import mongoose, { Document, Schema } from 'mongoose';

export interface IFileMetadata extends Document {
    connectionId: mongoose.Types.ObjectId;
    cloudFileId: string; // ID assigned by the cloud provider
    name: string;
    mimeType: string;
    sizeBytes: number;
    path: string;
    hash?: string; // For duplicate detection (e.g. MD5 or custom heuristic hash)
    cloudLastModified: Date;
    createdAt: Date;
    updatedAt: Date;
}

const FileMetadataSchema = new Schema<IFileMetadata>(
    {
        connectionId: { type: Schema.Types.ObjectId, ref: 'CloudConnection', required: true },
        cloudFileId: { type: String, required: true },
        name: { type: String, required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        path: { type: String, required: true },
        hash: { type: String, index: true },
        cloudLastModified: { type: Date, required: true },
    },
    { timestamps: true }
);

// Indexes to speed up queries (e.g., finding duplicates across the same user)
FileMetadataSchema.index({ connectionId: 1, cloudFileId: 1 }, { unique: true });
FileMetadataSchema.index({ hash: 1 });
FileMetadataSchema.index({ sizeBytes: -1 }); // Useful for finding large files

export const FileMetadata = mongoose.model<IFileMetadata>('FileMetadata', FileMetadataSchema);
