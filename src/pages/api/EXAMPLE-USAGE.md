# API Endpoint Implementation Examples

This file demonstrates how to implement API endpoints using the validation and helper utilities.

## Example 1: POST /api/trips (Create Trip)

```typescript
// src/pages/api/trips.ts

import type { APIRoute } from 'astro';
import { validateCreateTripCommand } from '../../lib/validation';
import { errorResponse, successResponse, parseRequestBody } from '../../lib/api-helpers';
import { supabase } from '../../db/supabase.client';
import type { CreateTripCommand, TripResponseDTO } from '../../types/dto';

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Authentication check
  const session = locals.session; // Assuming middleware sets this
  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required');
  }
  const userId = session.user.id;

  // 2. Parse request body
  const bodyResult = await parseRequestBody(request);
  if (bodyResult instanceof Response) {
    return bodyResult; // Return error response
  }

  // 3. Validate request body
  const validationResult = validateCreateTripCommand(bodyResult);
  if (!validationResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      validationResult.errors
    );
  }

  const command = validationResult.data as CreateTripCommand;

  // 4. Check trip limit (100 trips per user)
  const { count, error: countError } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (countError) {
    return errorResponse('INTERNAL_ERROR', 'Failed to check trip limit');
  }

  if (count && count >= 100) {
    return errorResponse(
      'TRIP_LIMIT_EXCEEDED',
      'You have reached the maximum limit of 100 trips'
    );
  }

  // 5. Create trip in database
  const { data: trip, error: insertError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      destination: command.destination,
      start_date: command.start_date,
      end_date: command.end_date,
      description: command.description || null,
      status: command.generate_ai ? 'generating' : 'draft',
      ai_model: command.generate_ai ? 'gpt-3.5-turbo' : null,
    })
    .select()
    .single();

  if (insertError || !trip) {
    return errorResponse('INTERNAL_ERROR', 'Failed to create trip');
  }

  // 6. If generate_ai is true, trigger AI generation (async)
  if (command.generate_ai) {
    // TODO: Trigger AI generation in background
    // This would typically be a separate function or job queue
  }

  // 7. Return created trip
  const responseDTO: TripResponseDTO = {
    ...trip,
    ai_generated_content: trip.ai_generated_content as any, // Cast JSONB
  };

  return successResponse(responseDTO, 201);
};
```

---

## Example 2: GET /api/trips (List Trips)

```typescript
// src/pages/api/trips.ts

import type { APIRoute } from 'astro';
import { validateTripsQueryParams } from '../../lib/validation';
import { errorResponse, successResponse } from '../../lib/api-helpers';
import { supabase } from '../../db/supabase.client';
import type { PaginatedTripsResponse, TripListItemDTO } from '../../types/dto';

export const GET: APIRoute = async ({ request, locals, url }) => {
  // 1. Authentication check
  const session = locals.session;
  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required');
  }
  const userId = session.user.id;

  // 2. Validate query parameters
  const validationResult = validateTripsQueryParams(url.searchParams);
  if (!validationResult.success) {
    return errorResponse(
      'INVALID_PARAMS',
      'Invalid query parameters',
      validationResult.errors
    );
  }

  const params = validationResult.data as any;
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  // 3. Build query
  let query = supabase
    .from('trips')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .range(offset, offset + limit - 1);

  // Apply status filter
  if (params.status) {
    query = query.eq('status', params.status);
  }

  // Apply sorting
  const sortField = params.sort?.split(':')[0] || 'created_at';
  const sortDir = params.sort?.split(':')[1] || 'desc';
  query = query.order(sortField, { ascending: sortDir === 'asc' });

  // 4. Execute query
  const { data: trips, error, count } = await query;

  if (error) {
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch trips');
  }

  // 5. Transform to DTOs (exclude ai_generated_content for list)
  const tripDTOs: TripListItemDTO[] = (trips || []).map((trip) => {
    const { ai_generated_content, ...rest } = trip;
    return rest as TripListItemDTO;
  });

  // 6. Build paginated response
  const response: PaginatedTripsResponse = {
    data: tripDTOs,
    pagination: {
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    },
  };

  return successResponse(response);
};
```

---

## Example 3: GET /api/users/me/rate-limits (Rate Limits)

```typescript
// src/pages/api/users/me/rate-limits.ts

import type { APIRoute } from 'astro';
import { errorResponse, successResponse } from '../../../lib/api-helpers';
import { transformRateLimitsToDTO } from '../../../services/rate-limit.service';
import { supabase } from '../../../db/supabase.client';
import type { RateLimitsDTO } from '../../../types/dto';

export const GET: APIRoute = async ({ locals }) => {
  // 1. Authentication check
  const session = locals.session;
  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required');
  }
  const userId = session.user.id;

  // 2. Fetch rate limits from database
  const { data: rateLimits, error } = await supabase
    .from('user_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !rateLimits) {
    // If no rate limits exist, create default ones
    const { data: newRateLimits, error: createError } = await supabase.rpc(
      'create_default_rate_limits',
      { p_user_id: userId }
    );

    if (createError) {
      return errorResponse('INTERNAL_ERROR', 'Failed to initialize rate limits');
    }

    // Fetch again after creation
    const { data: fetchedRateLimits, error: fetchError } = await supabase
      .from('user_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !fetchedRateLimits) {
      return errorResponse('INTERNAL_ERROR', 'Failed to fetch rate limits');
    }

    const dto = transformRateLimitsToDTO(fetchedRateLimits);
    return successResponse(dto);
  }

  // 3. Transform to DTO using service
  const dto: RateLimitsDTO = transformRateLimitsToDTO(rateLimits);

  // 4. Return transformed data
  return successResponse(dto);
};
```

---

## Example 4: POST /api/trips/:id/generate-ai (Generate AI with Rate Limiting)

```typescript
// src/pages/api/trips/[id]/generate-ai.ts

import type { APIRoute } from 'astro';
import { validateGenerateAICommand, isValidUUID } from '../../../../lib/validation';
import { errorResponse, successResponse, parseRequestBody } from '../../../../lib/api-helpers';
import {
  isRateLimitExceeded,
  getExceededLimitType,
  getNextResetTime,
  RATE_LIMITS,
} from '../../../../services/rate-limit.service';
import { supabase } from '../../../../db/supabase.client';
import type { GenerateAICommand, AIGenerationStartedResponse } from '../../../../types/dto';

export const POST: APIRoute = async ({ params, request, locals }) => {
  // 1. Authentication check
  const session = locals.session;
  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required');
  }
  const userId = session.user.id;

  // 2. Validate trip ID
  const tripId = params.id;
  if (!tripId || !isValidUUID(tripId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid trip ID');
  }

  // 3. Parse and validate request body
  const bodyResult = await parseRequestBody(request);
  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const validationResult = validateGenerateAICommand(bodyResult);
  if (!validationResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      validationResult.errors
    );
  }

  const command = validationResult.data as GenerateAICommand;

  // 4. Fetch trip and verify ownership
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (tripError || !trip) {
    return errorResponse('NOT_FOUND', 'Trip not found');
  }

  // 5. Check if already generating
  if (trip.status === 'generating' && !command.force_regenerate) {
    return errorResponse(
      'GENERATION_IN_PROGRESS',
      'AI generation already in progress for this trip'
    );
  }

  // 6. Check rate limits
  const { data: rateLimits, error: rateLimitError } = await supabase
    .from('user_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (rateLimitError || !rateLimits) {
    return errorResponse('INTERNAL_ERROR', 'Failed to check rate limits');
  }

  if (isRateLimitExceeded(rateLimits)) {
    const limitType = getExceededLimitType(rateLimits);
    const resetAt = getNextResetTime(rateLimits);

    return errorResponse('RATE_LIMIT_EXCEEDED', `You have exceeded your ${limitType} AI generation limit`, {
      limit: limitType,
      reset_at: resetAt,
      hourly_remaining: Math.max(
        0,
        RATE_LIMITS.HOURLY_LIMIT - rateLimits.hourly_generations_count
      ),
      daily_remaining: Math.max(
        0,
        RATE_LIMITS.DAILY_LIMIT - rateLimits.daily_generations_count
      ),
    });
  }

  // 7. Update trip status to 'generating'
  const { error: updateError } = await supabase
    .from('trips')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', tripId);

  if (updateError) {
    return errorResponse('INTERNAL_ERROR', 'Failed to update trip status');
  }

  // 8. Trigger AI generation (async)
  // TODO: Implement actual AI generation logic
  // This would typically call OpenAI API and update the trip

  // 9. Return 202 Accepted response
  const response: AIGenerationStartedResponse = {
    id: tripId,
    status: 'generating',
    message: 'AI generation started. This may take 30-60 seconds.',
    estimated_completion: new Date(Date.now() + 60000).toISOString(), // +60s
  };

  return successResponse(response, 202);
};
```

---

## Example 5: PATCH /api/trips/:id (Update Trip)

```typescript
// src/pages/api/trips/[id].ts

import type { APIRoute } from 'astro';
import { validateUpdateTripCommand, isValidUUID } from '../../../lib/validation';
import { errorResponse, successResponse, parseRequestBody } from '../../../lib/api-helpers';
import { supabase } from '../../../db/supabase.client';
import type { UpdateTripCommand, TripResponseDTO } from '../../../types/dto';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // 1. Authentication check
  const session = locals.session;
  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required');
  }
  const userId = session.user.id;

  // 2. Validate trip ID
  const tripId = params.id;
  if (!tripId || !isValidUUID(tripId)) {
    return errorResponse('VALIDATION_ERROR', 'Invalid trip ID');
  }

  // 3. Parse and validate request body
  const bodyResult = await parseRequestBody(request);
  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const validationResult = validateUpdateTripCommand(bodyResult);
  if (!validationResult.success) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      validationResult.errors
    );
  }

  const command = validationResult.data as UpdateTripCommand;

  // 4. Fetch trip and verify ownership
  const { data: existingTrip, error: fetchError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingTrip) {
    return errorResponse('NOT_FOUND', 'Trip not found');
  }

  // 5. Update trip in database
  const { data: updatedTrip, error: updateError } = await supabase
    .from('trips')
    .update({
      ...command,
      edit_count: (existingTrip.edit_count || 0) + 1,
      last_edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .select()
    .single();

  if (updateError || !updatedTrip) {
    return errorResponse('INTERNAL_ERROR', 'Failed to update trip');
  }

  // 6. Return updated trip
  const responseDTO: TripResponseDTO = {
    ...updatedTrip,
    ai_generated_content: updatedTrip.ai_generated_content as any,
  };

  return successResponse(responseDTO);
};
```

---

## Key Patterns

### 1. Always validate before processing
```typescript
const validationResult = validateCreateTripCommand(data);
if (!validationResult.success) {
  return errorResponse('VALIDATION_ERROR', 'Invalid request data', validationResult.errors);
}
```

### 2. Use helper functions for responses
```typescript
// Error
return errorResponse('NOT_FOUND', 'Trip not found');

// Success
return successResponse(data, 201);

// No content
return noContentResponse();
```

### 3. Transform database types to DTOs
```typescript
import { transformRateLimitsToDTO } from '../services/rate-limit.service';

const dto = transformRateLimitsToDTO(dbRow);
return successResponse(dto);
```

### 4. Handle authentication consistently
```typescript
const session = locals.session;
if (!session?.user) {
  return errorResponse('UNAUTHORIZED', 'Authentication required');
}
const userId = session.user.id;
```

---

## Testing Your Endpoints

Use these curl commands to test:

```bash
# Create trip
curl -X POST http://localhost:4321/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "Tokyo, Japan",
    "start_date": "2025-06-01",
    "end_date": "2025-06-07",
    "description": "First time in Japan",
    "generate_ai": false
  }'

# Get rate limits
curl -X GET http://localhost:4321/api/users/me/rate-limits \
  -H "Authorization: Bearer YOUR_TOKEN"

# List trips
curl -X GET "http://localhost:4321/api/trips?limit=10&status=completed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
