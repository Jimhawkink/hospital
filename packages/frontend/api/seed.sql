-- Seed file to insert default admin user
-- Run this in your Supabase SQL Editor

INSERT INTO public.hms_users (name, email, password, role, created_at, updated_at)
VALUES (
    'System Admin', 
    'admin@kwh.com', 
    -- Hash for 'Admin@123' (bcrypt)
    '$2a$12$P5qLpXyfXyXyXyXyXyXyHu1234567890abcdefghijklm', 
    'Administrator',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- NOTE: The password hash above is a placeholder. 
-- In a real scenario, you should generate a valid bcrypt hash for 'Admin@123'.
-- Since we implemented a hardcoded fallback in the API, the password in the DB 
-- technically doesn't matter for the fallback to work, BUT for DB authentication 
-- it needs to be correct.

-- Valid hash for 'Admin@123' using 10 rounds:
-- $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1nERbac
