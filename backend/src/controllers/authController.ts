import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { query, pool } from '../config/db';
import { env } from '../config/env';
import { AuthenticatedRequest, SafeUser, User } from '../types';
import { sendPasswordResetEmail } from '../services/emailService';

const COOKIE_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SEVEN_DAYS_MS,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
}

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    is_premium: user.is_premium,
    role: user.role,
    status: user.status,
    suspended_reason: user.suspended_reason,
    must_change_password: user.must_change_password,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    password_changed_at: user.password_changed_at,
    google_id: user.google_id || null,
    auth_provider: user.auth_provider || 'local',
    has_password: Boolean(user.password_hash),
  };
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password, phone } = req.body;

  try {
    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Signup ALWAYS assigns role 'user' and status 'active' - never accept role from client
    const insertResult = await query<User>(
      `INSERT INTO users (name, email, password_hash, phone, is_premium, role, status, must_change_password, password_changed_at, auth_provider)
       VALUES ($1, $2, $3, $4, FALSE, 'user', 'active', FALSE, NOW() - INTERVAL '5 seconds', 'local')
       RETURNING id, name, email, password_hash, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider`,
      [name, email, passwordHash, phone || null]
    );

    const newUser = insertResult.rows[0];

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully',
      user: toSafeUser(newUser),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    const result = await query<User>(
      `SELECT id, name, email, password_hash, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider 
       FROM users 
       WHERE email = $1 
       LIMIT 1`,
      [email]
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];

    // Check if account has been suspended before verifying password
    if (user.status === 'suspended') {
      res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: user.suspended_reason || 'Your account has been suspended by an administrator.',
      });
      return;
    }

    // Friendly hint if this account was created via Google and has no local password set
    if (!user.password_hash) {
      res.status(400).json({
        error: 'GOOGLE_SIGNIN_REQUIRED',
        message: 'This account uses Google Sign-In. Please sign in with Google or use "Forgot Password" to set a password.',
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Record last login timestamp
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    user.last_login_at = new Date();

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Logged in successfully',
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
}

// In-memory sliding window for per-email rate limit: max 3 requests per hour
const emailForgotRateLimitMap = new Map<string, number[]>();

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const genericResponse = {
    message: 'If that email exists in our system, a password reset link has been sent.',
  };

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Cleanup expired / already used tokens
    query(
      `DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '1 day' OR used_at IS NOT NULL`
    ).catch((err) => console.error('Token cleanup error:', err));

    // 2. Per-email rate limit check: max 3 per hour
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const timestamps = (emailForgotRateLimitMap.get(normalizedEmail) || []).filter((ts) => ts > oneHourAgo);

    if (timestamps.length >= 3) {
      // Exceeded limit: return identical 200 without sending email (prevent enumeration)
      res.status(200).json(genericResponse);
      return;
    }
    timestamps.push(now);
    emailForgotRateLimitMap.set(normalizedEmail, timestamps);

    // 3. Query user
    const userResult = await query<User>(
      'SELECT id, name, email, status FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    // If user does not exist or is suspended: return identical 200 without sending email
    if (userResult.rowCount === 0 || userResult.rows[0].status !== 'active') {
      res.status(200).json(genericResponse);
      return;
    }

    const user = userResult.rows[0];

    // 4. Generate 32-byte cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 5. Invalidate older unused tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // 6. Insert new token hash (expires in 30 minutes)
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id, tokenHash]
    );

    // 7. Send email asynchronously (DO NOT await it so response timing is identical)
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetUrl,
    }).catch((err) => console.error('Async password reset email error:', err));

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('forgotPassword error:', error);
    // Return identical message even on error
    res.status(200).json(genericResponse);
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  try {
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const tokenRes = await query<{ id: string; user_id: string; expires_at: Date; used_at: Date | null; status: string }>(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.status 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {
      res.status(400).json({
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'The password reset link is invalid or has expired. Please request a new link.',
      });
      return;
    }

    const tokenRecord = tokenRes.rows[0];

    // Check used or expired
    if (tokenRecord.used_at !== null || new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      res.status(400).json({
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'The password reset link is invalid or has expired. Please request a new link.',
      });
      return;
    }

    // Check suspended
    if (tokenRecord.status === 'suspended') {
      res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended. Password reset is not permitted.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password, revoke old sessions via password_changed_at, and mark token used
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users 
         SET password_hash = $1, 
             password_changed_at = NOW(), 
             must_change_password = FALSE 
         WHERE id = $2`,
        [passwordHash, tokenRecord.user_id]
      );

      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [tokenRecord.id]
      );

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new password.',
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
}

export function googleAuthStart(req: Request, res: Response): void {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(500).json({ error: 'Google OAuth is not configured on this server.' });
    return;
  }

  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const cookiePayload = JSON.stringify({ state, nonce, codeVerifier });
  const hmac = crypto.createHmac('sha256', env.JWT_SECRET).update(cookiePayload).digest('hex');
  const signedCookie = `${Buffer.from(cookiePayload).toString('base64url')}.${hmac}`;

  res.cookie('google_oauth_session', signedCookie, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/',
  });

  const redirectUri = `${env.FRONTEND_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function googleAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error: googleError } = req.query as { code?: string; state?: string; error?: string };

  if (googleError || !code || !state) {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed`);
    return;
  }

  const rawSession = req.cookies?.google_oauth_session;
  res.clearCookie('google_oauth_session', { path: '/' });

  if (!rawSession || typeof rawSession !== 'string') {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=session_missing`);
    return;
  }

  // Verify HMAC signature
  const [b64Payload, signature] = rawSession.split('.');
  if (!b64Payload || !signature) {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=invalid_session`);
    return;
  }

  const sessionJson = Buffer.from(b64Payload, 'base64url').toString('utf8');
  const expectedSig = crypto.createHmac('sha256', env.JWT_SECRET).update(sessionJson).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=tampered_session`);
    return;
  }

  let sessionData: { state: string; nonce: string; codeVerifier: string };
  try {
    sessionData = JSON.parse(sessionJson);
  } catch {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=corrupt_session`);
    return;
  }

  if (sessionData.state !== state) {
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=state_mismatch`);
    return;
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${env.FRONTEND_URL}/api/auth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: sessionData.codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Google token exchange error:', errBody);
      res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=token_exchange`);
      return;
    }

    const tokenData = await tokenResponse.json() as any;
    const idToken = tokenData.id_token;

    // Verify ID token and nonce
    const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=no_profile`);
      return;
    }

    // Security rule: Only accept verified emails
    if (payload.email_verified !== true) {
      res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=email_not_verified`);
      return;
    }

    // Verify nonce
    if (payload.nonce !== sessionData.nonce) {
      res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed&reason=nonce_mismatch`);
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || payload.given_name || 'LostLink User';

    // 1. Check if user exists by google_id OR email
    const existingUserRes = await query<User>(
      'SELECT id, name, email, role, status, suspended_reason, password_hash, google_id FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
      [googleId, email]
    );

    let dbUser: User;

    if (existingUserRes.rowCount && existingUserRes.rowCount > 0) {
      const foundUser = existingUserRes.rows[0];

      // Check suspended status BEFORE linking or signing in
      if (foundUser.status === 'suspended') {
        const reason = encodeURIComponent(foundUser.suspended_reason || 'Your account has been suspended by an administrator.');
        res.redirect(`${env.FRONTEND_URL}/auth?error=ACCOUNT_SUSPENDED&reason=${reason}`);
        return;
      }

      if (foundUser.google_id === googleId) {
        // Existing Google user - update last_login_at
        const updateRes = await query<User>(
          `UPDATE users SET last_login_at = NOW() WHERE id = $1
           RETURNING id, name, email, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider, password_hash`,
          [foundUser.id]
        );
        dbUser = updateRes.rows[0];
      } else {
        // Account linking hijack fix:
        // Linked local account matching Google verified email:
        // Set google_id, auth_provider = 'google', password_hash = NULL, password_changed_at = NOW() (kills existing sessions), must_change_password = FALSE
        const linkRes = await query<User>(
          `UPDATE users 
           SET google_id = $1, 
               auth_provider = 'google', 
               password_hash = NULL, 
               password_changed_at = NOW(), 
               must_change_password = FALSE,
               last_login_at = NOW()
           WHERE id = $2
           RETURNING id, name, email, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider, password_hash`,
          [googleId, foundUser.id]
        );
        dbUser = linkRes.rows[0];
      }
    } else {
      // New user registration via Google: role is strictly 'user'
      const insertRes = await query<User>(
        `INSERT INTO users (name, email, google_id, auth_provider, role, status, is_premium, must_change_password, password_changed_at, last_login_at)
         VALUES ($1, $2, $3, 'google', 'user', 'active', FALSE, FALSE, NOW() - INTERVAL '5 seconds', NOW())
         RETURNING id, name, email, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider, password_hash`,
        [name, email, googleId]
      );
      dbUser = insertRes.rows[0];
    }

    // Issue JWT cookie and redirect to dashboard
    const token = jwt.sign(
      { userId: dbUser.id, email: dbUser.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, token);
    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/auth?error=google_failed`);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await query<User>(
      `SELECT id, name, email, phone, is_premium, role, status, suspended_reason, must_change_password, last_login_at, created_at, password_changed_at, google_id, auth_provider, password_hash 
       FROM users 
       WHERE id = $1 
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user: toSafeUser(result.rows[0]) });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}
