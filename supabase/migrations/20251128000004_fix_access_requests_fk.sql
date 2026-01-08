-- Drop the existing foreign key constraint
ALTER TABLE access_requests 
DROP CONSTRAINT IF EXISTS access_requests_generated_link_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE access_requests 
ADD CONSTRAINT access_requests_generated_link_id_fkey 
FOREIGN KEY (generated_link_id) 
REFERENCES test_links(id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT access_requests_generated_link_id_fkey ON access_requests IS 
'Foreign key to test_links with SET NULL on delete to allow link deletion';
