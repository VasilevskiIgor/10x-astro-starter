# Plan implementacji widoku tworzenia nowej podróży

## 1. Przegląd

Widok tworzenia nowej podróży (`/trips/new`) to kluczowy element aplikacji VibeTravels MVP, umożliwiający użytkownikowi stworzenie planu podróży z opcjonalnym generowaniem szczegółowego itinerarium przez AI. Widok składa się z formularza z polami: destination, start_date, end_date, description oraz checkbox "Generate with AI". Po wypełnieniu formularza i kliknięciu przycisku, system zapisuje plan w bazie danych, a jeśli wybrano generowanie AI, wyświetla modal z postępem generowania (30-60 sekund), po czym przekierowuje użytkownika do widoku szczegółów podróży.

## 2. Routing widoku

**Ścieżka**: `/trips/new`

**Typ strony**: Protected route (wymaga autentykacji)

**Przekierowania**:
- Jeśli użytkownik niezalogowany → przekierowanie do `/login`
- Po utworzeniu planu bez AI → przekierowanie do `/trips/[id]`
- Po utworzeniu planu z AI → modal progress, następnie przekierowanie do `/trips/[id]`
- Po przekroczeniu limitu tripów (100) → komunikat błędu, pozostanie na stronie
- Po przekroczeniu rate limitu AI → modal z informacją o limitach, pozostanie na stronie

## 3. Struktura komponentów

```
src/pages/trips/new.astro (główna strona)
├── Layout.astro (wrapper z nawigacją)
├── Breadcrumb.astro (Dashboard > Create New Plan)
├── TripForm.tsx (React - główny formularz)
│   ├── Input (destination)
│   ├── DateRangePicker (start_date, end_date)
│   ├── Textarea (description)
│   ├── Checkbox ("Generate with AI")
│   └── Button ("Create Plan")
├── AIProgressModal.tsx (React - modal z postępem AI)
│   ├── ProgressBar
│   ├── StatusMessage
│   └── Button ("Cancel" - opcjonalnie)
├── RateLimitModal.tsx (React - informacja o limitach)
│   ├── Alert
│   ├── CountdownTimer
│   └── Button ("Close")
└── ErrorAlert.tsx (React - komunikaty błędów)
```

## 4. Szczegóły komponentów

### 4.1 TripForm (React Component)

**Opis**: Główny formularz tworzenia podróży. Odpowiedzialny za zbieranie danych od użytkownika, walidację w czasie rzeczywistym, wywołanie API do tworzenia planu, obsługę generowania AI oraz zarządzanie stanem formularza (persistence w localStorage).

**Główne elementy HTML i komponenty dzieci**:
- `<form>` - główny element formularza
- `Input` component - pole destination (text input)
- `DateRangePicker` component - pola start_date i end_date (native HTML5 date inputs z custom styling)
- `Textarea` component - pole description (opcjonalne)
- `Checkbox` component - "Generate with AI"
- `Button` component - "Create Plan" (submit button)
- `ErrorAlert` component - wyświetlanie błędów walidacji

**Obsługiwane zdarzenia**:
- `onSubmit` - wysłanie formularza, walidacja, wywołanie API
- `onChange` - real-time walidacja pól, zapisywanie do localStorage
- `onBlur` - walidacja pola po opuszczeniu (field-specific validation)
- `onGenerateToggle` - zmiana stanu checkbox "Generate with AI"

**Warunki walidacji**:
1. **destination**:
   - Wymagane (`required`)
   - Maksymalnie 200 znaków
   - Nie może być puste (tylko whitespace)
   - Komunikat błędu: "Destination is required and must be less than 200 characters"

2. **start_date**:
   - Wymagane (`required`)
   - Musi być prawidłową datą w formacie ISO 8601 (YYYY-MM-DD)
   - Komunikat błędu: "Start date is required and must be a valid date"

3. **end_date**:
   - Wymagane (`required`)
   - Musi być prawidłową datą w formacie ISO 8601 (YYYY-MM-DD)
   - Musi być >= start_date
   - Musi być <= start_date + 365 dni
   - Komunikaty błędów:
     - "End date is required and must be a valid date"
     - "End date must be after or equal to start date"
     - "Trip duration cannot exceed 365 days"

4. **description**:
   - Opcjonalne
   - Maksymalnie 2000 znaków
   - Komunikat błędu: "Description must be less than 2000 characters"

5. **generate_ai**:
   - Opcjonalne (boolean)
   - Default: false
   - Weryfikacja rate limitu przed włączeniem generowania

**Typy**:
- `CreateTripCommand` (DTO) - dane wysyłane do API
- `TripFormData` (ViewModel) - wewnętrzny stan formularza
- `TripResponseDTO` - odpowiedź z API po utworzeniu planu
- `ValidationError[]` - tablica błędów walidacji

**Propsy**:
```typescript
interface TripFormProps {
  onSuccess?: (tripId: string) => void; // Callback po utworzeniu planu
  onCancel?: () => void; // Callback anulowania (opcjonalnie)
  initialData?: Partial<TripFormData>; // Dane początkowe z localStorage
}
```

### 4.2 DateRangePicker (React Component)

**Opis**: Komponent do wyboru zakresu dat (start_date, end_date). Wykorzystuje native HTML5 date inputs z custom styling Tailwind. Zapewnia walidację zakresu dat i wizualne feedback.

**Główne elementy HTML**:
- `<div>` - wrapper z grid layout (2 kolumny)
- `<input type="date">` - start_date
- `<input type="date">` - end_date
- `<label>` - etykiety dla pól
- `<span>` - komunikaty błędów

**Obsługiwane zdarzenia**:
- `onChange` - zmiana daty, walidacja zakresu
- `onBlur` - walidacja po opuszczeniu pola

**Warunki walidacji**:
- Zgodne z walidacją TripForm (patrz wyżej)
- Walidacja zakresu w czasie rzeczywistym
- Wyświetlanie liczby dni między datami

**Typy**:
- `DateRange` - interfejs z polami startDate, endDate
- `DateValidationError` - typ błędu walidacji dat

**Propsy**:
```typescript
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  errors?: { startDate?: string; endDate?: string };
  disabled?: boolean;
}
```

### 4.3 AIProgressModal (React Component)

**Opis**: Modal wyświetlany podczas generowania planu przez AI. Pokazuje postęp, szacowany czas do zakończenia oraz opcję anulowania (opcjonalnie). Automatycznie zamyka się po zakończeniu generowania lub błędzie.

**Główne elementy HTML i komponenty**:
- `<div>` - modal overlay (backdrop)
- `<div>` - modal content box
- `ProgressBar` component - pasek postępu
- `<p>` - status message ("Generating your plan...")
- `<p>` - estimated time ("Estimated time: 30-60 seconds")
- `Button` component - "Cancel" (opcjonalnie)

**Obsługiwane zdarzenia**:
- `onCancel` - anulowanie generowania (opcjonalnie)
- `onComplete` - callback po zakończeniu generowania
- `onError` - callback w przypadku błędu

**Warunki walidacji**:
- Brak (komponent tylko do wyświetlania)

**Typy**:
- `AIGenerationStatus` - status generowania ('generating', 'completed', 'failed')
- `AIProgressData` - dane o postępie (progress percentage, estimated time)

**Propsy**:
```typescript
interface AIProgressModalProps {
  isOpen: boolean;
  tripId: string;
  onComplete: (tripId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}
```

### 4.4 RateLimitModal (React Component)

**Opis**: Modal informujący użytkownika o przekroczeniu limitów generowania AI. Wyświetla typ limitu (hourly/daily), czas do resetu oraz sugestie alternatyw. Zawiera countdown timer do momentu resetu limitu.

**Główne elementy HTML i komponenty**:
- `<div>` - modal overlay
- `<div>` - modal content box
- `Alert` component - informacja o przekroczeniu limitu
- `<p>` - typ limitu (hourly/daily)
- `CountdownTimer` component - czas do resetu
- `<p>` - sugestie alternatyw
- `Button` component - "Close"

**Obsługiwane zdarzenia**:
- `onClose` - zamknięcie modalu

**Warunki walidacji**:
- Brak (komponent tylko do wyświetlania)

**Typy**:
- `RateLimitInfo` - informacje o limicie (typ, reset_at, remaining)
- `RateLimitWindow` - okno limitu (hourly/daily)

**Propsy**:
```typescript
interface RateLimitModalProps {
  isOpen: boolean;
  limitType: 'hourly' | 'daily';
  resetAt: string; // ISO timestamp
  dailyRemaining?: number;
  onClose: () => void;
}
```

### 4.5 ErrorAlert (React Component)

**Opis**: Komponent do wyświetlania komunikatów błędów (walidacja, błędy API, limity). Wspiera różne typy błędów (error, warning, info) z odpowiednim stylingiem.

**Główne elementy HTML**:
- `<div>` - alert container z kolorowym stylingiem
- `<svg>` - ikona błędu/ostrzeżenia
- `<p>` - treść komunikatu
- `<button>` - przycisk zamknięcia (opcjonalnie)

**Obsługiwane zdarzenia**:
- `onDismiss` - zamknięcie alertu (opcjonalnie)

**Warunki walidacji**:
- Brak (komponent tylko do wyświetlania)

**Typy**:
- `AlertType` - typ alertu ('error', 'warning', 'info', 'success')
- `AlertMessage` - struktura wiadomości

**Propsy**:
```typescript
interface ErrorAlertProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

### 4.6 Breadcrumb (Astro Component)

**Opis**: Komponent nawigacji hierarchicznej pokazujący ścieżkę: Dashboard > Create New Plan.

**Główne elementy HTML**:
- `<nav>` - semantic navigation
- `<ol>` - uporządkowana lista breadcrumbs
- `<li>` - elementy breadcrumb
- `<a>` - linki do stron nadrzędnych
- `<span>` - separator (>)

**Obsługiwane zdarzenia**:
- Brak (tylko linki)

**Warunki walidacji**:
- Brak

**Typy**:
- `BreadcrumbItem` - interfejs dla elementu (label, href)

**Propsy**:
```typescript
interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

## 5. Typy

### 5.1 Typy DTO (z API)

```typescript
// DTO do tworzenia planu (request)
interface CreateTripCommand {
  destination: string;        // max 200 chars
  start_date: string;         // ISO 8601 format (YYYY-MM-DD)
  end_date: string;           // ISO 8601 format (YYYY-MM-DD)
  description?: string;       // max 2000 chars
  generate_ai?: boolean;      // default: false
}

// DTO odpowiedzi po utworzeniu planu
interface TripResponseDTO {
  id: string;                      // UUID
  user_id: string;                 // UUID
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

// DTO błędu walidacji
interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

// DTO odpowiedzi błędu
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[] | Record<string, unknown>;
  };
}

// DTO informacji o rate limitach
interface RateLimitInfo {
  limit: 'hourly' | 'daily';
  reset_at: string;              // ISO timestamp
  daily_remaining?: number;
}
```

### 5.2 Typy ViewModel (wewnętrzne w komponencie)

```typescript
// Stan formularza (wewnętrzny)
interface TripFormData {
  destination: string;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  description: string;
  generateAI: boolean;
}

// Stan walidacji formularza
interface TripFormValidation {
  destination?: string;       // komunikat błędu
  startDate?: string;
  endDate?: string;
  description?: string;
  general?: string;           // ogólny błąd (np. API error)
}

// Stan UI formularza
interface TripFormState {
  data: TripFormData;
  validation: TripFormValidation;
  isSubmitting: boolean;
  isGenerating: boolean;
  showAIProgressModal: boolean;
  showRateLimitModal: boolean;
  rateLimitInfo: RateLimitInfo | null;
  tripId: string | null;
}

// Range dat
interface DateRange {
  startDate: string;
  endDate: string;
  durationDays?: number;
}

// Status generowania AI
type AIGenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

// Dane postępu AI
interface AIProgressData {
  status: AIGenerationStatus;
  progress: number;           // 0-100
  estimatedTimeMs: number;
  startedAt: string;
}
```

### 5.3 Typy pomocnicze

```typescript
// Typ alertu
type AlertType = 'error' | 'warning' | 'info' | 'success';

// Element breadcrumb
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Callback po utworzeniu planu
type OnTripCreated = (tripId: string) => void;

// Callback błędu
type OnError = (error: string) => void;
```

## 6. Zarządzanie stanem

### 6.1 Local State (React useState)

**TripForm component**:
```typescript
const [formData, setFormData] = useState<TripFormData>({
  destination: '',
  startDate: '',
  endDate: '',
  description: '',
  generateAI: false,
});

const [validationErrors, setValidationErrors] = useState<TripFormValidation>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [showAIProgressModal, setShowAIProgressModal] = useState(false);
const [showRateLimitModal, setShowRateLimitModal] = useState(false);
const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
const [tripId, setTripId] = useState<string | null>(null);
```

### 6.2 LocalStorage persistence

**Klucz**: `vibetravels_new_trip_draft`

**Struktura danych**:
```typescript
interface LocalStorageTripDraft {
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  savedAt: string; // ISO timestamp
}
```

**Logika**:
- Zapisywanie do localStorage przy każdej zmianie pola (debounced 500ms)
- Wczytywanie z localStorage przy montowaniu komponentu
- Czyszczenie localStorage po pomyślnym utworzeniu planu
- Usunięcie draft po 24h (sprawdzenie savedAt)

### 6.3 Custom Hook: `useCreateTrip`

**Cel**: Enkapsulacja logiki tworzenia planu, wywołań API i zarządzania stanem.

**Interfejs**:
```typescript
interface UseCreateTripReturn {
  createTrip: (data: CreateTripCommand) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  tripId: string | null;
  reset: () => void;
}

function useCreateTrip(): UseCreateTripReturn {
  // Implementacja logiki tworzenia planu
  // - Walidacja danych
  // - Wywołanie POST /api/trips
  // - Obsługa odpowiedzi/błędów
  // - Zarządzanie stanem loading/error
}
```

**Użycie w TripForm**:
```typescript
const { createTrip, isLoading, error, tripId, reset } = useCreateTrip();

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  await createTrip({
    destination: formData.destination,
    start_date: formData.startDate,
    end_date: formData.endDate,
    description: formData.description || undefined,
    generate_ai: formData.generateAI,
  });
};
```

### 6.4 Custom Hook: `useAIGeneration`

**Cel**: Obsługa generowania AI, pollowania statusu i zarządzania progress modal.

**Interfejs**:
```typescript
interface UseAIGenerationReturn {
  startGeneration: (tripId: string) => Promise<void>;
  cancelGeneration: () => void;
  progress: number;
  status: AIGenerationStatus;
  error: string | null;
  estimatedTime: number;
}

function useAIGeneration(): UseAIGenerationReturn {
  // Implementacja logiki generowania AI
  // - Wywołanie POST /api/trips/:id/generate-ai
  // - Pollowanie GET /api/trips/:id co 2 sekundy
  // - Aktualizacja progress
  // - Timeout po 90 sekundach
}
```

## 7. Integracja API

### 7.1 Endpoint: POST /api/trips

**Request**:
```typescript
// Headers
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}

// Body
{
  destination: string;
  start_date: string;      // ISO 8601 format
  end_date: string;        // ISO 8601 format
  description?: string;
  generate_ai?: boolean;   // default: false
}
```

**Response (201 Created)**:
```typescript
{
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
  status: 'draft' | 'generating';
  ai_generated_content: null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses**:

1. **400 Bad Request - Validation Error**:
```typescript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: [
      {
        field: 'end_date',
        message: 'End date must be after start date'
      }
    ]
  }
}
```

2. **401 Unauthorized**:
```typescript
{
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required'
  }
}
```

3. **403 Forbidden - Trip Limit**:
```typescript
{
  error: {
    code: 'TRIP_LIMIT_EXCEEDED',
    message: 'You have reached the maximum limit of 100 trips'
  }
}
```

4. **500 Internal Server Error**:
```typescript
{
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }
}
```

### 7.2 Endpoint: POST /api/trips/:id/generate-ai

**Request**:
```typescript
// Headers
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}

// Body (wszystkie pola opcjonalne)
{
  model?: string;              // default: 'gpt-3.5-turbo'
  temperature?: number;        // default: 0.7
  force_regenerate?: boolean;  // default: false
}
```

**Response (200 OK - synchroniczny)**:
```typescript
{
  id: string;
  status: 'completed';
  ai_generated_content: AIGeneratedContent;
  ai_model: string;
  ai_tokens_used: number;
  ai_generation_time_ms: number;
}
```

**Error Responses**:

1. **429 Too Many Requests - Rate Limit**:
```typescript
{
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You have exceeded your hourly AI generation limit',
    details: {
      limit: 'hourly',
      reset_at: '2025-01-15T13:00:00Z',
      daily_remaining: 3
    }
  }
}
```

2. **409 Conflict - Already Generating**:
```typescript
{
  error: {
    code: 'GENERATION_IN_PROGRESS',
    message: 'AI generation already in progress for this trip'
  }
}
```

3. **500 Internal Server Error - AI Failed**:
```typescript
{
  error: {
    code: 'AI_GENERATION_FAILED',
    message: 'Failed to generate trip plan',
    details: {
      reason: 'AI service timeout'
    }
  }
}
```

### 7.3 Endpoint: GET /api/trips/:id (polling)

**Request**:
```typescript
// Headers
{
  'Authorization': 'Bearer <jwt_token>'
}
```

**Response (200 OK)**:
```typescript
{
  id: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  ai_generated_content: AIGeneratedContent | null;
  // ... pozostałe pola
}
```

**Logika pollowania**:
- Rozpoczęcie po wywołaniu POST /api/trips/:id/generate-ai
- Interwał: 2 sekundy
- Warunki zakończenia:
  - status === 'completed' → sukces, przekierowanie do /trips/:id
  - status === 'failed' → błąd, wyświetlenie komunikatu
  - timeout po 90 sekundach → błąd timeout

## 8. Interakcje użytkownika

### 8.1 Wypełnianie formularza

**Scenariusz**: Użytkownik wypełnia formularz tworzenia planu

**Kroki**:
1. Użytkownik wpisuje destination (np. "Paris, France")
   - Real-time walidacja: max 200 znaków
   - Zapisywanie do localStorage (debounced)
2. Użytkownik wybiera start_date (np. "2025-06-01")
   - Walidacja: prawidłowa data
   - Zapisywanie do localStorage
3. Użytkownik wybiera end_date (np. "2025-06-05")
   - Walidacja: end_date >= start_date
   - Walidacja: duration <= 365 dni
   - Wyświetlanie liczby dni (4 days)
   - Zapisywanie do localStorage
4. Użytkownik wpisuje description (opcjonalnie)
   - Real-time walidacja: max 2000 znaków
   - Zapisywanie do localStorage
5. Użytkownik zaznacza/odznacza "Generate with AI"
   - Zmiana tekstu przycisku submit
   - Zapisywanie do localStorage

**Expected outcome**:
- Wszystkie pola poprawnie walidowane
- Błędy wyświetlane pod odpowiednimi polami
- Dane zapisane w localStorage
- Przycisk submit enabled gdy formularz valid

### 8.2 Utworzenie planu bez AI

**Scenariusz**: Użytkownik tworzy plan bez generowania AI

**Kroki**:
1. Użytkownik wypełnia formularz (destination, daty)
2. "Generate with AI" = unchecked
3. Kliknięcie "Create Plan"
   - Walidacja client-side
   - Wywołanie POST /api/trips z generate_ai: false
   - Loading state na przycisku ("Creating...")
4. Sukces API:
   - Czyszczenie localStorage
   - Przekierowanie do /trips/:id
   - Toast: "Plan created successfully"

**Expected outcome**:
- Plan zapisany w bazie ze statusem 'draft'
- Użytkownik na stronie szczegółów planu
- Brak AI content

### 8.3 Utworzenie planu z generowaniem AI

**Scenariusz**: Użytkownik tworzy plan z generowaniem AI

**Kroki**:
1. Użytkownik wypełnia formularz
2. Zaznaczenie "Generate with AI"
3. Kliknięcie "Create Plan"
   - Walidacja client-side
   - Wywołanie POST /api/trips z generate_ai: false (najpierw zapisz plan)
4. Sukces POST /api/trips:
   - Zapisanie trip.id
   - Wywołanie POST /api/trips/:id/generate-ai
5. Sukces generate-ai lub 202 Accepted:
   - Otwarcie AIProgressModal
   - Rozpoczęcie pollowania GET /api/trips/:id
6. Pollowanie co 2 sekundy:
   - Aktualizacja progress bar (oszacowany postęp)
   - Wyświetlanie "Generating... (30-60 seconds)"
7. Status zmienia się na 'completed':
   - Zamknięcie modalu
   - Czyszczenie localStorage
   - Przekierowanie do /trips/:id
   - Toast: "Plan generated successfully"

**Expected outcome**:
- Plan zapisany z AI content
- Status 'completed'
- Użytkownik widzi szczegóły z AI itinerary

### 8.4 Obsługa przekroczenia rate limitu

**Scenariusz**: Użytkownik próbuje wygenerować plan, ale przekroczył limit

**Kroki**:
1. Użytkownik wypełnia formularz
2. Zaznaczenie "Generate with AI"
3. Kliknięcie "Create Plan"
4. POST /api/trips - sukces
5. POST /api/trips/:id/generate-ai - błąd 429 Rate Limit
   - Response zawiera limit type, reset_at
6. Otwarcie RateLimitModal:
   - Wyświetlenie typu limitu (hourly/daily)
   - Countdown timer do reset_at
   - Informacja o daily_remaining (jeśli hourly limit)
   - Przycisk "Close"
7. Użytkownik klika "Close":
   - Zamknięcie modalu
   - Pozostanie na stronie /trips/new
   - Plan zapisany jako 'draft' (można wrócić i wygenerować później)

**Expected outcome**:
- Modal z jasną informacją o limitach
- Plan zapisany jako draft
- Użytkownik może edytować lub wrócić później

### 8.5 Obsługa błędów walidacji

**Scenariusz**: Użytkownik próbuje wysłać formularz z nieprawidłowymi danymi

**Kroki**:
1. Użytkownik wypełnia formularz z błędami:
   - destination: pusty
   - end_date < start_date
2. Kliknięcie "Create Plan"
3. Client-side validation:
   - Zablokowanie submit
   - Wyświetlenie błędów pod polami:
     - "Destination is required"
     - "End date must be after start date"
   - Auto-focus na pierwszym błędnym polu
4. Użytkownik poprawia błędy:
   - Błędy znikają w czasie rzeczywistym
5. Ponowne kliknięcie "Create Plan":
   - Walidacja OK
   - Wywołanie API

**Expected outcome**:
- Jasne komunikaty błędów
- Niemożliwe wysłanie nieprawidłowych danych
- Dobry UX z real-time feedback

### 8.6 Przywracanie draft z localStorage

**Scenariusz**: Użytkownik wraca do formularza po zamknięciu przeglądarki

**Kroki**:
1. Użytkownik wypełnił formularz wcześniej (dane w localStorage)
2. Zamknięcie przeglądarki/zakładki
3. Powrót do /trips/new:
   - Sprawdzenie localStorage
   - Znalezienie draft (savedAt < 24h)
   - Pre-fill formularza z zapisanymi danymi
   - Wyświetlenie toast: "Draft restored"
4. Użytkownik może kontynuować wypełnianie

**Expected outcome**:
- Dane użytkownika nie zostały utracone
- Wygodne kontynuowanie wypełniania formularza

## 9. Warunki i walidacja

### 9.1 Warunki walidacji client-side

**TripForm component**:

1. **destination** (pole wymagane):
   - Warunek: `destination.trim().length > 0 && destination.length <= 200`
   - Moment weryfikacji: onChange, onBlur, onSubmit
   - Wpływ na UI:
     - Błąd: czerwona ramka, komunikat pod polem
     - OK: zielona ramka (onBlur)
     - Submit disabled jeśli invalid

2. **start_date** (pole wymagane):
   - Warunek: `isValidDate(start_date)`
   - Moment weryfikacji: onChange, onBlur, onSubmit
   - Wpływ na UI:
     - Błąd: czerwona ramka, komunikat
     - OK: zielona ramka

3. **end_date** (pole wymagane):
   - Warunki:
     - `isValidDate(end_date)`
     - `end_date >= start_date`
     - `daysBetween(start_date, end_date) <= 365`
   - Moment weryfikacji: onChange (gdy start_date lub end_date zmienia się), onBlur, onSubmit
   - Wpływ na UI:
     - Błąd: czerwona ramka, szczegółowy komunikat
     - OK: zielona ramka, wyświetlenie liczby dni

4. **description** (pole opcjonalne):
   - Warunek: `description.length <= 2000`
   - Moment weryfikacji: onChange, onBlur
   - Wpływ na UI:
     - Błąd: czerwona ramka, licznik znaków czerwony
     - OK: licznik znaków szary
     - Licznik znaków: "1234/2000"

5. **generate_ai checkbox**:
   - Warunek: przed zaznaczeniem sprawdzenie rate limitu (opcjonalnie)
   - Moment weryfikacji: onChange (gdy użytkownik zaznacza)
   - Wpływ na UI:
     - Zmiana tekstu przycisku: "Create Plan" → "Create Plan with AI"
     - Wyświetlenie info o czasie generowania (~30-60s)

**Funkcja walidacji formularza**:
```typescript
function validateTripForm(data: TripFormData): TripFormValidation {
  const errors: TripFormValidation = {};

  // destination
  if (!data.destination.trim()) {
    errors.destination = 'Destination is required';
  } else if (data.destination.length > 200) {
    errors.destination = 'Destination must be less than 200 characters';
  }

  // start_date
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  } else if (!isValidDate(data.startDate)) {
    errors.startDate = 'Start date must be a valid date';
  }

  // end_date
  if (!data.endDate) {
    errors.endDate = 'End date is required';
  } else if (!isValidDate(data.endDate)) {
    errors.endDate = 'End date must be a valid date';
  } else if (data.startDate && data.endDate < data.startDate) {
    errors.endDate = 'End date must be after or equal to start date';
  } else if (data.startDate && daysBetween(data.startDate, data.endDate) > 365) {
    errors.endDate = 'Trip duration cannot exceed 365 days';
  }

  // description
  if (data.description && data.description.length > 2000) {
    errors.description = 'Description must be less than 2000 characters';
  }

  return errors;
}
```

### 9.2 Warunki walidacji API-side

**API: POST /api/trips**:

Backend waliduje te same warunki co frontend + dodatkowe:
- Sprawdzenie limitu 100 planów na użytkownika
- Weryfikacja auth token
- SQL injection prevention (parametrized queries)

**Mapowanie błędów API na UI**:
```typescript
function handleAPIError(error: ErrorResponse): void {
  if (error.error.code === 'VALIDATION_ERROR' && error.error.details) {
    // Mapowanie błędów walidacji na pola formularza
    const details = error.error.details as ValidationErrorDetail[];
    const validationErrors: TripFormValidation = {};

    details.forEach((detail) => {
      validationErrors[detail.field as keyof TripFormValidation] = detail.message;
    });

    setValidationErrors(validationErrors);
  } else if (error.error.code === 'TRIP_LIMIT_EXCEEDED') {
    setValidationErrors({ general: error.error.message });
  } else {
    setValidationErrors({ general: 'An unexpected error occurred' });
  }
}
```

### 9.3 Warunki rate limitu AI

**Sprawdzenie przed generowaniem**:
- Hourly limit: 5 generacji
- Daily limit: 10 generacji

**Moment weryfikacji**:
- Przed wywołaniem POST /api/trips/:id/generate-ai
- API zwraca 429 jeśli limit przekroczony

**Wpływ na UI**:
- Otwarcie RateLimitModal
- Wyświetlenie countdown timer
- Informacja o daily_remaining (jeśli hourly limit)
- Plan zapisany jako 'draft' (można wrócić później)

## 10. Obsługa błędów

### 10.1 Błędy walidacji formularza

**Typ błędu**: Client-side validation errors

**Obsługa**:
- Wyświetlenie komunikatu pod odpowiednim polem
- Czerwona ramka wokół błędnego pola
- Auto-focus na pierwszym błędnym polu przy submit
- Disabled submit button do czasu poprawienia wszystkich błędów

**Przykład**:
```typescript
{
  destination: 'Destination is required',
  endDate: 'End date must be after start date'
}
```

### 10.2 Błędy API - 400 Validation Error

**Typ błędu**: Server-side validation errors

**Obsługa**:
- Mapowanie błędów API na pola formularza
- Wyświetlenie komunikatów pod polami
- Jeśli błąd ogólny (nie związany z polem) → ErrorAlert na górze formularza

**Przykład odpowiedzi**:
```typescript
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: [
      { field: 'end_date', message: 'End date must be after start date' }
    ]
  }
}
```

**Kod obsługi**:
```typescript
if (error.error.code === 'VALIDATION_ERROR') {
  const apiErrors: TripFormValidation = {};
  error.error.details?.forEach((detail: ValidationErrorDetail) => {
    apiErrors[detail.field] = detail.message;
  });
  setValidationErrors(apiErrors);
}
```

### 10.3 Błędy autoryzacji - 401 Unauthorized

**Typ błędu**: Missing or invalid JWT token

**Obsługa**:
- Przekierowanie do /login
- Zapisanie intended route (/trips/new) w localStorage
- Po zalogowaniu: przekierowanie z powrotem do /trips/new
- Toast: "Please log in to continue"

**Kod obsługi**:
```typescript
if (error.error.code === 'UNAUTHORIZED' || error.error.code === 'INVALID_TOKEN') {
  localStorage.setItem('intended_route', '/trips/new');
  window.location.href = '/login';
}
```

### 10.4 Błędy limitów - 403 Trip Limit Exceeded

**Typ błędu**: User reached 100 trips limit

**Obsługa**:
- ErrorAlert na górze formularza
- Komunikat: "You have reached the maximum limit of 100 trips. Please delete some trips to create new ones."
- Przycisk "Go to Dashboard" → przekierowanie do /dashboard
- Disabled submit button

**Przykład odpowiedzi**:
```typescript
{
  error: {
    code: 'TRIP_LIMIT_EXCEEDED',
    message: 'You have reached the maximum limit of 100 trips'
  }
}
```

### 10.5 Błędy rate limitu - 429 Rate Limit Exceeded

**Typ błędu**: AI generation quota exceeded (hourly or daily)

**Obsługa**:
- Otwarcie RateLimitModal
- Wyświetlenie:
  - Typ limitu (hourly/daily)
  - Countdown timer do reset_at
  - Informacja o daily_remaining (jeśli hourly)
  - Sugestie: "Try again later" lub "Create plan without AI"
- Plan zapisany jako 'draft' w bazie
- Użytkownik może wrócić później i wygenerować AI

**Przykład odpowiedzi**:
```typescript
{
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You have exceeded your hourly AI generation limit',
    details: {
      limit: 'hourly',
      reset_at: '2025-01-15T13:00:00Z',
      daily_remaining: 3
    }
  }
}
```

### 10.6 Błędy generowania AI - 500 AI Generation Failed

**Typ błędu**: AI service timeout, API error, network error

**Obsługa**:
- Zamknięcie AIProgressModal
- Wyświetlenie ErrorAlert: "Failed to generate trip plan. AI service is temporarily unavailable."
- Komunikat: "Your trip was saved as draft. You can try generating AI content later from trip details page."
- Przycisk "View Trip" → przekierowanie do /trips/:id
- Status planu w bazie: 'failed'

**Przykład odpowiedzi**:
```typescript
{
  error: {
    code: 'AI_GENERATION_FAILED',
    message: 'Failed to generate trip plan',
    details: {
      reason: 'AI service timeout'
    }
  }
}
```

**Kod obsługi**:
```typescript
if (error.error.code === 'AI_GENERATION_FAILED') {
  setShowAIProgressModal(false);
  setValidationErrors({
    general: 'AI generation failed. Your trip was saved as draft. You can try again later from trip details.'
  });
  // Opcjonalnie: automatyczne przekierowanie do /trips/:id po 3s
  setTimeout(() => {
    window.location.href = `/trips/${tripId}`;
  }, 3000);
}
```

### 10.7 Błędy konfliktu - 409 Generation In Progress

**Typ błędu**: Trip already generating (concurrent request)

**Obsługa**:
- ErrorAlert: "AI generation already in progress for this trip"
- Otwarcie AIProgressModal (kontynuacja pollowania)
- Nie pozwól na kolejne wywołanie generate-ai

**Przykład odpowiedzi**:
```typescript
{
  error: {
    code: 'GENERATION_IN_PROGRESS',
    message: 'AI generation already in progress for this trip'
  }
}
```

### 10.8 Błędy sieciowe

**Typ błędu**: Network error, timeout, offline

**Obsługa**:
- Retry logic (3 próby z exponential backoff)
- Jeśli wszystkie próby failed:
  - ErrorAlert: "Network error. Please check your connection and try again."
  - Przycisk "Retry"
  - Dane formularza zachowane w localStorage

**Kod obsługi**:
```typescript
async function createTripWithRetry(data: CreateTripCommand, retries = 3): Promise<TripResponseDTO> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => res.json());
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 10.9 Timeout generowania AI

**Typ błędu**: Pollowanie przekroczyło 90 sekund

**Obsługa**:
- Zatrzymanie pollowania
- Zamknięcie AIProgressModal
- ErrorAlert: "AI generation is taking longer than expected. Your trip was saved. Check back in a few minutes."
- Przycisk "View Trip" → przekierowanie do /trips/:id
- Status planu może być 'generating' lub 'failed' w zależności od backendowej logiki

**Kod obsługi**:
```typescript
useEffect(() => {
  if (isGenerating) {
    const timeout = setTimeout(() => {
      setIsGenerating(false);
      setShowAIProgressModal(false);
      setValidationErrors({
        general: 'AI generation timeout. Please check trip details later.'
      });
    }, 90000); // 90 sekund

    return () => clearTimeout(timeout);
  }
}, [isGenerating]);
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Zadania**:
1. Utworzenie `src/pages/trips/new.astro` (główna strona)
2. Utworzenie `src/components/forms/TripForm.tsx` (React component)
3. Utworzenie `src/components/forms/DateRangePicker.tsx`
4. Utworzenie `src/components/modals/AIProgressModal.tsx`
5. Utworzenie `src/components/modals/RateLimitModal.tsx`
6. Utworzenie `src/components/ui/ErrorAlert.tsx`
7. Utworzenie `src/hooks/useCreateTrip.ts`
8. Utworzenie `src/hooks/useAIGeneration.ts`
9. Utworzenie `src/lib/validation-client.ts` (funkcje walidacji)
10. Utworzenie `src/lib/localStorage.ts` (helper do localStorage)

**Weryfikacja**: Wszystkie pliki utworzone, importy działają

### Krok 2: Implementacja walidacji client-side

**Zadania**:
1. Implementacja `validateTripForm(data: TripFormData)` w `validation-client.ts`
2. Implementacja `isValidDate(dateString: string)` helper
3. Implementacja `daysBetween(start: string, end: string)` helper
4. Testy jednostkowe walidacji (opcjonalnie)
5. Sprawdzenie wszystkich warunków walidacji z sekcji 9.1

**Weryfikacja**: Wszystkie warunki walidacji działają poprawnie

### Krok 3: Implementacja komponentu DateRangePicker

**Zadania**:
1. Stworzenie UI z native HTML5 date inputs
2. Stylowanie z Tailwind CSS (grid layout, responsive)
3. Implementacja obsługi onChange, onBlur
4. Walidacja zakresu dat w czasie rzeczywistym
5. Wyświetlanie liczby dni między datami
6. Wyświetlanie błędów walidacji
7. Dostępność (ARIA labels, keyboard navigation)

**Weryfikacja**: Komponent działa, walidacja poprawna, accessibility OK

### Krok 4: Implementacja localStorage persistence

**Zadania**:
1. Implementacja `saveTripDraft(data: TripFormData)` w `localStorage.ts`
2. Implementacja `loadTripDraft(): TripFormData | null`
3. Implementacja `clearTripDraft()`
4. Implementacja `isDraftValid(savedAt: string): boolean` (sprawdzenie 24h)
5. Dodanie debounce do zapisywania (500ms)

**Weryfikacja**: Draft zapisywany i wczytywany poprawnie, stare drafty usuwane

### Krok 5: Implementacja custom hook useCreateTrip

**Zadania**:
1. Utworzenie hooka z interfejsem UseCreateTripReturn
2. Implementacja logiki wywołania POST /api/trips
3. Obsługa tokenów JWT (pobieranie z Supabase session)
4. Obsługa błędów API (mapowanie na UI)
5. Zarządzanie stanem loading/error
6. Retry logic dla błędów sieciowych (3 próby)

**Weryfikacja**: Hook działa, API wywołane poprawnie, błędy obsługiwane

### Krok 6: Implementacja komponentu TripForm (podstawowa wersja)

**Zadania**:
1. Stworzenie UI formularza (Input, Textarea, Checkbox, Button)
2. Zarządzanie stanem formularza (useState)
3. Integracja DateRangePicker
4. Integracja walidacji client-side
5. Obsługa onChange z real-time validation
6. Obsługa onSubmit z wywołaniem useCreateTrip
7. Integracja localStorage (save/load draft)
8. Wyświetlanie błędów walidacji (ErrorAlert pod polami)
9. Disabled submit button gdy formularz invalid
10. Loading state na przycisku ("Creating...")

**Weryfikacja**: Formularz działa, walidacja OK, submit wywołuje API

### Krok 7: Implementacja komponentu ErrorAlert

**Zadania**:
1. Stworzenie UI alertu (różne typy: error, warning, info, success)
2. Stylowanie z Tailwind CSS (kolory, ikony)
3. Opcjonalny przycisk dismiss
4. Animacje (fade in/out)
5. Dostępność (ARIA live regions, role="alert")

**Weryfikacja**: Alert wyświetla się poprawnie, dostępność OK

### Krok 8: Testowanie podstawowego flow (bez AI)

**Zadania**:
1. Test: Wypełnienie formularza i utworzenie planu bez AI
2. Weryfikacja: Plan zapisany w bazie ze statusem 'draft'
3. Weryfikacja: Przekierowanie do /trips/:id
4. Weryfikacja: Toast "Plan created successfully"
5. Weryfikacja: LocalStorage wyczyszczony
6. Test: Błędy walidacji wyświetlane poprawnie
7. Test: Draft zapisywany i wczytywany z localStorage

**Weryfikacja**: Podstawowy flow działa bez błędów

### Krok 9: Implementacja custom hook useAIGeneration

**Zadania**:
1. Utworzenie hooka z interfejsem UseAIGenerationReturn
2. Implementacja wywołania POST /api/trips/:id/generate-ai
3. Implementacja pollowania GET /api/trips/:id (co 2s)
4. Obsługa statusów ('generating', 'completed', 'failed')
5. Aktualizacja progress (oszacowany postęp na podstawie czasu)
6. Timeout po 90 sekundach
7. Obsługa błędów (rate limit, AI failed)

**Weryfikacja**: Hook polluje poprawnie, progress aktualizowany

### Krok 10: Implementacja komponentu AIProgressModal

**Zadania**:
1. Stworzenie UI modalu (overlay, content box)
2. Implementacja ProgressBar component
3. Wyświetlanie statusu ("Generating your plan...")
4. Wyświetlanie szacowanego czasu
5. Opcjonalny przycisk Cancel
6. Focus trap (dostępność)
7. ESC key handler (zamknięcie modalu)
8. Integracja z useAIGeneration hook
9. Animacje (fade in/out)

**Weryfikacja**: Modal wyświetla się, progress aktualizowany, dostępność OK

### Krok 11: Implementacja komponentu RateLimitModal

**Zadania**:
1. Stworzenie UI modalu (podobny do AIProgressModal)
2. Wyświetlanie typu limitu (hourly/daily)
3. Implementacja CountdownTimer component
4. Wyświetlanie czasu do reset_at
5. Wyświetlanie daily_remaining (jeśli hourly)
6. Sugestie alternatyw ("Create without AI", "Try later")
7. Przycisk Close
8. Focus trap, ESC key handler
9. Dostępność (ARIA announcements)

**Weryfikacja**: Modal wyświetla się, countdown działa, dostępność OK

### Krok 12: Integracja AI generation w TripForm

**Zadania**:
1. Dodanie stanu dla AI generation (showAIProgressModal, isGenerating)
2. Obsługa checkbox "Generate with AI"
3. Zmiana tekstu przycisku submit ("Create Plan" vs "Create Plan with AI")
4. Wywołanie useAIGeneration po utworzeniu planu (jeśli generateAI = true)
5. Obsługa błędów rate limit → otwarcie RateLimitModal
6. Obsługa sukcesu → przekierowanie do /trips/:id
7. Obsługa timeout/failure → ErrorAlert

**Weryfikacja**: AI generation działa end-to-end

### Krok 13: Implementacja strony Astro (new.astro)

**Zadania**:
1. Stworzenie `src/pages/trips/new.astro`
2. Server-side: sprawdzenie sesji użytkownika (Supabase Auth)
3. Jeśli brak sesji → redirect do /login
4. Integracja Layout.astro
5. Dodanie Breadcrumb component (Dashboard > Create New Plan)
6. Renderowanie TripForm component (client:load)
7. SEO meta tags (title, description)
8. Accessibility (semantic HTML, landmarks)

**Weryfikacja**: Strona renderuje się, protected route działa

### Krok 14: Stylowanie i responsywność

**Zadania**:
1. Stylowanie formularza z Tailwind CSS
2. Mobile-first responsive design (breakpoints: 320px+, 768px+, 1024px+)
3. Stylowanie modali (backdrop blur, animations)
4. Hover states, focus states (visual feedback)
5. Loading states (skeleton, spinners)
6. Error states (czerwone ramki, ikony)
7. Success states (zielone ramki)
8. Consistency z design system (kolory, spacing)

**Weryfikacja**: UI wygląda dobrze na wszystkich urządzeniach

### Krok 15: Testowanie dostępności (a11y)

**Zadania**:
1. Sprawdzenie ARIA labels na wszystkich polach formularza
2. Sprawdzenie keyboard navigation (Tab, Shift+Tab, Enter, ESC)
3. Sprawdzenie focus trap w modalach
4. Sprawdzenie screen reader announcements (live regions)
5. Sprawdzenie kontrastów kolorów (WCAG AA)
6. Sprawdzenie semantic HTML (proper headings hierarchy)
7. Testy z narzędziami (axe DevTools, Lighthouse)

**Weryfikacja**: Wszystkie testy accessibility passed, WCAG AA compliance

### Krok 16: Testowanie end-to-end (E2E)

**Zadania**:
1. Test E2E: Utworzenie planu bez AI
   - Wypełnienie formularza
   - Submit
   - Weryfikacja przekierowania
   - Weryfikacja danych w bazie
2. Test E2E: Utworzenie planu z AI
   - Wypełnienie formularza
   - Zaznaczenie "Generate with AI"
   - Submit
   - Weryfikacja progress modal
   - Weryfikacja AI content w bazie
3. Test E2E: Obsługa błędów walidacji
4. Test E2E: Obsługa rate limit
5. Test E2E: Draft persistence w localStorage

**Weryfikacja**: Wszystkie testy E2E passed

### Krok 17: Optymalizacje wydajności

**Zadania**:
1. Debounce dla localStorage saving (500ms)
2. Debounce dla real-time validation (300ms)
3. Lazy loading modali (tylko gdy potrzebne)
4. Memoization w TripForm (React.memo, useMemo, useCallback)
5. Optymalizacja bundle size (code splitting)
6. Prefetch /trips/:id route (po utworzeniu planu)

**Weryfikacja**: Performance metrics OK (Lighthouse score > 90)

### Krok 18: Dokumentacja i code review

**Zadania**:
1. Dodanie JSDoc komentarzy do wszystkich komponentów
2. Dodanie TypeScript typów do wszystkich funkcji
3. Code review przez zespół
4. Aktualizacja dokumentacji API (jeśli potrzebne)
5. Dodanie przykładów użycia w Storybook (opcjonalnie)

**Weryfikacja**: Kod czytelny, dobrze udokumentowany, zespół zaakceptował

### Krok 19: Deployment i monitoring

**Zadania**:
1. Merge feature branch do develop
2. Testowanie na środowisku staging
3. Merge develop do main
4. Deploy na produkcję (Vercel/DigitalOcean)
5. Smoke testing na produkcji
6. Monitoring błędów (Sentry, jeśli dostępne)
7. Monitoring metryk (success rate, avg generation time)

**Weryfikacja**: Feature deployed, działa na produkcji bez błędów

### Krok 20: Post-launch monitoring

**Zadania**:
1. Monitoring user feedback (przez 7 dni)
2. Analiza metryk:
   - Conversion rate (formularz → plan created)
   - AI generation success rate
   - Rate limit hit rate
   - Average form completion time
3. Identyfikacja bug'ów i edge cases
4. Planowanie iteracji (improvements)

**Weryfikacja**: Metryki w normie, user feedback pozytywny

---

**Status dokumentu**: Gotowy do implementacji ✅
**Wersja**: 1.0
**Data utworzenia**: 2025-01-18
**Zgodność z PRD**: Pełna zgodność z wymaganiami MVP minimum
**Zgodność z API**: Pełna integracja z endpointami API
**Zgodność z UI Plan**: Zgodny z architekturą UI i wzorcami UX
