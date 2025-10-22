# Test AI Generation API

Ten dokument zawiera przykładowe zapytania do testowania endpointu generowania AI.

## Krok 1: Utwórz użytkownika testowego (jeśli jeszcze nie istnieje)

```bash
# W Supabase Studio: http://127.0.0.1:54323
# Lub użyj API
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

## Krok 2: Zaloguj się i uzyskaj JWT token

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

Zapisz `access_token` z odpowiedzi.

## Krok 3: Utwórz trip testowy

```bash
# Zastąp YOUR_JWT_TOKEN swoim tokenem
curl -X POST 'http://localhost:3000/api/trips' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo, Japan",
    "start_date": "2025-06-01",
    "end_date": "2025-06-07",
    "description": "First time in Japan, interested in culture, food, and technology",
    "generate_ai": false
  }'
```

Zapisz `id` zwróconego tripu.

## Krok 4: Wygeneruj AI itinerary

### Test 1: Podstawowe generowanie (domyślne parametry)

```bash
# Zastąp YOUR_JWT_TOKEN i TRIP_ID
curl -X POST 'http://localhost:3000/api/trips/TRIP_ID/generate-ai' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2: Z niestandardowymi parametrami

```bash
curl -X POST 'http://localhost:3000/api/trips/TRIP_ID/generate-ai' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "temperature": 0.8,
    "force_regenerate": false
  }'
```

### Test 3: Regeneracja istniejącej treści

```bash
curl -X POST 'http://localhost:3000/api/trips/TRIP_ID/generate-ai' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force_regenerate": true
  }'
```

## Krok 5: Pobierz trip z wygenerowaną treścią

```bash
curl -X GET 'http://localhost:3000/api/trips/TRIP_ID' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Krok 6: Sprawdź rate limits

```bash
curl -X GET 'http://localhost:3000/api/users/me/rate-limits' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Oczekiwane odpowiedzi

### Sukces (200 OK)

```json
{
  "id": "uuid",
  "status": "completed",
  "ai_generated_content": {
    "summary": "A 7-day cultural and culinary journey...",
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
      "transportation": "JR Pass highly recommended",
      "accommodation": "Stay in Shinjuku",
      "budget": "Estimated $1500-2000 per person",
      "best_time": "June is pleasant"
    }
  },
  "ai_model": "gpt-3.5-turbo",
  "ai_tokens_used": 1250,
  "ai_generation_time_ms": 4500
}
```

### Błąd - Trip nie istnieje (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip not found"
  }
}
```

### Błąd - Trip już generuje (409)

```json
{
  "error": {
    "code": "GENERATION_IN_PROGRESS",
    "message": "AI generation already in progress for this trip"
  }
}
```

### Błąd - Przekroczony limit (429)

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

### Błąd - AI generowanie nie powiodło się (500)

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

## Debugowanie

### Sprawdź logi serwera dev

```bash
cd 10x-astro-starter
npm run dev
# Obserwuj logi w konsoli podczas wykonywania zapytań
```

### Sprawdź dane w Supabase Studio

Otwórz http://127.0.0.1:54323 i sprawdź tabele:
- `trips` - czy status się zaktualizował
- `user_rate_limits` - czy liczniki się zwiększyły
- `ai_generation_logs` - czy próby zostały zalogowane

### Sprawdź klucz API OpenAI

```bash
# W pliku .env
cat 10x-astro-starter/.env | grep OPENAI_API_KEY
```

## Uwagi

1. **OpenRouter vs OpenAI**: Używamy OpenRouter jako proxy do OpenAI
2. **Timeout**: Generowanie może zająć 30-60 sekund
3. **Rate Limits**:
   - Hourly: 5 generowań
   - Daily: 10 generowań
4. **Modele**: Domyślnie `gpt-3.5-turbo`, można użyć `gpt-4` (droższy)
