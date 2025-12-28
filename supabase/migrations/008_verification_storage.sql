-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Storage policies for verification documents

-- Allow authenticated users to upload their own verification documents
CREATE POLICY "Users can upload verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own verification documents
CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own verification documents
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all verification documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Create storage bucket for practice logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'practice-logos',
    'practice-logos',
    true, -- Public so logos can be displayed
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Allow practice owners/admins to upload logos
CREATE POLICY "Practice admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'practice-logos' AND
    EXISTS (
        SELECT 1 FROM practice_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.practice_id::text = (storage.foldername(name))[1]
        AND pm.role IN ('owner', 'admin')
        AND pm.status = 'active'
    )
);

-- Allow anyone to view practice logos (public bucket)
CREATE POLICY "Anyone can view practice logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'practice-logos');

-- Allow practice admins to delete logos
CREATE POLICY "Practice admins can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'practice-logos' AND
    EXISTS (
        SELECT 1 FROM practice_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.practice_id::text = (storage.foldername(name))[1]
        AND pm.role IN ('owner', 'admin')
        AND pm.status = 'active'
    )
);
