-- Google Calendar Sync Infrastructure Migration
-- Created: 2025-12-14
-- Purpose: Add Google Calendar bidirectional sync support

-- Add Google Calendar sync fields to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS event_category TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_metadata JSONB;

-- Add sync token to users table for incremental sync
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_calendar_sync_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMPTZ;

-- Create calendar sync log table for tracking sync history and conflicts
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'webhook')),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('google_to_reapex', 'reapex_to_google', 'bidirectional')),
  events_synced INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  sync_started_at TIMESTAMPTZ NOT NULL,
  sync_completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calendar sync conflicts table for conflict resolution
CREATE TABLE IF NOT EXISTS calendar_sync_conflicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('update_collision', 'delete_collision', 'duplicate')),
  reapex_data JSONB NOT NULL,
  google_data JSONB NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_strategy TEXT CHECK (resolution_strategy IN ('keep_reapex', 'keep_google', 'merge', 'manual')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_last_synced_at ON calendar_events(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_category ON calendar_events(event_category);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id ON calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_created_at ON calendar_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_conflicts_user_id ON calendar_sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_conflicts_resolved ON calendar_sync_conflicts(resolved);

-- RLS Policies for calendar_sync_log
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON calendar_sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert sync logs"
  ON calendar_sync_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all sync logs"
  ON calendar_sync_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for calendar_sync_conflicts
ALTER TABLE calendar_sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conflicts"
  ON calendar_sync_conflicts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conflicts"
  ON calendar_sync_conflicts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert conflicts"
  ON calendar_sync_conflicts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conflicts"
  ON calendar_sync_conflicts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_sync_conflicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER calendar_sync_conflicts_updated_at
  BEFORE UPDATE ON calendar_sync_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_sync_conflicts_updated_at();

-- Add comment documentation
COMMENT ON TABLE calendar_sync_log IS 'Tracks Google Calendar sync operations and their results';
COMMENT ON TABLE calendar_sync_conflicts IS 'Stores sync conflicts for manual resolution';
COMMENT ON COLUMN calendar_events.google_event_id IS 'Google Calendar event ID for bidirectional sync';
COMMENT ON COLUMN calendar_events.event_category IS 'User-assigned category for Google Calendar events';
COMMENT ON COLUMN calendar_events.last_synced_at IS 'Last time this event was synced with Google Calendar';
COMMENT ON COLUMN calendar_events.google_metadata IS 'Original Google Calendar event data in JSON format';
COMMENT ON COLUMN users.google_calendar_sync_token IS 'Google Calendar API sync token for incremental sync';
COMMENT ON COLUMN users.google_calendar_last_sync IS 'Last successful Google Calendar sync timestamp';
