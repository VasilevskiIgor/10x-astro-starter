-- migration: create materialized view for user statistics
-- description: creates a materialized view for efficient querying of user trip statistics and ai usage metrics
-- author: claude
-- date: 2025-10-13
-- note: materialized views must be refreshed periodically to reflect current data
-- refresh can be done manually via: refresh materialized view concurrently user_stats;
-- or scheduled via pg_cron extension

-- ============================================================================
-- materialized view: user_stats
-- ============================================================================
-- aggregates user trip statistics and ai usage metrics for analytics dashboards
-- includes trip counts by status, token usage, and generation performance
-- filters out soft-deleted trips from all calculations
-- performance: pre-aggregates data for fast dashboard queries

create materialized view user_stats as
select
  user_id,

  -- trip count metrics (excludes soft-deleted trips)
  count(*) filter (where deleted_at is null) as total_trips,
  count(*) filter (where status = 'completed' and deleted_at is null) as completed_trips,
  count(*) filter (where status = 'draft' and deleted_at is null) as draft_trips,

  -- timestamp metrics (only non-deleted trips)
  max(created_at) filter (where deleted_at is null) as last_trip_created_at,

  -- ai usage metrics (only non-deleted trips)
  sum(ai_tokens_used) filter (where deleted_at is null) as total_tokens_used,
  avg(ai_generation_time_ms) filter (where deleted_at is null and status = 'completed') as avg_generation_time_ms

from trips
group by user_id;

-- create unique index on user_id for efficient lookups and concurrent refreshes
-- this index is required for using 'refresh materialized view concurrently'
create unique index idx_user_stats_user_id on user_stats(user_id);

comment on materialized view user_stats is 'pre-aggregated user statistics for efficient analytics queries - must be refreshed periodically';
comment on column user_stats.total_trips is 'total number of non-deleted trips created by user';
comment on column user_stats.completed_trips is 'number of successfully completed trips';
comment on column user_stats.draft_trips is 'number of trips still in draft status';
comment on column user_stats.total_tokens_used is 'cumulative ai tokens consumed across all user trips';
comment on column user_stats.avg_generation_time_ms is 'average time taken to generate completed trips in milliseconds';

-- ============================================================================
-- refresh instructions
-- ============================================================================
-- manual refresh (blocking): refresh materialized view user_stats;
-- concurrent refresh (non-blocking, requires unique index): refresh materialized view concurrently user_stats;
--
-- recommended: schedule periodic refresh using pg_cron extension
-- example: select cron.schedule('refresh-user-stats', '0 * * * *', 'refresh materialized view concurrently user_stats');
-- this refreshes the view every hour without blocking reads
