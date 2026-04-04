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

export async function GET(req: Request) {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const connectionId = searchParams.get('connectionId');
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    let whereClause: any = { userId };
    if (search) whereClause.name = { contains: search, mode: 'insensitive' };
    if (connectionId) whereClause.connectionId = connectionId;
    
    if (type) {
        if (type === 'document') {
            whereClause.mimeType = { in: ['application/pdf', 'application/docx', 'application/xlsx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] };
        } else if (type === 'image') {
            whereClause.mimeType = { startsWith: 'image/' };
        } else if (type === 'video') {
            whereClause.mimeType = { startsWith: 'video/' };
        }
    }

    try {
        const files = await prisma.cloudFile.findMany({
            where: whereClause,
            orderBy: { [sortBy]: order },
            include: { connection: { select: { provider: true } } }
        });

        const safeFiles = files.map((file: any) => ({
            ...file,
            size: file.size.toString()
        }));

        return NextResponse.json({ files: safeFiles, count: safeFiles.length });
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userId = verifyToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const provider = formData.get('provider') as string || 'GOOGLE_DRIVE';

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        const connection = await prisma.cloudConnection.findFirst({
            where: { userId, provider, status: 'CONNECTED' }
        });

        if (!connection) return NextResponse.json({ error: 'No connected account found' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        let savedFile;

        if (connection.provider === 'GOOGLE_DRIVE') {
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
            oauth2Client.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            const driveRes = await drive.files.create({
                requestBody: { name: file.name, mimeType: file.type },
                media: { mimeType: file.type, body: ReadableStreamFromBuffer(buffer) as any },
                fields: 'id, name, mimeType, size, webViewLink, iconLink, md5Checksum'
            });

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId, connectionId: connection.id, fileId: driveRes.data.id!, name: driveRes.data.name!,
                    mimeType: driveRes.data.mimeType!, size: BigInt(driveRes.data.size || file.size),
                    webViewLink: driveRes.data.webViewLink, iconLink: driveRes.data.iconLink,
                    md5Checksum: driveRes.data.md5Checksum, isDir: false
                }
            });
        }
        else if (connection.provider === 'DROPBOX') {
            const dbx = new Dropbox({ accessToken: connection.accessToken });
            const driveRes = await dbx.filesUpload({ path: '/' + file.name, contents: buffer, mode: { '.tag': 'add' } });
            const driveFile: any = driveRes.result;

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId, connectionId: connection.id, fileId: driveFile.id, name: driveFile.name,
                    mimeType: file.type, size: BigInt(driveFile.size), path: driveFile.path_lower,
                    md5Checksum: driveFile.content_hash, isDir: false
                }
            });
        }
        else if (connection.provider === 'ONEDRIVE') {
            const driveRes = await axios.put(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(file.name)}:/content`, buffer, {
                headers: { 'Authorization': `Bearer ${connection.accessToken}`, 'Content-Type': file.type }
            });
            const driveFile = driveRes.data;

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId, connectionId: connection.id, fileId: driveFile.id, name: driveFile.name,
                    mimeType: driveFile.file?.mimeType || file.type, size: BigInt(driveFile.size),
                    webViewLink: driveFile.webUrl, md5Checksum: driveFile.file?.hashes?.quickXorHash || null, isDir: false
                }
            });
        }

        return NextResponse.json({ 
            message: 'File uploaded successfully', 
            file: { ...savedFile, size: savedFile?.size.toString() } 
        });

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}

// Helper to convert Buffer to Readable Stream (Node.js compatible)
function ReadableStreamFromBuffer(buffer: Buffer) {
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
