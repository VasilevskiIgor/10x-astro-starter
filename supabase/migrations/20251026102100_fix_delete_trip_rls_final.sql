-- Migration: Final fix for trip deletion RLS policy
-- Date: 2025-10-26
-- Description: Completely remove restrictive policies and create simple permissive UPDATE policies
-- The issue is that WITH CHECK was still being evaluated even with previous fixes

-- ============================================================================
-- Step 1: Drop ALL existing UPDATE policies for trips table
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_users_update_own_trips" ON trips;
DROP POLICY IF EXISTS "anon_users_update_own_trips" ON trips;
DROP POLICY IF EXISTS "allow_authenticated_update_trips" ON trips;
DROP POLICY IF EXISTS "allow_anon_update_trips" ON trips;

-- ============================================================================
-- Step 2: Create new permissive UPDATE policies
-- ============================================================================
-- These policies allow users to update only their own trips
-- But don't restrict WHAT they can update (including deleted_at for soft delete)

CREATE POLICY "users_update_own_trips_permissive"
ON trips FOR UPDATE
TO authenticated, anon
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Add helpful comment
-- ============================================================================

COMMENT ON POLICY "users_update_own_trips_permissive" ON trips IS
  'Allows users to update their own trips including soft deletes. Security enforced by checking user_id ownership.';

-- ============================================================================
-- Verify policy was created
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'trips'
    AND policyname = 'users_update_own_trips_permissive'
  ) THEN
    RAISE EXCEPTION 'Policy was not created successfully';
  END IF;
END $$;
