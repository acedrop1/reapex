-- ============================================================
-- REAPEX: Complete Database Migration Script
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This is SAFE to run multiple times — all statements use
-- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS patterns.
-- ============================================================

-- ============================================================
-- 1. ANNOUNCEMENTS — Add missing 'archived' column
--    (This is the confirmed error from production)
-- ============================================================
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT NULL;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS attachment_names TEXT[] DEFAULT NULL;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS related_url TEXT DEFAULT NULL;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS related_cta_text TEXT DEFAULT NULL;

-- ============================================================
-- 2. DEALS table — used by CRM page
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  stage TEXT DEFAULT 'lead',
  status TEXT DEFAULT 'active',
  expected_close_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'deals_agent_access'
  ) THEN
    CREATE POLICY deals_agent_access ON deals
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 3. MEETINGS table — used by CRM page
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'in_person',
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'meetings_agent_access'
  ) THEN
    CREATE POLICY meetings_agent_access ON meetings
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 4. CALENDAR_EVENTS table — used by Dashboard calendar widget
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  color TEXT,
  event_category TEXT,
  source TEXT DEFAULT 'custom',
  google_event_id TEXT,
  google_calendar_id TEXT,
  recurrence_rule TEXT,
  last_synced_at TIMESTAMPTZ,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'calendar_events_agent_access'
  ) THEN
    CREATE POLICY calendar_events_agent_access ON calendar_events
      FOR ALL USING (agent_id = auth.uid() OR agent_id IS NULL);
  END IF;
END $$;

-- ============================================================
-- 5. CONTACT_AGENT_ASSIGNMENTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(contact_id, agent_id)
);

ALTER TABLE contact_agent_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_agent_assignments' AND policyname = 'contact_assignments_access'
  ) THEN
    CREATE POLICY contact_assignments_access ON contact_agent_assignments
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 6. CONTACT_TASKS table — used by CRM tasks tab
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_tasks' AND policyname = 'contact_tasks_agent_access'
  ) THEN
    CREATE POLICY contact_tasks_agent_access ON contact_tasks
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 7. DOCUMENT_ACCESS_LOGS table — used by training downloads
-- ============================================================
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  access_type TEXT DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_access_logs' AND policyname = 'document_access_logs_insert'
  ) THEN
    CREATE POLICY document_access_logs_insert ON document_access_logs
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 8. RESOURCE_ACCESS_LOGS table — used by training page
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resource_access_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resource_access_logs' AND policyname = 'resource_access_logs_insert'
  ) THEN
    CREATE POLICY resource_access_logs_insert ON resource_access_logs
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 9. CALENDAR_SYNC_LOG table — used by Google Calendar sync
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sync_type TEXT DEFAULT 'full',
  status TEXT DEFAULT 'success',
  events_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'calendar_sync_log' AND policyname = 'calendar_sync_log_user_access'
  ) THEN
    CREATE POLICY calendar_sync_log_user_access ON calendar_sync_log
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 10. CONTACT_COMMUNICATIONS table
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'note',
  subject TEXT,
  content TEXT,
  direction TEXT DEFAULT 'outbound',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_communications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_communications' AND policyname = 'contact_comms_agent_access'
  ) THEN
    CREATE POLICY contact_comms_agent_access ON contact_communications
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 11. CONTACT_ACTIVITIES table
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_activities' AND policyname = 'contact_activities_agent_access'
  ) THEN
    CREATE POLICY contact_activities_agent_access ON contact_activities
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 12. TOUR_APPOINTMENTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS tour_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tour_appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tour_appointments' AND policyname = 'tour_appointments_agent_access'
  ) THEN
    CREATE POLICY tour_appointments_agent_access ON tour_appointments
      FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 13. TRANSACTION_CONTACTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  contact_id UUID,
  role TEXT DEFAULT 'buyer',
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transaction_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transaction_contacts' AND policyname = 'transaction_contacts_access'
  ) THEN
    CREATE POLICY transaction_contacts_access ON transaction_contacts
      FOR ALL USING (
        transaction_id IN (
          SELECT id FROM transactions WHERE agent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 14. TRANSACTION_NOTES table
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transaction_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transaction_notes' AND policyname = 'transaction_notes_access'
  ) THEN
    CREATE POLICY transaction_notes_access ON transaction_notes
      FOR ALL USING (
        transaction_id IN (
          SELECT id FROM transactions WHERE agent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 15. FORMS table — used by forms page
-- ============================================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  file_url TEXT,
  file_name TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'forms' AND policyname = 'forms_read_access'
  ) THEN
    CREATE POLICY forms_read_access ON forms
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 16. AGENT_RATINGS_SUMMARY view/table
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_ratings_summary (
  agent_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  last_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_ratings_summary ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_ratings_summary' AND policyname = 'agent_ratings_read'
  ) THEN
    CREATE POLICY agent_ratings_read ON agent_ratings_summary
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 17. USERS table — add potentially missing columns
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hide_from_listing BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_sync_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ============================================================
-- 18. TRANSACTIONS table — add commission payout columns
-- ============================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS final_commission_amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS brokerage_fees NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS agent_net_payout NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_notes TEXT;

-- ============================================================
-- 19. CONTACTS table — ensure all needed columns exist
-- ============================================================
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'lead';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 20. EXTERNAL_LINKS table — used by admin external links page
-- ============================================================
CREATE TABLE IF NOT EXISTS external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE external_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'external_links' AND policyname = 'external_links_read'
  ) THEN
    CREATE POLICY external_links_read ON external_links
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'external_links' AND policyname = 'external_links_admin_write'
  ) THEN
    CREATE POLICY external_links_admin_write ON external_links
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- ============================================================
-- 21. TRAINING_RESOURCES table
-- ============================================================
CREATE TABLE IF NOT EXISTS training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  resource_type TEXT DEFAULT 'document',
  file_url TEXT,
  file_name TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE training_resources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'training_resources' AND policyname = 'training_resources_read'
  ) THEN
    CREATE POLICY training_resources_read ON training_resources
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- 22. NOTIFICATIONS table — ensure structure
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_user_access'
  ) THEN
    CREATE POLICY notifications_user_access ON notifications
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- 23. ADMIN RLS POLICIES — Allow admins full access to key tables
-- ============================================================

-- Admin access to announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'announcements_admin_all'
  ) THEN
    CREATE POLICY announcements_admin_all ON announcements
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to agent_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_applications' AND policyname = 'applications_admin_all'
  ) THEN
    CREATE POLICY applications_admin_all ON agent_applications
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to agent_reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_reviews' AND policyname = 'reviews_admin_all'
  ) THEN
    CREATE POLICY reviews_admin_all ON agent_reviews
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to transactions (for commission payouts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'transactions_admin_all'
  ) THEN
    CREATE POLICY transactions_admin_all ON transactions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to users (for user management)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_admin_all'
  ) THEN
    CREATE POLICY users_admin_all ON users
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'listings_admin_all'
  ) THEN
    CREATE POLICY listings_admin_all ON listings
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- Admin access to contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_admin_all'
  ) THEN
    CREATE POLICY contacts_admin_all ON contacts
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'admin_agent')
        )
      );
  END IF;
END $$;

-- ============================================================
-- 24. STORAGE BUCKETS — Ensure all needed buckets exist
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('announcement-files', 'announcement-files', true),
  ('training-resources', 'training-resources', true),
  ('agent-photos', 'agent-photos', true),
  ('agent-agreements', 'agent-agreements', false),
  ('agent-application-documents', 'agent-application-documents', false),
  ('listing-images', 'listing-images', true),
  ('listing-photos', 'listing-photos', true),
  ('contact-documents', 'contact-documents', false),
  ('property-listings', 'property-listings', true),
  ('transaction-documents', 'transaction-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE! All tables, columns, policies, and buckets are ready.
-- ============================================================
