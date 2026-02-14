-- Migration: Add smart schedule grouping to therapists
-- This feature allows therapists to enable intelligent appointment grouping
-- to avoid inefficient gaps in their schedule.

-- Add smart_schedule_grouping column to therapists table
ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS smart_schedule_grouping BOOLEAN DEFAULT false;

-- Add comment explaining the feature
COMMENT ON COLUMN therapists.smart_schedule_grouping IS
'When enabled, the booking system will only show time slots adjacent to existing bookings,
to group appointments efficiently and avoid gaps in the schedule.';
