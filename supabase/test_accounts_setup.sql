-- ============================================================================
-- PLENURA TEST ACCOUNTS SETUP
-- Purpose: Create test accounts for troubleshooting therapist and practice scenarios
-- Run this in Supabase SQL Editor for project: vvbiriktnevlcjrejzoy
-- ============================================================================

-- IMPORTANT: You'll need to create auth.users manually via Supabase Dashboard first
-- Go to: Authentication > Users > Invite User or Add User
-- Then run this script to create profiles and relationships

-- ============================================================================
-- STEP 1: CREATE AUTH USERS (via Supabase Dashboard)
-- ============================================================================

-- Go to: https://supabase.com/dashboard/project/vvbiriktnevlcjrejzoy/auth/users
-- Create these users:
-- 1. test-therapist@redbroomsoftware.com (password: Test123!)
-- 2. test-clinic-owner@redbroomsoftware.com (password: Test123!)
-- 3. test-therapist-staff@redbroomsoftware.com (password: Test123!)

-- ============================================================================
-- STEP 2: CHECK IF AUTH USERS EXIST
-- ============================================================================

SELECT 'Checking for auth users...' as status;

SELECT
    id,
    email,
    created_at
FROM auth.users
WHERE email IN (
    'test-therapist@redbroomsoftware.com',
    'test-clinic-owner@redbroomsoftware.com',
    'test-therapist-staff@redbroomsoftware.com'
);

-- If no results, STOP and create auth users first!

-- ============================================================================
-- STEP 3: CREATE USER PROFILES
-- ============================================================================

-- Individual therapist profile
INSERT INTO users (id, email, full_name, phone, role)
SELECT
    au.id,
    'test-therapist@redbroomsoftware.com',
    'Maria Rodriguez (Test Therapist)',
    '+525512345001',
    'therapist'
FROM auth.users au
WHERE au.email = 'test-therapist@redbroomsoftware.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- Practice owner profile
INSERT INTO users (id, email, full_name, phone, role)
SELECT
    au.id,
    'test-clinic-owner@redbroomsoftware.com',
    'Dr. Carlos Mendez (Test Clinic Owner)',
    '+525512345002',
    'therapist'  -- Owner is also a therapist
FROM auth.users au
WHERE au.email = 'test-clinic-owner@redbroomsoftware.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- Staff therapist profile
INSERT INTO users (id, email, full_name, phone, role)
SELECT
    au.id,
    'test-therapist-staff@redbroomsoftware.com',
    'Ana Garcia (Test Staff Therapist)',
    '+525512345003',
    'therapist'
FROM auth.users au
WHERE au.email = 'test-therapist-staff@redbroomsoftware.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

-- ============================================================================
-- STEP 4: CREATE CATEGORIES & SERVICES (if not exist)
-- ============================================================================

-- Insert massage category
INSERT INTO categories (id, name, name_es, slug, icon, sort_order)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Massage',
    'Masaje',
    'massage',
    'spa',
    1
)
ON CONFLICT (slug) DO NOTHING;

-- Insert physical therapy category
INSERT INTO categories (id, name, name_es, slug, icon, sort_order)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Physical Therapy',
    'Fisioterapia',
    'physical-therapy',
    'activity',
    2
)
ON CONFLICT (slug) DO NOTHING;

-- Insert massage services
INSERT INTO services (category_id, name, name_es, description, description_es, default_duration_minutes, default_price_cents)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    service_data.name,
    service_data.name_es,
    service_data.description,
    service_data.description_es,
    service_data.duration,
    service_data.price
FROM (
    VALUES
        ('Swedish Massage', 'Masaje Sueco', 'Relaxing full-body massage', 'Masaje relajante de cuerpo completo', 60, 80000),
        ('Deep Tissue Massage', 'Masaje de Tejido Profundo', 'Therapeutic deep pressure massage', 'Masaje terapéutico de presión profunda', 90, 110000),
        ('Sports Massage', 'Masaje Deportivo', 'Massage for athletes and active individuals', 'Masaje para atletas y personas activas', 60, 90000)
) AS service_data(name, name_es, description, description_es, duration, price)
ON CONFLICT DO NOTHING;

-- Insert physical therapy services
INSERT INTO services (category_id, name, name_es, description, description_es, default_duration_minutes, default_price_cents)
SELECT
    '00000000-0000-0000-0000-000000000002'::uuid,
    service_data.name,
    service_data.name_es,
    service_data.description,
    service_data.description_es,
    service_data.duration,
    service_data.price
FROM (
    VALUES
        ('Physical Therapy Session', 'Sesión de Fisioterapia', 'Therapeutic exercise and treatment', 'Ejercicio terapéutico y tratamiento', 60, 90000),
        ('Sports Rehabilitation', 'Rehabilitación Deportiva', 'Recovery from sports injuries', 'Recuperación de lesiones deportivas', 60, 95000)
) AS service_data(name, name_es, description, description_es, duration, price)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 5: CREATE INDEPENDENT THERAPIST (Maria Rodriguez)
-- ============================================================================

-- Create therapist profile
INSERT INTO therapists (
    user_id,
    bio,
    years_of_experience,
    certification_details,
    location,
    service_radius_km,
    offers_home_visit,
    offers_studio_visit,
    studio_address,
    vetting_status,
    is_available,
    subscription_tier,
    verification_status,
    id_document_verified,
    license_verified,
    background_check_passed,
    is_independent
)
SELECT
    u.id,
    'Experienced massage therapist specializing in Swedish and deep tissue massage. 5+ years of experience helping clients relax and recover. [TEST ACCOUNT]',
    5,
    '[
        {"name": "Certified Massage Therapist", "issuer": "Mexican Association of Massage Therapists", "year": 2019},
        {"name": "Deep Tissue Specialist", "issuer": "International Massage Institute", "year": 2021}
    ]'::jsonb,
    ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography,  -- CDMX coords
    15.0,
    true,
    false,
    NULL,
    'approved',
    true,
    'pro',
    'fully_verified',
    true,
    true,
    true,
    true
FROM users u
WHERE u.email = 'test-therapist@redbroomsoftware.com'
ON CONFLICT (user_id) DO UPDATE SET
    vetting_status = 'approved',
    is_available = true,
    verification_status = 'fully_verified',
    id_document_verified = true,
    license_verified = true,
    background_check_passed = true,
    is_independent = true;

-- Add therapist services
INSERT INTO therapist_services (therapist_id, service_id, is_offered, custom_price_cents, custom_duration_minutes)
SELECT
    t.id,
    s.id,
    true,
    s.default_price_cents,
    s.default_duration_minutes
FROM therapists t
CROSS JOIN services s
WHERE t.user_id = (SELECT id FROM users WHERE email = 'test-therapist@redbroomsoftware.com')
    AND s.category_id = '00000000-0000-0000-0000-000000000001'::uuid  -- Massage services
ON CONFLICT (therapist_id, service_id) DO UPDATE SET
    is_offered = true;

-- ============================================================================
-- STEP 6: CREATE PRACTICE (Wellness Center Test Clinic)
-- ============================================================================

-- Create practice
INSERT INTO practices (
    name,
    description,
    business_type,
    tax_id,
    email,
    phone,
    address,
    city,
    state,
    postal_code,
    country,
    location,
    verification_status,
    verification_completed_at,
    subscription_tier,
    subscription_status
)
VALUES (
    'Wellness Center Test Clinic',
    'Full-service wellness center offering massage therapy, physical therapy, and holistic treatments. [TEST ACCOUNT]',
    'clinic',
    'XAXX010101000',  -- Test RFC
    'test-clinic-owner@redbroomsoftware.com',
    '+525555551234',
    'Av. Insurgentes Sur 1234, Del Valle',
    'Ciudad de México',
    'CDMX',
    '03100',
    'MX',
    ST_SetSRID(ST_MakePoint(-99.1638, 19.3910), 4326)::geography,  -- Del Valle coords
    'fully_verified',
    NOW(),
    'business',  -- Business tier
    'active'
)
ON CONFLICT DO NOTHING;

-- Create therapist profile for owner
INSERT INTO therapists (
    user_id,
    bio,
    years_of_experience,
    certification_details,
    location,
    service_radius_km,
    offers_home_visit,
    offers_studio_visit,
    studio_address,
    vetting_status,
    is_available,
    subscription_tier,
    verification_status,
    id_document_verified,
    license_verified,
    background_check_passed,
    is_independent,
    primary_practice_id
)
SELECT
    u.id,
    'Licensed physical therapist and wellness center owner. Specializing in sports rehabilitation and preventive care. [TEST ACCOUNT]',
    12,
    '[
        {"name": "Licensed Physical Therapist", "issuer": "UNAM", "year": 2013},
        {"name": "Sports Medicine Specialist", "issuer": "UNAM", "year": 2015}
    ]'::jsonb,
    p.location,
    0,  -- Doesn''t do home visits
    true,
    p.address,
    'approved',
    true,
    'business',
    'fully_verified',
    true,
    true,
    true,
    false,  -- Not independent, part of practice
    p.id
FROM users u
CROSS JOIN practices p
WHERE u.email = 'test-clinic-owner@redbroomsoftware.com'
    AND p.email = 'test-clinic-owner@redbroomsoftware.com'
ON CONFLICT (user_id) DO UPDATE SET
    vetting_status = 'approved',
    is_available = true,
    verification_status = 'fully_verified',
    is_independent = false;

-- Add owner as practice member
INSERT INTO practice_members (practice_id, user_id, therapist_id, role, title, hire_date, commission_rate, status, joined_at)
SELECT
    p.id,
    u.id,
    t.id,
    'owner',
    'Owner & Physical Therapist',
    CURRENT_DATE - INTERVAL '2 years',
    100.0,  -- Owner gets 100% after platform fees
    'active',
    NOW() - INTERVAL '2 years'
FROM practices p
JOIN users u ON u.email = 'test-clinic-owner@redbroomsoftware.com'
JOIN therapists t ON t.user_id = u.id
WHERE p.email = 'test-clinic-owner@redbroomsoftware.com'
ON CONFLICT (practice_id, user_id) DO UPDATE SET
    role = 'owner',
    status = 'active';

-- Add owner's services
INSERT INTO therapist_services (therapist_id, service_id, is_offered, custom_price_cents, custom_duration_minutes)
SELECT
    t.id,
    s.id,
    true,
    s.default_price_cents,
    s.default_duration_minutes
FROM therapists t
CROSS JOIN services s
WHERE t.user_id = (SELECT id FROM users WHERE email = 'test-clinic-owner@redbroomsoftware.com')
    AND s.category_id = '00000000-0000-0000-0000-000000000002'::uuid  -- Physical therapy services
ON CONFLICT (therapist_id, service_id) DO UPDATE SET
    is_offered = true;

-- ============================================================================
-- STEP 7: CREATE STAFF THERAPIST (Ana Garcia)
-- ============================================================================

-- Create therapist profile for staff
INSERT INTO therapists (
    user_id,
    bio,
    years_of_experience,
    certification_details,
    location,
    service_radius_km,
    offers_home_visit,
    offers_studio_visit,
    studio_address,
    vetting_status,
    is_available,
    subscription_tier,
    verification_status,
    id_document_verified,
    license_verified,
    background_check_passed,
    is_independent,
    primary_practice_id
)
SELECT
    u.id,
    'Physical therapist specializing in sports injuries and rehabilitation. Part of Wellness Center Test Clinic team. [TEST ACCOUNT]',
    8,
    '[
        {"name": "Licensed Physical Therapist", "issuer": "UNAM", "year": 2016},
        {"name": "Sports Rehabilitation Certified", "issuer": "UNAM", "year": 2018}
    ]'::jsonb,
    p.location,
    0,  -- Works only at clinic
    false,
    true,
    p.address,
    'approved',
    true,
    'business',
    'fully_verified',
    true,
    true,
    true,
    false,
    p.id
FROM users u
CROSS JOIN practices p
WHERE u.email = 'test-therapist-staff@redbroomsoftware.com'
    AND p.email = 'test-clinic-owner@redbroomsoftware.com'
ON CONFLICT (user_id) DO UPDATE SET
    vetting_status = 'approved',
    is_available = true,
    verification_status = 'fully_verified',
    is_independent = false;

-- Add staff as practice member
INSERT INTO practice_members (practice_id, user_id, therapist_id, role, title, hire_date, commission_rate, status, joined_at)
SELECT
    p.id,
    u.id,
    t.id,
    'therapist',
    'Senior Physical Therapist',
    CURRENT_DATE - INTERVAL '6 months',
    70.0,  -- Staff therapist gets 70% of booking fee
    'active',
    NOW() - INTERVAL '6 months'
FROM practices p
JOIN users u ON u.email = 'test-therapist-staff@redbroomsoftware.com'
JOIN therapists t ON t.user_id = u.id
WHERE p.email = 'test-clinic-owner@redbroomsoftware.com'
ON CONFLICT (practice_id, user_id) DO UPDATE SET
    role = 'therapist',
    status = 'active';

-- Add staff therapist services
INSERT INTO therapist_services (therapist_id, service_id, is_offered, custom_price_cents, custom_duration_minutes)
SELECT
    t.id,
    s.id,
    true,
    s.default_price_cents,
    s.default_duration_minutes
FROM therapists t
CROSS JOIN services s
WHERE t.user_id = (SELECT id FROM users WHERE email = 'test-therapist-staff@redbroomsoftware.com')
    AND s.category_id IN (
        '00000000-0000-0000-0000-000000000002'::uuid  -- Physical therapy
    )
ON CONFLICT (therapist_id, service_id) DO UPDATE SET
    is_offered = true;

-- ============================================================================
-- STEP 8: VERIFICATION QUERIES
-- ============================================================================

SELECT '=== VERIFICATION: Test Accounts Created ===' as status;

-- Check all test users
SELECT
    'USER PROFILES' as table_name,
    u.email,
    u.full_name,
    u.role,
    u.created_at
FROM users u
WHERE u.email LIKE '%redbroomsoftware.com'
ORDER BY u.email;

-- Check therapist accounts
SELECT
    'THERAPIST ACCOUNTS' as table_name,
    u.email,
    u.full_name,
    t.vetting_status,
    t.verification_status,
    t.is_available,
    t.is_independent,
    t.subscription_tier,
    p.name as primary_practice
FROM users u
JOIN therapists t ON t.user_id = u.id
LEFT JOIN practices p ON p.id = t.primary_practice_id
WHERE u.email LIKE '%redbroomsoftware.com'
ORDER BY t.is_independent DESC, u.email;

-- Check practice
SELECT
    'PRACTICE' as table_name,
    p.name,
    p.email,
    p.business_type,
    p.verification_status,
    p.subscription_tier,
    COUNT(pm.id) as member_count
FROM practices p
LEFT JOIN practice_members pm ON pm.practice_id = p.id
WHERE p.email LIKE '%redbroomsoftware.com'
GROUP BY p.id, p.name, p.email, p.business_type, p.verification_status, p.subscription_tier;

-- Check practice members
SELECT
    'PRACTICE MEMBERS' as table_name,
    p.name as practice_name,
    u.email,
    u.full_name,
    pm.role,
    pm.title,
    pm.commission_rate,
    pm.status
FROM practice_members pm
JOIN practices p ON p.id = pm.practice_id
JOIN users u ON u.id = pm.user_id
WHERE p.email LIKE '%redbroomsoftware.com'
ORDER BY pm.role, u.email;

-- Check services offered by therapists
SELECT
    'THERAPIST SERVICES' as table_name,
    u.email,
    u.full_name,
    COUNT(ts.id) as services_count,
    ARRAY_AGG(s.name ORDER BY s.name) as services_offered
FROM users u
JOIN therapists t ON t.user_id = u.id
JOIN therapist_services ts ON ts.therapist_id = t.id AND ts.is_offered = true
JOIN services s ON s.id = ts.service_id
WHERE u.email LIKE '%redbroomsoftware.com'
GROUP BY u.id, u.email, u.full_name
ORDER BY u.email;

-- ============================================================================
-- STEP 9: TEST CREDENTIALS SUMMARY
-- ============================================================================

SELECT '=== TEST ACCOUNT CREDENTIALS ===' as info;

SELECT
    'INDEPENDENT THERAPIST' as account_type,
    'test-therapist@redbroomsoftware.com' as email,
    'Test123!' as password,
    'Maria Rodriguez' as name,
    'Can accept bookings, manage profile, see earnings' as capabilities
UNION ALL
SELECT
    'PRACTICE OWNER',
    'test-clinic-owner@redbroomsoftware.com',
    'Test123!',
    'Dr. Carlos Mendez',
    'Full practice management, staff management, analytics'
UNION ALL
SELECT
    'STAFF THERAPIST',
    'test-therapist-staff@redbroomsoftware.com',
    'Test123!',
    'Ana Garcia',
    'See assigned bookings, manage own schedule, view earnings';

-- ============================================================================
-- STEP 10: ACCESS INSTRUCTIONS
-- ============================================================================

SELECT '=== HOW TO ACCESS TEST ACCOUNTS ===' as instructions;

SELECT
    '1. Direct Login' as method,
    'Go to https://plenura.redbroomsoftware.com and log in with test credentials' as description
UNION ALL
SELECT
    '2. Via Camino Ecosystem Dashboard (RECOMMENDED)',
    'Go to https://camino.redbroomsoftware.com/admin/ecosystem → Search for Wellness Center → Click Access'
UNION ALL
SELECT
    '3. Via Supabase Auth Dashboard',
    'Supabase Dashboard → Auth → Users → Select user → Actions → Send Magic Link';

SELECT '✅ Setup complete! You can now troubleshoot both therapist and practice scenarios.' as final_message;
