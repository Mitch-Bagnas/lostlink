import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuthStart,
  googleAuthCallback,
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/authSchemas';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

// Forgot & Reset Password
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// Google OAuth 2.0 PKCE Flow
router.get('/google', googleAuthStart);
router.get('/google/callback', googleAuthCallback);

export default router;
