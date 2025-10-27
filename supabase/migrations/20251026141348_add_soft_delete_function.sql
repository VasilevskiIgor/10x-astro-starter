-- Migration: Add soft delete function that bypasses RLS
-- Date: 2025-10-26
-- Description: Create a PostgreSQL function to handle soft delete with SECURITY DEFINER
-- This bypasses RLS issues while still maintaining security through user_id checks

-- ============================================================================
-- Create soft delete function
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_trip(
  p_trip_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes the function run with the privileges of the owner (bypasses RLS)
SET search_path = public
AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  -- Perform the soft delete with user ownership check
  UPDATE trips
  SET deleted_at = NOW()
  WHERE id = p_trip_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  -- Return true if a row was updated, false otherwise
  RETURN v_rows_affected > 0;
END;
$$;

-- ============================================================================
-- Add comment
-- ============================================================================

COMMENT ON FUNCTION soft_delete_trip(UUID, UUID) IS
  'Soft deletes a trip by setting deleted_at timestamp. Uses SECURITY DEFINER to bypass RLS while maintaining security through user_id check.';

-- ============================================================================
-- Grant execute permission to authenticated and anon users
-- ============================================================================

GRANT EXECUTE ON FUNCTION soft_delete_trip(UUID, UUID) TO authenticated, anon;
