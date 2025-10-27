# Unit Tests - RulesBuilderService

## Przegląd

Kompletny zestaw testów jednostkowych dla `RulesBuilderService` - serwisu odpowiedzialnego za generowanie i walidację reguł biznesowych dla AI generującego plany podróży.

## Statystyki pokrycia

- **Testy:** 75 test cases
- **Zestawy testowe:** 14 suites
- **Status:** ✅ Wszystkie przechodzą (75/75)
- **Czas wykonania:** ~50ms

## Struktura testów

### 1. Constructor and Configuration (3 testy)
Testuje inicjalizację serwisu i obsługę konfiguracji.

**Kluczowe przypadki:**
- ✅ Domyślna konfiguracja
- ✅ Konfiguracja niestandardowa
- ✅ Częściowa konfiguracja (merge z domyślnymi wartościami)

### 2. generateRulesContent() - Core Functionality (7 testów)
Testuje główną metodę generującą zawartość reguł dla promptów AI.

**Kluczowe przypadki:**
- ✅ Generowanie reguł dla poprawnego czasu trwania podróży
- ✅ Uwzględnienie wymagań dotyczących liczby aktywności
- ✅ Informacje o poziomach kosztów
- ✅ Definicje przedziałów czasowych
- ✅ Informacje specyficzne dla podróży
- ✅ Wytyczne budżetowe (gdy podany budżet)
- ✅ Działanie bez parametru budżetu

**Przykład użycia:**
```typescript
const service = new RulesBuilderService();
const rules = service.generateRulesContent(7, 'moderate');
// Generuje reguły dla 7-dniowej podróży z umiarkowanym budżetem
```

### 3. Input Validation and Edge Cases (6 testów)
Testuje walidację wejścia i przypadki brzegowe.

**Warunki brzegowe:**
- ❌ Nieprawidłowy czas trwania: 0, ujemny, >365, niecałkowity
- ✅ Minimalny czas trwania: 1 dzień
- ✅ Maksymalny czas trwania: 365 dni

**Reguły biznesowe:**
```typescript
// PASS: 1 <= duration <= 365 && Number.isInteger(duration)
// FAIL: wszystkie inne przypadki
```

### 4. Budget Parsing Logic (7 testów)
Testuje parsowanie różnych wariantów budżetu na `CostLevel` enum.

**Mapowania budżetu:**
| Input | Output |
|-------|--------|
| 'budget', 'low', 'cheap' | CostLevel.BUDGET ($) |
| 'moderate', 'medium', 'mid' | CostLevel.MODERATE ($$) |
| 'expensive', 'high' | CostLevel.EXPENSIVE ($$$) |
| 'luxury', 'premium', 'deluxe' | CostLevel.LUXURY ($$$$) |
| undefined, invalid | null |

**Funkcje:**
- Case-insensitive
- Obsługa białych znaków
- Rozpoznawanie synonimów

### 5. Trip Duration Validation (4 testy)
Testuje metodę `isValidTripDuration()`.

**Reguły:**
- ✅ 1-365 dni (włącznie)
- ✅ Tylko liczby całkowite
- ❌ NaN, Infinity, -Infinity

### 6. Activity Count Validation (6 testów)
Testuje `validateActivityCount()` z regułą biznesową 3-5 aktywności/dzień.

**Reguły biznesowe:**
```typescript
min: 3 aktywności/dzień (wymagane)
max: 5 aktywności/dzień (wymagane)
warning: dokładnie 3 aktywności (sugestia dodania więcej)
```

**Przykłady:**
```typescript
validateActivityCount(2)  // isValid: false, violation
validateActivityCount(3)  // isValid: true, warning
validateActivityCount(4)  // isValid: true, no warnings
validateActivityCount(6)  // isValid: false, violation
```

### 7. Activity Duration Validation (7 testów)
Testuje `validateActivityDuration()` z ograniczeniami czasowymi.

**Reguły biznesowe:**
```typescript
min: 15 minut
max: 480 minut (8 godzin)
warning: > 240 minut (4 godziny) - sugestia podziału
```

**Przypadki specjalne:**
- Dokładnie 4 godziny (240 min): ✅ bez ostrzeżenia
- 5 godzin (300 min): ✅ z ostrzeżeniem o podziale
- 0 minut: ❌ naruszenie
- Ujemne wartości: ❌ naruszenie

### 8. Cost Estimate Validation (3 testy)
Testuje `validateCostEstimate()` dla standaryzowanych poziomów kosztów.

**Dozwolone wartości:**
- `$` - Budget (<$20)
- `$$` - Moderate ($20-$50)
- `$$$` - Expensive ($50-$100)
- `$$$$` - Luxury (>$100)

**Niedozwolone:** 'free', 'cheap', '$$$$$', pusty string

### 9. Time Slot Detection (7 testów)
Testuje `getTimeSlot()` klasyfikującą czas w przedziały.

**Przedziały czasowe:**
```typescript
TimeSlot.EARLY_MORNING: 05:00-08:00
TimeSlot.MORNING:       08:00-12:00
TimeSlot.AFTERNOON:     12:00-17:00
TimeSlot.EVENING:       17:00-21:00
TimeSlot.NIGHT:         21:00-05:00
```

**Obsługa formatów:**
- `HH:MM` (dwucyfrowy)
- `H:MM` (jednocyfrowa godzina)
- Nieprawidłowe formaty: null

### 10. Time Progression Validation (8 testów)
Testuje `validateTimeProgression()` wykrywający nakładające się aktywności.

**Reguły:**
- ❌ Nakładające się czasy aktywności
- ✅ Dokładne granice czasowe (bez przerwy)
- ✅ Aktywności z przerwami

**Przykład nakładania:**
```typescript
// NIEPRAWIDŁOWE - nakładanie
[
  { time: '09:00', duration_minutes: 180 }, // 09:00-12:00
  { time: '11:00', duration_minutes: 60 }   // 11:00-12:00 ❌
]

// PRAWIDŁOWE - dokładne granice
[
  { time: '09:00', duration_minutes: 120 }, // 09:00-11:00
  { time: '11:00', duration_minutes: 60 }   // 11:00-12:00 ✅
]
```

**Przypadki specjalne:**
- Pojedyncza aktywność: zawsze prawidłowa
- Pusta tablica: zawsze prawidłowa
- Nieprawidłowy format czasu: naruszenie
- Przejście przez północ: akceptowane (obecna implementacja)

### 11. Total Activities Calculation (4 testy)
Testuje `calculateTotalActivities()`.

**Wzór:** `(min-max per day) × duration`

**Przykłady:**
```typescript
1 dzień:   3-5 aktywności
7 dni:     21-35 aktywności
30 dni:    90-150 aktywności
```

### 12. Integration Tests - Complex Scenarios (4 testy)
Testy integracyjne dla rzeczywistych scenariuszy.

**Scenariusze:**
1. **Weekendowy wyjazd** (3 dni, moderate)
   - 9-15 aktywności łącznie
   - Budżet: Mix płatnych i darmowych atrakcji

2. **Luksusowy długi wyjazd** (14 dni, luxury)
   - 42-70 aktywności łącznie
   - Budżet: Ekskluzywne doświadczenia, fine dining

3. **Budget backpacking** (21 dni, budget)
   - 63-105 aktywności łącznie
   - Budżet: Darmowe/tanie aktywności, transport publiczny

4. **Pełny harmonogram dnia** (5 aktywności)
   - Walidacja liczby aktywności: ✅
   - Walidacja postępu czasowego: ✅

### 13. Business Rules Enforcement (6 testów)
Weryfikacja krytycznych reguł biznesowych.

**Egzekwowane reguły:**
- ✅ Minimum 3 aktywności/dzień
- ✅ Maximum 5 aktywności/dzień
- ✅ Czas trwania aktywności: 15min - 8h
- ✅ Tylko standaryzowane poziomy kosztów
- ✅ Brak nakładających się aktywności

### 14. Custom Configuration Tests (3 testy)
Testuje customizację konfiguracji.

**Customizowalne parametry:**
```typescript
interface RulesConfig {
  minActivitiesPerDay?: number;      // domyślnie: 3
  maxActivitiesPerDay?: number;      // domyślnie: 5
  minActivityDurationMinutes?: number; // domyślnie: 15
  maxActivityDurationMinutes?: number; // domyślnie: 480
  allowedCostLevels?: CostLevel[];   // domyślnie: wszystkie
  strictTimeValidation?: boolean;     // domyślnie: true
}
```

## Uruchamianie testów

```bash
# Uruchom wszystkie testy jednostkowe
npm run test:unit

# Tryb watch (auto-rerun)
npm run test:unit:watch

# Z interfejsem UI
npm run test:unit:ui

# Z pokryciem kodu
npm run test:unit:coverage
```

## Wyniki testów

```
✓ tests/unit/services/rules-builder.service.test.ts (75 tests) 49ms

Test Files  1 passed (1)
     Tests  75 passed (75)
  Start at  21:07:29
  Duration  3.08s
```

## Kluczowe reguły biznesowe

### 1. Liczba aktywności
- **Minimum:** 3 aktywności/dzień
- **Maximum:** 5 aktywności/dzień
- **Ostrzeżenie:** dokładnie 3 (sugeruj więcej)

### 2. Czas trwania aktywności
- **Minimum:** 15 minut
- **Maximum:** 480 minut (8 godzin)
- **Ostrzeżenie:** >240 minut (podziel aktywność)

### 3. Czas trwania podróży
- **Zakres:** 1-365 dni
- **Typ:** liczba całkowita
- **Obliczanie całkowitych aktywności:** dni × (3-5)

### 4. Poziomy kosztów
- **$** - Budget (<$20)
- **$$** - Moderate ($20-$50)
- **$$$** - Expensive ($50-$100)
- **$$$$** - Luxury (>$100)

### 5. Przedziały czasowe
- **Early Morning:** 05:00-08:00 (ćwiczenia, wschód słońca)
- **Morning:** 08:00-12:00 (muzea, wycieczki)
- **Afternoon:** 12:00-17:00 (lunch, aktywności outdoor)
- **Evening:** 17:00-21:00 (kolacja, rozrywka)
- **Night:** 21:00-05:00 (bary, życie nocne)

### 6. Progresja czasowa
- Aktywności nie mogą się nakładać
- Dozwolone dokładne granice czasowe
- Wykrywanie nieprawidłowych formatów czasu

## Przypadki brzegowe uwzględnione w testach

### Walidacja wejścia
- ✅ Zero, ujemne, >365 dni
- ✅ Niecałkowite liczby
- ✅ NaN, Infinity, -Infinity

### Parsowanie budżetu
- ✅ Case-insensitive
- ✅ Białe znaki
- ✅ Synonimiczne warianty
- ✅ Undefined i nieprawidłowe wartości

### Formaty czasu
- ✅ HH:MM i H:MM
- ✅ Nieprawidłowe godziny/minuty
- ✅ Nieprawidłowe formaty
- ✅ Pojedyncze cyfry

### Walidacja aktywności
- ✅ Puste tablice
- ✅ Pojedyncze aktywności
- ✅ Wiele nakładających się
- ✅ Przejścia przez północ

## Przykłady użycia

### Podstawowe użycie
```typescript
import { RulesBuilderService } from '@/services/rules-builder.service';

const service = new RulesBuilderService();
const rules = service.generateRulesContent(7, 'moderate');
console.log(rules);
// Wyświetla sformatowane reguły dla 7-dniowej podróży
```

### Konfiguracja niestandardowa
```typescript
const service = new RulesBuilderService({
  minActivitiesPerDay: 2,
  maxActivitiesPerDay: 6,
  minActivityDurationMinutes: 30,
});

const rules = service.generateRulesContent(14, 'luxury');
```

### Walidacja harmonogramu dnia
```typescript
const activities = [
  { time: '09:00', duration_minutes: 120 },
  { time: '11:30', duration_minutes: 60 },
  { time: '13:00', duration_minutes: 90 },
  { time: '15:30', duration_minutes: 120 },
];

// Waliduj liczbę aktywności
const countResult = service.validateActivityCount(activities.length);
console.log(countResult.isValid); // true

// Waliduj progresję czasową
const timeResult = service.validateTimeProgression(activities);
console.log(timeResult.isValid); // true
```

### Walidacja pojedynczej aktywności
```typescript
// Sprawdź czas trwania
const durationResult = service.validateActivityDuration(120); // 2 godziny
console.log(durationResult.isValid); // true

// Sprawdź oszacowanie kosztów
const costResult = service.validateCostEstimate('$$');
console.log(costResult.isValid); // true

// Określ przedział czasowy
const timeSlot = service.getTimeSlot('14:30');
console.log(timeSlot); // TimeSlot.AFTERNOON
```

## Integracja z AI Service

`RulesBuilderService` jest zaprojektowany do integracji z `AIService`:

```typescript
import { AIService } from '@/services/ai.service';
import { RulesBuilderService } from '@/services/rules-builder.service';

const rulesService = new RulesBuilderService();
const aiService = new AIService(apiKey);

// Generuj reguły dla promptu
const rules = rulesService.generateRulesContent(tripDuration, budget);

// Użyj reguł w prompcie AI (przyszła implementacja)
// const enhancedPrompt = basePrompt + '\n\n' + rules;
```

## Metryki jakości

- **Pokrycie kodu:** Wysokie (wszystkie publiczne metody)
- **Pokrycie przypadków brzegowych:** Kompletne
- **Stabilność testów:** 100% (0 flaky tests)
- **Czas wykonania:** <100ms (bardzo szybkie)
- **Czytelność:** Opisowe nazwy testów i komentarze

## Przyszłe rozszerzenia

Potencjalne obszary do rozbudowy testów:

1. **Performance tests** - dla bardzo długich podróży (>100 dni)
2. **Localization tests** - różne formaty czasu (12h vs 24h)
3. **Accessibility rules** - aktywności przyjazne dla osób niepełnosprawnych
4. **Seasonal rules** - reguły sezonowe dla destynacji
5. **Group size rules** - dostosowanie do rozmiaru grupy

## Wkład w projekt

Przed dodaniem nowych reguł biznesowych:

1. Dodaj testy dla nowej funkcjonalności
2. Upewnij się, że wszystkie istniejące testy przechodzą
3. Udokumentuj nowe reguły biznesowe
4. Zaktualizuj przykłady użycia

## Autor i Kontakt

Testy stworzone jako część Travel App Planner MVP.
Pełna dokumentacja projektu: `10x-astro-starter/CLAUDE.md`
