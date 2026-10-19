import rateLimit from 'express-rate-limit';

// Rate limiter for authentication routes (prevent brute force on login / signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
  },
});

// Strict rate limiter for public finder notify endpoint:
// Evaluated per-IP + per-qr_id to protect individual item owners from spam flooding
export const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 notifications per qr_id per IP within 15 minutes
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const qrId = req.params.qrId || 'unknown-qr';
    return `${ip}_${qrId}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many notifications submitted for this item. Please wait a few minutes before trying again.',
  },
});

// Rate limiter for admin panel routes
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Generous 300 requests per 15 minutes for legitimate admin tasks
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many administrative requests from this IP. Please slow down.',
  },
});
