-- Fix RLS policies for questions table to allow authenticated users to perform admin operations
-- Since admin table was removed, all authenticated users should have full access

-- Drop existing restrictive policies on questions
DROP POLICY IF EXISTS "Allow public read on questions" ON questions;
DROP POLICY IF EXISTS "Admin full access on questions" ON questions;
-- Create new policies that allow authenticated users full access to questions
CREATE POLICY "Authenticated users full access on questions" ON questions
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);
-- Allow public read access for questions (anon users need to read questions for tests)
CREATE POLICY "Public read access on questions" ON questions
    FOR SELECT 
    TO anon
    USING (true);
