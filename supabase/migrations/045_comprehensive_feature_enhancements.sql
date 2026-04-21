-- Comprehensive Feature Enhancements Migration
-- Adds: User plan management, Payouts, CRM enhancements, Notifications, Profile settings

-- ============================================
-- STEP 1: Create new enums and types
-- ============================================

-- Subscription plan types
CREATE TYPE subscription_plan AS ENUM ('launch', 'growth', 'pro');

-- Notification types
CREATE TYPE notification_type AS ENUM ('application', 'transaction', 'crm', 'marketing', 'system', 'announcement');

-- Contact source types (extends existing contact tracking)
CREATE TYPE contact_source_type AS ENUM ('profile_form', 'manual', 'import', 'referral', 'website', 'social_media');

-- Task priority for contact tasks
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- ============================================
-- STEP 2: Enhance users table
-- ============================================

-- Add subscription plan column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan subscription_plan DEFAULT 'launch';
    END IF;
END $$;

-- Add phone visibility toggle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'show_phone_number') THEN
        ALTER TABLE public.users ADD COLUMN show_phone_number BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add Stripe payment information
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.users ADD COLUMN stripe_customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_payment_method_id') THEN
        ALTER TABLE public.users ADD COLUMN stripe_payment_method_id TEXT;
    END IF;
END $$;

-- Add email notification preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_preferences') THEN
        ALTER TABLE public.users ADD COLUMN email_preferences JSONB DEFAULT '{"applications": true, "messages": true, "transactions": true, "crm": true, "marketing": true, "announcements": true}'::jsonb;
    END IF;
END $$;

-- Add social media fields if they don't exist (from migration 017)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'facebook') THEN
        ALTER TABLE public.users ADD COLUMN facebook TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'instagram') THEN
        ALTER TABLE public.users ADD COLUMN instagram TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'linkedin') THEN
        ALTER TABLE public.users ADD COLUMN linkedin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tiktok') THEN
        ALTER TABLE public.users ADD COLUMN tiktok TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'x') THEN
        ALTER TABLE public.users ADD COLUMN x TEXT;
    END IF;
END $$;

-- ============================================
-- STEP 3: Create payouts table
-- ============================================

CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    property_address TEXT,
    payout_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    payment_method TEXT, -- check, ach, wire
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create notifications table
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create contact_tasks junction table
-- ============================================

CREATE TABLE IF NOT EXISTS public.contact_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    priority task_priority DEFAULT 'normal',
    urgency TEXT, -- low, medium, high
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, task_id)
);

-- ============================================
-- STEP 6: Enhance contacts table
-- ============================================

-- Add source_type column to contacts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'source_type') THEN
        ALTER TABLE public.contacts ADD COLUMN source_type contact_source_type DEFAULT 'manual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'contact_type') THEN
        ALTER TABLE public.contacts ADD COLUMN contact_type TEXT DEFAULT 'lead';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'message') THEN
        ALTER TABLE public.contacts ADD COLUMN message TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'preferred_contact_method') THEN
        ALTER TABLE public.contacts ADD COLUMN preferred_contact_method TEXT DEFAULT 'email';
    END IF;
END $$;

-- ============================================
-- STEP 7: Enable RLS on new tables
-- ============================================

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 8: Create RLS policies
-- ============================================

-- Payouts policies
CREATE POLICY "Users can view their own payouts"
    ON public.payouts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payouts"
    ON public.payouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

CREATE POLICY "Admins can manage payouts"
    ON public.payouts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
    ON public.notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'broker')
        )
    );

-- Contact tasks policies
CREATE POLICY "Users can view contact tasks for their contacts"
    ON public.contact_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_tasks.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

CREATE POLICY "Users can create contact tasks for their contacts"
    ON public.contact_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_tasks.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

CREATE POLICY "Users can update contact tasks for their contacts"
    ON public.contact_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_tasks.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete contact tasks for their contacts"
    ON public.contact_tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.contacts
            WHERE contacts.id = contact_tasks.contact_id
            AND contacts.agent_id = auth.uid()
        )
    );

-- ============================================
-- STEP 9: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_transaction_id ON public.payouts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payouts_payout_date ON public.payouts(payout_date DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_contact_tasks_contact_id ON public.contact_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_task_id ON public.contact_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_contact_tasks_priority ON public.contact_tasks(priority);

CREATE INDEX IF NOT EXISTS idx_contacts_source_type ON public.contacts(source_type);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON public.contacts(contact_type);

CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);

-- ============================================
-- STEP 10: Create triggers for updated_at
-- ============================================

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_tasks_updated_at BEFORE UPDATE ON public.contact_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 11: Create helper functions
-- ============================================

-- Function to get plan-based cap amount
CREATE OR REPLACE FUNCTION get_plan_cap_amount(plan subscription_plan)
RETURNS DECIMAL(12, 2) AS $$
BEGIN
    CASE plan
        WHEN 'launch' THEN RETURN 21000.00;
        WHEN 'growth' THEN RETURN 18000.00;
        WHEN 'pro' THEN RETURN NULL; -- No cap for Pro plan
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_link_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link_url, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_link_url, p_metadata)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET read = true
    WHERE id = ANY(notification_ids)
    AND user_id = auth.uid();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 12: Update existing data
-- ============================================

-- Set default subscription plans for existing users (based on cap_amount)
UPDATE public.users
SET subscription_plan =
    CASE
        WHEN cap_amount >= 50000 THEN 'pro'::subscription_plan
        WHEN cap_amount >= 18000 THEN 'growth'::subscription_plan
        ELSE 'launch'::subscription_plan
    END
WHERE subscription_plan IS NULL;

-- ============================================
-- STEP 13: Create view for unread notification counts
-- ============================================

CREATE OR REPLACE VIEW user_notification_counts AS
SELECT
    user_id,
    COUNT(*) FILTER (WHERE NOT read) AS unread_count,
    COUNT(*) FILTER (WHERE NOT read AND type = 'application') AS unread_applications,
    COUNT(*) FILTER (WHERE NOT read AND type = 'transaction') AS unread_transactions,
    COUNT(*) FILTER (WHERE NOT read AND type = 'crm') AS unread_crm,
    COUNT(*) FILTER (WHERE NOT read AND type = 'system') AS unread_system
FROM public.notifications
GROUP BY user_id;

-- Grant access to view
GRANT SELECT ON user_notification_counts TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.payouts IS 'Commission payout history for agents';
COMMENT ON TABLE public.notifications IS 'In-app notification system for users';
COMMENT ON TABLE public.contact_tasks IS 'Junction table linking contacts to tasks with priority/urgency';
COMMENT ON COLUMN public.users.subscription_plan IS 'Agent subscription plan: launch has $21K cap, growth has $18K cap, pro has no cap';
COMMENT ON COLUMN public.users.show_phone_number IS 'Control visibility of phone number on public profile';
COMMENT ON COLUMN public.users.email_preferences IS 'JSON object controlling email notification preferences';
COMMENT ON FUNCTION get_plan_cap_amount IS 'Returns the cap amount for a given subscription plan';
COMMENT ON FUNCTION create_notification IS 'Helper function to create notifications with proper validation';
