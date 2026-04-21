-- Migration: Fix duplicate display_order values across resource tables
-- Description: Ensures all display_order values are unique and sequential
-- This fixes the reorder functionality which breaks with duplicate order values

-- ===================================================================
-- 1. Fix external_links duplicate display_order values
-- ===================================================================

-- Reset all external_links to have sequential display_order based on current order
WITH ordered_links AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY display_order ASC NULLS LAST, created_at ASC) as new_order
    FROM external_links
)
UPDATE external_links
SET display_order = ordered_links.new_order
FROM ordered_links
WHERE external_links.id = ordered_links.id;

-- ===================================================================
-- 2. Fix brokerage_documents display_order (if any duplicates)
-- ===================================================================

WITH ordered_docs AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY display_order ASC NULLS LAST, created_at ASC) as new_order
    FROM brokerage_documents
)
UPDATE brokerage_documents
SET display_order = ordered_docs.new_order
FROM ordered_docs
WHERE brokerage_documents.id = ordered_docs.id;

-- ===================================================================
-- 3. Fix training_resources order_index (if any duplicates)
-- ===================================================================

WITH ordered_training AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY order_index ASC NULLS LAST, created_at ASC) as new_order
    FROM training_resources
)
UPDATE training_resources
SET order_index = ordered_training.new_order
FROM ordered_training
WHERE training_resources.id = ordered_training.id;

-- ===================================================================
-- 4. Fix canva_templates display_order (if any duplicates)
-- ===================================================================

WITH ordered_templates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY display_order ASC NULLS LAST, created_at ASC) as new_order
    FROM canva_templates
)
UPDATE canva_templates
SET display_order = ordered_templates.new_order
FROM ordered_templates
WHERE canva_templates.id = ordered_templates.id;

-- Verification query (run manually to check):
-- SELECT 'external_links' as table_name, display_order, COUNT(*) as count
-- FROM external_links
-- GROUP BY display_order
-- HAVING COUNT(*) > 1
-- UNION ALL
-- SELECT 'brokerage_documents', display_order, COUNT(*)
-- FROM brokerage_documents
-- GROUP BY display_order
-- HAVING COUNT(*) > 1
-- UNION ALL
-- SELECT 'training_resources', order_index, COUNT(*)
-- FROM training_resources
-- GROUP BY order_index
-- HAVING COUNT(*) > 1
-- UNION ALL
-- SELECT 'canva_templates', display_order, COUNT(*)
-- FROM canva_templates
-- GROUP BY display_order
-- HAVING COUNT(*) > 1;
