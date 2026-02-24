import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vaultiq_super_secret_dev_key';

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            cloudConnections: []
        });

        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: { id: user.id, email: user.email, firstName, lastName } });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        let user = await User.findOne({ email });
        if (!user) {
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
            res.status(200).json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
        });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/me
// @desc    Get logged in user details
// @access  Private (Needs middleware, skipping for mock just verifying structural setup)
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        // Mock returning the first user for now if no middleware is active
        const user = await User.findOne().select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;
