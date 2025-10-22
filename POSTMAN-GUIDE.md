# Postman Testing Guide - VibeTravels API

## Konfiguracja

### Informacje podstawowe
- **Base URL**: `http://localhost:3002`
- **Supabase URL**: `http://127.0.0.1:54321`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

### Przed rozpoczęciem
1. Upewnij się, że serwer dev działa: `npm run dev` (w katalogu `10x-astro-starter`)
2. Sprawdź, czy Supabase jest uruchomiony: `npx supabase status`
3. Serwer powinien działać na **http://localhost:3002**

---

## 📁 Postman Collection

### Krok 1: Utwórz kolekcję w Postman

Nazwa kolekcję: **VibeTravels API**

### Krok 2: Ustaw zmienne kolekcji (Collection Variables)

W Postman, kliknij prawym na kolekcję → **Edit** → **Variables**

| Variable Name | Initial Value | Current Value |
|---------------|---------------|---------------|
| `base_url` | `http://localhost:3002` | `http://localhost:3002` |
| `supabase_url` | `http://127.0.0.1:54321` | `http://127.0.0.1:54321` |
| `anon_key` | (wklej anon key powyżej) | (wklej anon key powyżej) |
| `jwt_token` | | (zostanie ustawione po logowaniu) |
| `trip_id` | | (zostanie ustawione po utworzeniu tripu) |

---

## 🔐 Authentication Requests

### 1. Sign Up (Rejestracja)

**Request Name**: `Auth - Sign Up`

**Method**: `POST`

**URL**: `{{supabase_url}}/auth/v1/signup`

**Headers**:
```
apikey: {{anon_key}}
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "postman-test@example.com",
  "password": "SecurePass123!"
}
```

**Tests Script** (zakładka Tests):
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set("jwt_token", jsonData.access_token);
    console.log("JWT Token saved:", jsonData.access_token);
}
```

---

### 2. Login (Logowanie)

**Request Name**: `Auth - Login`

**Method**: `POST`

**URL**: `{{supabase_url}}/auth/v1/token?grant_type=password`

**Headers**:
```
apikey: {{anon_key}}
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "postman-test@example.com",
  "password": "SecurePass123!"
}
```

**Tests Script**:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set("jwt_token", jsonData.access_token);
    console.log("JWT Token saved:", jsonData.access_token);
}
```

---

## 🗺️ Trip Endpoints

### 3. Create Trip

**Request Name**: `Trips - Create`

**Method**: `POST`

**URL**: `{{base_url}}/api/trips`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "destination": "Tokyo, Japan",
  "start_date": "2025-06-01",
  "end_date": "2025-06-07",
  "description": "First time in Japan, interested in culture, food, and technology. Would like to visit temples, try authentic ramen, and see modern Tokyo.",
  "generate_ai": false
}
```

**Tests Script**:
```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set("trip_id", jsonData.id);
    console.log("Trip ID saved:", jsonData.id);
}
```

**Przykłady alternatywnych destinacji**:

Paris:
```json
{
  "destination": "Paris, France",
  "start_date": "2025-07-01",
  "end_date": "2025-07-05",
  "description": "Romantic getaway, interested in art, food, and architecture",
  "generate_ai": false
}
```

New York:
```json
{
  "destination": "New York City, USA",
  "start_date": "2025-08-15",
  "end_date": "2025-08-20",
  "description": "Business trip with some free time. Love museums, Broadway shows, and great food",
  "generate_ai": false
}
```

---

### 4. List Trips

**Request Name**: `Trips - List`

**Method**: `GET`

**URL**: `{{base_url}}/api/trips?limit=20&offset=0`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
```

**Query Parameters** (opcjonalne):
- `limit`: 20
- `offset`: 0
- `status`: draft / generating / completed / failed
- `sort`: created_at:desc / start_date:asc / destination:asc

---

### 5. Get Trip by ID

**Request Name**: `Trips - Get by ID`

**Method**: `GET`

**URL**: `{{base_url}}/api/trips/{{trip_id}}`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
```

---

### 6. Update Trip

**Request Name**: `Trips - Update`

**Method**: `PATCH`

**URL**: `{{base_url}}/api/trips/{{trip_id}}`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "description": "Updated description: First time in Japan, very excited about ramen and temples!"
}
```

Możesz zaktualizować dowolne pola:
```json
{
  "destination": "Tokyo and Kyoto, Japan",
  "start_date": "2025-06-01",
  "end_date": "2025-06-10",
  "description": "Extended trip with Kyoto visit"
}
```

---

### 7. Delete Trip

**Request Name**: `Trips - Delete`

**Method**: `DELETE`

**URL**: `{{base_url}}/api/trips/{{trip_id}}`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
```

**Expected Response**: `204 No Content` (brak body)

---

## 🤖 AI Generation Endpoints

### 8. Generate AI Itinerary

**Request Name**: `AI - Generate Itinerary`

**Method**: `POST`

**URL**: `{{base_url}}/api/trips/{{trip_id}}/generate-ai`

**Headers**:
```
Authorization: Bearer {{jwt_token}}
Content-Type: application/json
```

**Body** (JSON - wszystkie pola opcjonalne):
```json
{}
```

**Z parametrami**:
```json
{
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}
```

**Force regenerate** (jeśli trip już ma AI content):
```json
{
  "force_regenerate": true,
  "temperature": 0.8
}
```

**Uwaga**: To zapytanie może potrwać 20-60 sekund! Ustaw timeout w Postman na co najmniej 90 sekund:
- Settings → General → Request timeout in ms: `90000`

---

## 📊 Oczekiwane odpowiedzi

### Success Responses

#### Trip Created (201)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "destination": "Tokyo, Japan",
  "start_date": "2025-06-01",
  "end_date": "2025-06-07",
  "description": "First time in Japan...",
  "status": "draft",
  "ai_generated_content": null,
  "ai_model": null,
  "ai_tokens_used": null,
  "ai_generation_time_ms": null,
  "view_count": 0,
  "created_at": "2025-10-18T18:00:00Z",
  "updated_at": "2025-10-18T18:00:00Z"
}
```

#### AI Generation Success (200)
```json
{
  "id": "uuid",
  "status": "completed",
  "ai_generated_content": {
    "summary": "Experience the best of Tokyo in 7 days...",
    "days": [
      {
        "day_number": 1,
        "date": "2025-06-01",
        "title": "Arrival in Tokyo",
        "activities": [
          {
            "time": "14:00",
            "title": "Check-in at Hotel",
            "description": "Arrive in Tokyo and check-in...",
            "location": "Hotel in Shinjuku",
            "duration_minutes": 60,
            "cost_estimate": "$$",
            "tips": "Consider taking a short rest..."
          }
        ]
      }
    ],
    "recommendations": {
      "transportation": "Use the efficient Tokyo Metro...",
      "accommodation": "Stay in Shinjuku for central location...",
      "budget": "Estimated budget range: $$-$$$...",
      "best_time": "Visit in late spring or autumn..."
    }
  },
  "ai_model": "gpt-3.5-turbo",
  "ai_tokens_used": 2501,
  "ai_generation_time_ms": 22463
}
```

### Error Responses

#### Unauthorized (401)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Not Found (404)
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip not found"
  }
}
```

#### Generation in Progress (409)
```json
{
  "error": {
    "code": "GENERATION_IN_PROGRESS",
    "message": "AI generation already in progress for this trip"
  }
}
```

#### Rate Limit Exceeded (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded your hourly AI generation limit",
    "details": {
      "limit": "hourly",
      "reset_at": "2025-10-18T19:00:00Z",
      "daily_remaining": 3
    }
  }
}
```

#### AI Generation Failed (500)
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

---

## 🔄 Typowy Flow Testowania

### Scenariusz 1: Nowy użytkownik tworzy trip z AI

1. **Sign Up** → Zapisuje `jwt_token`
2. **Create Trip** → Zapisuje `trip_id`
3. **Generate AI** → Czeka 20-60s na wygenerowanie
4. **Get Trip by ID** → Sprawdza wygenerowaną treść
5. **List Trips** → Widzi trip ze statusem "completed"

### Scenariusz 2: Istniejący użytkownik regeneruje plan

1. **Login** → Zapisuje `jwt_token`
2. **Create Trip** → Zapisuje `trip_id`
3. **Generate AI** → Pierwsze generowanie
4. **Generate AI** z `force_regenerate: true` → Regeneracja

### Scenariusz 3: Testowanie rate limits

1. **Login**
2. **Create Trip** (5x) → Utworzenie 5 różnych tripów
3. **Generate AI** (6x) → 6-te wywołanie powinno zwrócić 429

---

## 🛠️ Troubleshooting

### Problem: 401 Unauthorized
- **Rozwiązanie**: Sprawdź czy `jwt_token` jest ustawiony w zmiennych kolekcji
- Wykonaj ponownie Login i upewnij się, że Tests script zapisał token

### Problem: 404 Not Found dla tripu
- **Rozwiązanie**: Sprawdź czy `trip_id` jest poprawnie ustawiony
- Wykonaj ponownie Create Trip

### Problem: Timeout podczas AI generation
- **Rozwiązanie**: Zwiększ timeout w Postman Settings
- Sprawdź logi serwera dev (`npm run dev`)
- Sprawdź klucz OpenAI w `.env`

### Problem: Connection refused
- **Rozwiązanie**: Upewnij się, że serwer dev działa (`npm run dev`)
- Sprawdź port (powinno być 3002, może być inny jeśli 3002 jest zajęty)
- Zaktualizuj `base_url` w zmiennych kolekcji

### Problem: Supabase auth error
- **Rozwiązanie**: Sprawdź czy Supabase działa: `npx supabase status`
- Uruchom ponownie: `npx supabase start`

---

## 📥 Import gotowej kolekcji

Możesz zaimportować poniższą kolekcję JSON do Postmana:

```json
{
  "info": {
    "name": "VibeTravels API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3002"
    },
    {
      "key": "supabase_url",
      "value": "http://127.0.0.1:54321"
    },
    {
      "key": "anon_key",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    },
    {
      "key": "jwt_token",
      "value": ""
    },
    {
      "key": "trip_id",
      "value": ""
    }
  ]
}
```

Zapisz powyższy JSON jako `VibeTravels-API.postman_collection.json` i zaimportuj w Postman.

---

## ✅ Checklist testowania

- [ ] Rejestracja nowego użytkownika
- [ ] Logowanie istniejącego użytkownika
- [ ] Utworzenie tripu
- [ ] Lista tripów
- [ ] Pobranie szczegółów tripu
- [ ] Aktualizacja tripu
- [ ] Usunięcie tripu
- [ ] Generowanie AI dla tripu (pierwsze)
- [ ] Regeneracja AI z `force_regenerate: true`
- [ ] Test rate limits (6+ generowań)
- [ ] Test błędów (nieprawidłowy token, nieistniejący trip)

---

## 📝 Notatki

- **Port**: Serwer może zmienić port jeśli 3002 jest zajęty - sprawdź w logach `npm run dev`
- **Token expiry**: JWT token wygasa po czasie - jeśli dostajesz 401, zaloguj się ponownie
- **OpenAI Key**: Upewnij się, że klucz w `.env` jest prawidłowy
- **Rate Limits**: Hourly: 5, Daily: 10 (zdefiniowane w bazie danych)
