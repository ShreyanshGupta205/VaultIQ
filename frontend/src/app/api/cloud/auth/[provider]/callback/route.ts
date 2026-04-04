import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { google } from 'googleapis';
import axios from 'axios';
import qs from 'qs';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

const DROPBOX_CLIENT_ID = (process.env.DROPBOX_CLIENT_ID || '').trim();
const DROPBOX_CLIENT_SECRET = (process.env.DROPBOX_CLIENT_SECRET || '').trim();

const ONEDRIVE_CLIENT_ID = (process.env.ONEDRIVE_CLIENT_ID || '').trim();
const ONEDRIVE_CLIENT_SECRET = (process.env.ONEDRIVE_CLIENT_SECRET || '').trim();

const verifyToken = (token: string): string | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.user.id;
    } catch {
        return null;
    }
};

export async function GET(req: Request, { params }: { params: { provider: string } }) {
    const { provider } = params;
    const { searchParams } = new URL(req.url);
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    const dashboardRedirectUrl = `${origin}/dashboard/integrations`;

    if (error) {
        return NextResponse.redirect(`${dashboardRedirectUrl}?error=oauth_rejected&details=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${dashboardRedirectUrl}?error=missing_params`);
    }

    const userId = verifyToken(state);
    if (!userId) {
        return NextResponse.redirect(`${dashboardRedirectUrl}?error=invalid_state`);
    }

    const redirectUri = `${origin}/api/cloud/auth/${provider}/callback`;

    try {
        let dbProvider = '';
        let accessToken = '';
        let refreshToken = '';
        let email = '';
        let storageTotal = BigInt(0);
        let storageUsed = BigInt(0);

        if (provider === 'google') {
            dbProvider = 'GOOGLE_DRIVE';
            const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
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
            const tokenResponse = await axios.post('https://api.dropboxapi.com/oauth2/token', new URLSearchParams({
                code: code, grant_type: 'authorization_code', client_id: DROPBOX_CLIENT_ID, client_secret: DROPBOX_CLIENT_SECRET, redirect_uri: redirectUri
            }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            accessToken = tokenResponse.data.access_token;
            refreshToken = tokenResponse.data.refresh_token || '';

            const userRes = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, { 
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } 
            });
            email = userRes.data.email;

            const spaceRes = await axios.post('https://api.dropboxapi.com/2/users/get_space_usage', null, { 
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } 
            });
            storageTotal = BigInt(spaceRes.data.allocation?.allocated || 0);
            storageUsed = BigInt(spaceRes.data.used || 0);
        }
        else if (provider === 'onedrive') {
            dbProvider = 'ONEDRIVE';
            const tokenRes = await axios.post('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', qs.stringify({
                client_id: ONEDRIVE_CLIENT_ID, client_secret: ONEDRIVE_CLIENT_SECRET, code, redirect_uri: redirectUri, grant_type: 'authorization_code'
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

            accessToken = tokenRes.data.access_token;
            refreshToken = tokenRes.data.refresh_token || '';

            const userRes = await axios.get('https://graph.microsoft.com/v1.0/me', { headers: { 'Authorization': `Bearer ${accessToken}` } });
            email = userRes.data.userPrincipalName || userRes.data.mail;

            const driveRes = await axios.get('https://graph.microsoft.com/v1.0/me/drive', { headers: { 'Authorization': `Bearer ${accessToken}` } });
            storageTotal = BigInt(driveRes.data.quota?.total || 0);
            storageUsed = BigInt(driveRes.data.quota?.used || 0);
        }

        const data = {
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
            email,
            status: 'CONNECTED',
            storageTotal,
            storageUsed,
            updatedAt: new Date()
        };

        await prisma.cloudConnection.upsert({
            where: { userId_provider_email: { userId, provider: dbProvider, email } },
            update: data,
            create: { userId, provider: dbProvider, ...data }
        });

        return NextResponse.redirect(`${dashboardRedirectUrl}?status=success&trigger_sync=true`);
    } catch (err: any) {
        console.error(`Error in Google OAuth callback:`, err?.response?.data || err?.message || err);
        return NextResponse.redirect(`${dashboardRedirectUrl}?error=callback_failed`);
    }
}
