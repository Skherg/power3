-- Manual SQL to add question management policies
-- Run this in your Supabase SQL editor if migrations fail

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "questions_insert_admin" ON questions;
DROP POLICY IF EXISTS "questions_update_admin" ON questions;
DROP POLICY IF EXISTS "questions_delete_admin" ON questions;
-- Add admin policies for questions management
CREATE POLICY "questions_insert_admin" ON questions
    FOR INSERT 
    TO authenticated
    WITH CHECK (is_admin_user());
CREATE POLICY "questions_update_admin" ON questions
    FOR UPDATE 
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());
CREATE POLICY "questions_delete_admin" ON questions
    FOR DELETE 
    TO authenticated
    USING (is_admin_user());
-- Grant necessary permissions to authenticated role for questions management
GRANT INSERT, UPDATE, DELETE ON questions TO authenticated;
