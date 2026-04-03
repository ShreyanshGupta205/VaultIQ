import { Router } from 'express';
import authRoutes from './auth';
import cloudRoutes from './cloud';
import filesRoutes from './files';
import aiRoutes from './ai';
import userRoutes from './user';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cloud', cloudRoutes);
router.use('/files', filesRoutes);
router.use('/ai', aiRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;
