-- Add contact information and social media links to users table
-- Migration: 017_add_agent_contact_social.sql

-- Add phone number and social media fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email_public VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_linkedin VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_tiktok VARCHAR(255),
ADD COLUMN IF NOT EXISTS social_x VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN users.phone IS 'Agent phone number for public display';
COMMENT ON COLUMN users.email_public IS 'Public email address (may differ from auth email)';
COMMENT ON COLUMN users.social_facebook IS 'Facebook profile URL';
COMMENT ON COLUMN users.social_instagram IS 'Instagram profile URL';
COMMENT ON COLUMN users.social_linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN users.social_tiktok IS 'TikTok profile URL';
COMMENT ON COLUMN users.social_x IS 'X (Twitter) profile URL';
