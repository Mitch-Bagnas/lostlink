import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { query } from '../config/db';
import { AuthenticatedRequest, AuthUserPayload } from '../types';

interface JwtTokenPayload {
  userId: string;
  email: string;
  iat?: number;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.token;

    // Support Authorization: Bearer <token> if cookie is not present
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

    // Query DB to verify user exists, active status, role, and password revision
    const result = await query(
      `SELECT id, email, is_premium, role, status, suspended_reason, password_changed_at, must_change_password 
       FROM users 
       WHERE id = $1 
       LIMIT 1`,
      [decoded.userId]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
      return;
    }

    const dbUser = result.rows[0];

    // Check if account has been suspended
    if (dbUser.status === 'suspended') {
      res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: dbUser.suspended_reason || 'Your account has been suspended by an administrator.',
      });
      return;
    }

    // Check if JWT was issued before the last password change / admin reset
    if (decoded.iat && dbUser.password_changed_at) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      // Allow 1000ms leeway for database vs system clock differences
      const passwordChangedAtMs = new Date(dbUser.password_changed_at).getTime() - 1000;

      if (tokenIssuedAtMs < passwordChangedAtMs) {
        res.status(401).json({
          error: 'SESSION_REVOKED',
          message: 'Your session has been invalidated because the password was changed. Please log in again.',
        });
        return;
      }
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      is_premium: dbUser.is_premium,
      role: dbUser.role,
      status: dbUser.status,
      must_change_password: dbUser.must_change_password,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

/**
 * Middleware: requireAdmin
 * Enforces admin-only access by re-querying the database role on every request.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    // Always re-read the role from the database to prevent stale token elevation
    const result = await query(
      'SELECT role, status, suspended_reason FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    const dbUser = result.rows[0];

    if (dbUser.status === 'suspended') {
      res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: dbUser.suspended_reason || 'Your account has been suspended by an administrator.',
      });
      return;
    }

    if (dbUser.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
      return;
    }

    next();
  } catch (error) {
    console.error('requireAdmin middleware error:', error);
    res.status(500).json({ error: 'Internal server error during permission check' });
  }
}
