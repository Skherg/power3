-- Fix RLS policies for test_links table to allow authenticated users to perform admin operations
-- Since admin table was removed, all authenticated users should have full access

-- Drop existing restrictive policies on test_links
DROP POLICY IF EXISTS "Allow public read on test_links" ON test_links;
DROP POLICY IF EXISTS "Allow public update on test_links" ON test_links;
DROP POLICY IF EXISTS "Admin full access on test_links" ON test_links;
-- Create new policies that allow authenticated users full access to test_links
CREATE POLICY "Authenticated users full access on test_links" ON test_links
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);
-- Also allow public read access for test link validation (anon users need to validate links)
CREATE POLICY "Public read access on test_links" ON test_links
    FOR SELECT 
    TO anon
    USING (true);
-- Allow public update for marking links as used (anon users need to mark links as used)
CREATE POLICY "Public update access on test_links" ON test_links
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);
