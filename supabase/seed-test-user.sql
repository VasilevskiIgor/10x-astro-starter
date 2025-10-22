-- Seed Test User for Local Development
-- This script creates a test user for testing API endpoints locally
--
-- Usage: Run this in Supabase Studio SQL Editor or via CLI:
--   supabase db reset
--   (this file should be picked up automatically if in supabase/seed.sql)
--
-- Test Credentials:
--   Email: test@example.com
--   Password: password123

-- Note: In local Supabase, you can create users via the Studio UI:
-- 1. Open http://localhost:54323
-- 2. Go to Authentication > Users
-- 3. Click "Add user" > "Create new user"
-- 4. Enter email: test@example.com, password: password123

-- Alternatively, you can create via SQL (requires service_role access):
-- This is just for documentation - actual user creation should be done via Supabase Auth API

-- Clean up any existing test user (optional)
-- DELETE FROM auth.users WHERE email = 'test@example.com';

-- Insert test trips for the test user (if user exists)
-- Uncomment the section below after creating the test user

/*
-- Get the test user ID
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Find the test user
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'test@example.com'
  LIMIT 1;

  -- Only proceed if user exists
  IF test_user_id IS NOT NULL THEN
    -- Insert some test trips
    INSERT INTO public.trips (user_id, destination, start_date, end_date, description, status)
    VALUES
      (test_user_id, 'Paris, France', '2025-06-01', '2025-06-05', 'Romantic getaway', 'draft'),
      (test_user_id, 'Tokyo, Japan', '2025-08-10', '2025-08-17', 'Cultural exploration', 'completed'),
      (test_user_id, 'New York, USA', '2025-09-15', '2025-09-20', 'Business trip', 'draft')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Test trips created for user: %', test_user_id;
  ELSE
    RAISE NOTICE 'Test user not found. Please create user with email: test@example.com';
  END IF;
END $$;
*/

-- Verify trips were created
-- SELECT id, destination, start_date, end_date, status
-- FROM public.trips
-- WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'test@example.com');
