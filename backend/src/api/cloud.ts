import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { syncQueue } from '../workers';
import { google } from 'googleapis';
// DropboxAuth SDK removed — we build the OAuth URL manually (no PKCE) since we use client_secret flow
import axios from 'axios';
import qs from 'qs';
import { syncGoogleDrive, syncDropbox, syncOneDrive } from '../services/syncManager';

const router = Router();
const JWT_SECRET = 'vaultiq_super_secret_jwt_key_dev_2024';

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI || 'https://vaultiq-fdyf.onrender.com/api/cloud/auth/google/callback').trim();

const DROPBOX_CLIENT_ID = (process.env.DROPBOX_CLIENT_ID || '').trim();
const DROPBOX_CLIENT_SECRET = (process.env.DROPBOX_CLIENT_SECRET || '').trim();
const DROPBOX_REDIRECT_URI = (process.env.DROPBOX_REDIRECT_URI || 'https://vaultiq-fdyf.onrender.com/api/cloud/auth/dropbox/callback').trim();

const ONEDRIVE_CLIENT_ID = (process.env.ONEDRIVE_CLIENT_ID || '').trim();
const ONEDRIVE_CLIENT_SECRET = (process.env.ONEDRIVE_CLIENT_SECRET || '').trim();
const ONEDRIVE_REDIRECT_URI = (process.env.ONEDRIVE_REDIRECT_URI || 'https://vaultiq-fdyf.onrender.com/api/cloud/auth/onedrive/callback').trim();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://frontend-wheat-six-38.vercel.app';

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

const verifyToken = (token: string): string | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.user.id;
    } catch {
        return null;
    }
};

router.get('/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const connections = await prisma.cloudConnection.findMany({
            where: { userId }
        });
        const safeConnections = connections.map(conn => ({
            ...conn,
            storageUsed: conn.storageUsed.toString(),
            storageTotal: conn.storageTotal.toString()
        }));
        res.json({ connections: safeConnections });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/cloud/sync
router.post('/sync', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { connectionId } = req.body;
        const userId = (req as any).user.id;

        const connection = await prisma.cloudConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection || connection.userId !== userId) {
            res.status(404).json({ error: 'Connection not found' });
            return;
        }

        // Trigger sync
        if (syncQueue) {
            await syncQueue.add('syncCloud', { userId, connectionId: connection.id });
        } else {
            // Fallback sync logic
            if (connection.provider === 'GOOGLE_DRIVE') {
                syncGoogleDrive(connection).catch(console.error);
            } else if (connection.provider === 'DROPBOX') {
                syncDropbox(connection).catch(console.error);
            } else if (connection.provider === 'ONEDRIVE') {
                syncOneDrive(connection).catch(console.error);
            }
        }

        res.json({ message: 'Sync started successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/auth/:provider', (req: Request, res: Response): any => {
    const { provider } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Missing auth token' });
    }

    const userId = verifyToken(token);
    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const state = token;

    if (provider === 'google') {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.email'],
            state
        });
        return res.redirect(url);
    } 
    else if (provider === 'dropbox') {
        // Build the Dropbox OAuth URL manually — no PKCE (we use client_secret server-side)
        // Using PKCE (last arg=true in DropboxAuth.getAuthenticationUrl) without persisting
        // the code_verifier to the callback causes Dropbox to reject the token exchange.
        const params = new URLSearchParams({
            client_id: DROPBOX_CLIENT_ID,
            response_type: 'code',
            redirect_uri: DROPBOX_REDIRECT_URI,
            state: state,
            token_access_type: 'offline',  // Request refresh_token
        });
        const dropboxAuthUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
        return res.redirect(dropboxAuthUrl);
    }
    else if (provider === 'onedrive') {
        const scopes = encodeURIComponent('offline_access files.read.all user.read');
        // Switched from /common/ to /consumers/ to match your Azure app's User Audience (Personal Accounts only)
        const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${ONEDRIVE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(ONEDRIVE_REDIRECT_URI)}&response_mode=query&scope=${scopes}&state=${state}`;
        return res.redirect(url);
    } 
    else {
        return res.status(400).json({ error: 'Invalid provider' });
    }
});

router.get('/auth/:provider/callback', async (req: Request, res: Response): Promise<any> => {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;
 
    if (error) {
        console.error(`[cloud] OAuth error during callback for ${provider}:`, error, error_description || '');
        return res.redirect(`${FRONTEND_URL}/dashboard/integrations?error=oauth_rejected&details=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
        return res.redirect(`${FRONTEND_URL}/dashboard/integrations?error=missing_params`);
    }

    const userId = verifyToken(state);
    if (!userId) {
        return res.redirect(`${FRONTEND_URL}/dashboard/integrations?error=invalid_state`);
    }

    try {
        let dbProvider = '';
        let accessToken = '';
        let refreshToken = '';
        let email = '';
        let storageTotal = BigInt(0);
        let storageUsed = BigInt(0);

        if (provider === 'google') {
            dbProvider = 'GOOGLE_DRIVE';
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            
            accessToken = tokens.access_token || '';
            refreshToken = tokens.refresh_token || '';

            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            email = userInfo.data.email || 'user@google.com';

            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            const quota = await drive.about.get({ fields: 'storageQuota' });
            if (quota.data.storageQuota) {
                storageTotal = BigInt(quota.data.storageQuota.limit || '16106127360');
                storageUsed = BigInt(quota.data.storageQuota.usage || '0');
            }
        } 
        else if (provider === 'dropbox') {
            dbProvider = 'DROPBOX';

            console.log(`[cloud] Dropbox callback — exchanging code for token...`);
            
            // Manual token exchange using client_secret (no PKCE)
            const tokenParams = new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: DROPBOX_CLIENT_ID,
                client_secret: DROPBOX_CLIENT_SECRET,
                redirect_uri: DROPBOX_REDIRECT_URI
            }).toString();

            const tokenResponse = await axios.post(
                'https://api.dropboxapi.com/oauth2/token',
                tokenParams,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const result = tokenResponse.data;
            if (!result.access_token) {
                console.error('[cloud] Dropbox token exchange returned no access_token:', result);
                return res.redirect(`${FRONTEND_URL}/dashboard/integrations?error=dropbox_no_token`);
            }

            accessToken = result.access_token;
            refreshToken = result.refresh_token || ''; // Provided when token_access_type=offline
            
            console.log(`[cloud] Dropbox token obtained. Fetching user info...`);
            const userResponse = await axios.post(
                'https://api.dropboxapi.com/2/users/get_current_account',
                null,
                { 
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            email = userResponse.data.email;

            const spaceResponse = await axios.post(
                'https://api.dropboxapi.com/2/users/get_space_usage',
                null,
                { 
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            storageTotal = BigInt(spaceResponse.data.allocation?.allocated || 0);
            storageUsed = BigInt(spaceResponse.data.used || 0);
            console.log(`[cloud] Dropbox user: ${email}, storage: ${storageUsed}/${storageTotal}`);
        }
        else if (provider === 'onedrive') {
            dbProvider = 'ONEDRIVE';
            const tokenParams = qs.stringify({
                client_id: ONEDRIVE_CLIENT_ID,
                client_secret: ONEDRIVE_CLIENT_SECRET,
                code: code,
                redirect_uri: ONEDRIVE_REDIRECT_URI,
                grant_type: 'authorization_code'
            });

            const tokenRes = await axios.post('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', tokenParams, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            accessToken = tokenRes.data.access_token;
            refreshToken = tokenRes.data.refresh_token || '';

            const userRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            email = userRes.data.userPrincipalName || userRes.data.mail;

            const driveRes = await axios.get('https://graph.microsoft.com/v1.0/me/drive', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            storageTotal = BigInt(driveRes.data.quota?.total || 0);
            storageUsed = BigInt(driveRes.data.quota?.used || 0);
        }

        const existing = await prisma.cloudConnection.findFirst({
            where: { userId, provider: dbProvider }
        });

        let savedConnection;

        if (existing) {
            savedConnection = await prisma.cloudConnection.update({
                where: { id: existing.id },
                data: {
                    accessToken,
                    ...(refreshToken ? { refreshToken } : {}),
                    email,
                    status: 'CONNECTED',
                    storageTotal,
                    storageUsed,
                    updatedAt: new Date()
                }
            });
        } else {
            savedConnection = await prisma.cloudConnection.create({
                data: {
                    userId,
                    provider: dbProvider,
                    accessToken,
                    refreshToken,
                    email,
                    status: 'CONNECTED',
                    storageTotal,
                    storageUsed
                }
            });
        }

        if (syncQueue) {
            await syncQueue.add('syncCloud', { userId, connectionId: savedConnection.id });
        } else {
            // Fallback sync logic if Redis is not available
            if (dbProvider === 'GOOGLE_DRIVE') {
                syncGoogleDrive(savedConnection).catch(console.error);
            } else if (dbProvider === 'DROPBOX') {
                syncDropbox(savedConnection).catch(console.error);
            } else if (dbProvider === 'ONEDRIVE') {
                syncOneDrive(savedConnection).catch(console.error);
            }
        }

        return res.redirect(`${FRONTEND_URL}/dashboard/integrations?status=success`);
    } catch (err: any) {
        console.error(`Error in OAuth callback for ${provider}:`, err?.response?.data || err?.message || err);
        const errorMessage = err?.response?.data?.error_description || err?.message || 'callback_failed';
        return res.redirect(`${FRONTEND_URL}/dashboard/integrations?error=${encodeURIComponent(errorMessage)}`);
    }
});

router.delete('/disconnect/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const connectionId = req.params.id as string;

        const connection = await prisma.cloudConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection || connection.userId !== userId) {
            res.status(404).json({ error: 'Connection not found' });
            return;
        }

        await prisma.cloudConnection.delete({
            where: { id: connectionId }
        });

        res.json({ message: 'Disconnected successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

