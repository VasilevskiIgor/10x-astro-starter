-- migration: disable rls policies on legacy tables
-- description: drops all policies and disables rls on vibetravel, generations, and generation_error_log tables if they exist
-- author: claude
-- date: 2025-10-13
-- note: this migration uses 'if exists' to avoid errors if tables don't exist

-- ============================================================================
-- vibetravel table - drop all policies and disable rls
-- ============================================================================

-- drop all existing policies on vibetravel table (if exists)
do $$
declare
  policy_record record;
begin
  -- check if table exists before proceeding
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'vibetravel') then
    -- drop all policies on vibetravel table
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
      and tablename = 'vibetravel'
    loop
      execute format('drop policy if exists %I on vibetravel', policy_record.policyname);
    end loop;

    -- disable row level security
    alter table vibetravel disable row level security;

    raise notice 'disabled rls and dropped all policies on vibetravel table';
  else
    raise notice 'vibetravel table does not exist, skipping';
  end if;
end $$;

-- ============================================================================
-- generations table - drop all policies and disable rls
-- ============================================================================

-- drop all existing policies on generations table (if exists)
do $$
declare
  policy_record record;
begin
  -- check if table exists before proceeding
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'generations') then
    -- drop all policies on generations table
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
      and tablename = 'generations'
    loop
      execute format('drop policy if exists %I on generations', policy_record.policyname);
    end loop;

    -- disable row level security
    alter table generations disable row level security;

    raise notice 'disabled rls and dropped all policies on generations table';
  else
    raise notice 'generations table does not exist, skipping';
  end if;
end $$;

-- ============================================================================
-- generation_error_log table - drop all policies and disable rls
-- ============================================================================

-- drop all existing policies on generation_error_log table (if exists)
do $$
declare
  policy_record record;
begin
  -- check if table exists before proceeding
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'generation_error_log') then
    -- drop all policies on generation_error_log table
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
      and tablename = 'generation_error_log'
    loop
      execute format('drop policy if exists %I on generation_error_log', policy_record.policyname);
    end loop;

    -- disable row level security
    alter table generation_error_log disable row level security;

    raise notice 'disabled rls and dropped all policies on generation_error_log table';
  else
    raise notice 'generation_error_log table does not exist, skipping';
  end if;
end $$;
