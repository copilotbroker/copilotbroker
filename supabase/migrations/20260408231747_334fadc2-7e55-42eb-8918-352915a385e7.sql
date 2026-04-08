
-- Backfill: set all NULL source_instance to 'personal'
UPDATE conversations 
SET source_instance = 'personal' 
WHERE source_instance IS NULL;

-- Set default for future inserts
ALTER TABLE conversations 
ALTER COLUMN source_instance SET DEFAULT 'personal';
