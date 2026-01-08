-- Fix RLS policies for settings table to allow authenticated users to perform admin operations
-- Since admin table was removed, all authenticated users should have full access

-- Drop existing restrictive policies on settings
DROP POLICY IF EXISTS "Allow public read on settings" ON settings;
DROP POLICY IF EXISTS "Admin full access on settings" ON settings;
-- Create new policies that allow authenticated users full access to settings
CREATE POLICY "Authenticated users full access on settings" ON settings
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);
-- Allow public read access for settings (anon users need to read global settings)
CREATE POLICY "Public read access on settings" ON settings
    FOR SELECT 
    TO anon
    USING (true);
