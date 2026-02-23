import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/vaultmind_ai';
        const conn = await mongoose.connect(mongoURI);
        console.log(`[database]: MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`[database]: Error: ${error.message}`);
        } else {
            console.error(`[database]: An unexpected error occurred during connection`);
        }
        process.exit(1);
    }
};
