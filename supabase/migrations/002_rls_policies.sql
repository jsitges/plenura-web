-- Plenura 2.0 Row Level Security Policies
-- Enable RLS on all tables

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS
-- =============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can read all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- THERAPISTS
-- =============================================================================

-- Anyone can read approved therapists (for public profiles)
CREATE POLICY "Anyone can read approved therapists"
    ON therapists FOR SELECT
    USING (vetting_status = 'approved' AND is_available = true);

-- Therapists can read their own profile (any status)
CREATE POLICY "Therapists can read own profile"
    ON therapists FOR SELECT
    USING (user_id = auth.uid());

-- Therapists can update their own profile
CREATE POLICY "Therapists can update own profile"
    ON therapists FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Therapists can insert their own profile
CREATE POLICY "Therapists can insert own profile"
    ON therapists FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all therapists
CREATE POLICY "Admins can manage all therapists"
    ON therapists FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- CATEGORIES & SERVICES (Public read)
-- =============================================================================

-- Anyone can read categories
CREATE POLICY "Anyone can read categories"
    ON categories FOR SELECT
    USING (true);

-- Anyone can read active services
CREATE POLICY "Anyone can read services"
    ON services FOR SELECT
    USING (is_active = true);

-- =============================================================================
-- THERAPIST SERVICES
-- =============================================================================

-- Anyone can read therapist services for approved therapists
CREATE POLICY "Anyone can read therapist services"
    ON therapist_services FOR SELECT
    USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = therapist_services.therapist_id
            AND vetting_status = 'approved'
        )
    );

-- Therapists can manage their own services
CREATE POLICY "Therapists can manage own services"
    ON therapist_services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = therapist_services.therapist_id
            AND user_id = auth.uid()
        )
    );

-- =============================================================================
-- AVAILABILITY
-- =============================================================================

-- Anyone can read availability for approved therapists
CREATE POLICY "Anyone can read therapist availability"
    ON availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = availability.therapist_id
            AND vetting_status = 'approved'
        )
    );

-- Therapists can manage their own availability
CREATE POLICY "Therapists can manage own availability"
    ON availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = availability.therapist_id
            AND user_id = auth.uid()
        )
    );

-- =============================================================================
-- BOOKINGS
-- =============================================================================

-- Clients can read their own bookings
CREATE POLICY "Clients can read own bookings"
    ON bookings FOR SELECT
    USING (client_id = auth.uid());

-- Therapists can read bookings assigned to them
CREATE POLICY "Therapists can read assigned bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = bookings.therapist_id
            AND user_id = auth.uid()
        )
    );

-- Authenticated users can create bookings
CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Clients can update their own pending bookings
CREATE POLICY "Clients can update own pending bookings"
    ON bookings FOR UPDATE
    USING (client_id = auth.uid() AND status = 'pending')
    WITH CHECK (client_id = auth.uid());

-- Therapists can update their assigned bookings (status, notes)
CREATE POLICY "Therapists can update assigned bookings"
    ON bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = bookings.therapist_id
            AND user_id = auth.uid()
        )
    );

-- =============================================================================
-- REVIEWS
-- =============================================================================

-- Anyone can read public reviews
CREATE POLICY "Anyone can read public reviews"
    ON reviews FOR SELECT
    USING (is_public = true);

-- Clients can create reviews for their completed bookings
CREATE POLICY "Clients can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = reviews.booking_id
            AND client_id = auth.uid()
            AND status = 'completed'
        )
    );

-- Therapists can respond to their reviews
CREATE POLICY "Therapists can respond to reviews"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = reviews.therapist_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = reviews.therapist_id
            AND user_id = auth.uid()
        )
    );

-- =============================================================================
-- TIPS
-- =============================================================================

-- Clients can read their own tips
CREATE POLICY "Clients can read own tips"
    ON tips FOR SELECT
    USING (client_id = auth.uid());

-- Therapists can read tips they received
CREATE POLICY "Therapists can read received tips"
    ON tips FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = tips.therapist_id
            AND user_id = auth.uid()
        )
    );

-- Clients can create tips for their completed bookings
CREATE POLICY "Clients can create tips"
    ON tips FOR INSERT
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = tips.booking_id
            AND client_id = auth.uid()
            AND status = 'completed'
        )
    );

-- =============================================================================
-- REFERRAL CODES
-- =============================================================================

-- Users can read their own referral codes
CREATE POLICY "Users can read own referral codes"
    ON referral_codes FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own referral codes
CREATE POLICY "Users can create own referral codes"
    ON referral_codes FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Anyone can look up a valid referral code (for applying)
CREATE POLICY "Anyone can lookup valid codes"
    ON referral_codes FOR SELECT
    USING (is_active = true);

-- =============================================================================
-- REFERRALS
-- =============================================================================

-- Users can read referrals they're involved in
CREATE POLICY "Users can read own referrals"
    ON referrals FOR SELECT
    USING (
        referred_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM referral_codes
            WHERE id = referrals.referrer_code_id
            AND user_id = auth.uid()
        )
    );

-- =============================================================================
-- FAVORITES
-- =============================================================================

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
    ON favorites FOR ALL
    USING (user_id = auth.uid());

-- =============================================================================
-- FEATURED LISTINGS
-- =============================================================================

-- Anyone can read active featured listings
CREATE POLICY "Anyone can read active featured listings"
    ON featured_listings FOR SELECT
    USING (status = 'active' AND ends_at > NOW());

-- Therapists can manage their own listings
CREATE POLICY "Therapists can manage own listings"
    ON featured_listings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM therapists
            WHERE id = featured_listings.therapist_id
            AND user_id = auth.uid()
        )
    );
