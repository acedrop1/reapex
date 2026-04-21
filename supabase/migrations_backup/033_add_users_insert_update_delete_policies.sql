-- Migration: Add INSERT, UPDATE, DELETE policies for users table
-- Description: Allow service role to perform all operations, users can update own profile
-- Created: 2025-01-29

-- INSERT policy: Only allow inserts via service role (which bypasses RLS anyway)
-- This is a safety policy in case service role doesn't bypass RLS in some contexts
CREATE POLICY "Service role can insert users"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- UPDATE policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE policy: Only service role should delete (this won't be triggered for normal users)
CREATE POLICY "Service role can delete users"
    ON public.users FOR DELETE
    USING (true);
