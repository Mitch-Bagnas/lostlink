import dotenv from 'dotenv';
import path from 'path';

import fs from 'fs';

// Look for .env in current directory, backend directory, or root
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-fallback-secret-min-32-chars-long-do-not-use-in-prod',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'LostLink <onboarding@resend.dev>',
};

if (!env.DATABASE_URL && env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: DATABASE_URL is not configured in production environment.');
}
