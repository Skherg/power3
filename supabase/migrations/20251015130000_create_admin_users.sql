-- Create admin_users table to manage admin access
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
-- Only authenticated users can read admin_users (for checking admin status)
CREATE POLICY "Authenticated users can read admin_users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can manage admin users
CREATE POLICY "Service role can manage admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Create a function to create the first admin user
CREATE OR REPLACE FUNCTION create_first_admin(admin_email TEXT, admin_password TEXT)
RETURNS TEXT AS $$
DECLARE
    new_user_id UUID;
    admin_count INTEGER;
BEGIN
    -- Check if any admin users already exist
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    
    IF admin_count > 0 THEN
        RETURN 'Admin users already exist. Use Supabase dashboard to manage users.';
    END IF;
    
    -- This function should be called from the Supabase dashboard or CLI
    -- It's not meant to be called from the application
    RETURN 'Please create admin users through Supabase Auth dashboard and then add them to admin_users table.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Add unique constraint to prevent duplicate admin entries
ALTER TABLE admin_users ADD CONSTRAINT unique_admin_user_id UNIQUE (user_id);