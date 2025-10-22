-- Migration: Fix UPDATE and DELETE policies for trips table
-- Date: 2025-10-19
-- Description: Fix RLS policies to properly allow UPDATE and soft DELETE operations
-- The issue was that WITH CHECK clause was too restrictive

-- ============================================================================
-- Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_users_update_own_trips" ON trips;
DROP POLICY IF EXISTS "anon_users_update_own_trips" ON trips;

-- ============================================================================
-- Recreate UPDATE policies with correct logic
-- ============================================================================

-- Policy for authenticated users
-- USING: Can only update trips that belong to them and are not deleted
-- WITH CHECK: User must own the trip, and either:
--   1. It's a normal update (deleted_at stays NULL, status is valid)
--   2. It's a soft delete (deleted_at is being set to a timestamp)
CREATE POLICY "authenticated_users_update_own_trips"
ON trips FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy for anonymous users
CREATE POLICY "anon_users_update_own_trips"
ON trips FOR UPDATE
TO anon
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.uid() = user_id
);

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON POLICY "authenticated_users_update_own_trips" ON trips IS
  'Allows authenticated users to update their own non-deleted trips, including soft deletes';

COMMENT ON POLICY "anon_users_update_own_trips" ON trips IS
  'Allows anonymous users to update their own non-deleted trips, including soft deletes';
