-- ============================================================================
-- PRACTICES AND VERIFICATION SYSTEM
-- Adds support for:
-- 1. Practices/clinics (companies that employ multiple therapists)
-- 2. Practice membership with roles
-- 3. Multi-tier verification system with badges
-- ============================================================================

-- Verification status enum (applies to both individuals and practices)
CREATE TYPE verification_status AS ENUM (
    'unverified',           -- Just registered, no verification
    'pending',              -- Documents submitted, awaiting review
    'identity_verified',    -- ID verified (individual) or business registered (practice)
    'credential_verified',  -- Professional license verified
    'fully_verified'        -- All verifications complete
);

-- Practice/clinic type
CREATE TYPE practice_type AS ENUM (
    'solo',                 -- Solo practitioner with business entity
    'group',                -- Group practice with multiple therapists
    'clinic',               -- Full clinic/wellness center
    'franchise'             -- Multi-location franchise
);

-- Practice member roles
CREATE TYPE practice_role AS ENUM (
    'owner',                -- Practice owner (full control)
    'admin',                -- Can manage staff and settings
    'manager',              -- Can view analytics, manage bookings
    'therapist',            -- Staff therapist
    'receptionist'          -- Can manage bookings only
);

-- ============================================================================
-- PRACTICES TABLE
-- Represents a company/clinic that can have multiple therapists
-- ============================================================================
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE,  -- URL-friendly name
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,

    -- Business details
    business_type practice_type DEFAULT 'solo',
    tax_id TEXT,  -- RFC in Mexico
    business_license TEXT,

    -- Contact
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'MX',
    location GEOGRAPHY(POINT, 4326),

    -- Verification
    verification_status verification_status DEFAULT 'unverified',
    verification_submitted_at TIMESTAMPTZ,
    verification_completed_at TIMESTAMPTZ,
    verification_documents JSONB DEFAULT '[]',  -- Array of document URLs/metadata
    verification_notes TEXT,  -- Admin notes

    -- Settings
    timezone TEXT DEFAULT 'America/Mexico_City',
    currency TEXT DEFAULT 'MXN',
    booking_settings JSONB DEFAULT '{
        "advance_booking_days": 30,
        "min_notice_hours": 24,
        "cancellation_policy": "flexible"
    }',

    -- Ecosystem integration
    ecosystem_org_id TEXT,
    colectiva_wallet_id TEXT,  -- Practice-level wallet for shared earnings

    -- Subscription (practice-level)
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',

    -- Stats
    rating_avg DECIMAL(2,1) DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    total_bookings INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRACTICE MEMBERS TABLE
-- Links therapists to practices with roles
-- ============================================================================
CREATE TABLE practice_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,  -- NULL for non-therapist staff

    -- Role and permissions
    role practice_role NOT NULL DEFAULT 'therapist',
    permissions JSONB DEFAULT '{}',  -- Custom permission overrides

    -- Employment details
    title TEXT,  -- "Senior Massage Therapist", "Clinic Manager", etc.
    hire_date DATE,
    commission_rate DECIMAL(5,2),  -- Override practice default

    -- Status
    status TEXT DEFAULT 'active',  -- active, inactive, pending_invite
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    invited_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(practice_id, user_id)
);

-- ============================================================================
-- PRACTICE INVITATIONS TABLE
-- For inviting new members to a practice
-- ============================================================================
CREATE TABLE practice_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,

    -- Invitation details
    email TEXT NOT NULL,
    role practice_role NOT NULL DEFAULT 'therapist',
    title TEXT,

    -- Token for accepting
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending',  -- pending, accepted, expired, cancelled
    invited_by UUID REFERENCES users(id),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(practice_id, email)
);

-- ============================================================================
-- UPDATE THERAPISTS TABLE
-- Add verification fields and practice association
-- ============================================================================
ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_independent BOOLEAN DEFAULT true,  -- false if part of a practice
ADD COLUMN IF NOT EXISTS primary_practice_id UUID REFERENCES practices(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_practices_slug ON practices(slug);
CREATE INDEX IF NOT EXISTS idx_practices_verification_status ON practices(verification_status);
CREATE INDEX IF NOT EXISTS idx_practices_location ON practices USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_practices_ecosystem_org_id ON practices(ecosystem_org_id);

CREATE INDEX IF NOT EXISTS idx_practice_members_practice_id ON practice_members(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_user_id ON practice_members(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_therapist_id ON practice_members(therapist_id);
CREATE INDEX IF NOT EXISTS idx_practice_members_role ON practice_members(role);

CREATE INDEX IF NOT EXISTS idx_practice_invitations_token ON practice_invitations(token);
CREATE INDEX IF NOT EXISTS idx_practice_invitations_email ON practice_invitations(email);

CREATE INDEX IF NOT EXISTS idx_therapists_verification_status ON therapists(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapists_primary_practice_id ON therapists(primary_practice_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_invitations ENABLE ROW LEVEL SECURITY;

-- Practices: owners and admins can manage, public can view approved
CREATE POLICY "Public can view verified practices"
ON practices FOR SELECT
USING (verification_status IN ('identity_verified', 'credential_verified', 'fully_verified'));

CREATE POLICY "Practice members can view their practice"
ON practices FOR SELECT
USING (
    id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Practice owners can update"
ON practices FOR UPDATE
USING (
    id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Authenticated users can create practices"
ON practices FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Practice members: members can see their co-workers
CREATE POLICY "Members can view practice members"
ON practice_members FOR SELECT
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Owners and admins can manage members"
ON practice_members FOR ALL
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Invitations: only owners/admins can manage
CREATE POLICY "Owners and admins can manage invitations"
ON practice_invitations FOR ALL
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Anyone can view their own invitation by token"
ON practice_invitations FOR SELECT
USING (true);  -- Token validation happens in application layer

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practices_updated_at
    BEFORE UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_members_updated_at
    BEFORE UPDATE ON practice_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from practice name
CREATE OR REPLACE FUNCTION generate_practice_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INT := 0;
BEGIN
    IF NEW.slug IS NULL THEN
        base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        base_slug := trim(both '-' from base_slug);
        new_slug := base_slug;

        WHILE EXISTS (SELECT 1 FROM practices WHERE slug = new_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            new_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := new_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_practice_slug_trigger
    BEFORE INSERT OR UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION generate_practice_slug();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE practices IS 'Companies/clinics that can employ multiple therapists';
COMMENT ON TABLE practice_members IS 'Links users to practices with specific roles';
COMMENT ON TABLE practice_invitations IS 'Pending invitations to join a practice';
COMMENT ON COLUMN therapists.verification_status IS 'Current verification level for the therapist';
COMMENT ON COLUMN therapists.is_independent IS 'True if solo practitioner, false if part of a practice';
