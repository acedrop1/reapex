-- Alternative fix: Explicitly allow anon role to view agents
-- Supabase uses 'anon' role for unauthenticated users

DROP POLICY IF EXISTS "Public can view active agents" ON public.users;

-- Create policy that explicitly allows anon role
CREATE POLICY "Public can view active agents"
    ON public.users FOR SELECT
    TO anon, authenticated
    USING (role::text = 'agent' AND is_active = true);

