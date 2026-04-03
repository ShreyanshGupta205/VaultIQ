import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import multer from 'multer';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import axios from 'axios';
import { PassThrough } from 'stream';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

const upload = multer({ storage: multer.memoryStorage() });

// Middleware mock for extracting user
const authMiddleware = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// GET /api/files - List files with search, filtering, and sorting
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { search, connectionId, type, sortBy, order } = req.query;

        let whereClause: any = { userId };

        // Filtering
        if (search) {
            whereClause.name = { contains: search as string };
        }
        if (connectionId) {
            whereClause.connectionId = connectionId as string;
        }
        if (type) {
            if (type === 'document') {
                whereClause.mimeType = { in: ['application/pdf', 'application/docx', 'application/xlsx', 'application/msword'] };
            } else if (type === 'image') {
                whereClause.mimeType = { startsWith: 'image/' };
            } else if (type === 'video') {
                whereClause.mimeType = { startsWith: 'video/' };
            }
        }

        // Sorting
        let orderByClause: any = { updatedAt: 'desc' };
        if (sortBy) {
            const allowedSorts = ['name', 'size', 'updatedAt'];
            const sortField = allowedSorts.includes(sortBy as string) ? (sortBy as string) : 'updatedAt';
            const sortOrder = order === 'asc' ? 'asc' : 'desc';
            orderByClause = { [sortField]: sortOrder };
        }

        const files = await prisma.cloudFile.findMany({
            where: whereClause,
            orderBy: orderByClause,
            include: {
                connection: {
                    select: { provider: true }
                }
            }
        });

        // Convert BigInt to string
        const safeFiles = files.map(file => ({
            ...file,
            size: file.size.toString()
        }));

        res.json({ files: safeFiles, count: safeFiles.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching files' });
    }
});

// POST /api/files/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const selectedProvider = req.body.provider || 'GOOGLE_DRIVE';
        
        // 1. Find valid connection
        const connection = await prisma.cloudConnection.findFirst({
            where: { userId, provider: selectedProvider, status: 'CONNECTED' }
        });

        if (!connection || !connection.accessToken) {
            // Fallback to any connected connection
            const anyConn = await prisma.cloudConnection.findFirst({
                where: { userId, status: 'CONNECTED' }
            });
            if (!anyConn) return res.status(400).json({ error: 'No connected cloud account found.' });
            Object.assign(connection || {}, anyConn);
        }

        let savedFile: any = null;

        if (connection!.provider === 'GOOGLE_DRIVE') {
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
            oauth2Client.setCredentials({ access_token: connection!.accessToken, refresh_token: connection!.refreshToken });
            
            oauth2Client.on('tokens', async (tokens) => {
                if (tokens.access_token) {
                    await prisma.cloudConnection.update({
                        where: { id: connection!.id },
                        data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || connection!.refreshToken }
                    });
                }
            });

            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const bufferStream = new PassThrough();
            bufferStream.end(file.buffer);

            const driveRes = await drive.files.create({
                requestBody: { name: file.originalname, mimeType: file.mimetype },
                media: { mimeType: file.mimetype, body: bufferStream },
                fields: 'id, name, mimeType, size, webViewLink, iconLink, md5Checksum'
            });

            const driveFile = driveRes.data;

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId,
                    connectionId: connection!.id,
                    fileId: driveFile.id!,
                    name: driveFile.name || file.originalname,
                    mimeType: driveFile.mimeType || file.mimetype,
                    size: driveFile.size ? BigInt(driveFile.size) : BigInt(file.size),
                    webViewLink: driveFile.webViewLink,
                    iconLink: driveFile.iconLink,
                    md5Checksum: driveFile.md5Checksum,
                    isDir: false,
                }
            });
        } 
        else if (connection!.provider === 'DROPBOX') {
            const dbx = new Dropbox({ accessToken: connection!.accessToken });
            const driveRes = await dbx.filesUpload({
                path: '/' + file.originalname.replace(/\\/g, '/'),
                contents: file.buffer,
                mode: { '.tag': 'add' },
                mute: true,
            });

            const driveFile: any = driveRes.result;

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId,
                    connectionId: connection!.id,
                    fileId: driveFile.id,
                    name: driveFile.name,
                    mimeType: file.mimetype,
                    size: BigInt(driveFile.size || file.size),
                    path: driveFile.path_lower,
                    md5Checksum: driveFile.content_hash,
                    isDir: false,
                }
            });
        }
        else if (connection!.provider === 'ONEDRIVE') {
            const driveRes = await axios.put(`https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(file.originalname)}:/content`, file.buffer, {
                headers: {
                    'Authorization': `Bearer ${connection!.accessToken}`,
                    'Content-Type': file.mimetype
                }
            });

            const driveFile = driveRes.data;

            savedFile = await prisma.cloudFile.create({
                data: {
                    userId,
                    connectionId: connection!.id,
                    fileId: driveFile.id,
                    name: driveFile.name,
                    mimeType: driveFile.file?.mimeType || file.mimetype,
                    size: BigInt(driveFile.size || file.size),
                    webViewLink: driveFile.webUrl,
                    md5Checksum: driveFile.file?.hashes?.quickXorHash || null,
                    isDir: false,
                }
            });
        }

        const safeFile = {
            ...savedFile,
            size: savedFile?.size?.toString()
        };

        return res.json({ message: 'File uploaded successfully', file: safeFile });
    } catch (err: any) {
        console.error('Error uploading file to Google Drive:', err?.message || err);
        return res.status(500).json({ error: 'Failed to upload file to cloud provider' });
    }
});

// DELETE /api/files/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.id;
        const id = req.params.id as string;

        const dbFile: any = await prisma.cloudFile.findUnique({
            where: { id },
            include: { connection: true }
        });

        if (!dbFile || dbFile.userId !== userId) {
            return res.status(404).json({ error: 'File not found' });
        }

        const connection = dbFile.connection;

        if (connection.provider === 'GOOGLE_DRIVE') {
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
            oauth2Client.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            try {
                await drive.files.update({
                    fileId: dbFile.fileId,
                    requestBody: { trashed: true }
                });
            } catch (driveErr: any) {
                console.error("Google Drive API Error deleting file:", driveErr?.message || driveErr);
                if (driveErr?.code !== 404 && driveErr?.status !== 404) {
                     return res.status(500).json({ error: 'Failed to delete file from Google Drive' });
                }
            }
        } 
        else if (connection.provider === 'DROPBOX') {
            const dbx = new Dropbox({ accessToken: connection.accessToken });
            try {
                await dbx.filesDeleteV2({ path: dbFile.path || `/${dbFile.name}` });
            } catch (err: any) {
                console.error("Dropbox API Error deleting file:", err);
            }
        }
        else if (connection.provider === 'ONEDRIVE') {
             try {
                await axios.delete(`https://graph.microsoft.com/v1.0/me/drive/items/${dbFile.fileId}`, {
                    headers: { 'Authorization': `Bearer ${connection.accessToken}` }
                });
            } catch (err: any) {
                console.error("OneDrive API Error deleting file:", err?.response?.data || err);
            }
        }

        // Delete from local database
        await prisma.cloudFile.delete({
            where: { id: dbFile.id }
        });

        return res.json({ message: 'File deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting file:', err?.message || err);
        return res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
