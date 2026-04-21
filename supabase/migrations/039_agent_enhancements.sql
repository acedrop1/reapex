-- Migration: Agent Enhancements - Service Areas and Reviews System
-- Description: Adds service_areas field to users table and creates agent_reviews table
-- Date: 2025-01-29

-- Add service_areas column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS service_areas TEXT[] DEFAULT '{}';

-- Create agent_reviews table
CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent_id ON agent_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_approved ON agent_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_created_at ON agent_reviews(created_at DESC);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent_approved
ON agent_reviews(agent_id, is_approved)
WHERE is_approved = true;

-- Enable Row Level Security
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public to read approved reviews
CREATE POLICY "Public can view approved reviews"
ON agent_reviews
FOR SELECT
TO public
USING (is_approved = true);

-- RLS Policy: Authenticated users can view all reviews (for admin panel)
CREATE POLICY "Authenticated users can view all reviews"
ON agent_reviews
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Only admins can insert reviews
CREATE POLICY "Admins can insert reviews"
ON agent_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- RLS Policy: Only admins can update reviews
CREATE POLICY "Admins can update reviews"
ON agent_reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- RLS Policy: Only admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON agent_reviews
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_agent_reviews_updated_at_trigger
BEFORE UPDATE ON agent_reviews
FOR EACH ROW
EXECUTE FUNCTION update_agent_reviews_updated_at();

-- Create view for agent ratings summary (useful for queries)
CREATE OR REPLACE VIEW agent_ratings_summary AS
SELECT
  agent_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
  COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
  COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
  COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
  COUNT(*) FILTER (WHERE rating = 1) as one_star_count
FROM agent_reviews
WHERE is_approved = true
GROUP BY agent_id;

-- Grant permissions on the view
GRANT SELECT ON agent_ratings_summary TO public;
GRANT SELECT ON agent_ratings_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE agent_reviews IS 'Stores reviews for real estate agents with admin approval workflow';
COMMENT ON COLUMN users.service_areas IS 'Cities/areas where the agent provides services';
COMMENT ON COLUMN agent_reviews.is_approved IS 'Reviews require admin approval before being displayed publicly';
COMMENT ON VIEW agent_ratings_summary IS 'Aggregated rating statistics for each agent';
