-- migration: create initial tables for vibetravels mvp
-- description: creates core tables for trips, trip_days, trip_activities, ai_generation_logs, and user_rate_limits
-- author: claude
-- date: 2025-10-13

-- ============================================================================
-- trips table
-- ============================================================================
-- stores main trip information including ai-generated content and metadata
-- includes soft delete support via deleted_at column
-- tracks ai generation metrics and user engagement statistics

create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  destination varchar(200) not null,
  start_date date not null,
  end_date date not null,
  description varchar(2000),
  status text default 'draft' check (status in ('draft', 'generating', 'completed', 'failed')),

  -- ai generation metadata
  ai_generated_content jsonb,
  ai_model varchar(100) default 'gpt-3.5-turbo',
  ai_tokens_used integer,
  ai_generation_time_ms integer,

  -- engagement tracking
  view_count integer default 0,
  last_viewed_at timestamptz,
  edit_count integer default 0,
  last_edited_at timestamptz,

  -- timestamps and soft delete
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz,

  -- constraints
  constraint valid_dates check (end_date >= start_date),
  constraint valid_trip_duration check (end_date - start_date <= 365)
);

-- enable row level security on trips table
-- this ensures users can only access their own trips
alter table trips enable row level security;

comment on table trips is 'stores trip information with ai-generated itineraries and metadata';
comment on column trips.ai_generated_content is 'jsonb structure containing trip summary, daily activities, and recommendations';
comment on column trips.status is 'trip generation status: draft, generating, completed, or failed';
comment on column trips.deleted_at is 'soft delete timestamp - null means record is active';

-- ============================================================================
-- trip_days table
-- ============================================================================
-- stores individual days within a trip
-- enforces unique day numbers per trip
-- cascades deletes from parent trip

create table trip_days (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  day_number integer not null,
  date date not null,
  title varchar(200),
  summary text,

  -- timestamps and soft delete
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz,

  -- constraints
  constraint valid_day_number check (day_number > 0),
  constraint unique_trip_day unique (trip_id, day_number)
);

-- enable row level security on trip_days table
-- access is controlled through the parent trips table
alter table trip_days enable row level security;

comment on table trip_days is 'stores individual days within a trip itinerary';
comment on column trip_days.day_number is 'sequential day number starting from 1';
comment on constraint unique_trip_day on trip_days is 'ensures each trip has unique day numbers';

-- ============================================================================
-- trip_activities table
-- ============================================================================
-- stores activities for each trip day
-- includes scheduling, location, cost estimates, and ordering
-- cascades deletes from parent trip_day

create table trip_activities (
  id uuid default gen_random_uuid() primary key,
  trip_day_id uuid references trip_days(id) on delete cascade not null,
  title varchar(200) not null,
  description text,
  time time,
  location varchar(200),
  duration_minutes integer,
  cost_estimate varchar(50),
  tips text,
  order_index integer default 0,

  -- timestamps and soft delete
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz,

  -- constraints
  constraint valid_duration check (duration_minutes > 0 or duration_minutes is null),
  constraint valid_order check (order_index >= 0)
);

-- enable row level security on trip_activities table
-- access is controlled through the parent trip_days and trips tables
alter table trip_activities enable row level security;

comment on table trip_activities is 'stores activities within each trip day';
comment on column trip_activities.order_index is 'controls the display order of activities within a day';
comment on column trip_activities.cost_estimate is 'text-based cost estimate (e.g., $, $$, $$$)';

-- ============================================================================
-- ai_generation_logs table
-- ============================================================================
-- tracks all ai generation requests for monitoring and cost analysis
-- stores token usage, timing, status, and error information
-- nullable trip_id allows orphaned logs if trip is deleted

create table ai_generation_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  trip_id uuid references trips(id) on delete set null,
  model varchar(100) not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  generation_time_ms integer not null,
  status varchar(50) not null check (status in ('success', 'error', 'timeout')),
  error_message text,
  estimated_cost_usd decimal(10, 6),

  -- optional debug data
  input_data jsonb,
  response_data jsonb,

  created_at timestamptz default now() not null
);

-- enable row level security on ai_generation_logs table
-- users can view their own generation logs for transparency
alter table ai_generation_logs enable row level security;

comment on table ai_generation_logs is 'tracks ai generation requests for monitoring, debugging, and cost analysis';
comment on column ai_generation_logs.status is 'generation outcome: success, error, or timeout';
comment on column ai_generation_logs.estimated_cost_usd is 'calculated cost based on token usage and model pricing';

-- ============================================================================
-- user_rate_limits table
-- ============================================================================
-- tracks user rate limits for ai generation requests
-- supports both hourly and daily limits
-- auto-resets based on reset_at timestamps

create table user_rate_limits (
  user_id uuid references auth.users(id) primary key,
  daily_generations_count integer default 0 not null,
  daily_limit_reset_at timestamptz default (now() + interval '1 day') not null,
  hourly_generations_count integer default 0 not null,
  hourly_limit_reset_at timestamptz default (now() + interval '1 hour') not null,
  updated_at timestamptz default now() not null,

  -- constraints
  constraint valid_daily_count check (daily_generations_count >= 0),
  constraint valid_hourly_count check (hourly_generations_count >= 0)
);

-- enable row level security on user_rate_limits table
-- users can view and update their own rate limit records
alter table user_rate_limits enable row level security;

comment on table user_rate_limits is 'tracks user rate limits for ai generation to prevent abuse';
comment on column user_rate_limits.daily_limit_reset_at is 'timestamp when daily counter resets';
comment on column user_rate_limits.hourly_limit_reset_at is 'timestamp when hourly counter resets';
