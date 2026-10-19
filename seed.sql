-- LostLink Seed Data: seed.sql
-- Description: Inserts demo accounts with real bcrypt hashes and test items.
-- Demo Account Credentials:
-- 1. Free Account:    demo@lostlink.ph | Password: Password123!
-- 2. Premium Account: pro@lostlink.ph  | Password: Password123!
-- Real bcrypt hash for 'Password123!': $2a$10$OsJXQdSMKjfhRmmgL3pr/uw22mzgVH5T5ffwni5OcXb5wUNyGwTti

-- Clean up existing demo data if re-running
DELETE FROM users WHERE email IN ('demo@lostlink.ph', 'pro@lostlink.ph');

-- 1. Insert Demo Users
INSERT INTO users (id, name, email, password_hash, phone, is_premium, created_at)
VALUES 
(
    '11111111-1111-4111-a111-111111111111',
    'Demo Free User',
    'demo@lostlink.ph',
    '$2a$10$OsJXQdSMKjfhRmmgL3pr/uw22mzgVH5T5ffwni5OcXb5wUNyGwTti',
    '+639171234567',
    FALSE,
    NOW() - INTERVAL '10 days'
),
(
    '11111111-1111-4111-a111-111111111112',
    'Pro Power User',
    'pro@lostlink.ph',
    '$2a$10$OsJXQdSMKjfhRmmgL3pr/uw22mzgVH5T5ffwni5OcXb5wUNyGwTti',
    '+639189876543',
    TRUE,
    NOW() - INTERVAL '30 days'
);

-- 2. Insert Items for Free User (2 items: 1 lost, 1 safe; leaving 1 slot free before the 3-item limit)
INSERT INTO items (id, qr_id, owner_id, name, category, description, contact_method, status, created_at, updated_at)
VALUES 
(
    '22222222-2222-4222-a222-222222222221',
    '33333333-3333-4333-a333-333333333331',
    '11111111-1111-4111-a111-111111111111',
    'Blue Samsonite Backpack',
    'Bag',
    'Navy blue commuter backpack with laptop compartment and keychain ring.',
    'email',
    'lost',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
),
(
    '22222222-2222-4222-a222-222222222222',
    '33333333-3333-4333-a333-333333333332',
    '11111111-1111-4111-a111-111111111111',
    'University Student ID',
    'ID',
    'BS Computer Science ID card with green university lanyard.',
    'email',
    'safe',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
);

-- 3. Insert Items for Premium User (4 items: demonstrates unlimited items and email+phone contact method)
INSERT INTO items (id, qr_id, owner_id, name, category, description, contact_method, status, created_at, updated_at)
VALUES 
(
    '22222222-2222-4222-a222-222222222223',
    '33333333-3333-4333-a333-333333333333',
    '11111111-1111-4111-a111-111111111112',
    'MacBook Pro 14-inch M2',
    'Gadget',
    'Space Gray MacBook Pro with carbon skin on top lid.',
    'email+phone',
    'safe',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
),
(
    '22222222-2222-4222-a222-222222222224',
    '33333333-3333-4333-a333-333333333334',
    '11111111-1111-4111-a111-111111111112',
    'Bellroy Leather Wallet',
    'Wallet',
    'Caramel brown slim bifold with RFID protection.',
    'email+phone',
    'lost',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 hours'
),
(
    '22222222-2222-4222-a222-222222222225',
    '33333333-3333-4333-a333-333333333335',
    '11111111-1111-4111-a111-111111111112',
    'Sony WH-1000XM5 Headphones',
    'Gadget',
    'Black over-ear wireless headphones in original hard zip case.',
    'email+phone',
    'safe',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
),
(
    '22222222-2222-4222-a222-222222222226',
    '33333333-3333-4333-a333-333333333336',
    '11111111-1111-4111-a111-111111111112',
    'Calculus Binder & Notes',
    'School Supplies',
    'Black ring binder with handwritten lecture notes and problem sets.',
    'email',
    'safe',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
);

-- 4. Insert Demo Notification for Lost Blue Samsonite Backpack
INSERT INTO notifications (id, item_id, finder_message, finder_contact, created_at, read)
VALUES 
(
    '44444444-4444-4444-a444-444444444441',
    '22222222-2222-4222-a222-222222222221',
    'Found this backpack on the 3rd floor CS laboratory bench. I turned it over to Guard Ronald at the Building B security desk.',
    'Guard Ronald - local 4102',
    NOW() - INTERVAL '3 hours',
    FALSE
);
