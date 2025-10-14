-- migration: create functions and triggers
-- description: implements auto-update timestamps, soft delete cascades, validation, and rate limit initialization
-- author: claude
-- date: 2025-10-13

-- ============================================================================
-- function: auto-update updated_at timestamp
-- ============================================================================
-- automatically sets updated_at to current timestamp on row updates
-- used by multiple tables to track last modification time

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column() is 'automatically updates the updated_at column to current timestamp on row update';

-- ============================================================================
-- triggers: apply updated_at auto-update to tables
-- ============================================================================

-- trigger: auto-update updated_at on trips table
create trigger update_trips_updated_at
  before update on trips
  for each row
  execute function update_updated_at_column();

comment on trigger update_trips_updated_at on trips is 'automatically updates updated_at timestamp when trip is modified';

-- trigger: auto-update updated_at on trip_days table
create trigger update_trip_days_updated_at
  before update on trip_days
  for each row
  execute function update_updated_at_column();

comment on trigger update_trip_days_updated_at on trip_days is 'automatically updates updated_at timestamp when trip day is modified';

-- trigger: auto-update updated_at on trip_activities table
create trigger update_trip_activities_updated_at
  before update on trip_activities
  for each row
  execute function update_updated_at_column();

comment on trigger update_trip_activities_updated_at on trip_activities is 'automatically updates updated_at timestamp when activity is modified';

-- trigger: auto-update updated_at on user_rate_limits table
create trigger update_user_rate_limits_updated_at
  before update on user_rate_limits
  for each row
  execute function update_updated_at_column();

comment on trigger update_user_rate_limits_updated_at on user_rate_limits is 'automatically updates updated_at timestamp when rate limits are modified';

-- ============================================================================
-- function: cascade soft delete to child records
-- ============================================================================
-- when a trip is soft deleted (deleted_at is set), cascade the soft delete
-- to all related trip_days and trip_activities records
-- preserves referential integrity for soft delete pattern

create or replace function cascade_soft_delete_trip()
returns trigger as $$
begin
  -- only cascade if this is a new soft delete (transition from null to non-null)
  if new.deleted_at is not null and old.deleted_at is null then
    -- soft delete all trip_days belonging to this trip
    update trip_days
    set deleted_at = new.deleted_at
    where trip_id = new.id and deleted_at is null;

    -- soft delete all trip_activities belonging to these trip_days
    update trip_activities
    set deleted_at = new.deleted_at
    where trip_day_id in (
      select id from trip_days where trip_id = new.id
    ) and deleted_at is null;
  end if;

  return new;
end;
$$ language plpgsql;

comment on function cascade_soft_delete_trip() is 'cascades soft deletes from trips to trip_days and trip_activities';

-- trigger: cascade soft delete when trip.deleted_at is updated
create trigger cascade_soft_delete_on_trip
  after update of deleted_at on trips
  for each row
  execute function cascade_soft_delete_trip();

comment on trigger cascade_soft_delete_on_trip on trips is 'triggers cascade soft delete when a trip is soft deleted';

-- ============================================================================
-- function: enforce maximum trip count per user
-- ============================================================================
-- prevents users from creating more than 100 trips
-- helps prevent abuse and manage database growth

create or replace function enforce_trip_limit()
returns trigger as $$
declare
  trip_count integer;
begin
  -- count non-deleted trips for this user
  select count(*) into trip_count
  from trips
  where user_id = new.user_id
  and deleted_at is null;

  -- raise exception if limit reached
  if trip_count >= 100 then
    raise exception 'user has reached maximum limit of 100 trips';
  end if;

  return new;
end;
$$ language plpgsql;

comment on function enforce_trip_limit() is 'enforces maximum of 100 active trips per user to prevent abuse';

-- trigger: check trip limit before inserting new trip
create trigger enforce_trip_limit_trigger
  before insert on trips
  for each row
  execute function enforce_trip_limit();

comment on trigger enforce_trip_limit_trigger on trips is 'validates trip count limit before allowing new trip creation';

-- ============================================================================
-- function: validate trip day sequence
-- ============================================================================
-- ensures day numbers align with actual dates based on trip start date
-- day 1 should be start_date, day 2 should be start_date + 1, etc.
-- maintains data integrity between day_number and date fields

create or replace function validate_trip_day_sequence()
returns trigger as $$
declare
  trip_start_date date;
  expected_date date;
begin
  -- get the start date of the parent trip
  select start_date into trip_start_date
  from trips
  where id = new.trip_id;

  -- calculate expected date based on day number
  -- day 1 = start_date, day 2 = start_date + 1, etc.
  expected_date := trip_start_date + (new.day_number - 1);

  -- raise exception if date doesn't match expected sequence
  if new.date != expected_date then
    raise exception 'day % date (%) does not match expected date (%) based on trip start date',
      new.day_number, new.date, expected_date;
  end if;

  return new;
end;
$$ language plpgsql;

comment on function validate_trip_day_sequence() is 'validates that trip day dates align with day numbers and trip start date';

-- trigger: validate day sequence before insert or update
create trigger validate_trip_day_sequence_trigger
  before insert or update on trip_days
  for each row
  execute function validate_trip_day_sequence();

comment on trigger validate_trip_day_sequence_trigger on trip_days is 'ensures day numbers and dates remain synchronized with trip start date';

-- ============================================================================
-- function: cleanup old soft-deleted records
-- ============================================================================
-- permanently deletes records that have been soft-deleted for more than 30 days
-- helps manage database size and comply with data retention policies
-- note: this function must be called manually or via scheduled job (pg_cron)
-- warning: this permanently deletes data - ensure backups are in place

create or replace function cleanup_old_deleted_records()
returns void as $$
begin
  -- permanently delete trip_activities soft-deleted over 30 days ago
  delete from trip_activities
  where deleted_at is not null
  and deleted_at < now() - interval '30 days';

  -- permanently delete trip_days soft-deleted over 30 days ago
  delete from trip_days
  where deleted_at is not null
  and deleted_at < now() - interval '30 days';

  -- permanently delete trips soft-deleted over 30 days ago
  delete from trips
  where deleted_at is not null
  and deleted_at < now() - interval '30 days';
end;
$$ language plpgsql;

comment on function cleanup_old_deleted_records() is 'permanently deletes records soft-deleted over 30 days ago - must be called manually or via pg_cron';

-- ============================================================================
-- function: create default rate limits on user signup
-- ============================================================================
-- helper function to create rate limit record for a new user
-- this should be called from application code after user signup
-- not using a trigger on auth.users to avoid migration dependencies
-- note: call this function from your signup flow with the new user's id

create or replace function create_default_rate_limits(p_user_id uuid)
returns void as $$
begin
  -- create default rate limit record for new user
  insert into user_rate_limits (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$ language plpgsql security definer;

comment on function create_default_rate_limits(uuid) is 'creates rate limit record for a user - call from application code after signup with user id';
