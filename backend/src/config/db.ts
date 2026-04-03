import prisma from '../lib/prisma';

export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('Database Connected Successfully via Prisma');
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};
