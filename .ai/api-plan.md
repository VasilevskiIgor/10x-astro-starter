# REST API Plan - VibeTravels MVP

## Overview

This REST API plan defines the backend interface for VibeTravels MVP, a travel planning application that generates personalized trip itineraries using AI. The API is built on Supabase (PostgreSQL + Auth) and follows RESTful conventions.

**Base URL**: `/api`

**Authentication**: All endpoints (except public health checks) require Supabase JWT authentication via `Authorization: Bearer <token>` header.

**Authorization**: Row Level Security (RLS) policies in Supabase automatically filter data by authenticated user.

---

## 1. Resources

| Resource | Database Table | Description |
|----------|----------------|-------------|
| Trips | `trips` | User's travel plans with AI-generated itineraries |
| Rate Limits | `user_rate_limits` | User's AI generation quota tracking |
| AI Logs | `ai_generation_logs` | Internal logging of AI API calls (read-only) |

**Note**: For MVP minimum scope, `trip_days` and `trip_activities` are stored as JSONB within `trips.ai_generated_content` rather than exposed as separate API resources.

---

## 2. Authentication Endpoints

## 3. Trip Endpoints

### 3.1 List User's Trips

**Endpoint**: `GET /api/trips`

**Description**: Retrieves paginated list of authenticated user's trips, ordered by creation date (newest first).

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Number of trips per page (max 100) |
| `offset` | integer | No | 0 | Number of trips to skip |
| `status` | string | No | - | Filter by status: 'draft', 'generating', 'completed', 'failed' |
| `sort` | string | No | 'created_at:desc' | Sort field and order (e.g., 'start_date:asc') |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "destination": "Paris, France",
      "start_date": "2025-06-01",
      "end_date": "2025-06-05",
      "description": "Romantic getaway",
      "status": "completed",
      "ai_model": "gpt-3.5-turbo",
      "ai_tokens_used": 450,
      "ai_generation_time_ms": 2300,
      "view_count": 3,
      "last_viewed_at": "2025-01-15T10:30:00Z",
      "edit_count": 1,
      "last_edited_at": "2025-01-14T15:20:00Z",
      "created_at": "2025-01-14T14:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

- `400 Bad Request`: Invalid query parameters
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid limit value. Must be between 1 and 100",
    "details": {
      "field": "limit",
      "value": 150
    }
  }
}
```

---

### 3.2 Get Trip Details

**Endpoint**: `GET /api/trips/:id`

**Description**: Retrieves full details of a specific trip, including AI-generated content. Updates `view_count` and `last_viewed_at`.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Trip ID |

**Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "destination": "Tokyo, Japan",
  "start_date": "2025-06-01",
  "end_date": "2025-06-07",
  "description": "First time in Japan, interested in culture and food",
  "status": "completed",
  "ai_generated_content": {
    "summary": "A 7-day cultural and culinary journey through Tokyo...",
    "days": [
      {
        "day_number": 1,
        "date": "2025-06-01",
        "title": "Arrival and Shibuya Exploration",
        "activities": [
          {
            "time": "09:00",
            "title": "Arrive at Narita Airport",
            "description": "Take Narita Express to Tokyo Station",
            "location": "Narita Airport",
            "duration_minutes": 90,
            "cost_estimate": "$$",
            "tips": "Purchase Suica card for convenient travel"
          }
        ]
      }
    ],
    "recommendations": {
      "transportation": "JR Pass highly recommended for 7 days",
      "accommodation": "Stay in Shinjuku for easy access",
      "budget": "Estimated $1500-2000 per person",
      "best_time": "June is pleasant with occasional rain"
    }
  },
  "ai_model": "gpt-4",
  "ai_tokens_used": 1250,
  "ai_generation_time_ms": 4500,
  "view_count": 1,
  "last_viewed_at": "2025-01-15T10:30:00Z",
  "edit_count": 0,
  "created_at": "2025-01-15T10:25:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Trip belongs to another user
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have access to this trip"
  }
}
```

- `404 Not Found`: Trip doesn't exist
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip not found"
  }
}
```

---

### 3.3 Create Trip

**Endpoint**: `POST /api/trips`

**Description**: Creates a new trip. Optionally triggers AI generation if `generate_ai: true` is passed.

**Authentication**: Required

**Request Body**:
```json
{
  "destination": "Barcelona, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-17",
  "description": "Family vacation with kids, interested in beaches and architecture",
  "generate_ai": false
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `destination` | string | Yes | Max 200 characters |
| `start_date` | date (ISO 8601) | Yes | Valid date |
| `end_date` | date (ISO 8601) | Yes | Valid date, >= start_date, <= start_date + 365 days |
| `description` | string | No | Max 2000 characters |
| `generate_ai` | boolean | No | Default: false |

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "destination": "Barcelona, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-17",
  "description": "Family vacation with kids, interested in beaches and architecture",
  "status": "draft",
  "ai_generated_content": null,
  "created_at": "2025-01-15T11:00:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Note**: If `generate_ai: true`, status will be `"generating"` and you should poll `GET /api/trips/:id` or use the separate generation endpoint.

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Validation errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after start date"
      },
      {
        "field": "destination",
        "message": "Destination is required"
      }
    ]
  }
}
```

- `403 Forbidden`: User reached 100 trips limit
```json
{
  "error": {
    "code": "TRIP_LIMIT_EXCEEDED",
    "message": "You have reached the maximum limit of 100 trips"
  }
}
```

---

### 3.4 Update Trip

**Endpoint**: `PATCH /api/trips/:id`

**Description**: Updates basic trip information. AI-generated content cannot be modified (use regenerate endpoint instead).

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Trip ID |

**Request Body** (all fields optional):
```json
{
  "destination": "Barcelona and Madrid, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-20",
  "description": "Extended family vacation"
}
```

| Field | Type | Validation |
|-------|------|------------|
| `destination` | string | Max 200 characters |
| `start_date` | date (ISO 8601) | Valid date |
| `end_date` | date (ISO 8601) | Valid date, >= start_date, <= start_date + 365 days |
| `description` | string | Max 2000 characters |

**Response** (200 OK):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "destination": "Barcelona and Madrid, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-20",
  "description": "Extended family vacation",
  "status": "completed",
  "edit_count": 2,
  "last_edited_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-01-15T12:00:00Z"
}
```

**Note**: `edit_count` is automatically incremented and `last_edited_at` is updated.

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Trip belongs to another user
- `404 Not Found`: Trip doesn't exist
- `400 Bad Request`: Validation errors

---

### 3.5 Delete Trip

**Endpoint**: `DELETE /api/trips/:id`

**Description**: Permanently deletes a trip (hard delete). For MVP minimum scope, soft delete is optional.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Trip ID |

**Response** (204 No Content):
```
(empty response body)
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Trip belongs to another user
- `404 Not Found`: Trip doesn't exist

---

### 3.6 Generate AI Itinerary

**Endpoint**: `POST /api/trips/:id/generate-ai`

**Description**: Triggers AI generation for an existing trip. Updates trip status to 'generating', calls OpenAI/OpenRouter API, and updates trip with AI content.

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Trip ID |

**Request Body** (optional):
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "force_regenerate": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `model` | string | No | "gpt-3.5-turbo" | AI model to use |
| `temperature` | float | No | 0.7 | AI creativity (0.0-1.0) |
| `force_regenerate` | boolean | No | false | Regenerate even if content exists |

**Response** (202 Accepted):
```json
{
  "id": "uuid",
  "status": "generating",
  "message": "AI generation started. This may take 30-60 seconds.",
  "estimated_completion": "2025-01-15T12:01:30Z"
}
```

**Alternative: Synchronous Response** (200 OK) - if generation completes quickly:
```json
{
  "id": "uuid",
  "status": "completed",
  "ai_generated_content": { /* full AI content */ },
  "ai_model": "gpt-3.5-turbo",
  "ai_tokens_used": 850,
  "ai_generation_time_ms": 3200
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Trip belongs to another user
- `404 Not Found`: Trip doesn't exist

- `429 Too Many Requests`: Rate limit exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded your hourly AI generation limit",
    "details": {
      "limit": "hourly",
      "reset_at": "2025-01-15T13:00:00Z",
      "daily_remaining": 3
    }
  }
}
```

- `409 Conflict`: Trip already generating
```json
{
  "error": {
    "code": "GENERATION_IN_PROGRESS",
    "message": "AI generation already in progress for this trip"
  }
}
```

- `500 Internal Server Error`: AI API failure
```json
{
  "error": {
    "code": "AI_GENERATION_FAILED",
    "message": "Failed to generate trip plan",
    "details": {
      "reason": "AI service timeout"
    }
  }
}
```

**Implementation Notes**:
1. Check user's rate limits before calling AI API
2. Update `user_rate_limits` counters after successful generation
3. Log all attempts to `ai_generation_logs` table
4. Set trip status to 'failed' if AI call fails
5. Use timeout of 30-60 seconds for AI API call

---

## 4. Rate Limit Endpoints

### 4.1 Get User Rate Limits

**Endpoint**: `GET /api/users/me/rate-limits`

**Description**: Retrieves authenticated user's AI generation quota and usage.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "user_id": "uuid",
  "hourly": {
    "limit": 5,
    "used": 2,
    "remaining": 3,
    "reset_at": "2025-01-15T13:00:00Z"
  },
  "daily": {
    "limit": 10,
    "used": 5,
    "remaining": 5,
    "reset_at": "2025-01-16T00:00:00Z"
  },
  "updated_at": "2025-01-15T12:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token

---

## 5. AI Generation Log Endpoints (Optional)

For MVP minimum, these endpoints are **optional** and primarily for admin/debugging purposes.

### 5.1 Get User's AI Logs

**Endpoint**: `GET /api/users/me/ai-logs`

**Description**: Retrieves authenticated user's AI generation history.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Number of logs per page |
| `offset` | integer | No | 0 | Number of logs to skip |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "model": "gpt-3.5-turbo",
      "prompt_tokens": 150,
      "completion_tokens": 700,
      "total_tokens": 850,
      "generation_time_ms": 3200,
      "status": "success",
      "estimated_cost_usd": 0.002125,
      "created_at": "2025-01-15T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 6. Health Check Endpoint

### 6.1 API Health Check

**Endpoint**: `GET /api/health`

**Description**: Returns API health status (public, no auth required).

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-15T12:00:00Z",
  "services": {
    "database": "healthy",
    "auth": "healthy",
    "ai": "healthy"
  }
}
```

### 7.4 Row Level Security (RLS)

All database operations automatically filtered by Supabase RLS policies:

**trips table**:
- Users can SELECT only their own trips (`WHERE user_id = auth.uid()`)
- Users can INSERT trips with their own user_id
- Users can UPDATE only their own trips
- Users can DELETE only their own trips

**RLS Policy Examples**:
```sql
-- View own trips
CREATE POLICY "users_view_own_trips"
ON trips FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Insert own trips
CREATE POLICY "users_insert_own_trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update own trips
CREATE POLICY "users_update_own_trips"
ON trips FOR UPDATE
USING (auth.uid() = user_id);

-- Delete own trips
CREATE POLICY "users_delete_own_trips"
ON trips FOR DELETE
USING (auth.uid() = user_id);
```

### 7.5 Authorization Flow

```
Client Request
    ↓
API receives request with JWT
    ↓
Supabase validates JWT signature
    ↓
Extract user_id from JWT (auth.uid())
    ↓
Database query executed
    ↓
RLS policies filter by user_id
    ↓
Return only user's data
```

### 7.6 Error Handling

**Missing Token**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Invalid/Expired Token**:
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired authentication token"
  }
}
```

**Insufficient Permissions**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

---

## 8. Validation and Business Logic

### 8.1 Trip Validation Rules

| Field | Validation | Error Message |
|-------|-----------|---------------|
| `destination` | Required, max 200 chars | "Destination is required and must be less than 200 characters" |
| `start_date` | Required, valid date | "Start date is required and must be a valid date" |
| `end_date` | Required, valid date | "End date is required and must be a valid date" |
| `end_date` vs `start_date` | `end_date >= start_date` | "End date must be after or equal to start date" |
| Trip duration | `end_date - start_date <= 365` | "Trip duration cannot exceed 365 days" |
| `description` | Max 2000 chars | "Description must be less than 2000 characters" |
| `status` | Must be 'draft', 'generating', 'completed', 'failed' | "Invalid status value" |

### 8.2 Business Logic Rules

**Trip Limit per User**:
- Maximum: 100 trips per user
- Enforced by database trigger: `enforce_trip_limit_trigger`
- Error: `TRIP_LIMIT_EXCEEDED` (403)

**AI Generation Rate Limits**:
- Hourly limit: 5 generations (configurable)
- Daily limit: 10 generations (configurable)
- Checked before calling AI API
- Error: `RATE_LIMIT_EXCEEDED` (429)

**AI Generation Timeout**:
- Maximum wait time: 60 seconds
- If exceeded, set trip status to 'failed'
- Log error in `ai_generation_logs`
- Error: `AI_GENERATION_TIMEOUT` (500)

**Soft Delete (Optional for MVP)**:
- Instead of hard delete, set `deleted_at` timestamp
- Deleted records cleaned up after 30 days via `cleanup_old_deleted_records()`
- All queries filter `WHERE deleted_at IS NULL`

**Trip Metrics Tracking**:
- `view_count`: Incremented on each GET /api/trips/:id
- `last_viewed_at`: Updated on each view
- `edit_count`: Incremented on each PATCH /api/trips/:id
- `last_edited_at`: Updated on each edit

### 8.3 Validation Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after start date",
        "value": "2025-05-01"
      },
      {
        "field": "destination",
        "message": "Destination is required"
      }
    ]
  }
}
```

---

## 9. Error Response Standards

### 9.1 Error Response Structure

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional context
  }
}
```

### 9.2 HTTP Status Codes

| Status Code | Usage |
|-------------|-------|
| 200 OK | Successful GET, PATCH requests |
| 201 Created | Successful POST (create) |
| 202 Accepted | Async operation started (AI generation) |
| 204 No Content | Successful DELETE |
| 400 Bad Request | Validation errors, invalid parameters |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Insufficient permissions, rate limits, quotas |
| 404 Not Found | Resource doesn't exist |
| 409 Conflict | Resource state conflict (e.g., already generating) |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Server/AI service errors |
| 503 Service Unavailable | Temporary service outage |

### 9.3 Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing authentication |
| `INVALID_TOKEN` | 401 | Invalid/expired JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_PARAMS` | 400 | Invalid query parameters |
| `TRIP_LIMIT_EXCEEDED` | 403 | Max 100 trips reached |
| `RATE_LIMIT_EXCEEDED` | 429 | AI generation quota exceeded |
| `GENERATION_IN_PROGRESS` | 409 | AI already generating for this trip |
| `AI_GENERATION_FAILED` | 500 | AI service error |
| `AI_GENERATION_TIMEOUT` | 500 | AI call exceeded 60s timeout |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. API Versioning

For MVP minimum, versioning is **not implemented**. All endpoints are under `/api`.

**Future considerations**:
- Version 2: `/api/v2/trips`
- Header-based: `Accept: application/vnd.vibetravels.v2+json`

---

## 11. Rate Limiting (API-level)

Beyond AI generation rate limits, consider implementing general API rate limiting:

**Recommended limits** (per user):
- 100 requests per minute
- 1000 requests per hour

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642258800
```

**Implementation**: Can use Supabase Edge Functions middleware or API gateway (e.g., Kong, Nginx).

---

## 12. CORS Configuration

**Allowed Origins** (for MVP):
- Production: `https://vibetravels.com`
- Development: `http://localhost:4321`, `http://localhost:3000`

**Allowed Methods**: GET, POST, PATCH, DELETE, OPTIONS

**Allowed Headers**: Authorization, Content-Type

**Credentials**: true (to send cookies/auth headers)

---

## 13. Pagination Standards

All list endpoints support pagination:

**Query Parameters**:
- `limit`: Number of items (1-100, default 20)
- `offset`: Number of items to skip (default 0)

**Alternative (cursor-based)**:
- `limit`: Number of items
- `cursor`: Opaque cursor for next page

**Response**:
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_cursor": "eyJpZCI6InV1aWQifQ==" // if cursor-based
  }
}
```

---

## 14. Filtering and Sorting

### 14.1 Filtering

**Format**: `?field=value`

**Examples**:
- `GET /api/trips?status=completed`
- `GET /api/trips?status=completed&start_date_gte=2025-06-01`

**Supported Operators**:
- `field`: Exact match
- `field_gte`: Greater than or equal
- `field_lte`: Less than or equal
- `field_contains`: Substring match (for text fields)

### 14.2 Sorting

**Format**: `?sort=field:direction`

**Examples**:
- `GET /api/trips?sort=created_at:desc` (default)
- `GET /api/trips?sort=start_date:asc`
- `GET /api/trips?sort=destination:asc,start_date:desc` (multiple)

**Supported Fields**:
- `created_at`, `updated_at`, `start_date`, `end_date`, `destination`, `status`

---

## 15. Webhook Events (Future)

For future premium features, consider webhooks for:

| Event | Trigger |
|-------|---------|
| `trip.created` | New trip created |
| `trip.updated` | Trip updated |
| `trip.deleted` | Trip deleted |
| `trip.ai_generation_started` | AI generation started |
| `trip.ai_generation_completed` | AI generation completed |
| `trip.ai_generation_failed` | AI generation failed |

**Webhook payload**:
```json
{
  "event": "trip.ai_generation_completed",
  "data": { /* trip object */ },
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## 16. Testing Recommendations

### 16.1 Unit Tests
- Validation logic
- Business rules (trip limit, rate limits)
- Error handling

### 16.2 Integration Tests
- API endpoints with Supabase
- RLS policy enforcement
- Authentication flow

### 16.3 E2E Tests (Required for MVP)
Minimum 1 test covering:
1. User signup
2. Create trip
3. Generate AI itinerary
4. View trip details
5. Edit trip
6. Delete trip

**Example test** (Playwright):
```typescript
test('complete user journey', async ({ page }) => {
  // 1. Signup
  await page.goto('/signup');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.click('button[type="submit"]');

  // 2. Create trip
  await page.click('text=Create New Plan');
  await page.fill('input[name="destination"]', 'Tokyo');
  await page.fill('input[name="startDate"]', '2025-06-01');
  await page.fill('input[name="endDate"]', '2025-06-07');
  await page.click('button:has-text("Generate with AI")');

  // 3. Verify AI generation
  await page.waitForURL(/\/trips\/.*/, { timeout: 90000 });
  await expect(page.locator('text=Tokyo')).toBeVisible();

  // 4. Edit trip
  await page.click('button:has-text("Edit")');
  await page.fill('input[name="destination"]', 'Tokyo and Kyoto');
  await page.click('button:has-text("Save")');

  // 5. Delete trip
  await page.click('button:has-text("Delete")');
  await page.click('button:has-text("Confirm")');
  await expect(page.locator('text=Tokyo and Kyoto')).not.toBeVisible();
});
```

---

## 17. Performance Considerations

### 17.1 Database Indexes

Ensure these indexes exist (from db-plan.md):
```sql
-- Critical for list queries
CREATE INDEX idx_trips_user_id ON trips(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_created_at ON trips(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_status ON trips(status) WHERE deleted_at IS NULL;

-- For AI content search (future)
CREATE INDEX idx_trips_ai_content_gin ON trips USING GIN (ai_generated_content);
```

### 17.2 Query Optimization

- Use `SELECT` with specific fields instead of `SELECT *`
- Limit AI content in list queries (exclude `ai_generated_content`)
- Use pagination for large result sets

### 17.3 Caching (Future)

Consider caching for:
- User rate limits (Redis)
- Trip details (CDN for static content)
- AI-generated content (immutable after creation)

---

## 18. Security Best Practices

### 18.1 Input Validation
- ✅ Validate all user inputs
- ✅ Sanitize strings to prevent XSS
- ✅ Use parameterized queries (Supabase does this)

### 18.2 Authentication
- ✅ Use HTTPS only
- ✅ JWT token in Authorization header (not URL)
- ✅ Short access token expiry (1 hour)
- ✅ Refresh token rotation

### 18.3 Authorization
- ✅ RLS policies on all tables
- ✅ Never trust client-provided user_id
- ✅ Always use auth.uid() from JWT

### 18.4 Rate Limiting
- ✅ API-level rate limiting (100 req/min)
- ✅ AI generation quotas
- ✅ Exponential backoff for failed AI calls

### 18.5 API Keys
- ✅ Store OpenAI key in environment variables
- ✅ Never expose keys in responses
- ✅ Rotate keys periodically

---

## 19. Monitoring and Logging

### 19.1 Logging

**What to log**:
- All AI API calls → `ai_generation_logs` table
- Failed authentication attempts
- Rate limit violations
- 4xx and 5xx errors

**Log format** (structured JSON):
```json
{
  "timestamp": "2025-01-15T12:00:00Z",
  "level": "INFO",
  "user_id": "uuid",
  "endpoint": "POST /api/trips/:id/generate-ai",
  "status_code": 202,
  "duration_ms": 3200,
  "metadata": {}
}
```

### 19.2 Metrics

**Key metrics to track**:
- API request count by endpoint
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- AI generation success rate
- AI API cost per user
- Active users per day

### 19.3 Alerts

**Alert on**:
- Error rate > 5%
- AI generation failures > 20%
- Database connection issues
- High AI API costs (> $X per hour)

---

## 20. API Documentation

### 20.1 Interactive Documentation

**Recommended tools**:
- Swagger/OpenAPI 3.0
- Postman Collection
- Redoc

**Auto-generate from**:
- TypeScript types
- API route definitions

### 20.2 Code Examples

Provide examples in:
- JavaScript/TypeScript (Supabase client)
- cURL
- Python (requests library)

**Example**:
```typescript
// Create a trip
const { data, error } = await supabase
  .from('trips')
  .insert({
    destination: 'Paris',
    start_date: '2025-06-01',
    end_date: '2025-06-05',
    description: 'Romantic getaway'
  })
  .select()
  .single();
```

---

## 21. Migration Path (MVP → Full Product)

### Phase 1: MVP Minimum (Current)
✅ Basic CRUD
✅ AI generation
✅ Email/password auth
✅ Rate limiting

### Phase 2: Enhanced MVP
- Soft delete with recovery
- Trip sharing (view-only links)
- Export to PDF
- Google OAuth

### Phase 3: Premium Features
- Premium tier with Stripe
- Advanced AI models (GPT-4, Claude)
- Collaborative trip planning
- Mobile app API

### API Changes Needed:
- Add `shared_token` field to trips
- Add `subscription_tier` to users
- Add payment webhook endpoints
- Add collaboration endpoints

---

## Appendix A: Complete Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| GET | `/api/trips` | List user's trips | Yes |
| POST | `/api/trips` | Create new trip | Yes |
| GET | `/api/trips/:id` | Get trip details | Yes |
| PATCH | `/api/trips/:id` | Update trip | Yes |
| DELETE | `/api/trips/:id` | Delete trip | Yes |
| POST | `/api/trips/:id/generate-ai` | Generate AI itinerary | Yes |
| GET | `/api/users/me/rate-limits` | Get rate limits | Yes |
| GET | `/api/users/me/ai-logs` | Get AI generation logs | Yes |

---

## Appendix B: Database Schema Reference

**Key tables**:
- `auth.users` (Supabase managed)
- `trips` (main resource)
- `trip_days` (nested in JSONB for MVP)
- `trip_activities` (nested in JSONB for MVP)
- `ai_generation_logs` (internal tracking)
- `user_rate_limits` (quota management)

**Key constraints**:
- `valid_dates`: end_date >= start_date
- `valid_trip_duration`: max 365 days
- `unique_trip_day`: unique (trip_id, day_number)
- Trip limit: 100 per user (trigger)

---

## Appendix C: AI Generation Prompt Template

```typescript
const generatePrompt = (trip: Trip) => `
Create a detailed travel itinerary for the following trip:

Destination: ${trip.destination}
Start Date: ${trip.start_date}
End Date: ${trip.end_date}
Duration: ${calculateDays(trip.start_date, trip.end_date)} days
${trip.description ? `Additional Information: ${trip.description}` : ''}

Please provide:
1. A brief summary of the trip
2. Day-by-day itinerary with:
   - Suggested activities with times
   - Locations and descriptions
   - Estimated duration and cost
   - Practical tips
3. General recommendations for:
   - Transportation options
   - Accommodation areas
   - Budget estimates
   - Best time to visit considerations

Format the response as JSON matching this structure:
{
  "summary": "...",
  "days": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "title": "...",
      "activities": [
        {
          "time": "HH:MM",
          "title": "...",
          "description": "...",
          "location": "...",
          "duration_minutes": 120,
          "cost_estimate": "$$",
          "tips": "..."
        }
      ]
    }
  ],
  "recommendations": {
    "transportation": "...",
    "accommodation": "...",
    "budget": "...",
    "best_time": "..."
  }
}
`;
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Status**: Draft for MVP Minimum Scope
