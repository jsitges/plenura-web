-- Add table for blocked periods (vacations, days off)
CREATE TABLE blocked_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    reason TEXT, -- Optional description (e.g., "Vacation", "Personal day")

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE INDEX idx_blocked_periods_therapist ON blocked_periods(therapist_id);
CREATE INDEX idx_blocked_periods_dates ON blocked_periods(start_date, end_date);

-- Update trigger for updated_at
CREATE TRIGGER update_blocked_periods_updated_at
    BEFORE UPDATE ON blocked_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
