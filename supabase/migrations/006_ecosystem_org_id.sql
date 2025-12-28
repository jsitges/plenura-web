-- Add ecosystem_org_id column to therapists table
-- This links therapists to the RBS ecosystem for cross-app SSO and management

ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS ecosystem_org_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_therapists_ecosystem_org_id ON therapists(ecosystem_org_id);

-- Add comment for documentation
COMMENT ON COLUMN therapists.ecosystem_org_id IS 'Colectiva ecosystem organization ID for cross-app SSO';
