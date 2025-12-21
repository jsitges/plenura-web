-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role (required for pg_cron)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- Booking Reminders Cron Job (runs every hour)
-- ============================================

-- Function to send booking reminders via HTTP
-- Note: Update the URL if deploying to a different domain
CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://plenura.redbroomsoftware.com/api/cron/reminders',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
END;
$$;

-- Schedule: Run every hour at minute 0
SELECT cron.schedule(
    'send-booking-reminders',
    '0 * * * *',
    'SELECT send_booking_reminders()'
);

-- ============================================
-- Weekly Reports Cron Job (Mondays at 9 AM UTC)
-- ============================================

-- Function to send weekly reports via HTTP
CREATE OR REPLACE FUNCTION send_weekly_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://plenura.redbroomsoftware.com/api/cron/weekly-reports',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
END;
$$;

-- Schedule: Run every Monday at 9 AM UTC (15:00 in Mexico City during winter)
SELECT cron.schedule(
    'send-weekly-reports',
    '0 15 * * 1',
    'SELECT send_weekly_reports()'
);

-- ============================================
-- Cleanup job for cron history (prevents table bloat)
-- ============================================

-- Function to clean up old cron job run details
CREATE OR REPLACE FUNCTION cleanup_cron_history()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM cron.job_run_details
    WHERE end_time < NOW() - INTERVAL '7 days';
$$;

-- Schedule: Run daily at 3 AM UTC
SELECT cron.schedule(
    'cleanup-cron-history',
    '0 3 * * *',
    'SELECT cleanup_cron_history()'
);

-- ============================================
-- Featured therapists expiration check
-- ============================================

-- Function to expire featured therapists
CREATE OR REPLACE FUNCTION expire_featured_therapists()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE therapists
    SET is_featured = false
    WHERE is_featured = true
      AND featured_until IS NOT NULL
      AND featured_until < NOW();
$$;

-- Schedule: Run every hour
SELECT cron.schedule(
    'expire-featured-therapists',
    '0 * * * *',
    'SELECT expire_featured_therapists()'
);

-- ============================================
-- Monthly booking count reset
-- ============================================

-- Function to reset monthly booking counts (for subscription tier limits)
CREATE OR REPLACE FUNCTION reset_monthly_booking_counts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE therapists
    SET monthly_booking_count = 0;
$$;

-- Schedule: Run on the 1st of each month at midnight UTC
SELECT cron.schedule(
    'reset-monthly-booking-counts',
    '0 0 1 * *',
    'SELECT reset_monthly_booking_counts()'
);

-- ============================================
-- View to check scheduled jobs
-- ============================================
-- ============================================
-- Keep-alive ping (prevents free tier pause)
-- ============================================

-- Simple function to generate database activity
CREATE OR REPLACE FUNCTION keep_alive()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 1;
$$;

-- Schedule: Run every 3 days at noon UTC (safety margin before 7-day limit)
SELECT cron.schedule(
    'keep-alive-ping',
    '0 12 */3 * *',
    'SELECT keep_alive()'
);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON FUNCTION send_booking_reminders() IS 'Sends booking reminders 24h and 1h before appointments';
COMMENT ON FUNCTION send_weekly_reports() IS 'Sends weekly performance reports to therapists';
COMMENT ON FUNCTION cleanup_cron_history() IS 'Cleans up cron job history older than 7 days';
COMMENT ON FUNCTION expire_featured_therapists() IS 'Expires featured status for therapists past their featured_until date';
COMMENT ON FUNCTION reset_monthly_booking_counts() IS 'Resets monthly booking counts on the 1st of each month';
COMMENT ON FUNCTION keep_alive() IS 'Prevents free tier project from pausing due to inactivity';
