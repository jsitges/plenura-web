-- Client Wallets for Plenura
-- Tracks client balances for referral credits, promotional credits, and deposits

-- Create client_wallets table
CREATE TABLE IF NOT EXISTS client_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    colectiva_wallet_id TEXT,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    referral_credits_cents INTEGER NOT NULL DEFAULT 0,
    promotional_credits_cents INTEGER NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES client_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'payment', 'referral_credit', 'promo_credit', 'refund')),
    amount_cents INTEGER NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    colectiva_transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_wallets_user_id ON client_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

-- Enable RLS
ALTER TABLE client_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_wallets
CREATE POLICY "Users can view their own wallet"
    ON client_wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet"
    ON client_wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
    ON client_wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
    ON wallet_transactions FOR SELECT
    USING (
        wallet_id IN (
            SELECT id FROM client_wallets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transactions for their wallet"
    ON wallet_transactions FOR INSERT
    WITH CHECK (
        wallet_id IN (
            SELECT id FROM client_wallets WHERE user_id = auth.uid()
        )
    );

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access wallets"
    ON client_wallets FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access transactions"
    ON wallet_transactions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_client_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_wallets_updated_at
    BEFORE UPDATE ON client_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_client_wallet_updated_at();
