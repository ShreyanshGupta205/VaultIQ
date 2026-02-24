import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: false,
        },
        lastName: {
            type: String,
            required: false,
        },
        cloudConnections: [
            {
                provider: {
                    type: String,
                    enum: ['google', 'dropbox', 'onedrive'],
                    required: true,
                },
                email: String,
                accessToken: String,
                refreshToken: String,
                usedStorage: Number,
                totalStorage: Number,
                connectedAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
