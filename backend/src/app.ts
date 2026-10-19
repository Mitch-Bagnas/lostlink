import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { testDbConnection } from './config/db';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import usersRoutes from './routes/usersRoutes';
import itemsRoutes from './routes/itemsRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import foundRoutes from './routes/foundRoutes';
import adminRoutes from './routes/adminRoutes';

export const app = express();

// Trust reverse proxy (Render & Vercel) for rate limiting & secure cookie protocols
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin rewrites)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
  })
);

// Body parsing & Cookie parsing
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  const isDbConnected = await testDbConnection();
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use(errorHandler);
