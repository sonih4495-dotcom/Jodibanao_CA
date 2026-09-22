-- Phase 2 Migration: CA/CS Focus + Photo Visibility + Verified Badge
-- Run this in Supabase SQL Editor

-- 1. Add profession_type (CA/CS/CA Student/CS Student)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profession_type text,
  ADD COLUMN IF NOT EXISTS membership_number text,
  ADD COLUMN IF NOT EXISTS photo_visibility text DEFAULT 'everyone' CHECK (photo_visibility IN ('everyone', 'mutual', 'verified_only')),
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 2. Update existing test users to have CA/CS profession type
UPDATE public.profiles
  SET profession_type = 'CA', membership_number = 'TEST001'
  WHERE profession_type IS NULL;

-- 3. Comment on new columns for documentation
COMMENT ON COLUMN public.profiles.profession_type IS 'CA, CA Student, CS, CS Student';
COMMENT ON COLUMN public.profiles.membership_number IS 'ICAI or ICSI membership/student registration number';
COMMENT ON COLUMN public.profiles.photo_visibility IS 'everyone | mutual | verified_only';
COMMENT ON COLUMN public.profiles.is_verified IS 'Admin-approved verified professional badge';
