# Services Documentation

This directory contains business logic and data transformation services.

## Files Overview

### rate-limit.service.ts
Handles rate limit data transformation and checking.

**Constants:**
- `RATE_LIMITS.HOURLY_LIMIT` - Maximum AI generations per hour (5)
- `RATE_LIMITS.DAILY_LIMIT` - Maximum AI generations per day (10)

**Functions:**

#### `transformRateLimitsToDTO(dbRow)`
Transforms flat database structure to nested API DTO format.

**Input (from database):**
```typescript
{
  user_id: 'uuid',
  hourly_generations_count: 2,
  hourly_limit_reset_at: '2025-01-15T13:00:00Z',
  daily_generations_count: 5,
  daily_limit_reset_at: '2025-01-16T00:00:00Z',
  updated_at: '2025-01-15T12:30:00Z'
}
```

**Output (API DTO):**
```typescript
{
  user_id: 'uuid',
  hourly: {
    limit: 5,
    used: 2,
    remaining: 3,
    reset_at: '2025-01-15T13:00:00Z'
  },
  daily: {
    limit: 10,
    used: 5,
    remaining: 5,
    reset_at: '2025-01-16T00:00:00Z'
  },
  updated_at: '2025-01-15T12:30:00Z'
}
```

**Usage:**
```typescript
import { transformRateLimitsToDTO } from '../services/rate-limit.service';

const { data: rateLimits } = await supabase
  .from('user_rate_limits')
  .select('*')
  .eq('user_id', userId)
  .single();

const dto = transformRateLimitsToDTO(rateLimits);
return successResponse(dto);
```

---

#### `isRateLimitExceeded(dbRow)`
Checks if user has exceeded any rate limit (hourly or daily).

**Returns:** `boolean`

**Usage:**
```typescript
import { isRateLimitExceeded, getExceededLimitType } from '../services/rate-limit.service';

if (isRateLimitExceeded(rateLimits)) {
  const limitType = getExceededLimitType(rateLimits);
  return errorResponse(
    'RATE_LIMIT_EXCEEDED',
    `You have exceeded your ${limitType} AI generation limit`
  );
}
```

---

#### `isHourlyLimitExceeded(dbRow)`
Checks if hourly limit is exceeded.

**Returns:** `boolean`

---

#### `isDailyLimitExceeded(dbRow)`
Checks if daily limit is exceeded.

**Returns:** `boolean`

---

#### `getNextResetTime(dbRow)`
Gets the next reset time (earliest of hourly or daily).

**Returns:** `string` (ISO 8601 timestamp)

**Usage:**
```typescript
import { getNextResetTime } from '../services/rate-limit.service';

const resetAt = getNextResetTime(rateLimits);
return errorResponse('RATE_LIMIT_EXCEEDED', 'Limit exceeded', {
  reset_at: resetAt
});
```

---

#### `getExceededLimitType(dbRow)`
Determines which limit was exceeded.

**Returns:** `'hourly' | 'daily' | 'both' | null`

**Usage:**
```typescript
import { getExceededLimitType } from '../services/rate-limit.service';

const limitType = getExceededLimitType(rateLimits);
// 'hourly' - only hourly exceeded
// 'daily' - only daily exceeded
// 'both' - both limits exceeded
// null - no limits exceeded
```

---

## Usage Examples

### Example 1: GET /api/users/me/rate-limits

```typescript
import { transformRateLimitsToDTO } from '../services/rate-limit.service';

const { data: rateLimits } = await supabase
  .from('user_rate_limits')
  .select('*')
  .eq('user_id', userId)
  .single();

const dto = transformRateLimitsToDTO(rateLimits);
return successResponse(dto);
```

### Example 2: POST /api/trips/:id/generate-ai (with rate limit check)

```typescript
import {
  isRateLimitExceeded,
  getExceededLimitType,
  getNextResetTime,
  RATE_LIMITS,
} from '../services/rate-limit.service';

// Fetch rate limits
const { data: rateLimits } = await supabase
  .from('user_rate_limits')
  .select('*')
  .eq('user_id', userId)
  .single();

// Check if exceeded
if (isRateLimitExceeded(rateLimits)) {
  const limitType = getExceededLimitType(rateLimits);
  const resetAt = getNextResetTime(rateLimits);

  return errorResponse(
    'RATE_LIMIT_EXCEEDED',
    `You have exceeded your ${limitType} AI generation limit`,
    {
      limit: limitType,
      reset_at: resetAt,
      hourly_remaining: Math.max(0, RATE_LIMITS.HOURLY_LIMIT - rateLimits.hourly_generations_count),
      daily_remaining: Math.max(0, RATE_LIMITS.DAILY_LIMIT - rateLimits.daily_generations_count),
    }
  );
}

// Proceed with AI generation...
```

### Example 3: Displaying rate limits in UI

```typescript
import { transformRateLimitsToDTO } from '../services/rate-limit.service';

// In your API endpoint
const dto = transformRateLimitsToDTO(rateLimits);

// In your frontend
<div>
  <h3>AI Generation Quota</h3>
  <p>Hourly: {dto.hourly.remaining} / {dto.hourly.limit} remaining</p>
  <p>Daily: {dto.daily.remaining} / {dto.daily.limit} remaining</p>
  <p>Resets at: {new Date(dto.hourly.reset_at).toLocaleString()}</p>
</div>
```

---

## Configuration

Rate limits are defined as constants in `rate-limit.service.ts`:

```typescript
export const RATE_LIMITS = {
  HOURLY_LIMIT: 5,
  DAILY_LIMIT: 10,
} as const;
```

**For production**, you can:
1. Move these to environment variables
2. Store in database per user (premium tiers)
3. Use a config management service

Example with env vars:
```typescript
export const RATE_LIMITS = {
  HOURLY_LIMIT: parseInt(import.meta.env.HOURLY_RATE_LIMIT || '5'),
  DAILY_LIMIT: parseInt(import.meta.env.DAILY_RATE_LIMIT || '10'),
} as const;
```

---

## Testing

Test rate limit logic:
```bash
npm run test:services
```

Manual testing:
```bash
# Get rate limits
curl -X GET http://localhost:4321/api/users/me/rate-limits \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
{
  "user_id": "uuid",
  "hourly": {
    "limit": 5,
    "used": 0,
    "remaining": 5,
    "reset_at": "2025-01-15T13:00:00Z"
  },
  "daily": {
    "limit": 10,
    "used": 0,
    "remaining": 10,
    "reset_at": "2025-01-16T00:00:00Z"
  },
  "updated_at": "2025-01-15T12:00:00Z"
}
```

---

## Adding New Services

To add a new service:

1. Create `[name].service.ts` in this directory
2. Export functions from `index.ts`
3. Document in this README
4. Add tests in `tests/services/`

Example structure:
```typescript
// trip.service.ts
import type { Tables } from '../db/database.types';
import type { TripDetailDTO } from '../types/dto';

export function transformTripToDetailDTO(dbRow: Tables<'trips'>): TripDetailDTO {
  return {
    ...dbRow,
    ai_generated_content: dbRow.ai_generated_content as any,
  };
}
```

---

## Best Practices

### 1. Keep services pure
Services should be pure functions - no side effects, always return the same output for the same input.

✅ Good:
```typescript
export function transformRateLimitsToDTO(dbRow) {
  return { /* transformed data */ };
}
```

❌ Bad:
```typescript
export async function getRateLimits(userId) {
  // Don't put database calls in services
  const data = await supabase.from('...').select();
  return transformRateLimitsToDTO(data);
}
```

### 2. Database calls belong in endpoints
Services transform data, endpoints fetch/save data.

### 3. Use TypeScript types
```typescript
import type { Tables } from '../db/database.types';

export function transform(dbRow: Tables<'trips'>) {
  // TypeScript ensures dbRow has correct shape
}
```

### 4. Document complex transformations
Add JSDoc comments explaining what the transformation does and why.

---

## Related Documentation

- [API Plan](../../.ai/api-plan.md) - API specification
- [DTO Types](../types/dto.ts) - Data Transfer Objects
- [Database Types](../db/database.types.ts) - Database schema types
- [Validation](../lib/validation.ts) - Request validation
- [API Helpers](../lib/api-helpers.ts) - Response helpers
