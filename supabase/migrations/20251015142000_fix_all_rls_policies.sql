-- Comprehensive RLS policy fix for all tables
-- This migration will drop all existing policies and recreate them properly

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public insert on users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Allow public insert on assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public read on assessments" ON assessments;
DROP POLICY IF EXISTS "Admin can read all assessments" ON assessments;
DROP POLICY IF EXISTS "Allow public read on test_links" ON test_links;
DROP POLICY IF EXISTS "Allow public update on test_links" ON test_links;
DROP POLICY IF EXISTS "Admin can insert test_links" ON test_links;
DROP POLICY IF EXISTS "Admin can delete test_links" ON test_links;
DROP POLICY IF EXISTS "Allow public read on settings" ON settings;
DROP POLICY IF EXISTS "Admin can update settings" ON settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON settings;
DROP POLICY IF EXISTS "Allow public read on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read on questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Service role can manage admin_users" ON admin_users;
-- Recreate the admin check function (improved version)
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
-- USERS TABLE POLICIES
-- Allow anyone to insert (test takers creating their profile)
CREATE POLICY "users_insert_public" ON users
    FOR INSERT 
    WITH CHECK (true);
-- Allow users to read their own data
CREATE POLICY "users_select_own" ON users
    FOR SELECT 
    USING (auth.uid() = id);
-- Allow admins to read all users
CREATE POLICY "users_select_admin" ON users
    FOR SELECT 
    TO authenticated
    USING (is_admin_user());
-- Allow users to update their own data
CREATE POLICY "users_update_own" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
-- ASSESSMENTS TABLE POLICIES
-- Allow anyone to insert assessments (test takers submitting results)
CREATE POLICY "assessments_insert_public" ON assessments
    FOR INSERT 
    WITH CHECK (true);
-- Allow users to read their own assessments
CREATE POLICY "assessments_select_own" ON assessments
    FOR SELECT 
    USING (auth.uid() = user_id);
-- Allow admins to read all assessments
CREATE POLICY "assessments_select_admin" ON assessments
    FOR SELECT 
    TO authenticated
    USING (is_admin_user());
-- TEST_LINKS TABLE POLICIES
-- Allow public read to validate test links
CREATE POLICY "test_links_select_public" ON test_links
    FOR SELECT 
    USING (true);
-- Allow public update to mark links as used
CREATE POLICY "test_links_update_public" ON test_links
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);
-- Allow admins to insert test links
CREATE POLICY "test_links_insert_admin" ON test_links
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_admin_user());
-- Allow admins to delete test links
CREATE POLICY "test_links_delete_admin" ON test_links
    FOR DELETE 
    TO authenticated
    USING (is_admin_user());
-- SETTINGS TABLE POLICIES
-- Allow public read for settings (like show_results_immediately)
CREATE POLICY "settings_select_public" ON settings
    FOR SELECT 
    USING (true);
-- Allow admins to insert settings
CREATE POLICY "settings_insert_admin" ON settings
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_admin_user());
-- Allow admins to update settings
CREATE POLICY "settings_update_admin" ON settings
    FOR UPDATE 
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());
-- Allow admins to delete settings
CREATE POLICY "settings_delete_admin" ON settings
    FOR DELETE 
    TO authenticated
    USING (is_admin_user());
-- PROFILES TABLE POLICIES (read-only reference data)
-- Allow public read access to all profiles
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT 
    USING (true);
-- QUESTIONS TABLE POLICIES (read-only reference data)
-- Allow public read access to all questions
CREATE POLICY "questions_select_public" ON questions
    FOR SELECT 
    USING (true);
-- ADMIN_USERS TABLE POLICIES
-- Allow authenticated users to read admin_users (for checking admin status)
CREATE POLICY "admin_users_select_authenticated" ON admin_users
    FOR SELECT 
    TO authenticated
    USING (true);
-- Allow admins to manage admin users
CREATE POLICY "admin_users_all_admin" ON admin_users
    FOR ALL 
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());
-- Grant necessary permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- Grant table permissions to anon role (for public access)
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON questions TO anon;
GRANT SELECT ON test_links TO anon;
GRANT UPDATE ON test_links TO anon;
GRANT SELECT ON settings TO anon;
GRANT INSERT ON users TO anon;
GRANT INSERT ON assessments TO anon;
-- Grant table permissions to authenticated role
GRANT ALL ON users TO authenticated;
GRANT ALL ON assessments TO authenticated;
GRANT ALL ON test_links TO authenticated;
GRANT ALL ON settings TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON questions TO authenticated;
GRANT ALL ON admin_users TO authenticated;
-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
-- Create indexes for better performance on admin checks
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id_active ON admin_users(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_test_links_code ON test_links(link_code);
CREATE INDEX IF NOT EXISTS idx_test_links_used ON test_links(is_used);
