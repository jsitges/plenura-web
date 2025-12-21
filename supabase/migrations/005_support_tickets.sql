-- Support Tickets table for Camino CRM integration
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,

    -- Ticket info
    category TEXT NOT NULL CHECK (category IN ('booking', 'payment', 'account', 'therapist', 'technical', 'feedback', 'other')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),

    -- Related entities
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    -- Camino sync
    camino_ticket_id TEXT,
    camino_sync_status TEXT DEFAULT 'pending' CHECK (camino_sync_status IN ('pending', 'synced', 'failed')),
    camino_error TEXT,

    -- Source tracking
    source TEXT NOT NULL DEFAULT 'plenura',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_camino_sync ON support_tickets(camino_sync_status) WHERE camino_sync_status != 'synced';

-- RLS policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
    ON support_tickets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Anyone can create tickets (even anonymous)
CREATE POLICY "Anyone can create tickets"
    ON support_tickets FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Users can update their own tickets (e.g., add more info)
CREATE POLICY "Users can update own tickets"
    ON support_tickets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_ticket_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_timestamp();

-- Comment
COMMENT ON TABLE support_tickets IS 'Support tickets that sync with Camino CRM';
