-- Add self-assessment columns to assessments table
ALTER TABLE assessments
ADD COLUMN vision_self REAL,
ADD COLUMN people_self REAL,
ADD COLUMN execution_self REAL;
-- Add comment to explain these columns
COMMENT ON COLUMN assessments.vision_self IS 'Self-reported vision score (percentage)';
COMMENT ON COLUMN assessments.people_self IS 'Self-reported people score (percentage)';
COMMENT ON COLUMN assessments.execution_self IS 'Self-reported execution score (percentage)';
