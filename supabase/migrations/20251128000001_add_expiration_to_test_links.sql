-- Add expires_at column to test_links table
ALTER TABLE test_links 
ADD COLUMN expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN test_links.expires_at IS 'Optional expiration timestamp for the test link. NULL means no expiration.';

-- Add index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_test_links_expires_at ON test_links(expires_at);
