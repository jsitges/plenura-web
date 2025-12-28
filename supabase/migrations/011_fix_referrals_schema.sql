-- Migration: Fix referrals table schema to match TypeScript types
-- Aligns database column names with the code expectations

-- Add missing columns that the TypeScript types expect
ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'cancelled')),
    ADD COLUMN IF NOT EXISTS reward_paid_cents INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Rename referrer_code_id to referral_code_id (to match TypeScript types)
-- First, check if the column exists with the old name and rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'referrals' AND column_name = 'referrer_code_id'
    ) THEN
        ALTER TABLE referrals RENAME COLUMN referrer_code_id TO referral_code_id;
    END IF;
END
$$;

-- Update the index to use the new column name
DROP INDEX IF EXISTS idx_referrals_referrer;
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code_id);

-- Update RLS policy to use the new column name
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;

CREATE POLICY "Users can read own referrals"
    ON referrals FOR SELECT
    USING (
        referred_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM referral_codes
            WHERE id = referrals.referral_code_id
            AND user_id = auth.uid()
        )
    );

-- Migrate data from old columns to new if they exist
DO $$
BEGIN
    -- If converted_at has values, use it to set completed_at and status
    UPDATE referrals
    SET completed_at = converted_at,
        status = CASE
            WHEN converted_at IS NOT NULL THEN 'completed'
            ELSE 'pending'
        END
    WHERE status IS NULL OR status = 'pending';

    -- If referrer_reward_paid is true, mark as completed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'referrals' AND column_name = 'referrer_reward_paid'
    ) THEN
        UPDATE referrals
        SET status = 'completed'
        WHERE referrer_reward_paid = true;
    END IF;
END
$$;

-- Add comments
COMMENT ON COLUMN referrals.status IS 'pending = awaiting first booking, completed = reward paid, cancelled = referral invalidated';
COMMENT ON COLUMN referrals.reward_paid_cents IS 'Amount paid to referrer in cents (MXN)';
COMMENT ON COLUMN referrals.completed_at IS 'When the referral was completed and reward was paid';
