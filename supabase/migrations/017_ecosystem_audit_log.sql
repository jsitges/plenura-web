-- ============================================================================
-- ECOSYSTEM AUDIT LOG
-- Tracks all admin access and ecosystem operations for security compliance
-- ============================================================================

-- Audit log table
CREATE TABLE IF NOT EXISTS ecosystem_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event identification
    event_type TEXT NOT NULL,  -- 'admin.lookup', 'admin.impersonation', 'webhook.received', etc.
    event_id TEXT UNIQUE,      -- Idempotency key for webhooks

    -- Actor information
    actor_type TEXT NOT NULL,  -- 'admin', 'app', 'system', 'user'
    actor_id TEXT,             -- User ID, app ID, or admin ID
    actor_email TEXT,
    actor_ip TEXT,

    -- Target information
    target_type TEXT,          -- 'therapist', 'practice', 'user', 'booking'
    target_id TEXT,
    target_app TEXT,           -- 'plenura' for local, or source app for webhooks

    -- Request details
    action TEXT NOT NULL,      -- 'lookup', 'impersonate', 'sync', etc.
    outcome TEXT NOT NULL,     -- 'success', 'failure', 'denied'

    -- Context
    ecosystem_org_id TEXT,
    session_id TEXT,           -- For impersonation sessions

    -- Metadata
    metadata JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON ecosystem_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON ecosystem_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_id ON ecosystem_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON ecosystem_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ecosystem_org ON ecosystem_audit_log(ecosystem_org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_session ON ecosystem_audit_log(session_id) WHERE session_id IS NOT NULL;

-- Enable RLS
ALTER TABLE ecosystem_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON ecosystem_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Service role can insert (for server-side logging)
CREATE POLICY "Service role can insert audit logs"
ON ecosystem_audit_log FOR INSERT
WITH CHECK (true);

-- Comment
COMMENT ON TABLE ecosystem_audit_log IS 'Security audit trail for ecosystem operations including admin access';
