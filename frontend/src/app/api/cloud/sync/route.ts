import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { syncGoogleDriveChunk, syncDropboxChunk, syncOneDriveChunk } from '@/lib/syncManager';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.user.id;

        const { connectionId, continuationToken } = await req.json();

        if (!connectionId) {
            return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
        }

        const connection = await prisma.cloudConnection.findFirst({
            where: { id: connectionId, userId }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        let result;
        if (connection.provider === 'GOOGLE_DRIVE') {
            result = await syncGoogleDriveChunk(connection, continuationToken);
        } else if (connection.provider === 'DROPBOX') {
            result = await syncDropboxChunk(connection, continuationToken);
        } else if (connection.provider === 'ONEDRIVE') {
            result = await syncOneDriveChunk(connection, continuationToken);
        } else {
            return NextResponse.json({ error: 'Provider not supported' }, { status: 400 });
        }

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
