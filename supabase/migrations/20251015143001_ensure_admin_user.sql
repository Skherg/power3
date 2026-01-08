-- Ensure the admin user exists in production
-- This migration will safely add the admin user if it doesn't exist

-- First, let's check if the user exists in auth.users
DO $$
BEGIN
    -- Insert admin user if it doesn't exist
    INSERT INTO admin_users (user_id, email, is_active) 
    SELECT 
        '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid,
        COALESCE(
            (SELECT email FROM auth.users WHERE id = '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid),
            'admin@example.com'
        ),
        true
    WHERE NOT EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid
    );
    
    -- Log the result
    IF FOUND THEN
        RAISE NOTICE 'Admin user inserted successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END $$;

-- Verify the admin user exists
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM admin_users WHERE user_id = '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid;
    RAISE NOTICE 'Admin users found: %', admin_count;
END $$;