-- Migration: Add 'pdf' to resource_type enum
-- Description: Allows training resources to have PDF type
-- Created: 2025-12-01

-- Add 'pdf' value to resource_type enum
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'pdf';

-- Update comment
COMMENT ON TYPE resource_type IS 'Resource types: video, document, faq, pdf';
