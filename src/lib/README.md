# Library Utilities Documentation

This directory contains shared utilities and helpers for the API implementation.

## Files Overview

### validation.ts
Request validation utilities for API endpoints.

**Functions:**
- `validateCreateTripCommand(data)` - Validates POST /api/trips request body
- `validateUpdateTripCommand(data)` - Validates PATCH /api/trips/:id request body
- `validateGenerateAICommand(data)` - Validates POST /api/trips/:id/generate-ai request body
- `validateTripsQueryParams(params)` - Validates GET /api/trips query parameters
- `validateAILogsQueryParams(params)` - Validates GET /api/users/me/ai-logs query parameters
- `isValidUUID(uuid)` - Validates UUID format

**Types:**
- `ValidationResult` - Result type with success flag and errors

**Usage:**
```typescript
import { validateCreateTripCommand } from '../lib/validation';

const result = validateCreateTripCommand(requestBody);
if (!result.success) {
  return errorResponse('VALIDATION_ERROR', 'Invalid data', result.errors);
}
```

---

### api-helpers.ts
Common utilities for API endpoint handlers.

**Functions:**
- `errorResponse(code, message, details?)` - Creates error Response with proper status
- `successResponse(data, status?)` - Creates success Response with JSON data
- `noContentResponse()` - Creates 204 No Content Response
- `createErrorResponse(code, message, details?)` - Creates ErrorResponse object
- `getStatusForErrorCode(code)` - Maps error code to HTTP status
- `parseRequestBody(request)` - Safely parses JSON request body
- `getUserIdFromRequest(request)` - Extracts user ID from auth (placeholder)
- `corsPreflightResponse()` - Handles OPTIONS requests

**Constants:**
- `CORS_HEADERS` - Default CORS headers

**Usage:**
```typescript
import { errorResponse, successResponse } from '../lib/api-helpers';

// Error
return errorResponse('NOT_FOUND', 'Trip not found');

// Success
return successResponse({ id: '123', name: 'Trip' }, 201);
```

---

### utils.ts
General utility functions.

**Functions:**
- `cn(...inputs)` - Merges Tailwind CSS class names (for UI components)

---

### index.ts
Central export point for all library utilities.

**Usage:**
```typescript
// Instead of:
import { validateCreateTripCommand } from '../lib/validation';
import { errorResponse } from '../lib/api-helpers';

// You can do:
import { validateCreateTripCommand, errorResponse } from '../lib';
```

---

## Validation Rules Reference

### CreateTripCommand
| Field | Required | Type | Validation |
|-------|----------|------|------------|
| destination | Yes | string | Max 200 chars |
| start_date | Yes | string | Valid ISO date (YYYY-MM-DD) |
| end_date | Yes | string | Valid ISO date, >= start_date, <= start_date + 365 days |
| description | No | string | Max 2000 chars |
| generate_ai | No | boolean | - |

### UpdateTripCommand
| Field | Required | Type | Validation |
|-------|----------|------|------------|
| destination | No | string | Max 200 chars |
| start_date | No | string | Valid ISO date (YYYY-MM-DD) |
| end_date | No | string | Valid ISO date, >= start_date, <= start_date + 365 days |
| description | No | string | Max 2000 chars |

**Note:** At least one field must be provided.

### GenerateAICommand
| Field | Required | Type | Validation |
|-------|----------|------|------------|
| model | No | string | - |
| temperature | No | number | 0.0-1.0 |
| force_regenerate | No | boolean | - |

### TripsQueryParams
| Field | Required | Type | Validation |
|-------|----------|------|------------|
| limit | No | number | 1-100 |
| offset | No | number | >= 0 |
| status | No | string | 'draft' \| 'generating' \| 'completed' \| 'failed' |
| sort | No | string | Format: "field:direction" |

**Valid sort fields:** created_at, updated_at, start_date, end_date, destination, status
**Valid directions:** asc, desc

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing authentication |
| INVALID_TOKEN | 401 | Invalid/expired JWT |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| INVALID_PARAMS | 400 | Invalid query parameters |
| TRIP_LIMIT_EXCEEDED | 403 | Max 100 trips reached |
| RATE_LIMIT_EXCEEDED | 429 | AI generation quota exceeded |
| GENERATION_IN_PROGRESS | 409 | AI already generating |
| AI_GENERATION_FAILED | 500 | AI service error |
| AI_GENERATION_TIMEOUT | 500 | AI call timeout |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Testing

Run validation tests:
```bash
npm run test:validation
```

Test API endpoints:
```bash
npm run test:api
```

---

## Best Practices

### 1. Always validate user input
```typescript
const result = validateCreateTripCommand(body);
if (!result.success) {
  return errorResponse('VALIDATION_ERROR', 'Invalid data', result.errors);
}
```

### 2. Use typed command objects
```typescript
const command = result.data as CreateTripCommand;
// Now TypeScript knows the exact shape of command
```

### 3. Return consistent error responses
```typescript
// Always use errorResponse() helper
return errorResponse('NOT_FOUND', 'Trip not found');

// Never return raw Response objects for errors
// ❌ return new Response('Error', { status: 404 });
```

### 4. Handle async parsing safely
```typescript
const bodyResult = await parseRequestBody(request);
if (bodyResult instanceof Response) {
  return bodyResult; // Already an error Response
}
// Now bodyResult is the parsed JSON
```

### 5. Keep validation pure
All validation functions are pure - they don't have side effects and always return the same output for the same input.

---

## Adding New Validators

To add a new validator:

1. Define the command type in `src/types/dto.ts`
2. Add validation function in `src/lib/validation.ts`
3. Export it from `src/lib/index.ts`
4. Add tests in `tests/validation.test.ts`

Example:
```typescript
// 1. In dto.ts
export interface DeleteTripCommand {
  confirm: boolean;
}

// 2. In validation.ts
export function validateDeleteTripCommand(data: unknown): ValidationResult {
  const errors: ValidationErrorDetail[] = [];
  const body = data as Partial<DeleteTripCommand>;

  if (typeof body.confirm !== 'boolean') {
    errors.push({
      field: 'confirm',
      message: 'Confirmation required',
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body as DeleteTripCommand };
}

// 3. Export from index.ts
export { validateDeleteTripCommand } from './validation';
```

---

## Related Documentation

- [API Plan](../../.ai/api-plan.md) - Complete API specification
- [DTO Types](../types/dto.ts) - Type definitions for DTOs and commands
- [Database Types](../db/database.types.ts) - Supabase-generated types
- [Example Usage](../pages/api/EXAMPLE-USAGE.md) - Endpoint implementation examples
