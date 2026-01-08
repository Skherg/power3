-- Fix RLS policies to allow admin users to perform admin operations

-- Drop the existing admin policies that only work with service role
DROP POLICY IF EXISTS "Admin full access on users" ON users;
DROP POLICY IF EXISTS "Admin full access on assessments" ON assessments;
DROP POLICY IF EXISTS "Admin full access on test_links" ON test_links;
DROP POLICY IF EXISTS "Admin full access on settings" ON settings;

-- Create a better function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current authenticated user is in the admin_users table
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create proper admin policies for test_links table
CREATE POLICY "Admin can insert test_links" ON test_links
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY "Admin can delete test_links" ON test_links
    FOR DELETE 
    TO authenticated
    USING (is_admin_user());

-- Create proper admin policies for settings table
CREATE POLICY "Admin can update settings" ON settings
    FOR UPDATE 
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY "Admin can insert settings" ON settings
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_admin_user());

-- Create proper admin policies for users table (for admin dashboard access)
CREATE POLICY "Admin can read all users" ON users
    FOR SELECT 
    TO authenticated
    USING (is_admin_user());

-- Create proper admin policies for assessments table (for admin dashboard access)
CREATE POLICY "Admin can read all assessments" ON assessments
    FOR SELECT 
    TO authenticated
    USING (is_admin_user());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON test_links TO authenticated;
GRANT SELECT, INSERT, UPDATE ON settings TO authenticated;