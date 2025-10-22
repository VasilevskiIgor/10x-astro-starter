# Debug: Application Hang Issue

## Problem
Aplikacja zawiesza się po kliknięciu przycisku "Create Trip".

## Dodane logowanie
Dodałem szczegółowe logowanie w hooku `useCreateTrip` aby zdiagnozować problem.

## Jak debugować

### 1. Otwórz konsolę przeglądarki
- Naciśnij F12 (DevTools)
- Przejdź do zakładki "Console"

### 2. Wypełnij formularz i kliknij "Create Trip"

### 3. Sprawdź logi w konsoli

Powinieneś zobaczyć sekwencję logów:
```
[useCreateTrip] Starting createTrip with data: { destination: "...", ... }
[useCreateTrip] Getting access token...
[useCreateTrip] Access token retrieved: YES/NO
```

### 4. Analiza możliwych problemów

#### Scenariusz A: Zawieszenie przed "Getting access token"
**Problem:** React hook nie wykonuje się
**Rozwiązanie:** Sprawdź czy komponent TripForm jest prawidłowo zamontowany z `client:load`

#### Scenariusz B: Zawieszenie na "Getting access token"
**Problem:** Supabase `getSession()` się zawiesza
**Możliwe przyczyny:**
- Brak konfiguracji Supabase (SUPABASE_URL, SUPABASE_KEY)
- Problem z Supabase client
- Network timeout

**Rozwiązanie tymczasowe (dla testów bez autentykacji):**
Zobacz sekcję "Temporary Fix" poniżej

#### Scenariusz C: "Access token retrieved: NO"
**Problem:** Użytkownik nie jest zalogowany
**Oczekiwane:** Powinien pojawić się error alert: "You must be logged in to create a trip"

#### Scenariusz D: Błąd podczas API request
**Problem:** Endpoint `/api/trips` zwraca błąd
**Sprawdź:**
- Terminal dev servera (błędy po stronie serwera)
- Network tab w DevTools (status code, response)

---

## Temporary Fix: Testing bez autentykacji

Jeśli chcesz przetestować formularz **bez logowania**, możesz tymczasowo zmodyfikować hook:

### Opcja 1: Mock token (tylko do testów!)

Edytuj `src/hooks/useCreateTrip.ts`:

```typescript
async function getAccessToken(): Promise<string | null> {
  // TEMPORARY: Bypass auth for testing
  console.warn('⚠️ USING MOCK TOKEN - FOR TESTING ONLY!');
  return 'mock-token-for-testing';

  // Original code (commented out):
  // try {
  //   const { data: { session }, error } = await supabaseClient.auth.getSession();
  //   if (error) {
  //     console.error('Failed to get session:', error);
  //     return null;
  //   }
  //   return session?.access_token ?? null;
  // } catch (error) {
  //   console.error('Failed to get access token:', error);
  //   return null;
  // }
}
```

**UWAGA:** To spowoduje, że backend odrzuci request (401 Unauthorized), ale pozwoli zdiagnozować gdzie dokładnie jest problem.

### Opcja 2: Test z mock API response

Edytuj `src/hooks/useCreateTrip.ts`:

```typescript
const createTrip = React.useCallback(
  async (data: CreateTripCommand): Promise<TripResponseDTO | null> => {
    console.log('[useCreateTrip] MOCK MODE - Simulating success');

    // Mock successful response
    setState({ isLoading: true, error: null, validationErrors: null, trip: null });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    const mockTrip: TripResponseDTO = {
      id: 'mock-trip-id-123',
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description,
      status: 'draft',
      ai_generated_content: null,
      user_id: 'mock-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setState({ isLoading: false, error: null, validationErrors: null, trip: mockTrip });

    return mockTrip;
  },
  []
);
```

To pozwoli przetestować:
- ✅ Formularz submission
- ✅ Loading state
- ✅ Success redirect
- ✅ Draft clearing
- ❌ Prawdziwe API call (wymaga autentykacji)

---

## Prawdopodobna przyczyna problemu

**Najbardziej prawdopodobne:** Brak zalogowanego użytkownika w Supabase.

### Dlaczego się zawiesza?

1. User wypełnia formularz
2. Klika "Create Trip"
3. Hook `useCreateTrip` wywołuje `getAccessToken()`
4. Supabase zwraca `session = null` (brak zalogowanego użytkownika)
5. Hook rzuca `AuthenticationError`
6. **PROBLEM:** Error nie jest prawidłowo wyświetlany w UI

### Sprawdź czy error jest wyświetlany

W komponencie `TripForm` mamy:

```tsx
{error && !apiValidationErrors && (
  <ErrorAlert type="error" message={error} />
)}
```

**Debug:**
1. Dodaj `console.log('TripForm error:', error)` w komponencie
2. Sprawdź czy error alert się pojawia

---

## Rozwiązanie długoterminowe

### 1. Dodaj Supabase Auth
Zaimplementuj system logowania:
- Login page
- Registration page
- Auth middleware (already exists)
- Protected routes

### 2. Redirect do logowania
Zamiast pokazywać error, przekieruj do strony logowania:

```typescript
if (error instanceof AuthenticationError) {
  window.location.href = '/auth/login?redirect=/trips/new';
}
```

### 3. Loading state dla auth check
Dodaj sprawdzenie sesji przed renderowaniem formularza:

```tsx
const [isCheckingAuth, setIsCheckingAuth] = useState(true);

useEffect(() => {
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      window.location.href = '/auth/login';
    } else {
      setIsCheckingAuth(false);
    }
  });
}, []);

if (isCheckingAuth) {
  return <div>Checking authentication...</div>;
}
```

---

## Następne kroki

1. **Sprawdź logi w konsoli** - określ gdzie dokładnie się zawiesza
2. **Sprawdź network tab** - czy request do `/api/trips` jest wysyłany
3. **Sprawdź terminal dev servera** - czy są błędy po stronie serwera
4. **Użyj temporary fix** - przetestuj formularz z mock data
5. **Zaimplementuj auth** - dodaj system logowania

---

## Quick Test Checklist

- [ ] Console DevTools otwarta
- [ ] Widzę logi `[useCreateTrip]` w konsoli
- [ ] Sprawdziłem Network tab (czy fetch jest wysyłany)
- [ ] Sprawdziłem terminal (błędy serwera)
- [ ] Error alert pojawia się w UI (jeśli brak tokenu)

---

## Zgłoś wyniki

Po wykonaniu kroków debugowania, zgłoś:

1. **Ostatni log w konsoli:** "..."
2. **Czy fetch jest wysyłany:** TAK/NIE
3. **Status code (jeśli fetch):** 200/401/500/...
4. **Error w UI:** TAK/NIE
5. **Error message:** "..."

To pozwoli mi na dokładną diagnozę i naprawę problemu.
