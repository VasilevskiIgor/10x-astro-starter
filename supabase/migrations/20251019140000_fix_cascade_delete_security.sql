-- Migration: Fix cascade soft delete function to bypass RLS
-- Date: 2025-10-19
-- Description: Add SECURITY DEFINER to cascade function to bypass RLS policies
-- The trigger updates child records which were being blocked by RLS

-- ============================================================================
-- Recreate cascade function with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION cascade_soft_delete_trip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with the privileges of the function owner (bypasses RLS)
SET search_path = public
AS $$
BEGIN
  -- only cascade if this is a new soft delete (transition from null to non-null)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- soft delete all trip_days belonging to this trip
    UPDATE trip_days
    SET deleted_at = NEW.deleted_at
    WHERE trip_id = NEW.id AND deleted_at IS NULL;

    -- soft delete all trip_activities belonging to these trip_days
    UPDATE trip_activities
    SET deleted_at = NEW.deleted_at
    WHERE trip_day_id IN (
      SELECT id FROM trip_days WHERE trip_id = NEW.id
    ) AND deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION cascade_soft_delete_trip() IS
  'Cascades soft deletes from trips to trip_days and trip_activities. Uses SECURITY DEFINER to bypass RLS.';
