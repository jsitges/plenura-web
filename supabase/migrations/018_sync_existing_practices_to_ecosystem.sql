-- ============================================================================
-- SYNC EXISTING PRACTICES TO ECOSYSTEM
-- Purpose: Register existing Plenura practices with Colectiva ecosystem
-- This makes them visible in Camino's ecosystem dashboard
-- ============================================================================

-- ============================================================================
-- 1. CREATE FUNCTION TO SYNC PRACTICE TO ECOSYSTEM
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_practice_to_ecosystem(p_practice_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_practice practices%ROWTYPE;
    v_ecosystem_org_id TEXT;
    v_api_url TEXT := current_setting('app.settings.colectiva_api_url', true);
    v_api_key TEXT := current_setting('app.settings.colectiva_api_key', true);
BEGIN
    -- Get practice details
    SELECT * INTO v_practice FROM practices WHERE id = p_practice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Practice not found: %', p_practice_id;
    END IF;

    -- Generate ecosystem org ID if not exists
    IF v_practice.ecosystem_org_id IS NULL THEN
        v_ecosystem_org_id := 'plenura_' || replace(v_practice.id::text, '-', '');

        UPDATE practices
        SET ecosystem_org_id = v_ecosystem_org_id
        WHERE id = p_practice_id;
    ELSE
        v_ecosystem_org_id := v_practice.ecosystem_org_id;
    END IF;

    -- Return ecosystem org data (to be sent to Colectiva)
    RETURN jsonb_build_object(
        'ecosystem_org_id', v_ecosystem_org_id,
        'app_name', 'plenura',
        'organization_name', v_practice.name,
        'email', v_practice.email,
        'tax_id', v_practice.tax_id,
        'business_type', v_practice.business_type,
        'subscription_tier', v_practice.subscription_tier,
        'verification_status', v_practice.verification_status,
        'is_active', v_practice.subscription_status = 'active',
        'created_at', v_practice.created_at,
        'metadata', jsonb_build_object(
            'practice_id', v_practice.id,
            'city', v_practice.city,
            'state', v_practice.state,
            'phone', v_practice.phone,
            'website', v_practice.website,
            'rating_avg', v_practice.rating_avg,
            'total_bookings', v_practice.total_bookings
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE FUNCTION TO SYNC INDEPENDENT THERAPIST TO ECOSYSTEM
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_therapist_to_ecosystem(p_therapist_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_therapist therapists%ROWTYPE;
    v_user users%ROWTYPE;
    v_ecosystem_org_id TEXT;
BEGIN
    -- Get therapist details
    SELECT * INTO v_therapist FROM therapists WHERE id = p_therapist_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Therapist not found: %', p_therapist_id;
    END IF;

    -- Only sync independent therapists (not part of practice)
    IF NOT v_therapist.is_independent THEN
        RAISE EXCEPTION 'Therapist % is part of a practice, sync the practice instead', p_therapist_id;
    END IF;

    -- Get user details
    SELECT * INTO v_user FROM users WHERE id = v_therapist.user_id;

    -- Generate ecosystem org ID if not exists
    IF v_therapist.ecosystem_org_id IS NULL THEN
        v_ecosystem_org_id := 'plenura_therapist_' || replace(v_therapist.id::text, '-', '');

        UPDATE therapists
        SET ecosystem_org_id = v_ecosystem_org_id
        WHERE id = p_therapist_id;
    ELSE
        v_ecosystem_org_id := v_therapist.ecosystem_org_id;
    END IF;

    -- Return ecosystem org data (to be sent to Colectiva)
    RETURN jsonb_build_object(
        'ecosystem_org_id', v_ecosystem_org_id,
        'app_name', 'plenura',
        'organization_name', v_user.full_name || ' (Independent Therapist)',
        'email', v_user.email,
        'tax_id', NULL,  -- Independent therapists may not have business tax ID
        'business_type', 'solo',
        'subscription_tier', v_therapist.subscription_tier,
        'verification_status', v_therapist.verification_status,
        'is_active', v_therapist.is_available,
        'created_at', v_therapist.created_at,
        'metadata', jsonb_build_object(
            'therapist_id', v_therapist.id,
            'user_id', v_therapist.user_id,
            'is_independent', true,
            'years_of_experience', v_therapist.years_of_experience,
            'rating_avg', v_therapist.rating_avg,
            'trust_level', v_therapist.trust_level,
            'colectiva_wallet_id', v_therapist.colectiva_wallet_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. UPDATE EXISTING PRACTICES WITH ECOSYSTEM ORG IDs
-- ============================================================================

-- Add ecosystem_org_id to practices if not exists
ALTER TABLE practices
ADD COLUMN IF NOT EXISTS ecosystem_org_id TEXT;

CREATE INDEX IF NOT EXISTS idx_practices_ecosystem_org_id ON practices(ecosystem_org_id);

-- Generate ecosystem org IDs for existing practices
UPDATE practices
SET ecosystem_org_id = 'plenura_' || replace(id::text, '-', '')
WHERE ecosystem_org_id IS NULL;

-- ============================================================================
-- 4. UPDATE EXISTING INDEPENDENT THERAPISTS WITH ECOSYSTEM ORG IDs
-- ============================================================================

-- Generate ecosystem org IDs for independent therapists
UPDATE therapists
SET ecosystem_org_id = 'plenura_therapist_' || replace(id::text, '-', '')
WHERE ecosystem_org_id IS NULL
  AND is_independent = true
  AND vetting_status = 'approved';

-- ============================================================================
-- 5. CREATE VIEW FOR ECOSYSTEM ORGANIZATIONS
-- ============================================================================

CREATE OR REPLACE VIEW ecosystem_organizations AS
-- Practices/clinics
SELECT
    p.ecosystem_org_id,
    'plenura' as app_name,
    'practice' as entity_type,
    p.id as entity_id,
    p.name as organization_name,
    p.email,
    p.tax_id,
    p.business_type::text as business_type,
    p.subscription_tier,
    p.verification_status::text as verification_status,
    (p.subscription_status = 'active') as is_active,
    p.city,
    p.state,
    p.phone,
    p.rating_avg,
    p.total_bookings,
    (SELECT COUNT(*) FROM practice_members pm WHERE pm.practice_id = p.id AND pm.status = 'active') as member_count,
    p.created_at,
    p.updated_at
FROM practices p
WHERE p.ecosystem_org_id IS NOT NULL

UNION ALL

-- Independent therapists
SELECT
    t.ecosystem_org_id,
    'plenura' as app_name,
    'independent_therapist' as entity_type,
    t.id as entity_id,
    u.full_name || ' (Independent Therapist)' as organization_name,
    u.email,
    NULL as tax_id,
    'solo' as business_type,
    t.subscription_tier::text as subscription_tier,
    t.verification_status::text as verification_status,
    t.is_available as is_active,
    NULL as city,
    NULL as state,
    u.phone,
    t.rating_avg,
    NULL as total_bookings,
    0 as member_count,
    t.created_at,
    t.updated_at
FROM therapists t
JOIN users u ON u.id = t.user_id
WHERE t.ecosystem_org_id IS NOT NULL
  AND t.is_independent = true
  AND t.vetting_status = 'approved';

-- ============================================================================
-- 6. CREATE API-FRIENDLY FUNCTION TO LIST ECOSYSTEM ORGS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ecosystem_organizations(
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    ecosystem_org_id TEXT,
    app_name TEXT,
    entity_type TEXT,
    organization_name TEXT,
    email TEXT,
    business_type TEXT,
    subscription_tier TEXT,
    verification_status TEXT,
    is_active BOOLEAN,
    location TEXT,
    member_count BIGINT,
    rating_avg DECIMAL,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        eo.ecosystem_org_id,
        eo.app_name,
        eo.entity_type,
        eo.organization_name,
        eo.email,
        eo.business_type,
        eo.subscription_tier,
        eo.verification_status,
        eo.is_active,
        CASE
            WHEN eo.city IS NOT NULL THEN eo.city || ', ' || COALESCE(eo.state, '')
            ELSE NULL
        END as location,
        eo.member_count,
        eo.rating_avg,
        eo.created_at,
        jsonb_build_object(
            'entity_id', eo.entity_id,
            'entity_type', eo.entity_type,
            'phone', eo.phone,
            'total_bookings', eo.total_bookings
        ) as metadata
    FROM ecosystem_organizations eo
    WHERE (p_search IS NULL OR
           eo.organization_name ILIKE '%' || p_search || '%' OR
           eo.email ILIKE '%' || p_search || '%')
    ORDER BY eo.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to service role
GRANT SELECT ON ecosystem_organizations TO service_role;
GRANT EXECUTE ON FUNCTION get_ecosystem_organizations TO service_role;
GRANT EXECUTE ON FUNCTION sync_practice_to_ecosystem TO service_role;
GRANT EXECUTE ON FUNCTION sync_therapist_to_ecosystem TO service_role;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

SELECT '=== ECOSYSTEM SYNC VERIFICATION ===' as status;

-- Check practices with ecosystem IDs
SELECT
    'PRACTICES' as entity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN ecosystem_org_id IS NOT NULL THEN 1 END) as with_ecosystem_id,
    COUNT(CASE WHEN ecosystem_org_id IS NULL THEN 1 END) as missing_ecosystem_id
FROM practices;

-- Check independent therapists with ecosystem IDs
SELECT
    'INDEPENDENT THERAPISTS' as entity_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN ecosystem_org_id IS NOT NULL THEN 1 END) as with_ecosystem_id,
    COUNT(CASE WHEN ecosystem_org_id IS NULL THEN 1 END) as missing_ecosystem_id
FROM therapists
WHERE is_independent = true AND vetting_status = 'approved';

-- List all ecosystem organizations
SELECT
    'ECOSYSTEM ORGANIZATIONS' as title,
    entity_type,
    organization_name,
    email,
    verification_status,
    is_active,
    member_count
FROM ecosystem_organizations
ORDER BY entity_type, organization_name;

-- ============================================================================
-- 9. AUTO-REGISTER NEW PRACTICES TO ECOSYSTEM
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_register_practice_to_ecosystem()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate ecosystem org ID for new practice
    IF NEW.ecosystem_org_id IS NULL THEN
        NEW.ecosystem_org_id := 'plenura_' || replace(NEW.id::text, '-', '');
    END IF;

    -- TODO: Call Colectiva API to register org (requires HTTP extension or webhook)
    -- For now, ecosystem_org_id is set and can be synced via API

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_register_practice_ecosystem
    BEFORE INSERT ON practices
    FOR EACH ROW
    EXECUTE FUNCTION auto_register_practice_to_ecosystem();

-- ============================================================================
-- 10. AUTO-REGISTER NEW INDEPENDENT THERAPISTS TO ECOSYSTEM
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_register_therapist_to_ecosystem()
RETURNS TRIGGER AS $$
BEGIN
    -- Only register independent therapists who are approved
    IF NEW.is_independent = true AND NEW.vetting_status = 'approved' THEN
        IF NEW.ecosystem_org_id IS NULL THEN
            NEW.ecosystem_org_id := 'plenura_therapist_' || replace(NEW.id::text, '-', '');
        END IF;
    END IF;

    -- TODO: Call Colectiva API to register org (requires HTTP extension or webhook)
    -- For now, ecosystem_org_id is set and can be synced via API

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_register_therapist_ecosystem
    BEFORE INSERT OR UPDATE OF is_independent, vetting_status ON therapists
    FOR EACH ROW
    EXECUTE FUNCTION auto_register_therapist_to_ecosystem();

-- ============================================================================
-- 11. CREATE WEBHOOK NOTIFICATION TABLE (for syncing to Colectiva)
-- ============================================================================

-- Table to queue ecosystem registrations for webhook processing
CREATE TABLE IF NOT EXISTS ecosystem_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,  -- 'practice' or 'therapist'
    entity_id UUID NOT NULL,
    ecosystem_org_id TEXT NOT NULL,
    action TEXT NOT NULL,  -- 'register', 'update', 'deactivate'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending',  -- 'pending', 'processing', 'success', 'failed'
    attempts INT DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ecosystem_sync_queue_status ON ecosystem_sync_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_ecosystem_sync_queue_entity ON ecosystem_sync_queue(entity_type, entity_id);

-- Function to queue ecosystem sync
CREATE OR REPLACE FUNCTION queue_ecosystem_sync(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action TEXT
)
RETURNS UUID AS $$
DECLARE
    v_queue_id UUID;
    v_payload JSONB;
BEGIN
    -- Generate payload based on entity type
    IF p_entity_type = 'practice' THEN
        SELECT sync_practice_to_ecosystem(p_entity_id) INTO v_payload;
    ELSIF p_entity_type = 'therapist' THEN
        SELECT sync_therapist_to_ecosystem(p_entity_id) INTO v_payload;
    ELSE
        RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
    END IF;

    -- Insert into queue
    INSERT INTO ecosystem_sync_queue (
        entity_type,
        entity_id,
        ecosystem_org_id,
        action,
        payload
    )
    VALUES (
        p_entity_type,
        p_entity_id,
        v_payload->>'ecosystem_org_id',
        p_action,
        v_payload
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers to queue syncs
CREATE OR REPLACE FUNCTION auto_register_practice_to_ecosystem()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate ecosystem org ID for new practice
    IF NEW.ecosystem_org_id IS NULL THEN
        NEW.ecosystem_org_id := 'plenura_' || replace(NEW.id::text, '-', '');
    END IF;

    -- Queue for sync to Colectiva (async via webhook/cron)
    IF TG_OP = 'INSERT' THEN
        PERFORM queue_ecosystem_sync('practice', NEW.id, 'register');
    ELSIF TG_OP = 'UPDATE' AND (
        OLD.name != NEW.name OR
        OLD.email != NEW.email OR
        OLD.subscription_tier != NEW.subscription_tier OR
        OLD.verification_status != NEW.verification_status
    ) THEN
        PERFORM queue_ecosystem_sync('practice', NEW.id, 'update');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_register_therapist_to_ecosystem()
RETURNS TRIGGER AS $$
BEGIN
    -- Only register independent therapists who are approved
    IF NEW.is_independent = true AND NEW.vetting_status = 'approved' THEN
        IF NEW.ecosystem_org_id IS NULL THEN
            NEW.ecosystem_org_id := 'plenura_therapist_' || replace(NEW.id::text, '-', '');
        END IF;

        -- Queue for sync to Colectiva
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.vetting_status != 'approved') THEN
            PERFORM queue_ecosystem_sync('therapist', NEW.id, 'register');
        ELSIF TG_OP = 'UPDATE' AND (
            OLD.subscription_tier != NEW.subscription_tier OR
            OLD.verification_status != NEW.verification_status OR
            OLD.is_available != NEW.is_available
        ) THEN
            PERFORM queue_ecosystem_sync('therapist', NEW.id, 'update');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION sync_practice_to_ecosystem IS 'Syncs a practice to Colectiva ecosystem registry';
COMMENT ON FUNCTION sync_therapist_to_ecosystem IS 'Syncs an independent therapist to Colectiva ecosystem registry';
COMMENT ON FUNCTION get_ecosystem_organizations IS 'Lists all Plenura organizations for ecosystem dashboard';
COMMENT ON FUNCTION queue_ecosystem_sync IS 'Queues an ecosystem sync job for async processing';
COMMENT ON TABLE ecosystem_sync_queue IS 'Queue for syncing Plenura orgs to Colectiva ecosystem';
COMMENT ON VIEW ecosystem_organizations IS 'Unified view of all Plenura organizations (practices + independent therapists)';

SELECT '✅ Migration complete! Existing practices and therapists now have ecosystem_org_id.' as final_message;
SELECT '✅ New practices and therapists will auto-register to ecosystem on creation.' as auto_register_note;
SELECT '📋 Check ecosystem_sync_queue table for pending syncs to Colectiva.' as queue_note;
