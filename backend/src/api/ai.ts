import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { analysisQueue } from '../workers';
import { runStorageAnalysis } from '../services/aiManager';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_jwt_key_dev_2024';

// Middleware to protect routes
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

// /api/ai/analyze
router.post('/analyze', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const report = await prisma.analysisReport.create({
            data: {
                userId,
                status: 'PENDING'
            }
        });

        if (analysisQueue) {
            await analysisQueue.add('analyzeStorage', { userId, reportId: report.id });
        } else {
            // FIRE AND FORGET if Redis is not connected
            runStorageAnalysis(userId, report.id).catch(console.error);
        }
        
        res.json({ message: 'Analysis started', reportId: report.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error starting analysis' });
    }
});

// /api/ai/report
router.get('/report', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const report = await prisma.analysisReport.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        if (!report) {
            res.json({ report: null });
            return;
        }

        // Convert BigInts
        const safeReport = {
            ...report,
            totalSize: report.totalSize.toString(),
            duplicatesSize: report.duplicatesSize.toString(),
            unusedSize: report.unusedSize.toString()
        };

        res.json({ report: safeReport });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching report' });
    }
});

export default router;
