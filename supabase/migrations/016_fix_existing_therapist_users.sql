-- ============================================================================
-- FIX: Update existing users who registered as therapists but have role='client'
-- Run this AFTER 015_fix_therapist_registration.sql
-- ============================================================================

-- Fix specific user: ivannasitges@gmail.com
UPDATE public.users
SET role = 'therapist', updated_at = NOW()
WHERE email = 'ivannasitges@gmail.com' AND role = 'client';

-- ============================================================================
-- OPTIONAL: Fix ALL users who registered as therapists but got role='client'
-- This queries auth.users metadata to find mismatched roles
-- ============================================================================

-- Update all users where their auth metadata says 'therapist' but users table says 'client'
UPDATE public.users u
SET role = 'therapist', updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
  AND u.role = 'client'
  AND au.raw_user_meta_data->>'role' = 'therapist';

-- Verify the fix worked
SELECT
    u.id,
    u.email,
    u.role as users_table_role,
    au.raw_user_meta_data->>'role' as auth_metadata_role,
    au.raw_user_meta_data->>'registration_type' as registration_type
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.raw_user_meta_data->>'role' = 'therapist';
