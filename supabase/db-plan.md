# Database Schema - VibeTravels MVP

## Tables

### trips
```sql
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description VARCHAR(2000),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  ai_generated_content JSONB,
  ai_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
  ai_tokens_used INTEGER,
  ai_generation_time_ms INTEGER,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_trip_duration CHECK (end_date - start_date <= 365)
);
```

**JSONB Structure for ai_generated_content:**
```json
{
  "summary": "Trip overview text",
  "days": [
    {
      "day_number": 1,
      "date": "2025-06-01",
      "title": "Day title",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Activity details",
          "location": "Place name",
          "duration_minutes": 120,
          "cost_estimate": "$$",
          "tips": "Optional tips"
        }
      ]
    }
  ],
  "recommendations": {
    "transportation": "Travel tips",
    "accommodation": "Where to stay",
    "budget": "Budget breakdown",
    "best_time": "When to visit"
  }
}
```

### trip_days
```sql
CREATE TABLE trip_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(200),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_day_number CHECK (day_number > 0),
  CONSTRAINT unique_trip_day UNIQUE (trip_id, day_number)
);
```
### users
```sql 
This table is manages by Supabase Auth.
CREATE TABLE users (
  id UUID PRIMARY KEY
  email: VARCHAR(255) NOT NULL UNIQUE
  encrypted_password: VARCHAR NOT NULL
  created_at: TIMESTAPTZ NOT NULL DEFAULT now()
  confirmed_at: TIMESTAPTZ
);
```

### trip_activities
```sql
CREATE TABLE trip_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_day_id UUID REFERENCES trip_days(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  time TIME,
  location VARCHAR(200),
  duration_minutes INTEGER,
  cost_estimate VARCHAR(50),
  tips TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 OR duration_minutes IS NULL),
  CONSTRAINT valid_order CHECK (order_index >= 0)
);
```

### ai_generation_logs
```sql
CREATE TABLE ai_generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  generation_time_ms INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  estimated_cost_usd DECIMAL(10, 6),
  input_data JSONB,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### user_rate_limits
```sql
CREATE TABLE user_rate_limits (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  daily_generations_count INTEGER DEFAULT 0 NOT NULL,
  daily_limit_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 day') NOT NULL,
  hourly_generations_count INTEGER DEFAULT 0 NOT NULL,
  hourly_limit_reset_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour') NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_daily_count CHECK (daily_generations_count >= 0),
  CONSTRAINT valid_hourly_count CHECK (hourly_generations_count >= 0)
);
```

### user_preferences (Future)
```sql
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Indexes

```sql
-- Trips
CREATE INDEX idx_trips_user_id ON trips(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_status ON trips(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_created_at ON trips(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_start_date ON trips(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_deleted_at ON trips(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_trips_ai_content_gin ON trips USING GIN (ai_generated_content);

-- Trip Days
CREATE INDEX idx_trip_days_trip_id ON trip_days(trip_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trip_days_date ON trip_days(date);

-- Trip Activities
CREATE INDEX idx_trip_activities_day_id ON trip_activities(trip_day_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trip_activities_order ON trip_activities(trip_day_id, order_index) WHERE deleted_at IS NULL;

-- AI Logs
CREATE INDEX idx_ai_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_trip_id ON ai_generation_logs(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX idx_ai_logs_created_at ON ai_generation_logs(created_at DESC);
CREATE INDEX idx_ai_logs_status ON ai_generation_logs(status);

-- Rate Limits
CREATE INDEX idx_rate_limits_daily_reset ON user_rate_limits(daily_limit_reset_at);
CREATE INDEX idx_rate_limits_hourly_reset ON user_rate_limits(hourly_limit_reset_at);
```

## Row Level Security Policies

```sql
-- Trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_trips"
ON trips FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "users_insert_own_trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'generating'));

CREATE POLICY "users_update_own_trips"
ON trips FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'generating', 'completed', 'failed'));

CREATE POLICY "users_delete_own_trips"
ON trips FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (deleted_at IS NOT NULL);

-- Trip Days
ALTER TABLE trip_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_trip_days"
ON trip_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = trip_days.trip_id 
    AND trips.user_id = auth.uid()
    AND trips.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

CREATE POLICY "users_modify_own_trip_days"
ON trip_days FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = trip_days.trip_id 
    AND trips.user_id = auth.uid()
    AND trips.deleted_at IS NULL
  )
);

-- Trip Activities
ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_trip_activities"
ON trip_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_days 
    JOIN trips ON trips.id = trip_days.trip_id
    WHERE trip_days.id = trip_activities.trip_day_id 
    AND trips.user_id = auth.uid()
    AND trips.deleted_at IS NULL
    AND trip_days.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

CREATE POLICY "users_modify_own_trip_activities"
ON trip_activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trip_days 
    JOIN trips ON trips.id = trip_days.trip_id
    WHERE trip_days.id = trip_activities.trip_day_id 
    AND trips.user_id = auth.uid()
    AND trips.deleted_at IS NULL
  )
);

-- AI Logs
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_ai_logs"
ON ai_generation_logs FOR SELECT
USING (auth.uid() = user_id);

-- Rate Limits
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_rate_limits"
ON user_rate_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_rate_limits"
ON user_rate_limits FOR UPDATE
USING (auth.uid() = user_id);
```

## Functions & Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_days_updated_at
  BEFORE UPDATE ON trip_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_activities_updated_at
  BEFORE UPDATE ON trip_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rate_limits_updated_at
  BEFORE UPDATE ON user_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Soft delete cascade
CREATE OR REPLACE FUNCTION cascade_soft_delete_trip()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE trip_days
    SET deleted_at = NEW.deleted_at
    WHERE trip_id = NEW.id AND deleted_at IS NULL;
    
    UPDATE trip_activities
    SET deleted_at = NEW.deleted_at
    WHERE trip_day_id IN (
      SELECT id FROM trip_days WHERE trip_id = NEW.id
    ) AND deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cascade_soft_delete_on_trip
  AFTER UPDATE OF deleted_at ON trips
  FOR EACH ROW
  EXECUTE FUNCTION cascade_soft_delete_trip();

-- Trip count limit
CREATE OR REPLACE FUNCTION enforce_trip_limit()
RETURNS TRIGGER AS $$
DECLARE
  trip_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trip_count
  FROM trips
  WHERE user_id = NEW.user_id
  AND deleted_at IS NULL;
  
  IF trip_count >= 100 THEN
    RAISE EXCEPTION 'User has reached maximum limit of 100 trips';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_trip_limit_trigger
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION enforce_trip_limit();

-- Day sequence validation
CREATE OR REPLACE FUNCTION validate_trip_day_sequence()
RETURNS TRIGGER AS $$
DECLARE
  trip_start_date DATE;
  expected_date DATE;
BEGIN
  SELECT start_date INTO trip_start_date
  FROM trips
  WHERE id = NEW.trip_id;
  
  expected_date := trip_start_date + (NEW.day_number - 1);
  
  IF NEW.date != expected_date THEN
    RAISE EXCEPTION 'Day % date (%) does not match expected date (%) based on trip start date',
      NEW.day_number, NEW.date, expected_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_trip_day_sequence_trigger
  BEFORE INSERT OR UPDATE ON trip_days
  FOR EACH ROW
  EXECUTE FUNCTION validate_trip_day_sequence();

-- Cleanup old deleted records
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records()
RETURNS void AS $$
BEGIN
  DELETE FROM trip_activities
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM trip_days
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM trips
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create default rate limits on user signup
CREATE OR REPLACE FUNCTION create_default_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_rate_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_rate_limits_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_rate_limits();
```

## Materialized View

```sql
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_trips,
  COUNT(*) FILTER (WHERE status = 'completed' AND deleted_at IS NULL) as completed_trips,
  COUNT(*) FILTER (WHERE status = 'draft' AND deleted_at IS NULL) as draft_trips,
  MAX(created_at) FILTER (WHERE deleted_at IS NULL) as last_trip_created_at,
  SUM(ai_tokens_used) FILTER (WHERE deleted_at IS NULL) as total_tokens_used,
  AVG(ai_generation_time_ms) FILTER (WHERE deleted_at IS NULL AND status = 'completed') as avg_generation_time_ms
FROM trips
GROUP BY user_id;

CREATE UNIQUE INDEX idx_user_stats_user_id ON user_stats(user_id);
```

## Relationships

| Parent | Child | Type | Cascade |
|--------|-------|------|---------|
| auth.users | trips | 1:N | RLS |
| trips | trip_days | 1:N | CASCADE |
| trip_days | trip_activities | 1:N | CASCADE |
| auth.users | ai_generation_logs | 1:N | None |
| trips | ai_generation_logs | 1:N | SET NULL |
| auth.users | user_rate_limits | 1:1 | CASCADE |