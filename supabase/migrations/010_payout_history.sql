-- Migration: Add payout history tracking
-- This table records all payouts from Colectiva to therapists

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    colectiva_payout_id TEXT NOT NULL UNIQUE,
    amount_cents INT NOT NULL,
    currency TEXT DEFAULT 'MXN',
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method TEXT, -- 'bank_transfer', 'instant', etc.
    bank_account_last_four TEXT,
    notes TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster therapist lookups
CREATE INDEX IF NOT EXISTS idx_payouts_therapist_id ON payouts(therapist_id);
CREATE INDEX IF NOT EXISTS idx_payouts_processed_at ON payouts(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_colectiva_id ON payouts(colectiva_payout_id);

-- RLS policies for payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Therapists can view their own payouts
CREATE POLICY "Therapists can view own payouts"
    ON payouts FOR SELECT
    USING (
        therapist_id IN (
            SELECT id FROM therapists WHERE user_id = auth.uid()
        )
    );

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
    ON payouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only service role can insert payouts (from webhooks)
CREATE POLICY "Service role can insert payouts"
    ON payouts FOR INSERT
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE payouts IS 'Records of completed payouts from Colectiva to therapists';
COMMENT ON COLUMN payouts.colectiva_payout_id IS 'Unique payout ID from Colectiva';
COMMENT ON COLUMN payouts.amount_cents IS 'Amount paid out in cents (MXN)';
COMMENT ON COLUMN payouts.payout_method IS 'Method used: bank_transfer, instant, etc.';

-- Admin disputes table for tracking payment disputes
CREATE TABLE IF NOT EXISTS admin_disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    colectiva_dispute_id TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved_for_client', 'resolved_for_therapist', 'closed')),
    reason TEXT,
    resolution_notes TEXT,
    assigned_to UUID REFERENCES users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dispute lookups
CREATE INDEX IF NOT EXISTS idx_admin_disputes_booking_id ON admin_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_disputes_status ON admin_disputes(status);

-- RLS policies for disputes
ALTER TABLE admin_disputes ENABLE ROW LEVEL SECURITY;

-- Only admins can view disputes
CREATE POLICY "Admins can view disputes"
    ON admin_disputes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update disputes
CREATE POLICY "Admins can update disputes"
    ON admin_disputes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role can insert disputes (from webhooks)
CREATE POLICY "Service role can insert disputes"
    ON admin_disputes FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE admin_disputes IS 'Tracks payment disputes requiring admin resolution';
COMMENT ON COLUMN admin_disputes.assigned_to IS 'Admin user assigned to resolve this dispute';
