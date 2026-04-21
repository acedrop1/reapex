-- Fix calendar_events RLS policy to allow viewing public/brokerage-wide events
-- Public events have agent_id = NULL and should be viewable by all authenticated users

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Approved users can view own events" ON public.calendar_events;

-- Create new policy that allows:
-- 1. Users to view their own events
-- 2. Admins/brokers to view all events
-- 3. ALL authenticated users to view public events (where agent_id IS NULL)
CREATE POLICY "Users can view own and public events"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (
    agent_id IS NULL -- Public/brokerage-wide events
    OR (agent_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND account_status = 'approved'
    ))
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'broker', 'admin_agent')
    )
  );

-- Add comment
COMMENT ON POLICY "Users can view own and public events" ON public.calendar_events IS
  'Allows authenticated users to view public events (agent_id IS NULL), their own events (if approved), or all events (if admin/broker/admin_agent)';
