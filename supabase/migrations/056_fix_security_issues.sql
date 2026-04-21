-- Fix security linter issues
-- 1. Remove SECURITY DEFINER from views
-- 2. Add search_path to all functions

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.agent_ratings_summary;
CREATE OR REPLACE VIEW public.agent_ratings_summary
WITH (security_invoker=true) AS
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

DROP VIEW IF EXISTS public.transaction_documents_summary;
CREATE OR REPLACE VIEW public.transaction_documents_summary
WITH (security_invoker=true) AS
SELECT
  transaction_id,
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE document_type = 'Fully Executed Contract') as contract_count,
  COUNT(*) FILTER (WHERE document_type = 'CIS') as cis_count,
  COUNT(*) FILTER (WHERE document_type = 'Seller Disclosure') as disclosure_count,
  MAX(uploaded_at) as latest_upload
FROM transaction_documents
WHERE transaction_id IS NOT NULL
GROUP BY transaction_id;

-- Fix functions: Add SET search_path = public

-- Fix uuid_generate_v4 function (defined in 001_initial_schema.sql)
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_user_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from name
  base_slug := lower(trim(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM users WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_slug(address TEXT, city TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from address and city
  base_slug := lower(trim(regexp_replace(address || ' ' || city, '[^a-zA-Z0-9\s-]', '', 'g')));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM listings WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.property_address, NEW.property_city);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_listing_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.property_address, NEW.property_city);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_broker()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'broker')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_brokerage_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_agent_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND account_status = 'approved'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$;

-- Grant permissions on views
GRANT SELECT ON public.agent_ratings_summary TO public;
GRANT SELECT ON public.agent_ratings_summary TO authenticated;
GRANT SELECT ON public.transaction_documents_summary TO authenticated;
