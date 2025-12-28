-- ============================================================================
-- PRACTICE VERIFICATION ENHANCEMENTS
-- Adds:
-- 1. Missing columns to practices table for business verification
-- 2. Dedicated practice_verification_documents table
-- 3. Storage bucket for practice documents
-- 4. Therapist verification timestamp columns
-- ============================================================================

-- ============================================================================
-- ADD MISSING COLUMNS TO PRACTICES TABLE
-- ============================================================================
ALTER TABLE practices
    ADD COLUMN IF NOT EXISTS business_registration_number TEXT,
    ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
    ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;

COMMENT ON COLUMN practices.business_registration_number IS 'Official business registration number (e.g., REG-12345)';
COMMENT ON COLUMN practices.insurance_provider IS 'Name of liability insurance provider';
COMMENT ON COLUMN practices.insurance_policy_number IS 'Policy number for liability insurance';

-- ============================================================================
-- CREATE PRACTICE VERIFICATION DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS practice_verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

    -- Document details
    document_type TEXT NOT NULL,  -- 'business_license', 'insurance_certificate', 'tax_registration', etc.
    file_url TEXT NOT NULL,
    original_filename TEXT,
    file_size_bytes INT,
    mime_type TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),

    -- Metadata
    uploaded_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_verification_docs_practice ON practice_verification_documents(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_verification_docs_status ON practice_verification_documents(status);
CREATE INDEX IF NOT EXISTS idx_practice_verification_docs_type ON practice_verification_documents(document_type);

-- Update timestamp trigger
CREATE TRIGGER update_practice_verification_docs_updated_at
    BEFORE UPDATE ON practice_verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES FOR PRACTICE VERIFICATION DOCUMENTS
-- ============================================================================
ALTER TABLE practice_verification_documents ENABLE ROW LEVEL SECURITY;

-- Practice owners/admins can view their documents
CREATE POLICY "Practice admins can view verification documents"
ON practice_verification_documents FOR SELECT
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Practice owners/admins can insert documents
CREATE POLICY "Practice admins can upload verification documents"
ON practice_verification_documents FOR INSERT
WITH CHECK (
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) AND uploaded_by = auth.uid()
);

-- Practice owners can delete pending documents
CREATE POLICY "Practice owners can delete pending documents"
ON practice_verification_documents FOR DELETE
USING (
    status = 'pending' AND
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- Admins can view all verification documents
CREATE POLICY "Admins can view all practice verification documents"
ON practice_verification_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Admins can update verification document status
CREATE POLICY "Admins can update practice verification documents"
ON practice_verification_documents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- ============================================================================
-- CREATE STORAGE BUCKET FOR PRACTICE DOCUMENTS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'practice-documents',
    'practice-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage policies for practice documents

-- Allow practice admins to upload documents
CREATE POLICY "Practice admins can upload practice documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'practice-documents' AND
    EXISTS (
        SELECT 1 FROM practice_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.practice_id::text = (storage.foldername(name))[1]
        AND pm.role IN ('owner', 'admin')
        AND pm.status = 'active'
    )
);

-- Allow practice admins to view their documents
CREATE POLICY "Practice admins can view practice documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'practice-documents' AND
    EXISTS (
        SELECT 1 FROM practice_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.practice_id::text = (storage.foldername(name))[1]
        AND pm.role IN ('owner', 'admin')
        AND pm.status = 'active'
    )
);

-- Allow practice owners to delete documents
CREATE POLICY "Practice owners can delete practice documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'practice-documents' AND
    EXISTS (
        SELECT 1 FROM practice_members pm
        WHERE pm.user_id = auth.uid()
        AND pm.practice_id::text = (storage.foldername(name))[1]
        AND pm.role = 'owner'
        AND pm.status = 'active'
    )
);

-- Allow platform admins to view all practice documents
CREATE POLICY "Platform admins can view all practice documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'practice-documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- ============================================================================
-- ADD THERAPIST VERIFICATION TIMESTAMPS
-- ============================================================================
ALTER TABLE therapists
    ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS credential_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN therapists.identity_verified_at IS 'When identity verification was completed';
COMMENT ON COLUMN therapists.credential_verified_at IS 'When credential/license verification was completed';

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE practice_verification_documents IS 'Documents uploaded by practices for verification (business licenses, insurance, etc.)';
