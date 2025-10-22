-- Migration: Fix UPDATE policy WITH CHECK to allow soft delete
-- Date: 2025-10-19
-- Description: The WITH CHECK clause must explicitly allow setting deleted_at
-- The previous policy only checked user_id, but we need to allow deleted_at to be set

-- ============================================================================
-- Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_users_update_own_trips" ON trips;
DROP POLICY IF EXISTS "anon_users_update_own_trips" ON trips;

-- ============================================================================
-- Recreate UPDATE policies with proper WITH CHECK for soft delete
-- ============================================================================

-- Policy for authenticated users
-- USING: Can only update trips that belong to them and are not deleted
-- WITH CHECK: User must own the trip, and EITHER:
--   1. deleted_at remains NULL (normal update)
--   2. deleted_at is being set (soft delete)
CREATE POLICY "authenticated_users_update_own_trips"
ON trips FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.uid() = user_id
  AND (
    deleted_at IS NULL
    OR deleted_at IS NOT NULL
  )
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
  AND (
    deleted_at IS NULL
    OR deleted_at IS NOT NULL
  )
);

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON POLICY "authenticated_users_update_own_trips" ON trips IS
  'Allows authenticated users to update their own non-deleted trips, including soft deletes (setting deleted_at)';

COMMENT ON POLICY "anon_users_update_own_trips" ON trips IS
  'Allows anonymous users to update their own non-deleted trips, including soft deletes (setting deleted_at)';
