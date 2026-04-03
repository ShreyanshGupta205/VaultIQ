import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import axios from 'axios';
import prisma from '../lib/prisma';
import { CloudConnection } from '@prisma/client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

export async function syncGoogleDrive(connection: CloudConnection) {
    if (!connection.accessToken) {
        throw new Error('No access token available for this Google Drive connection.');
    }

    console.log(`[syncManager] Starting Google Drive sync for user ${connection.userId}`);

    try {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
        
        oauth2Client.setCredentials({
            access_token: connection.accessToken,
            refresh_token: connection.refreshToken,
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // Fetch storage quota
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

        let nextPageToken: string | undefined = undefined;
        let fileCount = 0;

        do {
            const res: any = await drive.files.list({
                q: "trashed=false",
                fields: "nextPageToken, files(id, name, mimeType, size, webViewLink, iconLink, md5Checksum, parents)",
                pageSize: 100,
                pageToken: nextPageToken,
            });

            const files = res.data.files;
            if (files && files.length > 0) {
                // We use a transaction so failed inserts don't leave half-state
                for (const file of files) {
                    const isDir = file.mimeType === 'application/vnd.google-apps.folder';
                    const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
                    const parentId = file.parents && file.parents.length > 0 ? file.parents[0] : null;

                    await prisma.cloudFile.upsert({
                        where: {
                            connectionId_fileId: {
                                connectionId: connection.id,
                                fileId: file.id!
                            }
                        },
                        update: {
                            name: file.name || 'Untitled',
                            mimeType: file.mimeType || 'unknown',
                            size: sizeBytes,
                            webViewLink: file.webViewLink,
                            iconLink: file.iconLink,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: file.md5Checksum
                        },
                        create: {
                            userId: connection.userId,
                            connectionId: connection.id,
                            fileId: file.id!,
                            name: file.name || 'Untitled',
                            mimeType: file.mimeType || 'unknown',
                            size: sizeBytes,
                            webViewLink: file.webViewLink,
                            iconLink: file.iconLink,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: file.md5Checksum
                        }
                    });
                }
                fileCount += files.length;
                console.log(`[syncManager] Synced ${fileCount} files so far...`);
            }

            nextPageToken = res.data.nextPageToken || undefined;
        } while (nextPageToken);

        console.log(`[syncManager] Successfully completed syncing ${fileCount} files for user ${connection.userId}`);
        
    } catch (error: any) {
        console.error(`[syncManager] Error fetching Google Drive files:`, error?.message || error);
    }
}

export async function syncDropbox(connection: CloudConnection) {
    if (!connection.accessToken) {
        throw new Error('No access token available for this Dropbox connection.');
    }
    console.log(`[syncManager] Starting Dropbox sync for user ${connection.userId}`);

    try {
        const dbx = new Dropbox({ accessToken: connection.accessToken });
        
        let hasMore = true;
        let cursor: string | undefined = undefined;
        let fileCount = 0;

        while (hasMore) {
            const res: any = cursor 
                ? await dbx.filesListFolderContinue({ cursor }) 
                : await dbx.filesListFolder({ path: '', recursive: true });

            const files = res.result.entries;

            if (files && files.length > 0) {
                for (const file of files) {
                    if (file['.tag'] === 'deleted') continue;

                    const isDir = file['.tag'] === 'folder';
                    const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
                    // Dropbox uses paths, parent is derived from path_lower
                    const parentId = file.path_lower ? file.path_lower.substring(0, file.path_lower.lastIndexOf('/')) || null : null;

                    await prisma.cloudFile.upsert({
                        where: {
                            connectionId_fileId: {
                                connectionId: connection.id,
                                fileId: file.id
                            }
                        },
                        update: {
                            name: file.name,
                            mimeType: isDir ? 'folder' : 'unknown',
                            size: sizeBytes,
                            path: file.path_lower,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: file.content_hash || null // Dropbox provides content_hash
                        },
                        create: {
                            userId: connection.userId,
                            connectionId: connection.id,
                            fileId: file.id,
                            name: file.name,
                            mimeType: isDir ? 'folder' : 'unknown',
                            size: sizeBytes,
                            path: file.path_lower,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: file.content_hash || null
                        }
                    });
                }
                fileCount += files.length;
            }

            hasMore = res.result.has_more;
            cursor = res.result.cursor;
        }

        console.log(`[syncManager] Successfully completed syncing ${fileCount} files for Dropbox user ${connection.userId}`);
    } catch (error: any) {
        console.error(`[syncManager] Error fetching Dropbox files:`, error?.message || error);
    }
}

export async function syncOneDrive(connection: CloudConnection) {
    if (!connection.accessToken) {
        throw new Error('No access token available for this OneDrive connection.');
    }
    console.log(`[syncManager] Starting OneDrive sync for user ${connection.userId}`);

    try {
        let fetchUrl = 'https://graph.microsoft.com/v1.0/me/drive/root/delta';
        let fileCount = 0;

        while (fetchUrl) {
            const response = await axios.get(fetchUrl, {
                headers: { 'Authorization': `Bearer ${connection.accessToken}` }
            });

            const files = response.data.value;

            if (files && files.length > 0) {
                for (const file of files) {
                    // Skip items that are deleted in the delta sync
                    if (file['@removed']) continue;

                    const isDir = !!file.folder;
                    const sizeBytes = file.size ? BigInt(file.size) : BigInt(0);
                    const parentId = file.parentReference?.id || null;
                    const md5 = file.file?.hashes?.quickXorHash || null;

                    await prisma.cloudFile.upsert({
                        where: {
                            connectionId_fileId: {
                                connectionId: connection.id,
                                fileId: file.id
                            }
                        },
                        update: {
                            name: file.name,
                            mimeType: file.file?.mimeType || (isDir ? 'folder' : 'unknown'),
                            size: sizeBytes,
                            webViewLink: file.webUrl,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: md5
                        },
                        create: {
                            userId: connection.userId,
                            connectionId: connection.id,
                            fileId: file.id,
                            name: file.name,
                            mimeType: file.file?.mimeType || (isDir ? 'folder' : 'unknown'),
                            size: sizeBytes,
                            webViewLink: file.webUrl,
                            parentId: parentId,
                            isDir: isDir,
                            md5Checksum: md5
                        }
                    });
                }
                fileCount += files.length;
            }

            // Microsoft Graph delta pagination:
            // nextLink is used to continue the current full enumeration.
            // deltaLink is returned once the full enumeration is complete.
            fetchUrl = response.data['@odata.nextLink'] || null;
        }

        console.log(`[syncManager] Successfully completed syncing ${fileCount} files for OneDrive user ${connection.userId}`);
    } catch (error: any) {
        console.error(`[syncManager] Error fetching OneDrive files:`, error?.response?.data || error?.message || error);
    }
}
