import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

const DROPBOX_CLIENT_ID = (process.env.DROPBOX_CLIENT_ID || '').trim();
const ONEDRIVE_CLIENT_ID = (process.env.ONEDRIVE_CLIENT_ID || '').trim();

// Reliably get the app's base URL from environment variables
// NEXTAUTH_URL is set on Vercel, falls back to localhost for local dev
const APP_URL = (process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function GET(req: Request, { params }: { params: { provider: string } }) {
    const { provider } = params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    try {
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const state = token;
    const redirectUri = `${APP_URL}/api/cloud/auth/${provider}/callback`;

    if (provider === 'google') {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.email'],
            state
        });
        return NextResponse.redirect(url);
    } 
    else if (provider === 'dropbox') {
        const params = new URLSearchParams({
            client_id: DROPBOX_CLIENT_ID,
            response_type: 'code',
            redirect_uri: redirectUri,
            state: state,
            token_access_type: 'offline',
        });
        return NextResponse.redirect(`https://www.dropbox.com/oauth2/authorize?${params.toString()}`);
    }
    else if (provider === 'onedrive') {
        const scopes = encodeURIComponent('offline_access files.read.all user.read');
        const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${ONEDRIVE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scopes}&state=${state}`;
        return NextResponse.redirect(url);
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
}
