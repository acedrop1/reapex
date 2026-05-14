-- Add must_change_password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Set existing users to false (they don't need to change)
UPDATE users SET must_change_password = false WHERE must_change_password IS NULL;
