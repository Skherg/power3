-- Comprehensive fix for all RLS policies
-- This migration will clean up all conflicting policies and set up working ones

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Drop all existing user policies
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_allow_all" ON users;
DROP POLICY IF EXISTS "users_select_public" ON users;
DROP POLICY IF EXISTS "users_update_authenticated" ON users;
DROP POLICY IF EXISTS "users_all_public" ON users;

-- Create working user policies
CREATE POLICY "users_all_public" ON users
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- ASSESSMENTS TABLE  
-- ============================================================================

-- Drop all existing assessment policies
DROP POLICY IF EXISTS "assessments_insert_public" ON assessments;
DROP POLICY IF EXISTS "assessments_select_own" ON assessments;
DROP POLICY IF EXISTS "assessments_select_admin" ON assessments;
DROP POLICY IF EXISTS "assessments_select_public" ON assessments;
DROP POLICY IF EXISTS "assessments_select_own_authenticated" ON assessments;
DROP POLICY IF EXISTS "assessments_select_public_by_id" ON assessments;
DROP POLICY IF EXISTS "assessments_update_authenticated" ON assessments;
DROP POLICY IF EXISTS "assessments_all_public" ON assessments;

-- Create working assessment policies
CREATE POLICY "assessments_all_public" ON assessments
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Ensure all necessary grants are in place
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON assessments TO anon, authenticated;
GRANT ALL ON test_links TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON questions TO anon, authenticated;
GRANT ALL ON admin_users TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Ensure performance indexes exist
CREATE INDEX IF NOT EXISTS idx_assessments_id ON assessments(id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);