-- Add single_use column to test_links table
ALTER TABLE test_links 
ADD COLUMN single_use BOOLEAN DEFAULT TRUE;
-- Add comment to explain the column
COMMENT ON COLUMN test_links.single_use IS 'If true, link can only be used once. If false, link can be used multiple times until expiration.';
-- Update existing links to be single use by default
UPDATE test_links SET single_use = TRUE WHERE single_use IS NULL;
