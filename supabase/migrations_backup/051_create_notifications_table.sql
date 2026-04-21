-- Create notifications table for user notifications
-- Used in Header component for notification bell icon

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Only admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'broker')
    )
  );

-- Policy: Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'broker')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON public.notifications USING btree (read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications USING btree (user_id, read)
  WHERE read = false;

-- Add comments
COMMENT ON TABLE public.notifications IS 'User notifications for system events and updates';
COMMENT ON COLUMN public.notifications.user_id IS 'User who receives this notification';
COMMENT ON COLUMN public.notifications.title IS 'Notification title/heading';
COMMENT ON COLUMN public.notifications.message IS 'Notification message/content';
COMMENT ON COLUMN public.notifications.type IS 'Notification type (info, success, warning, error)';
COMMENT ON COLUMN public.notifications.link IS 'Optional link to related resource';
COMMENT ON COLUMN public.notifications.read IS 'Whether notification has been read';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();
