-- migration: create indexes for performance optimization
-- description: creates indexes on frequently queried columns and foreign keys
-- author: claude
-- date: 2025-10-13

-- ============================================================================
-- trips table indexes
-- ============================================================================
-- optimize queries filtering by user, status, dates, and soft deletes
-- gin index for jsonb content searches

-- user_id index for filtering user's trips (excludes soft-deleted records)
create index idx_trips_user_id on trips(user_id) where deleted_at is null;

-- status index for filtering trips by generation status (excludes soft-deleted records)
create index idx_trips_status on trips(status) where deleted_at is null;

-- created_at index for sorting trips by creation date (excludes soft-deleted records)
-- ordered descending for newest-first queries
create index idx_trips_created_at on trips(created_at desc) where deleted_at is null;

-- start_date index for filtering trips by departure date (excludes soft-deleted records)
create index idx_trips_start_date on trips(start_date) where deleted_at is null;

-- deleted_at index for efficiently querying soft-deleted records
-- only indexes non-null values for cleanup operations
create index idx_trips_deleted_at on trips(deleted_at) where deleted_at is not null;

-- gin index for jsonb content searches within ai_generated_content
-- enables efficient queries on nested json fields
create index idx_trips_ai_content_gin on trips using gin (ai_generated_content);

comment on index idx_trips_user_id is 'optimizes queries filtering trips by user_id';
comment on index idx_trips_ai_content_gin is 'enables efficient searches within ai_generated_content jsonb column';

-- ============================================================================
-- trip_days table indexes
-- ============================================================================
-- optimize queries joining to parent trips and filtering by date

-- trip_id foreign key index for efficient joins (excludes soft-deleted records)
create index idx_trip_days_trip_id on trip_days(trip_id) where deleted_at is null;

-- date index for filtering days by date
create index idx_trip_days_date on trip_days(date);

comment on index idx_trip_days_trip_id is 'optimizes joins between trip_days and trips tables';

-- ============================================================================
-- trip_activities table indexes
-- ============================================================================
-- optimize queries joining to parent trip_days and ordering activities

-- trip_day_id foreign key index for efficient joins (excludes soft-deleted records)
create index idx_trip_activities_day_id on trip_activities(trip_day_id) where deleted_at is null;

-- composite index for ordering activities within a day (excludes soft-deleted records)
-- used when displaying activities in the correct sequence
create index idx_trip_activities_order on trip_activities(trip_day_id, order_index) where deleted_at is null;

comment on index idx_trip_activities_day_id is 'optimizes joins between trip_activities and trip_days tables';
comment on index idx_trip_activities_order is 'optimizes ordering of activities within a trip day';

-- ============================================================================
-- ai_generation_logs table indexes
-- ============================================================================
-- optimize queries for monitoring, analytics, and debugging

-- user_id index for filtering logs by user
create index idx_ai_logs_user_id on ai_generation_logs(user_id);

-- trip_id index for filtering logs by trip (only non-null trip_ids)
create index idx_ai_logs_trip_id on ai_generation_logs(trip_id) where trip_id is not null;

-- created_at index for sorting logs by timestamp (descending for newest-first)
create index idx_ai_logs_created_at on ai_generation_logs(created_at desc);

-- status index for filtering logs by success/error/timeout
create index idx_ai_logs_status on ai_generation_logs(status);

comment on index idx_ai_logs_created_at is 'optimizes queries sorting logs by creation time';
comment on index idx_ai_logs_status is 'optimizes queries filtering logs by generation status';

-- ============================================================================
-- user_rate_limits table indexes
-- ============================================================================
-- optimize queries for rate limit checks and resets

-- daily_limit_reset_at index for finding expired daily limits
create index idx_rate_limits_daily_reset on user_rate_limits(daily_limit_reset_at);

-- hourly_limit_reset_at index for finding expired hourly limits
create index idx_rate_limits_hourly_reset on user_rate_limits(hourly_limit_reset_at);

comment on index idx_rate_limits_daily_reset is 'optimizes queries for resetting expired daily limits';
comment on index idx_rate_limits_hourly_reset is 'optimizes queries for resetting expired hourly limits';
