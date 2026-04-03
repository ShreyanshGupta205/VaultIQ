import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { runStorageAnalysis } from '@/lib/aiManager';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

const verifyToken = (req: Request) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.user.id;
    } catch {
        return null;
    }
};

export async function POST(req: Request) {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const report = await prisma.analysisReport.create({
            data: { userId, status: 'PENDING' }
        });

        // Run analysis (this will probably finish in 10-15s if the number of files < 50k)
        await runStorageAnalysis(userId, report.id);
        
        return NextResponse.json({ message: 'Analysis completed', reportId: report.id });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
