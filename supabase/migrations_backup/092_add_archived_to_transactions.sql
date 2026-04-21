-- Add archived field to transactions table
-- Allows agents to archive transactions they no longer want to see

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for better query performance on archived status
CREATE INDEX IF NOT EXISTS idx_transactions_archived ON public.transactions(archived);

-- Add index for agent_id + archived combination (common query pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_agent_archived ON public.transactions(agent_id, archived);

COMMENT ON COLUMN public.transactions.archived IS 'Whether the transaction has been archived by the agent (soft delete)';
