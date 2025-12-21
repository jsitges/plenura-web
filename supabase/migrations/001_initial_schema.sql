-- Plenura 2.0 Database Schema
-- Based on PLENURA_2.0_ARCHITECTURE.md

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('client', 'therapist', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE vetting_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business', 'enterprise');
CREATE TYPE service_modality AS ENUM ('home_visit', 'studio_visit', 'neutral_location');
CREATE TYPE trust_level AS ENUM ('new', 'verified', 'gold');

-- =============================================================================
-- USERS (extends Supabase Auth)
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'client',
    locale TEXT DEFAULT 'es',
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- THERAPISTS
-- =============================================================================

CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    years_of_experience INT,
    certification_details JSONB DEFAULT '[]',

    -- Location (PostGIS)
    location GEOGRAPHY(POINT, 4326),
    service_radius_km DECIMAL(5,2) DEFAULT 15.0,
    offers_home_visit BOOLEAN DEFAULT true,
    offers_studio_visit BOOLEAN DEFAULT false,
    studio_address TEXT,
    studio_location GEOGRAPHY(POINT, 4326),

    -- Ratings
    rating_avg DECIMAL(2,1) DEFAULT 0.0,
    rating_count INT DEFAULT 0,

    -- Status
    vetting_status vetting_status DEFAULT 'pending',
    is_available BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'America/Mexico_City',
    trust_level trust_level DEFAULT 'new',

    -- Integrations
    colectiva_wallet_id TEXT,
    camino_contact_id TEXT,

    -- Subscription
    subscription_tier subscription_tier DEFAULT 'free',
    monthly_booking_count INT DEFAULT 0,
    monthly_booking_reset_at TIMESTAMPTZ,

    -- Distance pricing
    distance_pricing JSONB DEFAULT '{
        "included_km": 5,
        "tiers": [
            {"min_km": 5, "max_km": 10, "fee_cents": 5000},
            {"min_km": 10, "max_km": 15, "fee_cents": 10000},
            {"min_km": 15, "max_km": 25, "per_km_cents": 500}
        ]
    }',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_therapists_location ON therapists USING GIST (location);
CREATE INDEX idx_therapists_studio_location ON therapists USING GIST (studio_location);
CREATE INDEX idx_therapists_user_id ON therapists(user_id);
CREATE INDEX idx_therapists_vetting_status ON therapists(vetting_status);

-- =============================================================================
-- CATEGORIES & SERVICES
-- =============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_es TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_es TEXT NOT NULL,
    description TEXT,
    description_es TEXT,
    default_duration_minutes INT DEFAULT 60,
    default_price_cents INT DEFAULT 80000, -- $800 MXN
    is_active BOOLEAN DEFAULT true,
    requires_multiple_therapists BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_name_trgm ON services USING gin(name gin_trgm_ops);
CREATE INDEX idx_services_name_es_trgm ON services USING gin(name_es gin_trgm_ops);

-- =============================================================================
-- THERAPIST SERVICES (Many-to-Many with custom pricing)
-- =============================================================================

CREATE TABLE therapist_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    price_cents INT NOT NULL,
    duration_minutes INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(therapist_id, service_id)
);

CREATE INDEX idx_therapist_services_therapist ON therapist_services(therapist_id);
CREATE INDEX idx_therapist_services_service ON therapist_services(service_id);

-- =============================================================================
-- AVAILABILITY
-- =============================================================================

CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_availability_therapist ON availability(therapist_id);
CREATE INDEX idx_availability_day ON availability(day_of_week);

-- =============================================================================
-- BOOKINGS
-- =============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    therapist_service_id UUID NOT NULL REFERENCES therapist_services(id),

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NOT NULL,

    -- Status
    status booking_status DEFAULT 'pending',

    -- Pricing
    price_cents INT NOT NULL,
    commission_cents INT NOT NULL DEFAULT 0,
    therapist_payout_cents INT NOT NULL DEFAULT 0,
    distance_km DECIMAL(5,2),
    distance_fee_cents INT DEFAULT 0,

    -- Location
    service_modality service_modality DEFAULT 'home_visit',
    client_address TEXT,
    client_location GEOGRAPHY(POINT, 4326),

    -- Notes
    notes TEXT,
    therapist_notes TEXT, -- Private to therapist

    -- Tracking
    source TEXT DEFAULT 'plenura_web', -- plenura_web, plenura_app, camino, api_partner
    referral_code_used TEXT,

    -- Payment
    escrow_id TEXT, -- Colectiva escrow reference
    escrow_status TEXT DEFAULT 'pending',
    escrow_released_at TIMESTAMPTZ,

    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent double-booking with exclusion constraint
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
    therapist_id WITH =,
    tstzrange(scheduled_at, scheduled_end_at, '[)') WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show'));

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_therapist ON bookings(therapist_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_bookings_escrow ON bookings(escrow_id);

-- =============================================================================
-- REVIEWS
-- =============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    therapist_response TEXT,
    therapist_responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_therapist ON reviews(therapist_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Trigger to update therapist rating
CREATE OR REPLACE FUNCTION update_therapist_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE therapists
    SET
        rating_avg = (
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM reviews
            WHERE therapist_id = NEW.therapist_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE therapist_id = NEW.therapist_id
        ),
        updated_at = NOW()
    WHERE id = NEW.therapist_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_therapist_rating();

-- =============================================================================
-- TIPS
-- =============================================================================

CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    client_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    amount_cents INT NOT NULL,
    plenura_fee_cents INT DEFAULT 0,
    therapist_amount_cents INT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tips_therapist ON tips(therapist_id, created_at);
CREATE INDEX idx_tips_booking ON tips(booking_id);

-- =============================================================================
-- REFERRAL SYSTEM
-- =============================================================================

CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    reward_amount_cents INT DEFAULT 10000, -- $100 MXN
    uses_count INT DEFAULT 0,
    max_uses INT, -- NULL = unlimited
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_code_id UUID NOT NULL REFERENCES referral_codes(id),
    referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    signup_at TIMESTAMPTZ DEFAULT NOW(),
    first_booking_id UUID REFERENCES bookings(id),
    converted_at TIMESTAMPTZ,
    referrer_reward_paid BOOLEAN DEFAULT false,
    referred_reward_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_code_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);

-- =============================================================================
-- FAVORITES
-- =============================================================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, therapist_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_therapist ON favorites(therapist_id);

-- =============================================================================
-- FEATURED LISTINGS (Ads)
-- =============================================================================

CREATE TABLE featured_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_id UUID NOT NULL REFERENCES therapists(id),
    listing_type TEXT NOT NULL, -- 'local', 'category', 'super', 'boost'
    bid_amount_cents INT,
    zone_id TEXT, -- Geographic zone
    category_slug TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    bookings_generated INT DEFAULT 0,
    status TEXT DEFAULT 'active',
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_featured_active ON featured_listings(zone_id, category_slug, status, ends_at)
WHERE status = 'active' AND ends_at > NOW();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Search therapists nearby
CREATE OR REPLACE FUNCTION search_therapists_nearby(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 15.0,
    p_category_slug TEXT DEFAULT NULL,
    p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    rating_avg DECIMAL,
    rating_count INT,
    distance_km DOUBLE PRECISION,
    min_price_cents INT,
    services JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.user_id,
        u.full_name,
        u.avatar_url,
        t.bio,
        t.rating_avg,
        t.rating_count,
        ST_Distance(
            t.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1000 AS distance_km,
        MIN(ts.price_cents) AS min_price_cents,
        jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'name_es', s.name_es,
                'price_cents', ts.price_cents,
                'duration_minutes', ts.duration_minutes
            )
        ) AS services
    FROM therapists t
    INNER JOIN users u ON u.id = t.user_id
    INNER JOIN therapist_services ts ON ts.therapist_id = t.id AND ts.is_active = true
    INNER JOIN services s ON s.id = ts.service_id AND s.is_active = true
    LEFT JOIN categories c ON c.id = s.category_id
    WHERE
        t.vetting_status = 'approved'
        AND t.is_available = true
        AND ST_DWithin(
            t.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_km * 1000
        )
        AND (p_category_slug IS NULL OR c.slug = p_category_slug)
        AND (p_service_id IS NULL OR s.id = p_service_id)
    GROUP BY t.id, t.user_id, u.full_name, u.avatar_url, t.bio, t.rating_avg, t.rating_count, t.location
    ORDER BY t.rating_avg DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Calculate distance fee for booking
CREATE OR REPLACE FUNCTION calculate_distance_fee(
    therapist_uuid UUID,
    client_lat DOUBLE PRECISION,
    client_lng DOUBLE PRECISION
)
RETURNS TABLE (distance_km DECIMAL, fee_cents INT) AS $$
DECLARE
    t_location GEOGRAPHY;
    dist DECIMAL;
    pricing JSONB;
    included_km DECIMAL;
    tier JSONB;
    fee INT := 0;
BEGIN
    SELECT location, distance_pricing INTO t_location, pricing
    FROM therapists WHERE id = therapist_uuid;

    IF t_location IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL, 0;
        RETURN;
    END IF;

    dist := ST_Distance(
        t_location,
        ST_SetSRID(ST_MakePoint(client_lng, client_lat), 4326)::geography
    ) / 1000;

    included_km := (pricing->>'included_km')::DECIMAL;

    IF dist <= included_km THEN
        RETURN QUERY SELECT dist, 0;
        RETURN;
    END IF;

    FOR tier IN SELECT * FROM jsonb_array_elements(pricing->'tiers')
    LOOP
        IF dist >= (tier->>'min_km')::DECIMAL AND dist < (tier->>'max_km')::DECIMAL THEN
            IF tier ? 'fee_cents' THEN
                fee := (tier->>'fee_cents')::INT;
            ELSIF tier ? 'per_km_cents' THEN
                fee := ((dist - (tier->>'min_km')::DECIMAL) * (tier->>'per_km_cents')::INT)::INT;
            END IF;
            EXIT;
        END IF;
    END LOOP;

    RETURN QUERY SELECT dist, fee;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default categories
INSERT INTO categories (name, name_es, slug, icon, sort_order) VALUES
('Massage Therapy', 'Terapia de Masaje', 'massage', '💆', 1),
('Physiotherapy', 'Fisioterapia', 'physiotherapy', '🏃', 2),
('Psychology', 'Psicología', 'psychology', '🧠', 3),
('Nutrition', 'Nutrición', 'nutrition', '🥗', 4),
('Yoga & Meditation', 'Yoga y Meditación', 'yoga', '🧘', 5),
('Spa & Beauty', 'Spa y Belleza', 'spa', '🛁', 6);

-- Insert default services
INSERT INTO services (category_id, name, name_es, description, description_es, default_duration_minutes, default_price_cents) VALUES
-- Massage
((SELECT id FROM categories WHERE slug = 'massage'), 'Swedish Relaxation Massage', 'Masaje Sueco de Relajación',
 'A gentle full-body massage perfect for stress relief and relaxation',
 'Un masaje suave de cuerpo completo perfecto para aliviar el estrés y la relajación', 60, 80000),
((SELECT id FROM categories WHERE slug = 'massage'), 'Deep Tissue Massage', 'Masaje de Tejido Profundo',
 'Focuses on deeper layers of muscle and connective tissue. Ideal for chronic pain',
 'Se enfoca en las capas más profundas del músculo y tejido conectivo. Ideal para dolores crónicos', 60, 90000),
((SELECT id FROM categories WHERE slug = 'massage'), 'Sports Massage', 'Masaje Deportivo',
 'Targets areas overused and stressed from repetitive movements',
 'Se enfoca en áreas sobreusadas y estresadas por movimientos repetitivos', 60, 95000),
((SELECT id FROM categories WHERE slug = 'massage'), 'Couples Massage', 'Masaje en Pareja',
 'Two therapists work simultaneously on you and your partner',
 'Dos terapeutas trabajan simultáneamente en ti y tu pareja', 60, 160000),

-- Physiotherapy
((SELECT id FROM categories WHERE slug = 'physiotherapy'), 'Physical Therapy Session', 'Sesión de Fisioterapia',
 'Assessment and treatment for injuries and physical conditions',
 'Evaluación y tratamiento para lesiones y condiciones físicas', 60, 100000),
((SELECT id FROM categories WHERE slug = 'physiotherapy'), 'Sports Rehabilitation', 'Rehabilitación Deportiva',
 'Specialized recovery for sports injuries',
 'Recuperación especializada para lesiones deportivas', 60, 110000),

-- Psychology
((SELECT id FROM categories WHERE slug = 'psychology'), 'Individual Therapy', 'Terapia Individual',
 'One-on-one session with a licensed psychologist',
 'Sesión individual con un psicólogo licenciado', 50, 120000),
((SELECT id FROM categories WHERE slug = 'psychology'), 'Couples Counseling', 'Consejería de Parejas',
 'Therapy session for couples to improve communication',
 'Sesión de terapia para parejas para mejorar la comunicación', 60, 150000),

-- Nutrition
((SELECT id FROM categories WHERE slug = 'nutrition'), 'Nutrition Consultation', 'Consulta de Nutrición',
 'Personalized dietary assessment and meal planning',
 'Evaluación dietética personalizada y planificación de comidas', 45, 80000),

-- Yoga
((SELECT id FROM categories WHERE slug = 'yoga'), 'Private Yoga Session', 'Sesión Privada de Yoga',
 'One-on-one yoga instruction tailored to your level',
 'Instrucción de yoga individual adaptada a tu nivel', 60, 70000),
((SELECT id FROM categories WHERE slug = 'yoga'), 'Meditation & Mindfulness', 'Meditación y Mindfulness',
 'Guided meditation and mindfulness practice',
 'Práctica guiada de meditación y mindfulness', 45, 60000);
