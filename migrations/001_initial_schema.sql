-- LostLink Migration: 001_initial_schema.sql
-- Description: Creates initial tables, enums, indexes, and enables Row Level Security (RLS)

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
DO $$ BEGIN
    CREATE TYPE item_category AS ENUM (
        'Wallet', 
        'Bag', 
        'ID', 
        'Gadget', 
        'School Supplies', 
        'Other'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE contact_method AS ENUM (
        'email', 
        'email+phone'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM (
        'safe', 
        'lost'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category item_category NOT NULL,
    description TEXT NULL,
    contact_method contact_method NOT NULL DEFAULT 'email',
    status item_status NOT NULL DEFAULT 'safe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    finder_message TEXT NULL,
    finder_contact TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6. Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_qr_id ON items(qr_id);
CREATE INDEX IF NOT EXISTS idx_notifications_item_id ON notifications(item_id);

-- 7. Row Level Security (RLS) Enforcement
-- WHY RLS IS ENABLED WITHOUT POLICIES:
-- Enabling Row Level Security (RLS) on users, items, and notifications acts as a critical
-- defense-in-depth safeguard in Supabase. By enabling RLS without granting public or anon
-- policies, any accidental direct query to Supabase's auto-generated PostgREST HTTP API
-- using the Supabase public "anon" key will be completely rejected (returns empty / access denied).
-- The LostLink backend connects via a direct PostgreSQL connection string (using the postgres
-- superuser / pooler role), which bypasses RLS and handles all authentication, ownership
-- verification, and business rule enforcement securely inside Express.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
