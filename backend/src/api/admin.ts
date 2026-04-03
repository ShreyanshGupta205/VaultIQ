import { Router, Request, Response } from 'express';

const router = Router();

// /api/admin/stats
router.get('/stats', async (req: Request, res: Response) => {
    res.json({ message: 'Admin system stats' });
});

export default router;
