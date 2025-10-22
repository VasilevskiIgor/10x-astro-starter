# Testing Guide: POST /api/trips Endpoint

## Prerequisites

Before testing the endpoint, ensure:

1. **Supabase is running locally**:
   ```bash
   supabase start
   ```

2. **Astro dev server is running**:
   ```bash
   cd 10x-astro-starter
   npm run dev
   ```

3. **You have a valid JWT token**:
   - Create a test user in Supabase
   - Get the JWT token from authentication

## Getting a Test JWT Token

### Option 1: Using Supabase CLI

```bash
# Create a test user (if not exists)
supabase db reset

# The local Supabase comes with a test user:
# Email: test@example.com
# Password: password (configure in your seed script)
```

### Option 2: Using Supabase Studio

1. Open Supabase Studio: http://localhost:54323
2. Go to Authentication > Users
3. Create a new user or use existing test user
4. Copy the JWT token from the session

### Option 3: Programmatic login

```bash
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }'
```

The response will contain an `access_token` field.

## Test Cases

### 1. Success - Create Trip Without AI Generation

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Paris, France",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "description": "Romantic getaway to explore the city of lights"
  }'
```

**Expected Response**: `201 Created`
```json
{
  "id": "uuid-here",
  "user_id": "user-uuid",
  "destination": "Paris, France",
  "start_date": "2025-06-01",
  "end_date": "2025-06-05",
  "description": "Romantic getaway to explore the city of lights",
  "status": "draft",
  "ai_generated_content": null,
  "ai_model": null,
  "ai_tokens_used": null,
  "ai_generation_time_ms": null,
  "view_count": 0,
  "last_viewed_at": null,
  "edit_count": 0,
  "last_edited_at": null,
  "created_at": "2025-10-16T10:00:00.000Z",
  "updated_at": "2025-10-16T10:00:00.000Z"
}
```

### 2. Success - Create Trip With AI Generation Flag

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Tokyo, Japan",
    "start_date": "2025-08-10",
    "end_date": "2025-08-17",
    "description": "First time in Japan, interested in culture and food",
    "generate_ai": true
  }'
```

**Expected Response**: `201 Created`
- Note: `status` will be `"generating"` instead of `"draft"`
- Note: `ai_model` will be `"gpt-3.5-turbo"` (even though AI generation is not implemented yet)

### 3. Error - Missing Authentication

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "London, UK",
    "start_date": "2025-07-01",
    "end_date": "2025-07-05"
  }'
```

**Expected Response**: `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 4. Error - Invalid JWT Token

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_here" \
  -d '{
    "destination": "London, UK",
    "start_date": "2025-07-01",
    "end_date": "2025-07-05"
  }'
```

**Expected Response**: `401 Unauthorized`
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired authentication token"
  }
}
```

### 5. Error - Missing Required Fields

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Barcelona"
  }'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "start_date",
        "message": "Start date is required"
      },
      {
        "field": "end_date",
        "message": "End date is required"
      }
    ]
  }
}
```

### 6. Error - Invalid Date Range

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Rome, Italy",
    "start_date": "2025-06-10",
    "end_date": "2025-06-01"
  }'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after or equal to start date",
        "value": "2025-06-01"
      }
    ]
  }
}
```

### 7. Error - Trip Duration Exceeds 365 Days

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "World Tour",
    "start_date": "2025-01-01",
    "end_date": "2026-01-05"
  }'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "end_date",
        "message": "Trip duration cannot exceed 365 days",
        "value": 369
      }
    ]
  }
}
```

### 8. Error - Destination Too Long

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "This is a very long destination name that exceeds the maximum allowed length of 200 characters. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05"
  }'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "destination",
        "message": "Destination must be less than 200 characters",
        "value": 250
      }
    ]
  }
}
```

### 9. Error - Invalid JSON Format

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d 'invalid json here'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid JSON format"
  }
}
```

### 10. Error - Missing Content-Type Header

**Request**:
```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Berlin, Germany",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05"
  }'
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Content-Type must be application/json"
  }
}
```

## Verification in Database

After successfully creating a trip, verify in Supabase Studio:

1. Open: http://localhost:54323
2. Navigate to: Table Editor > trips
3. Verify the new trip record exists with correct data
4. Check that:
   - `user_id` matches the authenticated user
   - `status` is 'draft' or 'generating'
   - `created_at` and `updated_at` are set
   - Other fields match the request

## Testing Trip Limit (100 trips per user)

To test the 100 trip limit:

1. Create 100 trips for a test user
2. Attempt to create the 101st trip
3. Expected Response: `403 Forbidden`

```json
{
  "error": {
    "code": "TRIP_LIMIT_EXCEEDED",
    "message": "You have reached the maximum limit of 100 trips"
  }
}
```

**Note**: You'll need to write a script to create 100 trips or manually modify the database trigger for testing purposes.

## Automated Testing

For automated testing, consider creating a test suite using:

- **Vitest** for unit tests
- **Playwright** or **Cypress** for E2E tests
- **Bruno** or **Postman** for API testing

Example test structure:

```typescript
// tests/api/trips.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/trips', () => {
  it('should create trip with valid data', async () => {
    const response = await fetch('http://localhost:3000/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        destination: 'Paris, France',
        start_date: '2025-06-01',
        end_date: '2025-06-05'
      })
    });

    expect(response.status).toBe(201);
    const trip = await response.json();
    expect(trip.destination).toBe('Paris, France');
    expect(trip.status).toBe('draft');
  });
});
```

## Common Issues & Troubleshooting

### Issue: "ECONNREFUSED" when testing

**Solution**: Ensure both Supabase and Astro dev server are running:
```bash
# Terminal 1
supabase start

# Terminal 2
cd 10x-astro-starter
npm run dev
```

### Issue: "Invalid or expired authentication token"

**Solution**:
1. Verify your JWT token is not expired
2. Check that SUPABASE_URL and SUPABASE_KEY in .env match your local Supabase instance
3. Ensure you're using the correct anon key (not service_role key for client requests)

### Issue: "Trip limit exceeded" but user has fewer than 100 trips

**Solution**: Check if the database trigger `enforce_trip_limit_trigger` is working correctly and counting only non-deleted trips.

### Issue: Database insert fails silently

**Solution**: Check Supabase logs:
```bash
supabase status
supabase logs
```

## Next Steps

After verifying the POST endpoint works:

1. Implement `GET /api/trips` - List all trips for user
2. Implement `GET /api/trips/:id` - Get single trip details
3. Implement `PATCH /api/trips/:id` - Update trip
4. Implement `DELETE /api/trips/:id` - Soft delete trip
5. Implement AI generation functionality
6. Add rate limiting middleware
7. Add comprehensive error logging

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Related**: [view-implementation-plan.md](.ai/view-implementation-plan.md)
