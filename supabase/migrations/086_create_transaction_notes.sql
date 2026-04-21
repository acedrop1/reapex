-- Create transaction_notes table
CREATE TABLE IF NOT EXISTS public.transaction_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_transaction_notes_transaction_id ON public.transaction_notes(transaction_id);
CREATE INDEX idx_transaction_notes_created_at ON public.transaction_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.transaction_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agents can view notes for their own transactions
CREATE POLICY "Agents can view their transaction notes"
    ON public.transaction_notes
    FOR SELECT
    USING (
        agent_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_notes.transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Agents can create notes for their own transactions
CREATE POLICY "Agents can create notes for their transactions"
    ON public.transaction_notes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Agents can update their own notes
CREATE POLICY "Agents can update their own notes"
    ON public.transaction_notes
    FOR UPDATE
    USING (agent_id = auth.uid())
    WITH CHECK (agent_id = auth.uid());

-- Agents can delete their own notes
CREATE POLICY "Agents can delete their own notes"
    ON public.transaction_notes
    FOR DELETE
    USING (agent_id = auth.uid());

-- Admins can view all transaction notes
CREATE POLICY "Admins can view all transaction notes"
    ON public.transaction_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can create notes for any transaction
CREATE POLICY "Admins can create notes for any transaction"
    ON public.transaction_notes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can update any notes
CREATE POLICY "Admins can update any transaction notes"
    ON public.transaction_notes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can delete any notes
CREATE POLICY "Admins can delete any transaction notes"
    ON public.transaction_notes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER update_transaction_notes_updated_at
    BEFORE UPDATE ON public.transaction_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.transaction_notes IS 'Notes and activity log for transactions';
COMMENT ON COLUMN public.transaction_notes.transaction_id IS 'Reference to the transaction';
COMMENT ON COLUMN public.transaction_notes.agent_id IS 'User who created the note';
COMMENT ON COLUMN public.transaction_notes.note_text IS 'Content of the note';
