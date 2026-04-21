-- Add title column to users table for professional titles
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN users.title IS 'Professional title that appears above agent name on public profile (e.g., Licensed Realtor, Real Estate Broker)';
