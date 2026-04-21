-- Create Storage Buckets for Agent Portal

-- Insert storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('brand-assets', 'brand-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'application/pdf', 'video/mp4', 'application/illustrator']),
    ('training-resources', 'training-resources', true, 104857600, ARRAY['video/mp4', 'application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
    ('marketing-files', 'marketing-files', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/illustrator']),
    ('support-attachments', 'support-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']),
    ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('announcement-files', 'announcement-files', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for brand-assets (public read, admin write)
CREATE POLICY "Public can view brand assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins can upload brand assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can update brand assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete brand assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'brand-assets' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- RLS Policies for training-resources (public read, admin write)
CREATE POLICY "Public can view training resources"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'training-resources');

CREATE POLICY "Admins can upload training resources"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can update training resources"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete training resources"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'training-resources' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

-- RLS Policies for marketing-files (agents can manage their own)
CREATE POLICY "Agents can view own marketing files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'marketing-files' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

CREATE POLICY "Agents can upload own marketing files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'marketing-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Agents can delete own marketing files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'marketing-files' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

-- RLS Policies for support-attachments (agents can manage their own)
CREATE POLICY "Agents can view own support attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'support-attachments' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

CREATE POLICY "Agents can upload own support attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'support-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Agents can delete own support attachments"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'support-attachments' AND
        (auth.uid()::text = (storage.foldername(name))[1] OR
         EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker')))
    );

-- RLS Policies for profile-photos (public read, users can manage their own)
CREATE POLICY "Public can view profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload own profile photo"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile photo"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile photo"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS Policies for announcement-files (public read, admin write)
CREATE POLICY "Public can view announcement files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'announcement-files');

CREATE POLICY "Admins can upload announcement files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'announcement-files' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );

CREATE POLICY "Admins can delete announcement files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'announcement-files' AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'broker'))
    );
