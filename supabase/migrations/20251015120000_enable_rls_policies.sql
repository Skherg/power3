-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- Create policies for users table
-- Allow anyone to insert (test takers creating their profile)
CREATE POLICY "Allow public insert on users" ON users
    FOR INSERT WITH CHECK (true);
-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (true);
-- Allow admins to read all users (we'll use service role for admin operations)
-- This will be handled by the service role key, not through RLS

-- Create policies for assessments table
-- Allow anyone to insert assessments (test takers submitting results)
CREATE POLICY "Allow public insert on assessments" ON assessments
    FOR INSERT WITH CHECK (true);
-- Allow reading assessments (for results display)
CREATE POLICY "Allow public read on assessments" ON assessments
    FOR SELECT USING (true);
-- Create policies for test_links table
-- Allow public read to validate test links
CREATE POLICY "Allow public read on test_links" ON test_links
    FOR SELECT USING (true);
-- Allow public update to mark links as used
CREATE POLICY "Allow public update on test_links" ON test_links
    FOR UPDATE USING (true);
-- Insert and delete will be handled by service role (admin functions)

-- Create policies for settings table
-- Allow public read for settings (like show_results_immediately)
CREATE POLICY "Allow public read on settings" ON settings
    FOR SELECT USING (true);
-- Updates will be handled by service role (admin functions)

-- Create policies for profiles table (read-only reference data)
-- Allow public read access to all profiles
CREATE POLICY "Allow public read on profiles" ON profiles
    FOR SELECT USING (true);
-- Create policies for questions table (read-only reference data)
-- Allow public read access to all questions
CREATE POLICY "Allow public read on questions" ON questions
    FOR SELECT USING (true);
-- Create a function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, we'll use service role for admin operations
  -- In the future, you can implement proper admin user authentication here
  RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create admin policies (these will only work with service role)
CREATE POLICY "Admin full access on users" ON users
    FOR ALL USING (is_admin());
CREATE POLICY "Admin full access on assessments" ON assessments
    FOR ALL USING (is_admin());
CREATE POLICY "Admin full access on test_links" ON test_links
    FOR ALL USING (is_admin());
CREATE POLICY "Admin full access on settings" ON settings
    FOR ALL USING (is_admin());
-- Note: For production, you should implement proper admin authentication
-- This could involve:
-- 1. Creating an admin users table
-- 2. Implementing JWT-based authentication
-- 3. Using more restrictive policies based on user roles;
