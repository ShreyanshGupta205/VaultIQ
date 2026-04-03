import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.user.id;

        const connections = await prisma.cloudConnection.findMany({
            where: { userId }
        });

        const stats = connections.reduce((acc: { totalStorage: number; usedStorage: number }, curr: any) => {
            acc.totalStorage += Number(curr.storageTotal);
            acc.usedStorage += Number(curr.storageUsed);
            return acc;
        }, { totalStorage: 0, usedStorage: 0 });

        return NextResponse.json({ 
            connections, 
            stats: {
                totalStorage: stats.totalStorage,
                usedStorage: stats.usedStorage,
                percentUsed: stats.totalStorage > 0 ? (stats.usedStorage / stats.totalStorage) * 100 : 0
            }
        });

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}
