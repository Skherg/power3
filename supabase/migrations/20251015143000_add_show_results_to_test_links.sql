-- Add show_results_immediately column to test_links table
ALTER TABLE test_links 
ADD COLUMN show_results_immediately BOOLEAN DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN test_links.show_results_immediately IS 'Per-link setting to show results immediately. NULL means use global setting.';