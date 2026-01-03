-- Video Sessions for Online Therapy
-- Enables therapists to offer remote video consultations via JaaS (Jitsi as a Service)

-- Add online_video to service_modality enum
ALTER TYPE service_modality ADD VALUE IF NOT EXISTS 'online_video';

-- Add offers_online_video to therapists
ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS offers_online_video BOOLEAN DEFAULT false;

-- Create video_sessions table
CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- JaaS room details
    room_name TEXT NOT NULL UNIQUE,
    room_password TEXT, -- Optional additional security

    -- Session timing
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Status tracking
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled',    -- Room created, waiting for session time
        'waiting',      -- One participant joined, waiting for other
        'active',       -- Both participants in session
        'completed',    -- Session ended normally
        'missed',       -- No one joined within grace period
        'cancelled'     -- Session cancelled before start
    )),

    -- Participant tracking
    therapist_joined_at TIMESTAMPTZ,
    client_joined_at TIMESTAMPTZ,
    therapist_left_at TIMESTAMPTZ,
    client_left_at TIMESTAMPTZ,

    -- Session metadata
    duration_seconds INT, -- Calculated on completion
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT, -- If recording is enabled (paid tier)

    -- Quality tracking (updated by client-side metrics)
    connection_quality_therapist TEXT CHECK (connection_quality_therapist IN ('excellent', 'good', 'fair', 'poor')),
    connection_quality_client TEXT CHECK (connection_quality_client IN ('excellent', 'good', 'fair', 'poor')),

    -- Notes
    therapist_session_notes TEXT, -- Post-session clinical notes (private to therapist)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_video_sessions_booking ON video_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON video_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_video_sessions_status ON video_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_sessions_scheduled ON video_sessions(scheduled_start);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS video_sessions_updated_at ON video_sessions;
CREATE TRIGGER video_sessions_updated_at
    BEFORE UPDATE ON video_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Therapists can view their video sessions
CREATE POLICY "Therapists can view own video sessions"
ON video_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN therapists t ON t.id = b.therapist_id
        WHERE b.id = video_sessions.booking_id
        AND t.user_id = auth.uid()
    )
);

-- Therapists can update their video sessions (notes, status)
CREATE POLICY "Therapists can update own video sessions"
ON video_sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN therapists t ON t.id = b.therapist_id
        WHERE b.id = video_sessions.booking_id
        AND t.user_id = auth.uid()
    )
);

-- Clients can view their video sessions
CREATE POLICY "Clients can view own video sessions"
ON video_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = video_sessions.booking_id
        AND b.client_id = auth.uid()
    )
);

-- Clients can update their video sessions (join times, quality)
CREATE POLICY "Clients can update own video sessions"
ON video_sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = video_sessions.booking_id
        AND b.client_id = auth.uid()
    )
);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access to video sessions"
ON video_sessions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add index on therapists.offers_online_video for filtering
CREATE INDEX IF NOT EXISTS idx_therapists_offers_online_video
ON therapists(offers_online_video)
WHERE offers_online_video = true;

-- Comment for documentation
COMMENT ON TABLE video_sessions IS 'Tracks video therapy sessions conducted via JaaS (Jitsi as a Service). Each session is linked to a booking with online_video modality.';
COMMENT ON COLUMN video_sessions.room_name IS 'Unique JaaS room identifier. Format: plenura-{booking_short_id}-{random}';
COMMENT ON COLUMN video_sessions.therapist_session_notes IS 'Private clinical notes written by therapist after session. Not visible to client.';
