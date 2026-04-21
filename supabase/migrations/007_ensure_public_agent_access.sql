-- Verify and fix public agent access policy
-- Ensure public can view individual agents by ID

-- Drop and recreate the public agent policy to ensure it works
DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Create policy that allows public to view active agents (including by ID)
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    USING (role = 'agent' AND is_active = true);

