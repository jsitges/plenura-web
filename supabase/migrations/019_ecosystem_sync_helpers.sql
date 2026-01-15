-- ============================================================================
-- ECOSYSTEM SYNC QUEUE HELPERS
-- Helper functions for the ecosystem sync queue processor
-- ============================================================================

-- Function to increment sync attempts atomically
CREATE OR REPLACE FUNCTION increment_sync_attempts(queue_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE ecosystem_sync_queue
    SET
        attempts = attempts + 1,
        last_attempt_at = NOW()
    WHERE id = queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset stuck items (in processing for more than 10 minutes)
CREATE OR REPLACE FUNCTION reset_stuck_sync_items()
RETURNS TABLE (reset_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH updated AS (
        UPDATE ecosystem_sync_queue
        SET status = 'pending'
        WHERE status = 'processing'
          AND last_attempt_at < NOW() - INTERVAL '10 minutes'
        RETURNING id
    )
    SELECT COUNT(*) FROM updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for monitoring sync queue status
CREATE OR REPLACE VIEW ecosystem_sync_stats AS
SELECT
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item,
    AVG(attempts) as avg_attempts
FROM ecosystem_sync_queue
GROUP BY status;

COMMENT ON VIEW ecosystem_sync_stats IS 'Quick overview of ecosystem sync queue status';

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_sync_attempts TO service_role;
GRANT EXECUTE ON FUNCTION reset_stuck_sync_items TO service_role;
GRANT SELECT ON ecosystem_sync_stats TO service_role;
