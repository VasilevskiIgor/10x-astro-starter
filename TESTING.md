# Testing the POST /api/trips Endpoint

Quick guide to test the newly implemented `POST /api/trips` endpoint.

## Quick Start

### 1. Setup Environment Variables

**IMPORTANT**: First, create the `.env` file from the example:

```bash
cd 10x-astro-starter
cp .env.example .env
```

The `.env` file should contain:
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
OPENROUTER_API_KEY=###
```

### 2. Start Services

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start Astro dev server
cd 10x-astro-starter
npm run dev
```

### 3. Create Test User

Open Supabase Studio at http://localhost:54323

1. Navigate to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm password: `password123`
4. Click **Create user**

### 4. Get JWT Token

Run the helper script:

```bash
node scripts/get-test-token.js
```

This will output:
- User ID
- JWT token (copy this!)
- Example curl command

### 5. Test the Endpoint

Copy the JWT token from step 3, then run:

```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "destination": "Paris, France",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "description": "Romantic getaway"
  }'
```

**Expected Response**: `201 Created` with trip details

### 6. Verify in Database

Open Supabase Studio > **Table Editor** > **trips**

You should see your newly created trip!

## What Was Implemented

✅ **Trip Service** ([src/services/trip.service.ts](src/services/trip.service.ts))
- `createTrip()` method with full validation and error handling
- Input sanitization to prevent XSS
- Proper error handling with specific error codes
- Support for AI generation flag

✅ **API Endpoint** ([src/pages/api/trips.ts](src/pages/api/trips.ts))
- Full authentication via JWT
- Request validation using existing validation library
- Proper HTTP status codes (201, 400, 401, 403, 500)
- Location header in response

✅ **Type Safety**
- Uses existing DTO types from `src/types/dto.ts`
- Database types from `src/db/database.types.ts`
- Full TypeScript support

## Features

### ✅ Validation
- Required fields: `destination`, `start_date`, `end_date`
- Optional fields: `description`, `generate_ai`
- Business rules:
  - Destination max 200 chars
  - Description max 2000 chars
  - Trip duration max 365 days
  - End date must be >= start date
  - Date format: ISO 8601 (YYYY-MM-DD)

### ✅ Security
- JWT authentication required
- User ID extracted from token (not from request body)
- Input sanitization (XSS prevention)
- Row Level Security (RLS) policies enforced by Supabase

### ✅ Error Handling
- 400: Validation errors with detailed field-level feedback
- 401: Missing or invalid authentication
- 403: Trip limit exceeded (100 trips per user)
- 500: Database or internal errors

## Testing Scenarios

See [.ai/endpoint-testing-guide.md](.ai/endpoint-testing-guide.md) for comprehensive test cases including:

1. ✅ Success - Create trip without AI
2. ✅ Success - Create trip with AI flag
3. ✅ Error - Missing authentication
4. ✅ Error - Invalid JWT token
5. ✅ Error - Missing required fields
6. ✅ Error - Invalid date range
7. ✅ Error - Trip duration exceeds 365 days
8. ✅ Error - Destination too long
9. ✅ Error - Invalid JSON format
10. ✅ Error - Missing Content-Type header

## Project Structure

```
10x-astro-starter/
├── src/
│   ├── services/
│   │   ├── trip.service.ts          # ✅ NEW: Trip business logic
│   │   └── index.ts                 # ✅ UPDATED: Export TripService
│   ├── pages/
│   │   └── api/
│   │       └── trips.ts             # ✅ NEW: POST /api/trips endpoint
│   ├── lib/
│   │   ├── validation.ts            # ✅ EXISTING: Validation functions
│   │   └── api-helpers.ts           # ✅ EXISTING: API helper functions
│   ├── types/
│   │   └── dto.ts                   # ✅ EXISTING: DTO types
│   └── db/
│       ├── database.types.ts        # ✅ EXISTING: Database types
│       └── supabase.client.ts       # ✅ EXISTING: Supabase client
├── scripts/
│   └── get-test-token.js            # ✅ NEW: Helper to get JWT token
├── supabase/
│   └── seed-test-user.sql           # ✅ NEW: Test user seed script
└── .ai/
    ├── view-implementation-plan.md  # ✅ EXISTING: Implementation plan
    └── endpoint-testing-guide.md    # ✅ NEW: Detailed testing guide
```

## Next Steps

After verifying the POST endpoint works, you can implement:

1. **GET /api/trips** - List all trips for user (with pagination)
2. **GET /api/trips/:id** - Get single trip details
3. **PATCH /api/trips/:id** - Update trip
4. **DELETE /api/trips/:id** - Soft delete trip
5. **POST /api/trips/:id/generate-ai** - Trigger AI itinerary generation
6. **Rate limiting middleware** - Prevent abuse
7. **Comprehensive logging** - Track errors and usage

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process if needed
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Supabase not running
```bash
supabase status
# If not running:
supabase start
```

### Can't get JWT token
1. Verify test user exists in Supabase Studio
2. Check credentials in `scripts/get-test-token.js`
3. Ensure SUPABASE_URL and SUPABASE_KEY are correct in `.env`

### Database errors
```bash
# View Supabase logs
supabase logs

# Reset database (warning: deletes all data)
supabase db reset
```

## Documentation

- **Implementation Plan**: [.ai/view-implementation-plan.md](.ai/view-implementation-plan.md)
- **API Specification**: [.ai/api-plan.md](.ai/api-plan.md)
- **Database Schema**: [supabase/db-plan.md](supabase/db-plan.md)
- **Testing Guide**: [.ai/endpoint-testing-guide.md](.ai/endpoint-testing-guide.md)

---

**Status**: ✅ Implemented and ready for testing
**Last Updated**: 2025-10-16
