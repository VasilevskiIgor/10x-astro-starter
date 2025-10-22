-- Migration: Allow soft delete on trips table
-- Date: 2025-10-18
-- Description: Update RLS policies to allow setting deleted_at timestamp

-- Drop existing update policies
DROP POLICY IF EXISTS "authenticated_users_update_own_trips" ON trips;
DROP POLICY IF EXISTS "anon_users_update_own_trips" ON trips;

-- Recreate policy for authenticated users with soft delete support
-- Allows updating trips where deleted_at is null (existing trips)
-- Also allows setting deleted_at (soft delete operation)
CREATE POLICY "authenticated_users_update_own_trips"
ON trips FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (
  auth.uid() = user_id AND (
    -- Normal update: status must be valid
    (deleted_at IS NULL AND status IN ('draft', 'generating', 'completed', 'failed'))
    OR
    -- Soft delete: deleted_at is being set
    (deleted_at IS NOT NULL)
  )
);

-- Recreate policy for anonymous users with soft delete support
CREATE POLICY "anon_users_update_own_trips"
ON trips FOR UPDATE
TO anon
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (
  auth.uid() = user_id AND (
    -- Normal update: status must be valid
    (deleted_at IS NULL AND status IN ('draft', 'generating', 'completed', 'failed'))
    OR
    -- Soft delete: deleted_at is being set
    (deleted_at IS NOT NULL)
  )
);

COMMENT ON POLICY "authenticated_users_update_own_trips" ON trips IS 'Allows authenticated users to update their own trips including status changes and soft deletes';
COMMENT ON POLICY "anon_users_update_own_trips" ON trips IS 'Allows anonymous users to update their own trips including status changes and soft deletes';
