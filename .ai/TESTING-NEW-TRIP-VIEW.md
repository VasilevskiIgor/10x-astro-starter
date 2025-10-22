# Testing Guide: New Trip View

## Przegląd implementacji

Widok tworzenia nowej podróży został zaimplementowany zgodnie z planem w pliku `new-trip-view-implementation-plan.md`.

## Zaimplementowane pliki

### Komponenty React
- ✅ `src/components/forms/TripForm.tsx` - główny formularz tworzenia podróży
- ✅ `src/components/forms/DateRangePicker.tsx` - wybór zakresu dat
- ✅ `src/components/ui/ErrorAlert.tsx` - komponent alertów (error, warning, info, success)

### Komponenty Astro
- ✅ `src/components/ui/Breadcrumb.astro` - nawigacja breadcrumb
- ✅ `src/pages/trips/new.astro` - strona formularza
- ✅ `src/pages/trips/[id].astro` - strona szczegółów podróży (placeholder)

### Utility i Hooks
- ✅ `src/lib/validation-client.ts` - walidacja formularza po stronie klienta
- ✅ `src/lib/localStorage.ts` - zarządzanie draft w localStorage
- ✅ `src/hooks/useCreateTrip.ts` - custom hook do tworzenia podróży

## Instrukcje uruchomienia

### 1. Przejdź do katalogu projektu
```bash
cd 10x-astro-starter
```

### 2. Zainstaluj dependencies (jeśli nie zrobione wcześniej)
```bash
npm install
```

### 3. Skonfiguruj zmienne środowiskowe
Upewnij się, że plik `.env` zawiera:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Uruchom dev server
```bash
npm run dev
```

Aplikacja powinna być dostępna pod adresem: http://localhost:3000

## Scenariusze testowe

### Test 1: Podstawowa nawigacja
1. Otwórz http://localhost:3000
2. Kliknij przycisk "Create New Trip"
3. ✅ Powinno przekierować do `/trips/new`
4. ✅ Breadcrumb powinien pokazywać: Home > Trips > New Trip
5. ✅ Formularz powinien być widoczny z wszystkimi polami

### Test 2: Walidacja formularza - puste pola
1. Na stronie `/trips/new` kliknij "Create Trip" bez wypełniania pól
2. ✅ Powinny pojawić się błędy walidacji:
   - "Destination is required"
   - "Start date is required"
   - "End date is required"
3. ✅ Pola z błędami powinny mieć czerwone ramki

### Test 3: Walidacja formularza - nieprawidłowe daty
1. Wypełnij formularz:
   - Destination: "Paris, France"
   - Start Date: 2025-12-01
   - End Date: 2025-11-01 (wcześniejsza niż start date)
2. Kliknij "Create Trip"
3. ✅ Powinien pojawić się błąd: "End date must be after or equal to start date"

### Test 4: Walidacja formularza - zbyt długa podróż
1. Wypełnij formularz:
   - Destination: "Tokyo, Japan"
   - Start Date: 2025-01-01
   - End Date: 2026-02-01 (więcej niż 365 dni)
2. Kliknij "Create Trip"
3. ✅ Powinien pojawić się błąd: "Trip duration cannot exceed 365 days"

### Test 5: Licznik dni podróży
1. Wypełnij:
   - Start Date: 2025-12-01
   - End Date: 2025-12-05
2. ✅ Pod polami dat powinno pojawić się: "Trip duration: 4 days"

### Test 6: Walidacja - zbyt długi opis
1. Wpisz w pole Description tekst o długości > 2000 znaków
2. ✅ Powinien pojawić się błąd: "Description must be less than 2000 characters"
3. ✅ Licznik znaków powinien pokazywać: "2100/2000 characters" (przykład)

### Test 7: Auto-save do localStorage (Draft)
1. Wypełnij częściowo formularz:
   - Destination: "Barcelona"
   - Start Date: 2025-06-01
2. Poczekaj 1-2 sekundy
3. Odśwież stronę (F5)
4. ✅ Formularz powinien zostać przywrócony z wartościami
5. ✅ Na górze formularza powinien pojawić się niebieski alert:
   "We've restored your previous draft. You can continue editing or start fresh."

### Test 8: Czyszczenie draft
1. Po przywróceniu draft (Test 7)
2. Kliknij przycisk "Clear Draft"
3. ✅ Formularz powinien zostać wyczyszczony
4. ✅ Alert o draft powinien zniknąć

### Test 9: Tworzenie podróży bez AI (WYMAGA ZALOGOWANIA)
**Uwaga: Ten test wymaga działającego backendu i sesji użytkownika**

1. Zaloguj się do aplikacji (Supabase Auth)
2. Wypełnij formularz:
   - Destination: "London, UK"
   - Start Date: 2025-07-15
   - End Date: 2025-07-22
   - Description: "Summer vacation with family"
   - Generate AI Itinerary: NIE zaznaczone
3. Kliknij "Create Trip"
4. ✅ Przycisk powinien pokazać spinner: "Creating Trip..."
5. ✅ Po sukcesie przekierowanie do `/trips/:id`
6. ✅ Draft powinien zostać wyczyszczony z localStorage

### Test 10: Tworzenie podróży z AI (WYMAGA ZALOGOWANIA)
**Uwaga: Ten test wymaga działającego backendu i sesji użytkownika**

1. Zaloguj się do aplikacji
2. Wypełnij formularz:
   - Destination: "Rome, Italy"
   - Start Date: 2025-09-01
   - End Date: 2025-09-07
   - Description: "Historic tour, interested in art and cuisine"
   - Generate AI Itinerary: ZAZNACZONE
3. Kliknij "Create Trip"
4. ✅ Przycisk powinien pokazać: "Creating & Generating..."
5. ✅ Po sukcesie przekierowanie do `/trips/:id`

### Test 11: Obsługa błędów API - Unauthorized (bez logowania)
1. Wypełnij poprawnie formularz
2. Kliknij "Create Trip" (bez zalogowania)
3. ✅ Powinien pojawić się czerwony alert z błędem:
   "You must be logged in to create a trip"

### Test 12: Responsywność mobile
1. Otwórz DevTools (F12)
2. Przełącz na widok mobile (iPhone/Android)
3. ✅ Formularz powinien być czytelny
4. ✅ Pola dat powinny być ułożone pionowo (1 kolumna)
5. ✅ Przyciski powinny być dostępne

### Test 13: Real-time validation podczas wpisywania
1. Wpisz w Destination: "A" (1 znak)
2. Kliknij poza pole (blur)
3. ✅ Nie powinno być błędu (to pole wymaga tylko niepustej wartości)
4. Wyczyść pole (usuń "A")
5. Kliknij poza pole
6. ✅ Powinien pojawić się błąd: "Destination is required"
7. Wpisz ponownie tekst
8. ✅ Błąd powinien zniknąć automatycznie
9. ✅ Ramka pola powinna zmienić kolor na zielony

### Test 14: Accessibility (A11y)
1. Użyj klawisza Tab do nawigacji po formularzu
2. ✅ Wszystkie pola powinny być osiągalne przez klawiaturę
3. ✅ Focus powinien być widoczny (ring)
4. Użyj screen readera (NVDA/JAWS/VoiceOver)
5. ✅ Wszystkie pola powinny być prawidłowo oznaczone
6. ✅ Błędy powinny być ogłaszane przez screen reader

## Известные ograniczenia

1. **Autentykacja**: Testy 9-11 wymagają zaimplementowanego systemu logowania
2. **Backend API**: Endpoint `POST /api/trips` musi być dostępny
3. **Strona szczegółów**: `/trips/:id` jest obecnie placeholderem

## Struktura komponentów

```
TripForm (React)
├── ErrorAlert (draft notice)
├── ErrorAlert (API errors)
├── Input (destination)
├── DateRangePicker
│   ├── Input (start date)
│   └── Input (end date)
├── Textarea (description)
├── Checkbox (generateAI)
└── Buttons (Clear Draft, Cancel, Create Trip)
```

## Najważniejsze funkcje

### Walidacja client-side
- Destination: wymagane, max 200 znaków
- Start Date: wymagane, format ISO 8601
- End Date: wymagane, >= start_date, <= 365 dni
- Description: opcjonalne, max 2000 znaków

### Auto-save
- Debounce: 500ms
- Expiry: 24 godziny
- Storage key: `vibetravels_new_trip_draft`

### Retry logic (API)
- Max retries: 2
- Delay: 1s, 2s
- Tylko dla błędów sieciowych

## Troubleshooting

### Problem: "localStorage is not available"
**Rozwiązanie**: Upewnij się, że przeglądarka nie jest w trybie prywatnym/incognito

### Problem: "SUPABASE_URL is not defined"
**Rozwiązanie**: Sprawdź plik `.env` i zmienne środowiskowe

### Problem: Formularz nie ładuje się
**Rozwiązanie**:
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź czy React component ma `client:load`
3. Sprawdź terminal dev servera

### Problem: Błąd TypeScript w edytorze
**Rozwiązanie**: Uruchom `npm run dev` - Astro wygeneruje pliki typów

## Następne kroki (TODO)

Po pomyślnym przetestowaniu podstawowego flow:

1. ⏭️ Implementacja strony listy podróży (`/trips`)
2. ⏭️ Implementacja pełnej strony szczegółów podróży (`/trips/:id`)
3. ⏭️ Dodanie UI feedback podczas generowania AI (progress indicator)
4. ⏭️ Implementacja polling dla async AI generation (jeśli backend zwraca 202)
5. ⏭️ Dodanie toast notifications dla lepszego UX
6. ⏭️ Implementacja edycji podróży
7. ⏭️ Implementacja usuwania podróży

## Kontakt

Jeśli znajdziesz błędy lub masz pytania, zgłoś je podczas review.
