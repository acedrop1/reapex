-- Create transaction_contacts table to associate contacts with transactions
-- in specific roles (seller, buyer, renter)

CREATE TABLE IF NOT EXISTS public.transaction_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('seller', 'buyer', 'renter', 'other')),
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure we don't have duplicate contact-transaction-role combinations
    UNIQUE(transaction_id, contact_id, role)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_contacts_transaction_id
    ON public.transaction_contacts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_contacts_contact_id
    ON public.transaction_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_transaction_contacts_role
    ON public.transaction_contacts(role);

-- Enable RLS
ALTER TABLE public.transaction_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Agents can view transaction contacts for their own transactions
CREATE POLICY "Agents can view their transaction contacts"
    ON public.transaction_contacts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_contacts.transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Agents can create transaction contacts for their own transactions
CREATE POLICY "Agents can create transaction contacts"
    ON public.transaction_contacts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_contacts.transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Agents can update transaction contacts for their own transactions
CREATE POLICY "Agents can update their transaction contacts"
    ON public.transaction_contacts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_contacts.transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Agents can delete transaction contacts for their own transactions
CREATE POLICY "Agents can delete their transaction contacts"
    ON public.transaction_contacts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_contacts.transaction_id
            AND t.agent_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_transaction_contacts_updated_at
    BEFORE UPDATE ON public.transaction_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.transaction_contacts IS 'Associates contacts with transactions in specific roles (seller, buyer, renter)';
