import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { google } from 'googleapis';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_jwt_key_dev_2024';

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const GOOGLE_LOGIN_REDIRECT_URI = (process.env.GOOGLE_LOGIN_REDIRECT_URI || 'https://vaultiq-fdyf.onrender.com/api/auth/google/callback').trim();
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://frontend-wheat-six-38.vercel.app';

// @route   POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        let user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
            }
        });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            res.status(400).json({ error: 'Invalid Credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ error: 'Invalid Credentials' });
            return;
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token, authorization denied' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const user = await prisma.user.findUnique({
            where: { id: decoded.user.id },
            select: { id: true, email: true, name: true, createdAt: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
});

// @route   GET /api/auth/google/login
router.get('/google/login', (req: Request, res: Response): void => {
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_LOGIN_REDIRECT_URI);
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
    res.redirect(url);
});

// @route   GET /api/auth/google/callback
router.get('/google/callback', async (req: Request, res: Response): Promise<any> => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_rejected`);
    }

    if (!code || typeof code !== 'string') {
        return res.redirect(`${FRONTEND_URL}/login?error=missing_code`);
    }

    try {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_LOGIN_REDIRECT_URI);
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;
        const name = userInfo.data.name;

        if (!email) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_email_provided`);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    // We leave password empty/null since they use OAuth
                }
            });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            return res.redirect(`${FRONTEND_URL}/auth-callback?token=${token}`);
        });

    } catch (err: any) {
        console.error('Google Auth Error:', err?.message || err);
        return res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
    }
});

export default router;
