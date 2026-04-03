import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

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

export async function GET(req: Request) {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const report = await prisma.analysisReport.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!report) return NextResponse.json({ report: null });

        const safeReport = {
            ...report,
            totalSize: report.totalSize.toString(),
            duplicatesSize: report.duplicatesSize.toString(),
            unusedSize: report.unusedSize.toString()
        };

        return NextResponse.json({ report: safeReport });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
