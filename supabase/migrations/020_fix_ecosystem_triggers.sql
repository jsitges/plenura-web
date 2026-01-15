-- ============================================================================
-- FIX ECOSYSTEM AUTO-REGISTRATION TRIGGERS
-- Separate BEFORE trigger (for setting ecosystem_org_id) from AFTER trigger (for queueing sync)
-- This avoids tuple modification conflicts
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS auto_register_practice_ecosystem ON practices;
DROP TRIGGER IF EXISTS auto_register_therapist_ecosystem ON therapists;

-- BEFORE trigger: Set ecosystem_org_id by modifying NEW
CREATE OR REPLACE FUNCTION set_practice_ecosystem_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ecosystem_org_id IS NULL THEN
        NEW.ecosystem_org_id := 'plenura_' || replace(NEW.id::text, '-', '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_therapist_ecosystem_org_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set for independent approved therapists
    IF NEW.is_independent = true AND NEW.vetting_status = 'approved' THEN
        IF NEW.ecosystem_org_id IS NULL THEN
            NEW.ecosystem_org_id := 'plenura_therapist_' || replace(NEW.id::text, '-', '');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AFTER trigger: Queue sync to Colectiva
CREATE OR REPLACE FUNCTION queue_practice_ecosystem_sync()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION queue_therapist_ecosystem_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Only queue if independent and approved
    IF NEW.is_independent = true AND NEW.vetting_status = 'approved' THEN
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

-- Create BEFORE triggers for setting ecosystem_org_id
CREATE TRIGGER set_practice_ecosystem_org_id_trigger
    BEFORE INSERT OR UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION set_practice_ecosystem_org_id();

CREATE TRIGGER set_therapist_ecosystem_org_id_trigger
    BEFORE INSERT OR UPDATE OF is_independent, vetting_status ON therapists
    FOR EACH ROW
    EXECUTE FUNCTION set_therapist_ecosystem_org_id();

-- Create AFTER triggers for queueing sync
CREATE TRIGGER queue_practice_ecosystem_sync_trigger
    AFTER INSERT OR UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION queue_practice_ecosystem_sync();

CREATE TRIGGER queue_therapist_ecosystem_sync_trigger
    AFTER INSERT OR UPDATE OF is_independent, vetting_status ON therapists
    FOR EACH ROW
    EXECUTE FUNCTION queue_therapist_ecosystem_sync();

-- Add comments
COMMENT ON FUNCTION set_practice_ecosystem_org_id IS 'BEFORE trigger: Sets ecosystem_org_id on practices';
COMMENT ON FUNCTION set_therapist_ecosystem_org_id IS 'BEFORE trigger: Sets ecosystem_org_id on approved independent therapists';
COMMENT ON FUNCTION queue_practice_ecosystem_sync IS 'AFTER trigger: Queues practice sync to Colectiva ecosystem';
COMMENT ON FUNCTION queue_therapist_ecosystem_sync IS 'AFTER trigger: Queues therapist sync to Colectiva ecosystem';
