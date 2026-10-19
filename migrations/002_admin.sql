-- LostLink Migration: 002_admin.sql
-- Description: Adds admin role, account suspension, audit logging, and session revocation columns.
-- Paste-ready for the Supabase SQL Editor. Fully idempotent.

-- 1. Create Enums if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter Users Table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user',
    ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS suspended_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- 5. Enable Row Level Security on audit_logs (defense in depth, no public access)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
