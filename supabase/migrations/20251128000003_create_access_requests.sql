-- Create access_requests table
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    generated_link_id UUID REFERENCES test_links(id)
);
-- Add comment
COMMENT ON TABLE access_requests IS 'Stores user requests for test access';
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
-- Allow anyone to insert access requests
CREATE POLICY "access_requests_insert_public" ON access_requests
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);
-- Allow admins to view all access requests
CREATE POLICY "access_requests_select_admin" ON access_requests
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );
-- Allow admins to update access requests
CREATE POLICY "access_requests_update_admin" ON access_requests
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );
-- Grant permissions
GRANT INSERT ON access_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON access_requests TO authenticated;
