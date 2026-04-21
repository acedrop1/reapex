-- Migration: Remove 'renter' contact type
-- Created: 2026-02-17
-- Description: Converts all 'renter' contacts to 'lead' and removes 'renter' from allowed contact types

-- Step 1: Convert all existing 'renter' contacts to 'lead' in contacts table
UPDATE public.contacts
SET contact_type = 'lead'
WHERE contact_type = 'renter';

-- Step 2: Update transaction_contacts table - change 'renter' role to 'other'
UPDATE public.transaction_contacts
SET role = 'other'
WHERE role = 'renter';

-- Step 3: Drop and recreate constraint on contacts table (if exists)
-- Note: This assumes there's a CHECK constraint on contact_type column
ALTER TABLE public.contacts
DROP CONSTRAINT IF EXISTS contacts_contact_type_check;

ALTER TABLE public.contacts
ADD CONSTRAINT contacts_contact_type_check
CHECK (contact_type IN ('buyer', 'seller', 'landlord', 'tenant', 'lead'));

-- Step 4: Drop and recreate constraint on transaction_contacts table (if exists)
-- Note: This assumes there's a CHECK constraint on role column
ALTER TABLE public.transaction_contacts
DROP CONSTRAINT IF EXISTS transaction_contacts_role_check;

ALTER TABLE public.transaction_contacts
ADD CONSTRAINT transaction_contacts_role_check
CHECK (role IN ('seller', 'buyer', 'other'));

-- Verification query (commented out - uncomment to verify after migration)
-- SELECT COUNT(*) as remaining_renters FROM contacts WHERE contact_type = 'renter';
-- SELECT COUNT(*) as remaining_renter_roles FROM transaction_contacts WHERE role = 'renter';
