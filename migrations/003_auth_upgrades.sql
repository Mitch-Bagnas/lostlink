-- LostLink Migration: 003_auth_upgrades.sql
-- Description: Password reset tokens, Google OAuth support, and nullable password_hash.
-- Paste-ready for the Supabase SQL Editor. Fully idempotent.

-- 1. Create auth_provider enum if not exists
DO $$ BEGIN
    CREATE TYPE auth_provider_type AS ENUM ('local', 'google');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter Users Table
-- Make password_hash nullable for Google-only accounts
ALTER TABLE users 
    ALTER COLUMN password_hash DROP NOT NULL;

-- Add google_id and auth_provider columns
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE NULL,
    ADD COLUMN IF NOT EXISTS auth_provider auth_provider_type NOT NULL DEFAULT 'local';

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

-- 3. Create Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);

-- 5. Enable Row Level Security (defense-in-depth, no public access)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
