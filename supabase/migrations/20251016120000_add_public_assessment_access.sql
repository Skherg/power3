-- Add public access to assessments for results viewing
-- This allows anyone with the assessment ID to view results

-- Add a new policy to allow public read access to assessments by ID
-- This is needed for the persistent results URLs (/results/{assessment_id})
CREATE POLICY "assessments_select_public_by_id" ON assessments
    FOR SELECT 
    USING (true);

-- Grant SELECT permission on assessments to anon role
GRANT SELECT ON assessments TO anon;

-- Also grant SELECT on users table to anon for the join in assessment queries
GRANT SELECT ON users TO anon;

-- Create index for better performance on assessment ID lookups
CREATE INDEX IF NOT EXISTS idx_assessments_id ON assessments(id);