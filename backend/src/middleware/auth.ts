import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { query } from '../config/db';
import { AuthenticatedRequest, AuthUserPayload } from '../types';

interface JwtTokenPayload {
  userId: string;
  email: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.token;

    // Also support Authorization: Bearer <token> if cookie is not present
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    let decoded: JwtTokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
    } catch (jwtError) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      return;
    }

    // Query DB to verify user still exists and obtain real-time is_premium status
    const result = await query(
      'SELECT id, email, is_premium FROM users WHERE id = $1 LIMIT 1',
      [decoded.userId]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
      return;
    }

    const dbUser = result.rows[0];
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      is_premium: dbUser.is_premium,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
