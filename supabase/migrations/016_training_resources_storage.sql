-- Create training-resources storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-resources', 'training-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload training resources
CREATE POLICY "Admins can upload training resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to update training resources
CREATE POLICY "Admins can update training resources"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow admins to delete training resources
CREATE POLICY "Admins can delete training resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-resources' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow all authenticated users to view training resources
CREATE POLICY "Authenticated users can view training resources"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'training-resources');
