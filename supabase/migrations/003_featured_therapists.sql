-- Add featured listing columns to therapists table
-- These columns allow therapists to be highlighted in search results

-- Add is_featured flag
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add featured_until timestamp for time-limited featured status
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Create index for efficient featured queries
CREATE INDEX IF NOT EXISTS idx_therapists_featured
ON therapists(is_featured, featured_until)
WHERE is_featured = true;

-- Add RLS policy for featured columns (therapists can read but not write)
-- Writing is handled by the featured purchase action

COMMENT ON COLUMN therapists.is_featured IS 'Whether this therapist is currently featured in search results';
COMMENT ON COLUMN therapists.featured_until IS 'When the featured status expires';
