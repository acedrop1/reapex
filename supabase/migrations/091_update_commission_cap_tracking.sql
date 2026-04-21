-- Update Commission Cap Tracking
-- Ties commission caps to user plans and automatically tracks agent commission toward cap

-- ============================================
-- STEP 0: Create subscription_plan type if it doesn't exist
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('launch', 'growth', 'pro');
    END IF;
END $$;

-- ============================================
-- STEP 0.1: Add subscription_plan column to users if it doesn't exist
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'users'
                   AND column_name = 'subscription_plan') THEN
        ALTER TABLE public.users ADD COLUMN subscription_plan subscription_plan DEFAULT 'launch';
    END IF;
END $$;

-- ============================================
-- STEP 1: Update plan cap function
-- ============================================

-- Update function to set cap based on plan
-- Launch: $21,000 cap
-- Growth: $18,000 cap
-- Pro: No cap
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

-- ============================================
-- STEP 2: Function to update user cap progress
-- ============================================

-- Function to update user's commission cap progress
-- This adds the agent's net commission to their current cap progress
CREATE OR REPLACE FUNCTION update_user_cap_progress()
RETURNS TRIGGER AS $$
DECLARE
    user_cap DECIMAL(12, 2);
    commission_amount DECIMAL(12, 2);
BEGIN
    -- Only update cap progress when commission status changes to 'paid'
    IF NEW.commission_status = 'paid' AND (OLD.commission_status IS NULL OR OLD.commission_status != 'paid') THEN
        -- Get the agent's net payout amount (this is their actual commission)
        commission_amount := COALESCE(NEW.agent_net_payout, NEW.agent_commission, 0);

        -- Get the user's cap amount
        SELECT cap_amount INTO user_cap
        FROM public.users
        WHERE id = NEW.agent_id;

        -- Only update if user has a cap (not NULL for unlimited plans)
        IF user_cap IS NOT NULL THEN
            -- Add this commission to their cap progress
            UPDATE public.users
            SET current_cap_progress = COALESCE(current_cap_progress, 0) + commission_amount,
                updated_at = NOW()
            WHERE id = NEW.agent_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Create trigger on transactions
-- ============================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_cap_progress_on_payout ON public.transactions;

-- Create trigger to update cap progress when commission is paid
CREATE TRIGGER update_cap_progress_on_payout
    AFTER UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_cap_progress();

-- ============================================
-- STEP 4: Update existing users' cap amounts
-- ============================================

-- Update cap_amount based on subscription_plan
UPDATE public.users
SET cap_amount = get_plan_cap_amount(subscription_plan)
WHERE subscription_plan IN ('launch', 'pro', 'growth');

-- ============================================
-- STEP 5: Create function to get cap progress percentage
-- ============================================

CREATE OR REPLACE FUNCTION get_cap_progress_percentage(user_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    user_cap DECIMAL(12, 2);
    user_progress DECIMAL(12, 2);
    percentage DECIMAL(5, 2);
BEGIN
    -- Get user's cap and progress
    SELECT cap_amount, COALESCE(current_cap_progress, 0)
    INTO user_cap, user_progress
    FROM public.users
    WHERE id = user_id;

    -- If no cap (unlimited), return NULL
    IF user_cap IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate percentage
    IF user_cap > 0 THEN
        percentage := (user_progress / user_cap) * 100;
        RETURN LEAST(percentage, 100.00); -- Cap at 100%
    ELSE
        RETURN 0.00;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STEP 6: Create function to get remaining cap amount
-- ============================================

CREATE OR REPLACE FUNCTION get_remaining_cap_amount(user_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    user_cap DECIMAL(12, 2);
    user_progress DECIMAL(12, 2);
BEGIN
    -- Get user's cap and progress
    SELECT cap_amount, COALESCE(current_cap_progress, 0)
    INTO user_cap, user_progress
    FROM public.users
    WHERE id = user_id;

    -- If no cap (unlimited), return NULL
    IF user_cap IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate remaining amount
    RETURN GREATEST(user_cap - user_progress, 0.00);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON FUNCTION update_user_cap_progress IS 'Automatically updates user cap progress when commission is marked as paid (uses agent_net_payout)';
COMMENT ON FUNCTION get_cap_progress_percentage IS 'Returns the percentage of cap used (0-100), NULL for unlimited plans';
COMMENT ON FUNCTION get_remaining_cap_amount IS 'Returns the remaining cap amount, NULL for unlimited plans';
COMMENT ON TRIGGER update_cap_progress_on_payout ON public.transactions IS 'Updates user cap progress when commission status changes to paid';
