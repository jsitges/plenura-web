-- ============================================================================
-- FIX: Therapist Registration and Missing Schema
-- This migration:
-- 1. Fixes the handle_new_user() trigger to extract role from metadata
-- 2. Ensures practices table and related schema exist (from 007)
-- 3. Ensures therapist columns exist
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE MISSING ENUMS (if not exist)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'unverified',
        'pending',
        'identity_verified',
        'credential_verified',
        'fully_verified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE practice_type AS ENUM (
        'solo',
        'group',
        'clinic',
        'franchise'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE practice_role AS ENUM (
        'owner',
        'admin',
        'manager',
        'therapist',
        'receptionist'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 2: CREATE PRACTICES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,

    -- Business details
    business_type practice_type DEFAULT 'solo',
    tax_id TEXT,
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
    verification_documents JSONB DEFAULT '[]',
    verification_notes TEXT,

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
    colectiva_wallet_id TEXT,

    -- Subscription
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
-- STEP 3: CREATE PRACTICE_MEMBERS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,

    -- Role and permissions
    role practice_role NOT NULL DEFAULT 'therapist',
    permissions JSONB DEFAULT '{}',

    -- Employment details
    title TEXT,
    hire_date DATE,
    commission_rate DECIMAL(5,2),

    -- Status
    status TEXT DEFAULT 'active',
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
-- STEP 4: CREATE PRACTICE_INVITATIONS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_invitations (
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
    status TEXT DEFAULT 'pending',
    invited_by UUID REFERENCES users(id),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(practice_id, email)
);

-- ============================================================================
-- STEP 5: ADD MISSING COLUMNS TO THERAPISTS TABLE
-- ============================================================================

ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_independent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS primary_practice_id UUID REFERENCES practices(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: CREATE INDEXES (if not exist)
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
-- STEP 7: FIX THE handle_new_user() TRIGGER
-- This is the critical fix - extract role from user metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
    metadata_role TEXT;
BEGIN
    -- Extract role from user metadata, default to 'client'
    metadata_role := NEW.raw_user_meta_data->>'role';

    -- Map the role string to the enum
    IF metadata_role = 'therapist' THEN
        user_role_value := 'therapist';
    ELSIF metadata_role = 'admin' THEN
        user_role_value := 'admin';
    ELSE
        user_role_value := 'client';
    END IF;

    INSERT INTO public.users (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role_value
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: ENABLE RLS ON NEW TABLES (if not already enabled)
-- ============================================================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES (drop and recreate to avoid conflicts)
-- ============================================================================

-- Practices policies
DROP POLICY IF EXISTS "Public can view verified practices" ON practices;
DROP POLICY IF EXISTS "Practice members can view their practice" ON practices;
DROP POLICY IF EXISTS "Practice owners can update" ON practices;
DROP POLICY IF EXISTS "Authenticated users can create practices" ON practices;

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

-- Practice members policies
DROP POLICY IF EXISTS "Members can view practice members" ON practice_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON practice_members;

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

-- Invitations policies
DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON practice_invitations;
DROP POLICY IF EXISTS "Anyone can view their own invitation by token" ON practice_invitations;

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
USING (true);

-- ============================================================================
-- STEP 10: CREATE/UPDATE HELPER TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_practices_updated_at ON practices;
DROP TRIGGER IF EXISTS update_practice_members_updated_at ON practice_members;

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

DROP TRIGGER IF EXISTS generate_practice_slug_trigger ON practices;

CREATE TRIGGER generate_practice_slug_trigger
    BEFORE INSERT OR UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION generate_practice_slug();

-- ============================================================================
-- DONE
-- ============================================================================
