-- Add archived column to contacts table
-- This allows marking contacts/sell requests as archived
-- Archived items are hidden by default in admin views

-- Add archived column
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Create index for filtering archived contacts
CREATE INDEX IF NOT EXISTS idx_contacts_archived ON contacts(archived);

-- Update existing contacts to not be archived
UPDATE contacts SET archived = false WHERE archived IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN contacts.archived IS 'Marks contacts as archived. Archived items are hidden by default in admin views but can be toggled to show.';
