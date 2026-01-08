-- Add the current authenticated user as an admin
-- This should be run after the user has been created in Supabase Auth

-- Insert admin user (replace with actual user ID from your auth.users table)
-- You can find the user ID in your Supabase dashboard under Authentication > Users
INSERT INTO admin_users (user_id, email, is_active) 
VALUES (
    '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid,
    (SELECT email FROM auth.users WHERE id = '1b07ded5-3c0f-4dde-9232-7f754150ccd0'::uuid),
    true
) ON CONFLICT (user_id) DO NOTHING;

-- If you need to add more admin users, you can add them here:
-- INSERT INTO admin_users (user_id, email, is_active) 
-- VALUES (
--     'another-user-id'::uuid,
--     'admin@example.com',
--     true
-- ) ON CONFLICT (user_id) DO NOTHING;