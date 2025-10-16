# API Endpoint Implementation Plan: POST /api/trips

## 1. Przegląd punktu końcowego

**Endpoint**: `POST /api/trips`

**Cel**: Utworzenie nowej podróży dla zaautoryzowanego użytkownika z opcjonalnym wygenerowaniem AI itinerarium.

**Funkcjonalność**:
- Przyjmuje podstawowe dane podróży (destination, daty, opis)
- Waliduje dane wejściowe zgodnie z regułami biznesowymi
- Tworzy rekord w tabeli `trips` w Supabase
- Opcjonalnie inicjuje generowanie AI (jeśli `generate_ai: true`)
- Zwraca utworzoną podróż z kodem 201 Created

**Kontekst biznesowy**:
- Użytkownik może mieć maksymalnie 100 podróży (egzekwowane przez trigger BD)
- Podróż może trwać maksymalnie 365 dni
- Domyślnie podróż ma status `'draft'` (lub `'generating'` jeśli AI jest włączone)

---

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/trips`

### Headers
| Header | Wymagany | Wartość | Opis |
|--------|----------|---------|------|
| `Authorization` | Tak | `Bearer <jwt_token>` | Supabase JWT token |
| `Content-Type` | Tak | `application/json` | Format danych |

### Parametry

**URL Parameters**: Brak

**Query Parameters**: Brak

**Request Body** (JSON):

```typescript
{
  "destination": string,      // Wymagane
  "start_date": string,        // Wymagane (ISO 8601: YYYY-MM-DD)
  "end_date": string,          // Wymagane (ISO 8601: YYYY-MM-DD)
  "description"?: string,      // Opcjonalne
  "generate_ai"?: boolean      // Opcjonalne, default: false
}
```

### Walidacja parametrów

| Pole | Wymagane | Typ | Walidacja | Komunikat błędu |
|------|----------|-----|-----------|-----------------|
| `destination` | Tak | string | Niepuste, max 200 znaków | "Destination is required and must be less than 200 characters" |
| `start_date` | Tak | string | Format ISO 8601 (YYYY-MM-DD), poprawna data | "Start date is required and must be a valid date" |
| `end_date` | Tak | string | Format ISO 8601, poprawna data, >= start_date | "End date must be after or equal to start date" |
| `end_date` vs `start_date` | - | - | Różnica <= 365 dni | "Trip duration cannot exceed 365 days" |
| `description` | Nie | string | Max 2000 znaków | "Description must be less than 2000 characters" |
| `generate_ai` | Nie | boolean | - | - |

### Przykładowe żądanie

```json
{
  "destination": "Barcelona, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-17",
  "description": "Family vacation with kids, interested in beaches and architecture",
  "generate_ai": false
}
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

Z pliku [src/types/dto.ts](../src/types/dto.ts):

**Request (Command Model)**:
```typescript
CreateTripCommand {
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
  generate_ai?: boolean;
}
```

**Response**:
```typescript
TripResponseDTO = TripEntity {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  ai_generated_content: AIGeneratedContent | null;
  ai_model: string | null;
  ai_tokens_used: number | null;
  ai_generation_time_ms: number | null;
  view_count: number;
  last_viewed_at: string | null;
  edit_count: number;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Error Response**:
```typescript
ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ValidationErrorDetail[] | Record<string, unknown>;
  }
}

ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}
```

### Database Types

Z pliku [src/db/database.types.ts](../src/db/database.types.ts):

```typescript
TablesInsert<'trips'> {
  destination: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  user_id: string;
  status?: string | null;  // default: 'draft'
  // ... pozostałe pola opcjonalne z wartościami domyślnymi
}
```

---

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

**Headers**:
```
Content-Type: application/json
Location: /api/trips/{trip_id}
```

**Body**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "destination": "Barcelona, Spain",
  "start_date": "2025-08-10",
  "end_date": "2025-08-17",
  "description": "Family vacation with kids, interested in beaches and architecture",
  "status": "draft",
  "ai_generated_content": null,
  "ai_model": null,
  "ai_tokens_used": null,
  "ai_generation_time_ms": null,
  "view_count": 0,
  "last_viewed_at": null,
  "edit_count": 0,
  "last_edited_at": null,
  "created_at": "2025-01-15T11:00:00.000Z",
  "updated_at": "2025-01-15T11:00:00.000Z"
}
```

**Uwaga**: Jeśli `generate_ai: true`, status będzie `"generating"`.

### Błędy

#### 400 Bad Request - Walidacja

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after or equal to start date",
        "value": "2025-08-01"
      },
      {
        "field": "destination",
        "message": "Destination is required"
      }
    ]
  }
}
```

#### 401 Unauthorized - Brak autentykacji

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden - Limit podróży

```json
{
  "error": {
    "code": "TRIP_LIMIT_EXCEEDED",
    "message": "You have reached the maximum limit of 100 trips"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create trip"
  }
}
```

---

## 5. Przepływ danych

### Architektura warstwowa

```
Client Request
    ↓
[Astro API Route: /src/pages/api/trips.ts]
    ↓ (POST handler)
1. Weryfikacja metody HTTP
    ↓
2. Weryfikacja Content-Type
    ↓
3. Wyciągnięcie JWT z Authorization header
    ↓
[Supabase Auth Middleware]
4. Walidacja JWT tokenu
5. Wyciągnięcie user_id z auth.uid()
    ↓
[Validation Service]
6. Parsowanie request body
7. Walidacja command model (CreateTripCommand)
    ↓ (jeśli błędy)
Return 400 Bad Request
    ↓ (jeśli OK)
[Trip Service]
8. Przygotowanie danych do insertu
9. Wywołanie Supabase .from('trips').insert()
    ↓
[Supabase Database]
10. Trigger: enforce_trip_limit (sprawdza limit 100)
    ↓ (jeśli limit przekroczony)
RAISE EXCEPTION → Return 403 Forbidden
    ↓ (jeśli OK)
11. INSERT do tabeli trips
12. RLS policy: users_insert_own_trips (auth.uid() = user_id)
13. Trigger: update_updated_at_column
    ↓
[Trip Service - cd.]
14. Otrzymanie utworzonego rekordu
15. Transformacja do TripResponseDTO
    ↓ (jeśli generate_ai: true)
[AI Service - Future]
16. Async wywołanie generacji AI (202 Accepted)
    ↓
[Astro API Route - cd.]
17. Zwrócenie response 201 Created
```

### Diagram sekwencji

```
Client → API Route: POST /api/trips + JWT
API Route → Supabase Auth: Verify JWT
Supabase Auth → API Route: user_id
API Route → Validation Service: Validate(command)
Validation Service → API Route: OK / Errors[]
API Route → Trip Service: createTrip(user_id, command)
Trip Service → Supabase DB: INSERT trips
Supabase DB → Trip Service: Trip record
Trip Service → API Route: TripResponseDTO
API Route → Client: 201 Created + Trip
```

### Interakcje z zewnętrznymi usługami

| Usługa | Cel | Gdy? |
|--------|-----|------|
| **Supabase Auth** | Weryfikacja JWT, wyciągnięcie user_id | Każde żądanie |
| **Supabase Database** | INSERT do tabeli trips | Każde żądanie |
| **AI Service** (OpenAI/OpenRouter) | Generowanie itinerarium | Tylko jeśli `generate_ai: true` |

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm**: Supabase JWT via `Authorization: Bearer <token>`

**Implementacja**:
```typescript
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), { status: 401 });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({
    error: {
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token'
    }
  }), { status: 401 });
}

const userId = user.id; // ZAWSZE używać tego user_id!
```

**Zagrożenia**:
- ❌ Brak tokenu → 401 Unauthorized
- ❌ Token wygasły → 401 Invalid Token
- ❌ Token podrobiony → 401 Invalid Token

### 6.2 Autoryzacja (Authorization)

**Mechanizm**: Row Level Security (RLS) policies w Supabase

**Policy**: `users_insert_own_trips`
```sql
CREATE POLICY "users_insert_own_trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'generating'));
```

**Implementacja**:
- ✅ **NIGDY** nie pobieraj `user_id` z request body
- ✅ **ZAWSZE** używaj `user_id` z `auth.uid()` (JWT payload)
- ✅ Supabase automatycznie odrzuci INSERT jeśli `user_id` nie pasuje

**Zagrożenia**:
- ❌ User ID Spoofing → Chronione przez RLS
- ❌ Tworzenie podróży dla innego użytkownika → Niemożliwe (RLS)

### 6.3 Walidacja danych wejściowych

**Sanityzacja stringów**:
```typescript
// Zapobiega XSS
const sanitize = (input: string): string => {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sanitizedDestination = sanitize(command.destination);
const sanitizedDescription = command.description
  ? sanitize(command.description)
  : null;
```

**Walidacja dat**:
```typescript
// Zapobiega Date Injection
const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};
```

**Zagrożenia**:
- ❌ XSS through destination/description → Sanityzacja
- ❌ SQL Injection → Chronione przez Supabase (parametryzowane zapytania)
- ❌ NoSQL Injection → Nie dotyczy (PostgreSQL)

### 6.4 Rate Limiting

**Dla tego endpointu**:
- ⚠️ Brak rate limitingu na poziomie API (do zaimplementowania w przyszłości)
- ✅ Limit 100 podróży per user (trigger BD: `enforce_trip_limit_trigger`)

**Rekomendacje**:
- Implementacja API-level rate limiting: 100 req/min per user
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 6.5 CORS

**Allowed Origins** (w pliku konfiguracyjnym):
- Production: `https://vibetravels.com`
- Development: `http://localhost:4321`

**Implementacja** (Astro middleware):
```typescript
response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
response.headers.set('Access-Control-Allow-Credentials', 'true');
```

---

## 7. Obsługa błędów

### 7.1 Katalog błędów

| HTTP Status | Error Code | Scenariusz | Message | Details |
|-------------|------------|------------|---------|---------|
| 400 | `VALIDATION_ERROR` | Nieprawidłowe dane wejściowe | "Invalid request data" | `ValidationErrorDetail[]` |
| 400 | `INVALID_PARAMS` | Nieprawidłowy format JSON | "Invalid JSON format" | - |
| 401 | `UNAUTHORIZED` | Brak Authorization header | "Authentication required" | - |
| 401 | `INVALID_TOKEN` | Token wygasły lub nieprawidłowy | "Invalid or expired authentication token" | - |
| 403 | `TRIP_LIMIT_EXCEEDED` | Użytkownik ma już 100 podróży | "You have reached the maximum limit of 100 trips" | - |
| 500 | `INTERNAL_ERROR` | Błąd bazy danych, nieoczekiwany błąd | "Failed to create trip" | - |

### 7.2 Przykłady obsługi błędów

#### Walidacja

```typescript
const errors = validateCreateTripCommand(command);
if (errors.length > 0) {
  return new Response(JSON.stringify({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: errors
    }
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### Trip Limit Exceeded

```typescript
// Supabase trigger rzuci wyjątek
try {
  const { data, error } = await supabase.from('trips').insert(tripData);
} catch (err) {
  if (err.message.includes('maximum limit of 100 trips')) {
    return new Response(JSON.stringify({
      error: {
        code: 'TRIP_LIMIT_EXCEEDED',
        message: 'You have reached the maximum limit of 100 trips'
      }
    }), { status: 403 });
  }
}
```

#### Database Error

```typescript
const { data, error } = await supabase.from('trips').insert(tripData).select().single();

if (error) {
  console.error('Database error:', error);
  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Failed to create trip'
    }
  }), { status: 500 });
}
```

### 7.3 Logowanie błędów

**Co logować**:
- ✅ Wszystkie błędy 4xx i 5xx
- ✅ Próby dostępu bez autentykacji
- ✅ Przekroczenie limitu podróży
- ✅ Błędy bazy danych

**Format logów** (JSON):
```typescript
console.error({
  timestamp: new Date().toISOString(),
  level: 'ERROR',
  endpoint: 'POST /api/trips',
  user_id: userId || 'anonymous',
  error_code: 'VALIDATION_ERROR',
  message: 'Invalid request data',
  details: errors
});
```

**NIE logować**:
- ❌ JWT tokenów
- ❌ Haseł
- ❌ Danych osobowych (GDPR)

---

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

| Obszar | Zagrożenie | Wpływ |
|--------|------------|-------|
| **Database INSERT** | Wiele jednoczesnych requestów | Średni |
| **JWT Verification** | Wolne sprawdzanie tokenu | Niski |
| **RLS Policies** | Dodatkowe query do sprawdzenia user_id | Niski |
| **Trigger execution** | `enforce_trip_limit_trigger` robi COUNT(*) | Średni |

### 8.2 Strategie optymalizacji

#### Indexy bazy danych

Upewnij się, że istnieją (z [db-plan.md](../../supabase/db-plan.md)):

```sql
-- Kluczowy dla triggera enforce_trip_limit
CREATE INDEX idx_trips_user_id ON trips(user_id) WHERE deleted_at IS NULL;

-- Kluczowy dla sortowania wyników
CREATE INDEX idx_trips_created_at ON trips(created_at DESC) WHERE deleted_at IS NULL;
```

#### Optymalizacja zapytania INSERT

```typescript
// ✅ DOBRE: Single query z .select()
const { data, error } = await supabase
  .from('trips')
  .insert(tripData)
  .select()
  .single();

// ❌ ZŁE: Dwa zapytania (INSERT + SELECT)
await supabase.from('trips').insert(tripData);
const trip = await supabase.from('trips').select().eq('id', tripId).single();
```

#### Caching (przyszłość)

- ❌ Nie cache'ować POST requestów (non-idempotent)
- ✅ Można cache'ować trip count per user (Redis) do sprawdzenia limitu

### 8.3 Metryki do monitorowania

| Metryka | Cel | Alert jeśli |
|---------|-----|-------------|
| Response time (p95) | < 500ms | > 1000ms |
| Database INSERT time | < 100ms | > 300ms |
| Error rate | < 1% | > 5% |
| Trip creation rate | - | Monitoring only |

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

**1.1 Utworzyć katalogi** (jeśli nie istnieją):
```bash
mkdir -p src/lib/services
mkdir -p src/pages/api
mkdir -p src/lib/utils
```

**1.2 Utworzyć pliki**:
- `src/lib/services/validation.service.ts` - serwis walidacji
- `src/lib/services/trip.service.ts` - serwis logiki biznesowej trips
- `src/lib/utils/supabase.ts` - klient Supabase (jeśli nie istnieje)
- `src/pages/api/trips.ts` - główny endpoint API

**Zależności**:
- [src/types/dto.ts](../src/types/dto.ts) - już istnieje ✅
- [src/db/database.types.ts](../src/db/database.types.ts) - już istnieje ✅

---

### Krok 2: Implementacja Validation Service

**Plik**: `src/lib/services/validation.service.ts`

**Funkcjonalność**:
```typescript
import type { CreateTripCommand, ValidationErrorDetail } from '@/types/dto';

export function validateCreateTripCommand(
  command: CreateTripCommand
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  // 1. Walidacja destination
  if (!command.destination || command.destination.trim().length === 0) {
    errors.push({
      field: 'destination',
      message: 'Destination is required',
      value: command.destination
    });
  } else if (command.destination.length > 200) {
    errors.push({
      field: 'destination',
      message: 'Destination must be less than 200 characters',
      value: command.destination
    });
  }

  // 2. Walidacja start_date
  if (!command.start_date) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required'
    });
  } else if (!isValidDate(command.start_date)) {
    errors.push({
      field: 'start_date',
      message: 'Invalid date format. Use YYYY-MM-DD',
      value: command.start_date
    });
  }

  // 3. Walidacja end_date
  if (!command.end_date) {
    errors.push({
      field: 'end_date',
      message: 'End date is required'
    });
  } else if (!isValidDate(command.end_date)) {
    errors.push({
      field: 'end_date',
      message: 'Invalid date format. Use YYYY-MM-DD',
      value: command.end_date
    });
  }

  // 4. Walidacja relacji dat
  if (command.start_date && command.end_date &&
      isValidDate(command.start_date) && isValidDate(command.end_date)) {
    const startDate = new Date(command.start_date);
    const endDate = new Date(command.end_date);

    if (endDate < startDate) {
      errors.push({
        field: 'end_date',
        message: 'End date must be after or equal to start date',
        value: command.end_date
      });
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      errors.push({
        field: 'end_date',
        message: 'Trip duration cannot exceed 365 days',
        value: command.end_date
      });
    }
  }

  // 5. Walidacja description
  if (command.description && command.description.length > 2000) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 2000 characters',
      value: command.description
    });
  }

  return errors;
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

**Testy jednostkowe** (opcjonalne, ale zalecane):
- Test: destination wymagane
- Test: destination max 200 znaków
- Test: start_date format ISO 8601
- Test: end_date >= start_date
- Test: duration <= 365 dni
- Test: description max 2000 znaków

---

### Krok 3: Implementacja Trip Service

**Plik**: `src/lib/services/trip.service.ts`

**Funkcjonalność**:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type { CreateTripCommand, TripResponseDTO } from '@/types/dto';
import { sanitizeString } from './validation.service';

export class TripService {
  private supabase;

  constructor(supabaseClient: ReturnType<typeof createClient<Database>>) {
    this.supabase = supabaseClient;
  }

  async createTrip(
    userId: string,
    command: CreateTripCommand
  ): Promise<{ data: TripResponseDTO | null; error: Error | null }> {
    try {
      // 1. Sanityzacja danych
      const sanitizedDestination = sanitizeString(command.destination);
      const sanitizedDescription = command.description
        ? sanitizeString(command.description)
        : null;

      // 2. Określenie statusu
      const status = command.generate_ai ? 'generating' : 'draft';

      // 3. Przygotowanie danych do insertu
      const tripData: Database['public']['Tables']['trips']['Insert'] = {
        user_id: userId,
        destination: sanitizedDestination,
        start_date: command.start_date,
        end_date: command.end_date,
        description: sanitizedDescription,
        status: status,
        ai_model: command.generate_ai ? 'gpt-3.5-turbo' : null,
      };

      // 4. INSERT do bazy danych
      const { data, error } = await this.supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) {
        // Sprawdzenie specyficznych błędów
        if (error.message.includes('maximum limit of 100 trips')) {
          return {
            data: null,
            error: new Error('TRIP_LIMIT_EXCEEDED')
          };
        }

        console.error('Database error creating trip:', error);
        return {
          data: null,
          error: new Error('INTERNAL_ERROR')
        };
      }

      // 5. Transformacja do DTO
      const tripResponse: TripResponseDTO = {
        id: data.id,
        user_id: data.user_id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        status: data.status as 'draft' | 'generating' | 'completed' | 'failed',
        ai_generated_content: data.ai_generated_content as any, // Typed w DTO
        ai_model: data.ai_model,
        ai_tokens_used: data.ai_tokens_used,
        ai_generation_time_ms: data.ai_generation_time_ms,
        view_count: data.view_count ?? 0,
        last_viewed_at: data.last_viewed_at,
        edit_count: data.edit_count ?? 0,
        last_edited_at: data.last_edited_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // 6. TODO: Jeśli generate_ai === true, wywołaj AI Service (async)
      if (command.generate_ai) {
        // await aiService.generateItinerary(tripResponse.id);
        console.log('AI generation requested but not implemented yet');
      }

      return { data: tripResponse, error: null };

    } catch (err) {
      console.error('Unexpected error in createTrip:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error('INTERNAL_ERROR')
      };
    }
  }
}
```

---

### Krok 4: Konfiguracja Supabase Client

**Plik**: `src/lib/utils/supabase.ts` (jeśli nie istnieje)

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Tworzy Supabase client z custom JWT tokenem (dla API routes)
 */
export function createSupabaseClientWithToken(token: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
```

**Zmienne środowiskowe** (`.env`):
```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### Krok 5: Implementacja API Route

**Plik**: `src/pages/api/trips.ts`

**Funkcjonalność**:
```typescript
import type { APIRoute } from 'astro';
import { createSupabaseClientWithToken } from '@/lib/utils/supabase';
import { TripService } from '@/lib/services/trip.service';
import { validateCreateTripCommand } from '@/lib/services/validation.service';
import type { CreateTripCommand, ErrorResponse } from '@/types/dto';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Weryfikacja Content-Type
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Content-Type must be application/json'
        }
      } as ErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Uwierzytelnianie - wyciągnięcie JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      } as ErrorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Weryfikacja tokenu i pobranie user_id
    const supabase = createSupabaseClientWithToken(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token'
        }
      } as ErrorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    // 4. Parsowanie request body
    let command: CreateTripCommand;
    try {
      command = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Invalid JSON format'
        }
      } as ErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Walidacja danych wejściowych
    const validationErrors = validateCreateTripCommand(command);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationErrors
        }
      } as ErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Utworzenie podróży przez Trip Service
    const tripService = new TripService(supabase);
    const { data: trip, error: serviceError } = await tripService.createTrip(
      userId,
      command
    );

    if (serviceError) {
      // Obsługa specyficznych błędów
      if (serviceError.message === 'TRIP_LIMIT_EXCEEDED') {
        return new Response(JSON.stringify({
          error: {
            code: 'TRIP_LIMIT_EXCEEDED',
            message: 'You have reached the maximum limit of 100 trips'
          }
        } as ErrorResponse), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Ogólny błąd serwera
      return new Response(JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create trip'
        }
      } as ErrorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Zwrócenie sukcesu 201 Created
    return new Response(JSON.stringify(trip), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Location': `/api/trips/${trip!.id}`
      }
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/trips:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    } as ErrorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

### Krok 6: Testowanie endpointu

#### 6.1 Test manualny (cURL)

**Sukces - utworzenie podróży**:
```bash
curl -X POST http://localhost:4321/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "Paris, France",
    "start_date": "2025-06-01",
    "end_date": "2025-06-05",
    "description": "Romantic getaway"
  }'
```

**Oczekiwana odpowiedź**: 201 Created + Trip object

**Błąd walidacji**:
```bash
curl -X POST http://localhost:4321/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "destination": "",
    "start_date": "2025-06-05",
    "end_date": "2025-06-01"
  }'
```

**Oczekiwana odpowiedź**: 400 Bad Request + validation errors

**Brak autentykacji**:
```bash
curl -X POST http://localhost:4321/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo",
    "start_date": "2025-06-01",
    "end_date": "2025-06-07"
  }'
```

**Oczekiwana odpowiedź**: 401 Unauthorized

#### 6.2 Test integracyjny (Vitest)

**Plik**: `src/pages/api/trips.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('POST /api/trips', () => {
  let authToken: string;

  beforeAll(async () => {
    // Zaloguj się i pobierz token
    const supabase = createClient(/* ... */);
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = data.session!.access_token;
  });

  it('should create trip with valid data', async () => {
    const response = await fetch('http://localhost:4321/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        destination: 'Barcelona, Spain',
        start_date: '2025-08-10',
        end_date: '2025-08-17',
        description: 'Family vacation'
      })
    });

    expect(response.status).toBe(201);
    const trip = await response.json();
    expect(trip.destination).toBe('Barcelona, Spain');
    expect(trip.status).toBe('draft');
  });

  it('should return 400 for invalid dates', async () => {
    const response = await fetch('http://localhost:4321/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        destination: 'Tokyo',
        start_date: '2025-06-10',
        end_date: '2025-06-01' // end_date < start_date
      })
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth token', async () => {
    const response = await fetch('http://localhost:4321/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: 'London',
        start_date: '2025-07-01',
        end_date: '2025-07-05'
      })
    });

    expect(response.status).toBe(401);
  });
});
```

#### 6.3 Weryfikacja w bazie danych

Po utworzeniu podróży, sprawdź w Supabase Dashboard:

```sql
SELECT * FROM trips
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

Sprawdź, czy:
- ✅ `user_id` jest poprawny
- ✅ `destination`, `start_date`, `end_date` są zgodne z requestem
- ✅ `status` = 'draft' (lub 'generating')
- ✅ `created_at`, `updated_at` są ustawione
- ✅ `ai_generated_content` = null

---

### Krok 7: Dokumentacja i finalizacja

#### 7.1 Aktualizacja dokumentacji API

**Plik**: `.ai/api-plan.md` - już istnieje ✅

Upewnij się, że dokumentacja zawiera:
- ✅ Request/Response examples
- ✅ Error codes
- ✅ Validation rules

#### 7.2 Przykłady użycia dla frontend

**Plik**: `docs/api-examples.md` (opcjonalny)

```typescript
// Przykład użycia w React component
import { useState } from 'react';
import { supabase } from '@/lib/utils/supabase';

function CreateTripForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in first');
        return;
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          destination: 'Paris, France',
          start_date: '2025-06-01',
          end_date: '2025-06-05',
          description: 'Romantic getaway',
          generate_ai: true
        })
      });

      if (response.status === 201) {
        const trip = await response.json();
        console.log('Trip created:', trip);
        // Redirect to trip details page
      } else {
        const error = await response.json();
        console.error('Error:', error);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        Create Trip
      </button>
    </form>
  );
}
```

#### 7.3 Checklist finalizacji

- [ ] Wszystkie pliki utworzone i zaimplementowane
- [ ] Walidacja działa poprawnie
- [ ] Testy manualne przeszły
- [ ] Testy jednostkowe napisane (opcjonalne)
- [ ] Błędy są logowane
- [ ] RLS policies działają
- [ ] JWT authentication działa
- [ ] Trip limit (100) jest egzekwowany
- [ ] Sanityzacja danych wejściowych
- [ ] Response zawiera poprawne kody statusu
- [ ] Location header jest ustawiony w 201
- [ ] Dokumentacja zaktualizowana

---

## 10. Monitorowanie i metryki

### Kluczowe metryki

Po wdrożeniu, monitoruj:

| Metryka | Narzędzie | Alert jeśli |
|---------|-----------|-------------|
| Liczba utworzonych podróży | Supabase Analytics | - |
| Response time (p95) | APM tool | > 1000ms |
| Error rate | Logging service | > 5% |
| 401 Unauthorized rate | Security logs | Wysokie (możliwy atak) |
| 403 Trip Limit rate | Application logs | Wysokie (użytkownicy hit limit) |

### Logi do analizy

```typescript
// Przykład structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'trip_created',
  user_id: userId,
  trip_id: trip.id,
  destination: trip.destination,
  generate_ai: command.generate_ai,
  duration_ms: performance.now() - startTime
}));
```

---

## 11. Następne kroki (poza zakresem tego planu)

Po implementacji `POST /api/trips`, rozważ:

1. **GET /api/trips** - lista podróży użytkownika (z paginacją)
2. **GET /api/trips/:id** - szczegóły pojedynczej podróży
3. **PATCH /api/trips/:id** - aktualizacja podróży
4. **DELETE /api/trips/:id** - usunięcie podróży
5. **POST /api/trips/:id/generate-ai** - generowanie AI itinerarium
6. **AI Service** - integracja z OpenAI/OpenRouter
7. **Rate Limiting Middleware** - limit requestów per user
8. **Caching** - Redis dla rate limits i trip count

---

## Appendix A: Struktura plików po implementacji

```
10x-astro-starter/
├── src/
│   ├── db/
│   │   └── database.types.ts          (✅ już istnieje)
│   ├── types/
│   │   └── dto.ts                     (✅ już istnieje)
│   ├── lib/
│   │   ├── services/
│   │   │   ├── validation.service.ts  (🆕 do utworzenia)
│   │   │   └── trip.service.ts        (🆕 do utworzenia)
│   │   └── utils/
│   │       └── supabase.ts            (🆕 do utworzenia)
│   └── pages/
│       └── api/
│           └── trips.ts               (🆕 do utworzenia)
├── supabase/
│   ├── migrations/
│   │   └── 20251013120000_create_initial_tables.sql (✅ już istnieje)
│   └── db-plan.md                     (✅ już istnieje)
└── .ai/
    ├── api-plan.md                    (✅ już istnieje)
    └── view-implementation-plan.md    (📄 ten plik)
```

---

## Appendix B: Zmienne środowiskowe

**Plik**: `.env`

```env
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: OpenAI (dla przyszłej integracji AI)
# OPENAI_API_KEY=sk-...
```

**Plik**: `.env.example` (do repozytorium)

```env
# Supabase
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=

# Optional: OpenAI
# OPENAI_API_KEY=
```

---

## Appendix C: Referencje

- [API Plan](./api-plan.md) - pełna specyfikacja API
- [Database Plan](../../supabase/db-plan.md) - schemat bazy danych
- [DTO Types](../src/types/dto.ts) - definicje typów
- [Database Types](../src/db/database.types.ts) - typy Supabase
- [Tech Stack](./tech/tech-stack.md) - stack technologiczny
- [Backend Rules](../.cursor/rules/backend.mdc) - reguły implementacji
- [Astro Rules](../.cursor/rules/astro.mdc) - reguły Astro
- [Shared Rules](../.cursor/rules/shared.mdc) - wspólne reguły

---

**Dokument wersja**: 1.0
**Data utworzenia**: 2025-01-15
**Endpoint**: POST /api/trips
**Status**: Gotowy do implementacji ✅
