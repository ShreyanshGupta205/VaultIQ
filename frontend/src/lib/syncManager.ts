import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import axios from 'axios';
import prisma from './prisma';
import { CloudConnection } from '@prisma/client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

export interface SyncResult {
    success: boolean;
    fileCount: number;
    continuationToken: string | null;
    error?: string;
}

export async function syncGoogleDriveChunk(connection: CloudConnection, pageToken?: string): Promise<SyncResult> {
    if (!connection.accessToken) throw new Error('No access token');

    try {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
        oauth2Client.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // On first page, sync quota
        if (!pageToken) {
            const quota = await drive.about.get({ fields: 'storageQuota' });
            if (quota.data.storageQuota) {
                await prisma.cloudConnection.update({
                    where: { id: connection.id },
                    data: {
                        storageTotal: BigInt(quota.data.storageQuota.limit || '16106127360'),
                        storageUsed: BigInt(quota.data.storageQuota.usage || '0')
                    }
                });
            }
        }

        const res: any = await drive.files.list({
            q: "trashed=false",
            fields: "nextPageToken, files(id, name, mimeType, size, webViewLink, iconLink, md5Checksum, parents)",
            pageSize: 50, // Small page for serverless
            pageToken: pageToken,
        });

        const files = res.data.files || [];
        for (const file of files) {
            const isDir = file.mimeType === 'application/vnd.google-apps.folder';
            const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
            const parentId = file.parents && file.parents.length > 0 ? file.parents[0] : null;

            await prisma.cloudFile.upsert({
                where: { connectionId_fileId: { connectionId: connection.id, fileId: file.id! } },
                update: { name: file.name || 'Untitled', mimeType: file.mimeType || 'unknown', size: sizeBytes, webViewLink: file.webViewLink, iconLink: file.iconLink, parentId, isDir, md5Checksum: file.md5Checksum },
                create: { userId: connection.userId, connectionId: connection.id, fileId: file.id!, name: file.name || 'Untitled', mimeType: file.mimeType || 'unknown', size: sizeBytes, webViewLink: file.webViewLink, iconLink: file.iconLink, parentId, isDir, md5Checksum: file.md5Checksum }
            });
        }

        return { success: true, fileCount: files.length, continuationToken: res.data.nextPageToken || null };
    } catch (error: any) {
        return { success: false, fileCount: 0, continuationToken: null, error: error.message };
    }
}

export async function syncDropboxChunk(connection: CloudConnection, cursor?: string): Promise<SyncResult> {
    if (!connection.accessToken) throw new Error('No access token');

    try {
        const dbx = new Dropbox({ accessToken: connection.accessToken });
        const res: any = cursor 
            ? await dbx.filesListFolderContinue({ cursor }) 
            : await dbx.filesListFolder({ path: '', recursive: true, limit: 50 });

        const files = res.result.entries || [];
        for (const file of files) {
            if (file['.tag'] === 'deleted') continue;
            const isDir = file['.tag'] === 'folder';
            const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
            const parentId = file.path_lower ? file.path_lower.substring(0, file.path_lower.lastIndexOf('/')) || null : null;

            await prisma.cloudFile.upsert({
                where: { connectionId_fileId: { connectionId: connection.id, fileId: file.id } },
                update: { name: file.name, mimeType: isDir ? 'folder' : 'unknown', size: sizeBytes, path: file.path_lower, parentId, isDir, md5Checksum: file.content_hash || null },
                create: { userId: connection.userId, connectionId: connection.id, fileId: file.id, name: file.name, mimeType: isDir ? 'folder' : 'unknown', size: sizeBytes, path: file.path_lower, parentId, isDir, md5Checksum: file.content_hash || null }
            });
        }

        return { success: true, fileCount: files.length, continuationToken: res.result.has_more ? res.result.cursor : null };
    } catch (error: any) {
        return { success: false, fileCount: 0, continuationToken: null, error: error.message };
    }
}

export async function syncOneDriveChunk(connection: CloudConnection, nextLink?: string): Promise<SyncResult> {
    if (!connection.accessToken) throw new Error('No access token');

    try {
        const fetchUrl = nextLink || 'https://graph.microsoft.com/v1.0/me/drive/root/delta';
        const response = await axios.get(fetchUrl, {
            headers: { 'Authorization': `Bearer ${connection.accessToken}` }
        });

        const files = response.data.value || [];
        for (const file of files) {
            if (file['@removed']) continue;
            const isDir = !!file.folder;
            const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
            const parentId = file.parentReference?.id || null;
            const md5 = file.file?.hashes?.quickXorHash || null;

            await prisma.cloudFile.upsert({
                where: { connectionId_fileId: { connectionId: connection.id, fileId: file.id } },
                update: { name: file.name, mimeType: file.file?.mimeType || (isDir ? 'folder' : 'unknown'), size: sizeBytes, webViewLink: file.webUrl, parentId, isDir, md5Checksum: md5 },
                create: { userId: connection.userId, connectionId: connection.id, fileId: file.id, name: file.name, mimeType: file.file?.mimeType || (isDir ? 'folder' : 'unknown'), size: sizeBytes, webViewLink: file.webUrl, parentId, isDir, md5Checksum: md5 }
            });
        }

        const nextContinuation = response.data['@odata.nextLink'] || null;
        return { success: true, fileCount: files.length, continuationToken: nextContinuation };
    } catch (error: any) {
        return { success: false, fileCount: 0, continuationToken: null, error: error.message };
    }
}
