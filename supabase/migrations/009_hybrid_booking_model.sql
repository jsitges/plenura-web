-- ============================================================================
-- HYBRID BOOKING MODEL
-- Supports both practice-centric and therapist-centric booking modes
-- ============================================================================

-- Booking mode for practices
CREATE TYPE booking_mode AS ENUM (
    'therapist_direct',      -- Clients book specific therapists (default)
    'practice_assigns',      -- Practice assigns therapists to bookings
    'hybrid'                 -- Practice can assign, but clients can also book directly
);

-- Payout routing for practice bookings
CREATE TYPE payout_routing AS ENUM (
    'therapist_wallet',      -- Payout goes to therapist's personal wallet
    'practice_wallet',       -- Payout goes to practice wallet (practice handles internal payouts)
    'split'                  -- Split between practice and therapist based on commission_rate
);

-- Add booking model settings to practices
ALTER TABLE practices
ADD COLUMN IF NOT EXISTS booking_mode booking_mode DEFAULT 'therapist_direct',
ADD COLUMN IF NOT EXISTS payout_routing payout_routing DEFAULT 'therapist_wallet',
ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2) DEFAULT 0.00;  -- Practice's cut from therapist earnings

-- Add practice override settings to practice_members
ALTER TABLE practice_members
ADD COLUMN IF NOT EXISTS payout_routing payout_routing,  -- NULL means inherit from practice
ADD COLUMN IF NOT EXISTS is_accepting_direct_bookings BOOLEAN DEFAULT true,  -- Therapist can receive direct bookings
ADD COLUMN IF NOT EXISTS is_available_for_assignment BOOLEAN DEFAULT true;   -- Can be assigned by practice

-- Add booking source tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id),  -- If practice assigned the therapist
ADD COLUMN IF NOT EXISTS assignment_notes TEXT,
ADD COLUMN IF NOT EXISTS practice_commission_cents INT DEFAULT 0,  -- Practice's cut
ADD COLUMN IF NOT EXISTS payout_routing payout_routing;  -- Where payout should go

-- Index for practice bookings
CREATE INDEX IF NOT EXISTS idx_bookings_practice_id ON bookings(practice_id);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_by ON bookings(assigned_by);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate practice commission
CREATE OR REPLACE FUNCTION calculate_practice_commission(
    p_therapist_id UUID,
    p_price_cents INT
) RETURNS INT AS $$
DECLARE
    v_practice_id UUID;
    v_member_commission_rate DECIMAL(5,2);
    v_practice_commission_rate DECIMAL(5,2);
    v_commission_rate DECIMAL(5,2);
BEGIN
    -- Get therapist's primary practice and commission rates
    SELECT
        t.primary_practice_id,
        pm.commission_rate,
        p.default_commission_rate
    INTO
        v_practice_id,
        v_member_commission_rate,
        v_practice_commission_rate
    FROM therapists t
    LEFT JOIN practice_members pm ON pm.therapist_id = t.id AND pm.status = 'active'
    LEFT JOIN practices p ON p.id = t.primary_practice_id
    WHERE t.id = p_therapist_id;

    -- No practice = no practice commission
    IF v_practice_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Use member-specific rate if set, otherwise practice default
    v_commission_rate := COALESCE(v_member_commission_rate, v_practice_commission_rate, 0);

    RETURN FLOOR(p_price_cents * v_commission_rate / 100);
END;
$$ LANGUAGE plpgsql;

-- Function to determine payout routing for a booking
CREATE OR REPLACE FUNCTION determine_payout_routing(
    p_therapist_id UUID
) RETURNS payout_routing AS $$
DECLARE
    v_practice_id UUID;
    v_member_routing payout_routing;
    v_practice_routing payout_routing;
BEGIN
    -- Get therapist's practice and routing settings
    SELECT
        t.primary_practice_id,
        pm.payout_routing,
        p.payout_routing
    INTO
        v_practice_id,
        v_member_routing,
        v_practice_routing
    FROM therapists t
    LEFT JOIN practice_members pm ON pm.therapist_id = t.id AND pm.status = 'active'
    LEFT JOIN practices p ON p.id = t.primary_practice_id
    WHERE t.id = p_therapist_id;

    -- No practice = therapist wallet
    IF v_practice_id IS NULL THEN
        RETURN 'therapist_wallet';
    END IF;

    -- Use member-specific routing if set, otherwise practice default
    RETURN COALESCE(v_member_routing, v_practice_routing, 'therapist_wallet');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON COLUMN practices.booking_mode IS 'How clients book: direct to therapist, practice assigns, or hybrid';
COMMENT ON COLUMN practices.payout_routing IS 'Default payout destination for practice bookings';
COMMENT ON COLUMN practices.default_commission_rate IS 'Practice commission % from therapist earnings';
COMMENT ON COLUMN practice_members.payout_routing IS 'Override payout routing for this member';
COMMENT ON COLUMN practice_members.is_accepting_direct_bookings IS 'Whether this therapist accepts direct client bookings';
COMMENT ON COLUMN practice_members.is_available_for_assignment IS 'Whether practice can assign bookings to this therapist';
COMMENT ON COLUMN bookings.practice_id IS 'Practice that this booking is associated with';
COMMENT ON COLUMN bookings.assigned_by IS 'User who assigned the therapist (for practice_assigns mode)';
COMMENT ON COLUMN bookings.practice_commission_cents IS 'Practice commission deducted from therapist payout';
