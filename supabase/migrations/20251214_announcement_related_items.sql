-- Announcement Related Items Migration
-- Created: 2025-12-14
-- Purpose: Add related items linking to announcements for CTA buttons

-- Add related item fields to announcements table
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS related_type TEXT CHECK (related_type IN ('form', 'marketing', 'listing', 'event', 'link', 'training')),
ADD COLUMN IF NOT EXISTS related_id TEXT,
ADD COLUMN IF NOT EXISTS related_title TEXT,
ADD COLUMN IF NOT EXISTS related_url TEXT,
ADD COLUMN IF NOT EXISTS related_cta_text TEXT;

-- Add index for related type queries
CREATE INDEX IF NOT EXISTS idx_announcements_related_type ON announcements(related_type);

-- Add comments for documentation
COMMENT ON COLUMN announcements.related_type IS 'Type of related item: form, marketing, listing, event, link, training';
COMMENT ON COLUMN announcements.related_id IS 'ID of the related item in its respective table (for forms, listings, events, training)';
COMMENT ON COLUMN announcements.related_title IS 'Display title for the related item (cached for performance)';
COMMENT ON COLUMN announcements.related_url IS 'Direct URL for link type or override URL for other types';
COMMENT ON COLUMN announcements.related_cta_text IS 'Custom CTA button text (defaults based on type if not provided)';

-- Default CTA text by type:
-- form: "View Form"
-- marketing: "View Resource"
-- listing: "View Listing"
-- event: "View Event"
-- link: "Learn More"
-- training: "Start Training"
