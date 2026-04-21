-- Add file attachment support to announcements table

-- Add columns for file attachments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'file_urls') THEN
        ALTER TABLE public.announcements ADD COLUMN file_urls TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'attachment_names') THEN
        ALTER TABLE public.announcements ADD COLUMN attachment_names TEXT[];
    END IF;

    -- Ensure author_id column exists (renamed from created_by)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'author_id') THEN
        -- Check if created_by exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'created_by') THEN
            ALTER TABLE public.announcements RENAME COLUMN created_by TO author_id;
        ELSE
            -- If neither exists, create author_id
            ALTER TABLE public.announcements ADD COLUMN author_id UUID REFERENCES public.users(id);
        END IF;
    END IF;

    -- Ensure priority column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'announcements'
                   AND column_name = 'priority') THEN
        ALTER TABLE public.announcements ADD COLUMN priority TEXT DEFAULT 'medium';
        ALTER TABLE public.announcements ADD CONSTRAINT announcements_priority_check
            CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
END $$;

-- Add RLS policies for admin announcement management
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

    -- Create policy for admins to create announcements
    CREATE POLICY "Admins can create announcements"
        ON public.announcements FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        );

    -- Create policy for admins to update announcements
    CREATE POLICY "Admins can update announcements"
        ON public.announcements FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        );

    -- Create policy for admins to delete announcements
    CREATE POLICY "Admins can delete announcements"
        ON public.announcements FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        );
END $$;

-- Add comment explaining the new columns
COMMENT ON COLUMN public.announcements.file_urls IS 'Array of file URLs stored in announcement-files bucket';
COMMENT ON COLUMN public.announcements.attachment_names IS 'Array of original file names corresponding to file_urls';
