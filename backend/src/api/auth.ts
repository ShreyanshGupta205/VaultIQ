import { Router, Request, Response } from 'express';

const router = Router();

// @route   POST /api/auth/login
// @desc    Mock login route
// @access  Public
router.post('/login', (req: Request, res: Response) => {
    res.json({ message: 'Login placeholder' });
});

// @route   POST /api/auth/register
// @desc    Mock register route
// @access  Public
router.post('/register', (req: Request, res: Response) => {
    res.json({ message: 'Register placeholder' });
});

// @route   GET /api/auth/oauth/google
// @desc    OAuth connection mock
// @access  Private
router.get('/oauth/google', (req: Request, res: Response) => {
    res.json({ message: 'Google OAuth placeholder' });
});

export default router;
