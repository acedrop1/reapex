-- Create storage bucket for external link logos

BEGIN;

-- Create external-links bucket for logo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('external-links', 'external-links', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view logos (public bucket)
CREATE POLICY "Anyone can view external link logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'external-links');

-- Allow admins to upload logos
CREATE POLICY "Admins can upload external link logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'external-links'
    AND (storage.foldername(name))[1] = 'logos'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Allow admins to update logos
CREATE POLICY "Admins can update external link logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'external-links'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Allow admins to delete logos
CREATE POLICY "Admins can delete external link logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'external-links'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

COMMIT;
