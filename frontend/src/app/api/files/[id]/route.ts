import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_jwt_key_dev_2024';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    try {
        const dbFile = await prisma.cloudFile.findUnique({
            where: { id },
            include: { connection: true }
        });

        if (!dbFile || dbFile.userId !== userId) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const connection = dbFile.connection;

        if (connection.provider === 'GOOGLE_DRIVE') {
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
            oauth2Client.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            try {
                await drive.files.update({ fileId: dbFile.fileId, requestBody: { trashed: true } });
            } catch (err: any) {
                if (err.code !== 404) throw err;
            }
        } 
        else if (connection.provider === 'DROPBOX') {
            const dbx = new Dropbox({ accessToken: connection.accessToken });
            try {
                await dbx.filesDeleteV2({ path: dbFile.path || `/${dbFile.name}` });
            } catch (err) { }
        }
        else if (connection.provider === 'ONEDRIVE') {
             try {
                await axios.delete(`https://graph.microsoft.com/v1.0/me/drive/items/${dbFile.fileId}`, {
                    headers: { 'Authorization': `Bearer ${connection.accessToken}` }
                });
            } catch (err) { }
        }

        await prisma.cloudFile.delete({ where: { id: dbFile.id } });

        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
    }
}
