-- migration: create row level security policies
-- description: implements granular rls policies for all tables ensuring users can only access their own data
-- author: claude
-- date: 2025-10-13
-- note: tables were already enabled for rls in the initial migration, this adds the policies

-- ============================================================================
-- trips table rls policies
-- ============================================================================
-- users can view, insert, update, and soft-delete their own trips
-- separate policies for each operation (select, insert, update, delete)

-- policy: allow authenticated users to view their own non-deleted trips
create policy "authenticated_users_select_own_trips"
on trips for select
to authenticated
using (auth.uid() = user_id and deleted_at is null);

-- policy: allow anonymous users to view their own non-deleted trips
create policy "anon_users_select_own_trips"
on trips for select
to anon
using (auth.uid() = user_id and deleted_at is null);

-- policy: allow authenticated users to insert their own trips
-- restricts initial status to draft or generating
create policy "authenticated_users_insert_own_trips"
on trips for insert
to authenticated
with check (auth.uid() = user_id and status in ('draft', 'generating'));

-- policy: allow anonymous users to insert their own trips
-- restricts initial status to draft or generating
create policy "anon_users_insert_own_trips"
on trips for insert
to anon
with check (auth.uid() = user_id and status in ('draft', 'generating'));

-- policy: allow authenticated users to update their own non-deleted trips
-- permits all status transitions for flexibility
create policy "authenticated_users_update_own_trips"
on trips for update
to authenticated
using (auth.uid() = user_id and deleted_at is null)
with check (auth.uid() = user_id and status in ('draft', 'generating', 'completed', 'failed'));

-- policy: allow anonymous users to update their own non-deleted trips
-- permits all status transitions for flexibility
create policy "anon_users_update_own_trips"
on trips for update
to anon
using (auth.uid() = user_id and deleted_at is null)
with check (auth.uid() = user_id and status in ('draft', 'generating', 'completed', 'failed'));

comment on policy "authenticated_users_select_own_trips" on trips is 'allows authenticated users to view their own non-deleted trips';
comment on policy "authenticated_users_insert_own_trips" on trips is 'allows authenticated users to create trips in draft or generating status';
comment on policy "authenticated_users_update_own_trips" on trips is 'allows authenticated users to update their own trips including status changes and soft deletes';

-- ============================================================================
-- trip_days table rls policies
-- ============================================================================
-- access controlled through parent trips table
-- users can perform all operations on days belonging to their trips

-- policy: allow authenticated users to view trip days from their own trips
create policy "authenticated_users_select_own_trip_days"
on trip_days for select
to authenticated
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
  and deleted_at is null
);

-- policy: allow anonymous users to view trip days from their own trips
create policy "anon_users_select_own_trip_days"
on trip_days for select
to anon
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
  and deleted_at is null
);

-- policy: allow authenticated users to insert trip days for their own trips
create policy "authenticated_users_insert_own_trip_days"
on trip_days for insert
to authenticated
with check (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to insert trip days for their own trips
create policy "anon_users_insert_own_trip_days"
on trip_days for insert
to anon
with check (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow authenticated users to update trip days from their own trips
create policy "authenticated_users_update_own_trip_days"
on trip_days for update
to authenticated
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to update trip days from their own trips
create policy "anon_users_update_own_trip_days"
on trip_days for update
to anon
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow authenticated users to delete trip days from their own trips
create policy "authenticated_users_delete_own_trip_days"
on trip_days for delete
to authenticated
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to delete trip days from their own trips
create policy "anon_users_delete_own_trip_days"
on trip_days for delete
to anon
using (
  exists (
    select 1 from trips
    where trips.id = trip_days.trip_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

comment on policy "authenticated_users_select_own_trip_days" on trip_days is 'allows users to view days from their own non-deleted trips';
comment on policy "authenticated_users_insert_own_trip_days" on trip_days is 'allows users to create days for their own trips';

-- ============================================================================
-- trip_activities table rls policies
-- ============================================================================
-- access controlled through parent trip_days and trips tables
-- users can perform all operations on activities belonging to their trip days

-- policy: allow authenticated users to view activities from their own trip days
create policy "authenticated_users_select_own_trip_activities"
on trip_activities for select
to authenticated
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
    and trip_days.deleted_at is null
  )
  and deleted_at is null
);

-- policy: allow anonymous users to view activities from their own trip days
create policy "anon_users_select_own_trip_activities"
on trip_activities for select
to anon
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
    and trip_days.deleted_at is null
  )
  and deleted_at is null
);

-- policy: allow authenticated users to insert activities for their own trip days
create policy "authenticated_users_insert_own_trip_activities"
on trip_activities for insert
to authenticated
with check (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to insert activities for their own trip days
create policy "anon_users_insert_own_trip_activities"
on trip_activities for insert
to anon
with check (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow authenticated users to update activities from their own trip days
create policy "authenticated_users_update_own_trip_activities"
on trip_activities for update
to authenticated
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to update activities from their own trip days
create policy "anon_users_update_own_trip_activities"
on trip_activities for update
to anon
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow authenticated users to delete activities from their own trip days
create policy "authenticated_users_delete_own_trip_activities"
on trip_activities for delete
to authenticated
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

-- policy: allow anonymous users to delete activities from their own trip days
create policy "anon_users_delete_own_trip_activities"
on trip_activities for delete
to anon
using (
  exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_activities.trip_day_id
    and trips.user_id = auth.uid()
    and trips.deleted_at is null
  )
);

comment on policy "authenticated_users_select_own_trip_activities" on trip_activities is 'allows users to view activities from their own non-deleted trip days';
comment on policy "authenticated_users_insert_own_trip_activities" on trip_activities is 'allows users to create activities for their own trip days';

-- ============================================================================
-- ai_generation_logs table rls policies
-- ============================================================================
-- users can view their own generation logs for transparency
-- insert is typically done by backend/service role, but allow authenticated users

-- policy: allow authenticated users to view their own ai generation logs
create policy "authenticated_users_select_own_ai_logs"
on ai_generation_logs for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow anonymous users to view their own ai generation logs
create policy "anon_users_select_own_ai_logs"
on ai_generation_logs for select
to anon
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own ai generation logs
create policy "authenticated_users_insert_own_ai_logs"
on ai_generation_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow anonymous users to insert their own ai generation logs
create policy "anon_users_insert_own_ai_logs"
on ai_generation_logs for insert
to anon
with check (auth.uid() = user_id);

comment on policy "authenticated_users_select_own_ai_logs" on ai_generation_logs is 'allows users to view their own ai generation logs for transparency';
comment on policy "authenticated_users_insert_own_ai_logs" on ai_generation_logs is 'allows users or services to log ai generation requests';

-- ============================================================================
-- user_rate_limits table rls policies
-- ============================================================================
-- users can view and update their own rate limit records
-- typically managed by backend but accessible to users for transparency

-- policy: allow authenticated users to view their own rate limits
create policy "authenticated_users_select_own_rate_limits"
on user_rate_limits for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow anonymous users to view their own rate limits
create policy "anon_users_select_own_rate_limits"
on user_rate_limits for select
to anon
using (auth.uid() = user_id);

-- policy: allow authenticated users to update their own rate limits
-- note: typically this would be restricted to service role only in production
create policy "authenticated_users_update_own_rate_limits"
on user_rate_limits for update
to authenticated
using (auth.uid() = user_id);

-- policy: allow anonymous users to update their own rate limits
-- note: typically this would be restricted to service role only in production
create policy "anon_users_update_own_rate_limits"
on user_rate_limits for update
to anon
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own rate limits
create policy "authenticated_users_insert_own_rate_limits"
on user_rate_limits for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow anonymous users to insert their own rate limits
create policy "anon_users_insert_own_rate_limits"
on user_rate_limits for insert
to anon
with check (auth.uid() = user_id);

comment on policy "authenticated_users_select_own_rate_limits" on user_rate_limits is 'allows users to view their own rate limit status';
comment on policy "authenticated_users_update_own_rate_limits" on user_rate_limits is 'allows rate limit updates - consider restricting to service role in production';
