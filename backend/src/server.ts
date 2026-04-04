import dotenv from 'dotenv';
// Load env vars immediately
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { connectDB } from './config/db';
import apiRoutes from './api';

// Connect to Database
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'VaultMind AI Backend is running' });
});

// Start Server
app.listen(port as number, '0.0.0.0', () => {
    console.log(`[server]: Server is running at http://0.0.0.0:${port}`);
});
