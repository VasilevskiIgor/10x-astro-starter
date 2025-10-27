# Plan Testów - VibeTravels MVP

**Wersja:** 1.0
**Data:** 24 października 2025
**Status:** Gotowy do implementacji
**Autor:** QA Team

---

## Spis treści

1. [Wprowadzenie i cele testowania](#1-wprowadzenie-i-cele-testowania)
2. [Zakres testów](#2-zakres-testów)
3. [Strategia testowania](#3-strategia-testowania)
4. [Scenariusze testowe](#4-scenariusze-testowe)
5. [Środowisko testowe](#5-środowisko-testowe)
6. [Narzędzia do testowania](#6-narzędzia-do-testowania)
7. [Harmonogram testów](#7-harmonogram-testów)
8. [Kryteria akceptacji testów](#8-kryteria-akceptacji-testów)
9. [Role i odpowiedzialności](#9-role-i-odpowiedzialności)
10. [Procedury raportowania błędów](#10-procedury-raportowania-błędów)
11. [Appendix](#11-appendix)

---

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument definiuje kompleksowy plan testów dla aplikacji VibeTravels MVP - platformy do planowania podróży z wykorzystaniem sztucznej inteligencji. Plan zapewnia, że wszystkie wymagania zaliczeniowe projektu zostaną zweryfikowane przed finalnym wdrożeniem.

### 1.2 Wymagania zaliczeniowe (z PRD)

Zgodnie z dokumentem PRD v2.0, projekt **MUSI** zawierać:

1. ✅ **Mechanizm kontroli dostępu użytkownika**
   - Rejestracja użytkownika (email + hasło)
   - Logowanie użytkownika
   - Wylogowanie użytkownika
   - Ochrona protected routes

2. ✅ **Zarządzanie danymi CRUD**
   - CREATE: Tworzenie nowego planu podróży
   - READ: Przeglądanie listy planów + szczegóły planu
   - UPDATE: Edycja planu (destination, daty, description)
   - DELETE: Usuwanie planu z potwierdzeniem

3. ✅ **Logika biznesowa z AI**
   - Integracja z OpenAI/OpenRouter API
   - Generowanie planu podróży przez AI
   - Parsowanie i zapisywanie odpowiedzi AI
   - Wyświetlanie wygenerowanej treści

4. ✅ **Testy end-to-end**
   - **MINIMUM 1 test E2E** weryfikujący cały flow użytkownika
   - Test musi sprawdzać: signup → login → create plan → AI generation → edit → delete → logout

5. ✅ **Pipeline CI/CD**
   - GitHub Actions workflow
   - Build aplikacji w pipeline
   - Uruchamianie testów w pipeline
   - Pipeline działa na push/PR

### 1.3 Zakres MVP minimum

**MUST HAVE (P0 - wymagane do zaliczenia):**
- ✅ Ekran logowania + rejestracji (email/password, Supabase Auth)
- ✅ CRUD dla planów podróży (wszystkie operacje)
- ✅ Generowanie planów przez AI (OpenAI/OpenRouter)
- ✅ Minimum 1 test E2E weryfikujący complete user journey
- ✅ GitHub Actions CI/CD (build + test)
- ✅ Row Level Security (RLS) w Supabase - izolacja danych użytkowników

**NICE TO HAVE (P1-P2 - opcjonalne, poza zakresem MVP minimum):**
- ⚠️ Google OAuth (wystarczy email/hasło)
- ⚠️ System Premium/płatności
- ⚠️ Email notifications
- ⚠️ PDF export
- ⚠️ Rating system
- ⚠️ Password reset flow (nice to have, nie blokujące)

### 1.4 Definicja "Done" dla testów

Test jest uznawany za zaliczony (PASS), gdy:

1. **Dla testów automatycznych (E2E):**
   - Test wykonuje się bez błędów na środowisku lokalnym
   - Test przechodzi w CI/CD (GitHub Actions)
   - Wszystkie asercje (assertions) są spełnione
   - Test jest stabilny (nie-flaky, < 5% failure rate)
   - Czas wykonania < 3 minuty

2. **Dla testów manualnych:**
   - Wszystkie kroki testowe wykonane zgodnie z instrukcją
   - Rezultat zgodny z oczekiwaniami
   - Brak defektów krytycznych (P0)
   - Udokumentowane screenshots/video dla błędów

3. **Dla projektu jako całości:**
   - Wszystkie testy P0 (MUST HAVE) przechodzą
   - Minimum 1 test E2E działa w CI/CD
   - RLS policies działają poprawnie
   - AI integration generuje poprawne plany
   - Brak błędów blokujących (P0-Critical)

---

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami

#### 2.1.1 Moduł Autentykacji (Supabase Auth)

| User Story | Funkcjonalność | Priorytet | Typ testu |
|------------|----------------|-----------|-----------|
| US-001 | Rejestracja użytkownika (email + hasło) | P0 | E2E + Manual |
| US-002 | Logowanie użytkownika | P0 | E2E + Manual |
| US-003 | Wylogowanie użytkownika | P0 | E2E + Manual |
| US-011 | Ochrona protected routes (middleware) | P0 | E2E + Manual |
| US-012 | Ochrona planów innych użytkowników (RLS) | P0 | E2E + Security |

**Scenariusze testowe:**
- ✅ TC-001: Poprawna rejestracja nowego użytkownika
- ✅ TC-002: Rejestracja z emailem już istniejącym (błąd)
- ✅ TC-003: Walidacja formularza rejestracji (hasła nie pasują)
- ✅ TC-004: Poprawne logowanie
- ✅ TC-005: Logowanie z nieprawidłowym hasłem
- ✅ TC-006: Automatyczne przekierowanie po logowaniu
- ✅ TC-007: Wylogowanie i zakończenie sesji
- ✅ TC-008: Dostęp do protected route bez logowania (redirect)
- ✅ TC-009: Próba dostępu do cudzego planu (RLS block)

#### 2.1.2 Moduł CRUD - Zarządzanie planami podróży

| User Story | Funkcjonalność | Priorytet | Typ testu |
|------------|----------------|-----------|-----------|
| US-004 | CREATE: Formularz tworzenia planu | P0 | E2E + Manual |
| US-005 | CREATE: Generowanie planu przez AI | P0 | E2E + Integration |
| US-006 | READ: Lista planów użytkownika | P0 | E2E + Manual |
| US-007 | READ: Szczegóły planu | P0 | E2E + Manual |
| US-008 | UPDATE: Formularz edycji planu | P0 | E2E + Manual |
| US-009 | UPDATE: Zapisanie zmian | P0 | E2E + Manual |
| US-010 | DELETE: Usunięcie planu z potwierdzeniem | P0 | E2E + Manual |

**Scenariusze testowe:**
- ✅ TC-010: Utworzenie nowego planu (formularz + zapis do bazy)
- ✅ TC-011: Generowanie planu przez AI (OpenAI/OpenRouter)
- ✅ TC-012: Wyświetlenie listy planów użytkownika
- ✅ TC-013: Pusta lista planów (nowy użytkownik)
- ✅ TC-014: Wyświetlenie szczegółów planu
- ✅ TC-015: Wyświetlenie AI-generated content
- ✅ TC-016: Edycja planu (zmiana destination, dat)
- ✅ TC-017: Zapisanie zmian w planie
- ✅ TC-018: Usunięcie planu (modal potwierdzający)
- ✅ TC-019: Anulowanie usunięcia planu

#### 2.1.3 Moduł AI Integration

| Funkcjonalność | Priorytet | Typ testu |
|----------------|-----------|-----------|
| FR-009: Wysłanie request do OpenRouter/OpenAI | P0 | E2E + Integration |
| FR-010: Parsowanie odpowiedzi AI | P0 | E2E + Unit |
| Obsługa timeout (30-90s) | P1 | E2E |
| Obsługa błędów API (rate limit, 500) | P1 | E2E + Manual |
| Loading state podczas generowania | P1 | E2E + Manual |

**Scenariusze testowe:**
- ✅ TC-020: AI generuje plan podróży (happy path)
- ✅ TC-021: AI timeout po 90 sekundach
- ✅ TC-022: Błąd API (invalid API key)
- ✅ TC-023: Loading state widoczny podczas generowania
- ✅ TC-024: Parsowanie odpowiedzi AI (format tekstu)

#### 2.1.4 Moduł Bezpieczeństwa

| Funkcjonalność | Priorytet | Typ testu |
|----------------|-----------|-----------|
| FR-011: Row Level Security (RLS) | P0 | E2E + Security |
| JWT token validation | P0 | Security |
| XSS protection | P1 | Security + Manual |
| SQL injection protection | P1 | Security |
| HTTPS enforcement (production) | P2 | Manual |

**Scenariusze testowe:**
- ✅ TC-025: User A nie widzi planów User B (RLS)
- ✅ TC-026: Próba SQL injection w formularzu
- ✅ TC-027: Próba XSS attack w description field
- ✅ TC-028: Walidacja JWT token expiry
- ✅ TC-029: Session management (logout invalidates token)

### 2.2 Funkcjonalności NIE objęte testami (Out of Scope dla MVP)

Zgodnie z PRD v2.0, następujące funkcjonalności są **poza zakresem MVP minimum** i nie będą testowane:

- ❌ Google OAuth (social login)
- ❌ System Premium i płatności (Stripe integration)
- ❌ Email notifications (Resend)
- ❌ PDF export planów podróży
- ❌ Rating i feedback system
- ❌ Regeneracja planów AI
- ❌ Współdzielenie planów między użytkownikami
- ❌ Landing page (wystarczy prosta strona główna)
- ❌ Advanced analytics i metryki
- ❌ Preferencje użytkownika (save/load)
- ❌ Filtry i wyszukiwanie w dashboardzie
- ❌ **Password reset flow** (nice to have, nie blokujący - 4 dodatkowe komponenty)

### 2.3 Macierz pokrycia wymagań (Traceability Matrix)

| FR/US ID | Wymaganie | Test Case IDs | Typ testu | Status |
|----------|-----------|---------------|-----------|--------|
| FR-001 | Rejestracja użytkownika | TC-001, TC-002, TC-003 | E2E + Manual | ✅ Covered |
| FR-002 | Logowanie użytkownika | TC-004, TC-005, TC-006 | E2E + Manual | ✅ Covered |
| FR-003 | Wylogowanie | TC-007 | E2E + Manual | ✅ Covered |
| FR-004 | CREATE: Tworzenie planu | TC-010 | E2E + Manual | ✅ Covered |
| FR-005 | READ: Lista planów | TC-012, TC-013 | E2E + Manual | ✅ Covered |
| FR-006 | READ: Szczegóły planu | TC-014, TC-015 | E2E + Manual | ✅ Covered |
| FR-007 | UPDATE: Edycja planu | TC-016, TC-017 | E2E + Manual | ✅ Covered |
| FR-008 | DELETE: Usuwanie planu | TC-018, TC-019 | E2E + Manual | ✅ Covered |
| FR-009 | AI: Generowanie planu | TC-011, TC-020, TC-021 | E2E + Integration | ✅ Covered |
| FR-010 | AI: Wyświetlanie treści | TC-015, TC-024 | E2E + Unit | ✅ Covered |
| FR-011 | Autoryzacja i RLS | TC-008, TC-009, TC-025 | E2E + Security | ✅ Covered |

**Pokrycie wymagań:**
- **MUST HAVE (FR-001 do FR-011):** 100% covered
- **Testy E2E:** 29 test cases
- **Testy manualne:** 22 checkpoints
- **Testy bezpieczeństwa:** 9 checkpoints

---

## 3. Strategia testowania

### 3.1 Piramida testów

```
           ┌────────────────┐
           │   E2E Tests    │  ← Playwright (WYMAGANE, P0)
           │   (4 tests)    │     1 test minimum do zaliczenia
           └────────────────┘
                  ▲
         ┌────────────────────┐
         │ Integration Tests  │  ← API + DB (OPCJONALNE, P1)
         │   (2-3 tests)      │     OpenRouter API, Supabase RLS
         └────────────────────┘
                  ▲
        ┌──────────────────────┐
        │    Unit Tests        │  ← Vitest (OPCJONALNE, P2)
        │   (5-10 tests)       │     Walidacje, parsowanie
        └──────────────────────┘
                  ▲
       ┌────────────────────────┐
       │   Manual Tests         │  ← Browser testing (WYMAGANE, P0)
       │   (22 checkpoints)     │     UI/UX, Cross-browser, A11y
       └────────────────────────┘
```

**Rozkład nakładu pracy:**
- **E2E Tests:** 40% czasu (10-12h) - najwyższy priorytet
- **Manual Tests:** 30% czasu (6-8h) - wymagane do akceptacji
- **Security Tests:** 20% czasu (4-6h) - krytyczne dla produkcji
- **Unit Tests:** 10% czasu (2-4h) - opcjonalne, nice to have

### 3.2 Typy testów do przeprowadzenia

#### 3.2.1 E2E Tests (Playwright) - **WYMAGANE, P0**

**Cel:** Weryfikacja całego flow użytkownika od początku do końca

**Zakres:**
- ✅ Complete User Journey (signup → logout) - **WYMAGANY do zaliczenia**
- ✅ Protected Routes & Authorization
- ✅ Data Isolation (RLS)
- ✅ Form Validation

**Narzędzie:** Playwright + TypeScript
**Lokalizacja:** `tests/e2e/*.spec.ts`
**Czas wykonania:** < 3 min/test
**Prioryt:** **P0 (MUST HAVE)**

**Wymagania:**
- Minimum 1 test E2E musi działać w CI/CD
- Test musi weryfikować 100% user stories (US-001 do US-012)
- Stabilność: < 5% flakiness rate

#### 3.2.2 Integration Tests - OPCJONALNE, P1

**Cel:** Testowanie integracji między komponentami

**Zakres:**
- OpenRouter/OpenAI API integration
- Supabase database operations (CRUD)
- Middleware authentication flow

**Narzędzie:** Vitest + Mock API
**Lokalizacja:** `tests/integration/*.test.ts`
**Prioryt:** **P1 (Important)**

**Uwaga:** Opcjonalne dla MVP minimum, ale zalecane dla lepszego pokrycia.

#### 3.2.3 Unit Tests (Vitest) - OPCJONALNE, P2

**Cel:** Testowanie jednostek kodu w izolacji

**Zakres:**
- Walidacja email (regex)
- Walidacja hasła (min. 8 znaków)
- Parsowanie odpowiedzi AI
- Error handling utilities

**Narzędzie:** Vitest + React Testing Library
**Lokalizacja:** `tests/unit/*.test.ts`
**Prioryt:** **P2 (Nice to have)**

**Uwaga:** Opcjonalne dla MVP minimum, można pominąć jeśli brakuje czasu.

#### 3.2.4 Manual Tests - **WYMAGANE, P0**

**Cel:** Weryfikacja aspektów trudnych do automatyzacji

**Zakres:**
- ✅ UI/UX testing (layout, responsiveness, interactions)
- ✅ Cross-browser testing (Chrome, Firefox, Safari, Edge)
- ✅ Accessibility WCAG 2.1 Level AA
- ✅ Visual regression testing
- ✅ Performance testing (Lighthouse)

**Narzędzia:** Browser DevTools, Lighthouse, WAVE
**Lokalizacja:** Checklisty w sekcji 4.5
**Prioryt:** **P0 (MUST HAVE)**

#### 3.2.5 Security Tests - **WYMAGANE, P0**

**Cel:** Weryfikacja bezpieczeństwa aplikacji

**Zakres:**
- ✅ Row Level Security (RLS) policies
- ✅ JWT token validation
- ✅ XSS protection
- ✅ SQL injection protection
- ✅ Password hashing (bcrypt)
- ✅ HTTPS enforcement (production)
- ✅ Environment variables security

**Narzędzia:** Manual testing + OWASP ZAP (opcjonalnie)
**Lokalizacja:** Checklisty w sekcji 4.6
**Prioryt:** **P0 (MUST HAVE)**

### 3.3 Priorytety testów

| Priorytet | Opis | Testy | Wymagane do zaliczenia |
|-----------|------|-------|------------------------|
| **P0 (Critical)** | Testy blokujące zaliczenie projektu | E2E #1 (Complete Journey), Manual Auth, Manual CRUD, Security RLS | ✅ TAK |
| **P1 (Important)** | Testy ważnych funkcjonalności | E2E #2-4, Integration AI, Error Handling | ⚠️ Zalecane |
| **P2 (Nice to have)** | Testy usprawniające jakość | Unit tests, Performance, A11y | ❌ Opcjonalne |

**Minimalne wymagania do zaliczenia projektu:**
1. ✅ 1 test E2E `complete-user-journey.spec.ts` przechodzi w CI/CD
2. ✅ Testy manualne auth + CRUD wykonane (22 checkpoints)
3. ✅ Security checklist zweryfikowany (9 items)
4. ✅ Brak błędów P0-Critical

**Zalecane do pełnego pokrycia MVP:**
- 4 testy E2E przechodzą
- Testy integracji AI działają
- Cross-browser testing wykonany
- Accessibility checklist zweryfikowany

---

## 4. Scenariusze testowe

### 4.1 Test E2E #1: Complete User Journey (WYMAGANY)

**Plik:** `tests/e2e/complete-user-journey.spec.ts`

**Opis:** Kompleksowy test weryfikujący cały flow użytkownika od rejestracji do wylogowania. Ten test **MUSI** działać w CI/CD, aby projekt został zaliczony.

**User Stories pokryte:** US-001, US-002, US-003, US-004, US-005, US-006, US-007, US-008, US-009, US-010

**Kroki testowe:**
1. ✅ Rejestracja nowego użytkownika (email + hasło)
2. ✅ Automatyczne logowanie po rejestracji
3. ✅ Przekierowanie do dashboardu `/trips`
4. ✅ Utworzenie nowego planu podróży (formularz)
5. ✅ Generowanie planu przez AI (OpenRouter/OpenAI)
6. ✅ Wyświetlenie szczegółów planu (AI-generated content)
7. ✅ Edycja planu (zmiana destination, dat)
8. ✅ Zapisanie zmian w planie
9. ✅ Usunięcie planu (modal potwierdzający)
10. ✅ Wylogowanie użytkownika

**Kod testu:**

```typescript
// tests/e2e/complete-user-journey.spec.ts

import { test, expect } from '@playwright/test';

/**
 * TEST E2E #1: Complete User Journey
 *
 * Ten test weryfikuje cały flow użytkownika od rejestracji do wylogowania.
 * Jest to GŁÓWNY TEST wymagany do zaliczenia projektu.
 *
 * Pokrywa User Stories: US-001, US-002, US-003, US-004, US-005, US-006,
 *                       US-007, US-008, US-009, US-010
 *
 * Czas wykonania: ~2-3 minuty (w tym 30-90s na AI generation)
 */

// Generuj unikalny email dla każdego uruchomienia testu (aby uniknąć konfliktów)
const generateTestEmail = () => `test-${Date.now()}@vibetravels.test`;
const testPassword = 'SecurePassword123!';

test.describe('Complete User Journey - VibeTravels MVP', () => {

  let testEmail: string;
  let planId: string;

  test.beforeEach(() => {
    // Generuj nowy email przed każdym testem
    testEmail = generateTestEmail();
  });

  test('user can signup, create AI plan, edit, delete, and logout', async ({ page }) => {

    // ========================================
    // KROK 1: REJESTRACJA NOWEGO UŻYTKOWNIKA
    // ========================================

    console.log(`[TEST] Krok 1: Rejestracja użytkownika: ${testEmail}`);

    await test.step('1. Navigate to signup page', async () => {
      await page.goto('/auth/signup');
      await expect(page).toHaveURL(/\/auth\/signup/);
      await expect(page.locator('h1')).toContainText('Utwórz konto');
    });

    await test.step('2. Fill signup form and submit', async () => {
      // Wypełnij formularz rejestracji
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);

      // Kliknij przycisk "Utwórz konto"
      await page.click('button[type="submit"]:has-text("Utwórz konto")');

      // Poczekaj na komunikat sukcesu lub redirect
      await page.waitForTimeout(2000); // Poczekaj na auto-login
    });

    // ========================================
    // KROK 2: AUTOMATYCZNE LOGOWANIE I REDIRECT DO DASHBOARDU
    // ========================================

    console.log('[TEST] Krok 2: Weryfikacja automatycznego logowania');

    await test.step('3. Verify auto-login and redirect to dashboard', async () => {
      // Po rejestracji: auto-login + redirect do /trips
      await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

      // Weryfikuj czy użytkownik jest zalogowany (sprawdź nawigację)
      await expect(page.locator('nav')).toContainText(testEmail.substring(0, 1).toUpperCase());

      // Weryfikuj pusty dashboard (nowy użytkownik nie ma planów)
      await expect(page.locator('text=You don\'t have any plans yet')).toBeVisible();
    });

    // ========================================
    // KROK 3: UTWORZENIE NOWEGO PLANU PODRÓŻY
    // ========================================

    console.log('[TEST] Krok 3: Tworzenie nowego planu podróży');

    await test.step('4. Click "Create New Plan" button', async () => {
      await page.click('a:has-text("Create New Plan")');
      await expect(page).toHaveURL(/\/trips\/new/);
      await expect(page.locator('h1')).toContainText('Create New Travel Plan');
    });

    await test.step('5. Fill plan creation form', async () => {
      // Wypełnij formularz
      await page.fill('input[name="destination"]', 'Tokyo, Japan');
      await page.fill('input[name="startDate"]', '2025-12-01');
      await page.fill('input[name="endDate"]', '2025-12-07');
      await page.fill('textarea[name="description"]',
        'First time in Japan. Interested in culture, temples, and authentic food experiences.');
    });

    // ========================================
    // KROK 4: GENEROWANIE PLANU PRZEZ AI
    // ========================================

    console.log('[TEST] Krok 4: Generowanie planu przez AI (może potrwać 30-90s)');

    await test.step('6. Generate plan with AI', async () => {
      // Kliknij przycisk "Generate with AI"
      await page.click('button:has-text("Generate with AI")');

      // Weryfikuj loading state
      await expect(page.locator('text=Generating your plan')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.animate-spin')).toBeVisible(); // Spinner

      // Poczekaj na zakończenie generowania AI (max 90 sekund)
      await expect(page).toHaveURL(/\/trips\/[a-z0-9-]+$/, { timeout: 120000 });

      console.log('[TEST] AI generation completed, redirected to plan details');
    });

    // ========================================
    // KROK 5: WERYFIKACJA SZCZEGÓŁÓW PLANU
    // ========================================

    console.log('[TEST] Krok 5: Weryfikacja szczegółów wygenerowanego planu');

    await test.step('7. Verify plan details and AI-generated content', async () => {
      // Pobierz ID planu z URL
      const url = page.url();
      planId = url.split('/trips/')[1].split('/')[0];
      console.log(`[TEST] Plan ID: ${planId}`);

      // Weryfikuj podstawowe dane planu
      await expect(page.locator('text=Tokyo')).toBeVisible();
      await expect(page.locator('text=2025-12-01')).toBeVisible();
      await expect(page.locator('text=2025-12-07')).toBeVisible();

      // Weryfikuj obecność AI-generated content
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
      expect(pageContent!.length).toBeGreaterThan(200); // AI powinien wygenerować >200 znaków

      // Sprawdź czy treść zawiera typowe słowa kluczowe dla planu podróży
      expect(pageContent).toMatch(/day|visit|explore|temple|food|culture/i);

      // Weryfikuj widoczność przycisków akcji
      await expect(page.locator('button:has-text("Edit")')).toBeVisible();
      await expect(page.locator('button:has-text("Delete")')).toBeVisible();
      await expect(page.locator('a:has-text("Back to Dashboard")')).toBeVisible();
    });

    // ========================================
    // KROK 6: EDYCJA PLANU
    // ========================================

    console.log('[TEST] Krok 6: Edycja planu podróży');

    await test.step('8. Click Edit button and navigate to edit form', async () => {
      await page.click('button:has-text("Edit")');
      await expect(page).toHaveURL(new RegExp(`/trips/${planId}/edit`));
      await expect(page.locator('h1')).toContainText('Edit');
    });

    await test.step('9. Modify plan details', async () => {
      // Zmień destination (rozszerzenie podróży)
      await page.fill('input[name="destination"]', 'Tokyo and Kyoto, Japan');

      // Przedłuż podróż o 3 dni
      await page.fill('input[name="endDate"]', '2025-12-10');

      // Zaktualizuj opis
      await page.fill('textarea[name="description"]',
        'Extended trip to include Kyoto. Want to see traditional temples and try kaiseki dining.');
    });

    await test.step('10. Save changes', async () => {
      // Kliknij przycisk "Save Changes"
      await page.click('button:has-text("Save Changes")');

      // Poczekaj na redirect do szczegółów planu
      await expect(page).toHaveURL(new RegExp(`/trips/${planId}$`), { timeout: 10000 });

      // Weryfikuj zaktualizowane dane
      await expect(page.locator('text=Tokyo and Kyoto')).toBeVisible();
      await expect(page.locator('text=2025-12-10')).toBeVisible();

      // Weryfikuj komunikat sukcesu (jeśli jest implementowany)
      // await expect(page.locator('text=Plan updated successfully')).toBeVisible();

      console.log('[TEST] Plan successfully updated');
    });

    // ========================================
    // KROK 7: POWRÓT DO DASHBOARDU I WERYFIKACJA
    // ========================================

    console.log('[TEST] Krok 7: Powrót do dashboardu');

    await test.step('11. Navigate back to dashboard', async () => {
      await page.click('a:has-text("Back to Dashboard")');
      await expect(page).toHaveURL(/\/trips$/);

      // Weryfikuj że plan jest widoczny na liście
      await expect(page.locator('text=Tokyo and Kyoto')).toBeVisible();
      await expect(page.locator('text=2025-12-01')).toBeVisible();
      await expect(page.locator('text=2025-12-10')).toBeVisible();

      // Status planu powinien być "completed"
      await expect(page.locator('text=completed')).toBeVisible();
    });

    // ========================================
    // KROK 8: USUNIĘCIE PLANU
    // ========================================

    console.log('[TEST] Krok 8: Usunięcie planu');

    await test.step('12. Click on plan to open details', async () => {
      await page.click('text=Tokyo and Kyoto');
      await expect(page).toHaveURL(new RegExp(`/trips/${planId}`));
    });

    await test.step('13. Delete plan with confirmation', async () => {
      // Kliknij przycisk Delete
      await page.click('button:has-text("Delete")');

      // Weryfikuj modal potwierdzający
      await expect(page.locator('text=Are you sure')).toBeVisible({ timeout: 5000 });

      // Kliknij przycisk "Delete" w modalu (lub "Confirm")
      await page.click('button:has-text("Delete"):last-of-type, button:has-text("Confirm")');

      // Poczekaj na redirect do dashboardu
      await expect(page).toHaveURL(/\/trips$/, { timeout: 10000 });

      // Weryfikuj że plan zniknął z listy
      await expect(page.locator('text=Tokyo and Kyoto')).not.toBeVisible();
      await expect(page.locator('text=You don\'t have any plans yet')).toBeVisible();

      console.log('[TEST] Plan successfully deleted');
    });

    // ========================================
    // KROK 9: WYLOGOWANIE
    // ========================================

    console.log('[TEST] Krok 9: Wylogowanie użytkownika');

    await test.step('14. Logout user', async () => {
      // Kliknij avatar/inicjały użytkownika (UserMenu)
      const userMenuButton = page.locator('nav button:has-text("' + testEmail.substring(0, 1).toUpperCase() + '")');
      await userMenuButton.click();

      // Kliknij "Wyloguj się" w dropdown
      await page.click('button:has-text("Wyloguj się"), button:has-text("Logout")');

      // Poczekaj na redirect do strony logowania
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

      console.log('[TEST] User successfully logged out');
    });

    // ========================================
    // KROK 10: WERYFIKACJA BRAKU DOSTĘPU PO WYLOGOWANIU
    // ========================================

    console.log('[TEST] Krok 10: Weryfikacja braku dostępu do protected routes');

    await test.step('15. Verify no access to protected routes after logout', async () => {
      // Próba dostępu do dashboardu bez logowania
      await page.goto('/trips');

      // Middleware powinien przekierować do logowania
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });

      // Weryfikuj parametr redirect
      expect(page.url()).toContain('redirect=');

      console.log('[TEST] Protected routes correctly blocked after logout');
    });

    // ========================================
    // TEST ZAKOŃCZONY SUKCESEM
    // ========================================

    console.log('[TEST] ✅ Complete User Journey test PASSED');
    console.log(`[TEST] Total test duration: ${(Date.now() - parseInt(testEmail.split('-')[1])) / 1000}s`);
  });

  // ========================================
  // CLEANUP: Usunięcie użytkownika testowego
  // ========================================

  test.afterEach(async () => {
    // W MVP minimum nie implementujemy cleanup - użytkownicy testowi pozostają w bazie
    // Dla production warto dodać API endpoint do usuwania test users
    console.log(`[CLEANUP] Test user ${testEmail} remains in database`);
  });

});
```

**Kryteria akceptacji:**
- ✅ Test wykonuje się bez błędów na localhost
- ✅ Test przechodzi w CI/CD (GitHub Actions)
- ✅ Czas wykonania < 3 minuty
- ✅ Wszystkie asercje spełnione
- ✅ Stabilność: < 5% flakiness rate

---

### 4.2 Test E2E #2: Protected Routes & Authorization

**Plik:** `tests/e2e/protected-routes.spec.ts`

**Opis:** Test weryfikujący middleware protection i obsługę protected routes.

**User Stories pokryte:** US-011

**Kod testu:**

```typescript
// tests/e2e/protected-routes.spec.ts

import { test, expect } from '@playwright/test';

/**
 * TEST E2E #2: Protected Routes & Authorization
 *
 * Weryfikuje middleware protection i obsługę redirect params.
 *
 * Pokrywa User Story: US-011 (FR-011)
 *
 * Czas wykonania: ~30 sekund
 */

test.describe('Protected Routes & Authorization', () => {

  test('unauthenticated user cannot access /trips', async ({ page }) => {
    // Próba dostępu do dashboardu bez logowania
    await page.goto('/trips');

    // Middleware powinien przekierować do logowania
    await expect(page).toHaveURL(/\/auth\/login/);

    // Weryfikuj parametr redirect
    expect(page.url()).toContain('redirect=%2Ftrips');
  });

  test('unauthenticated user cannot access /trips/new', async ({ page }) => {
    await page.goto('/trips/new');

    await expect(page).toHaveURL(/\/auth\/login/);
    expect(page.url()).toContain('redirect=');
  });

  test('unauthenticated user cannot access specific trip by ID', async ({ page }) => {
    // Próba dostępu do konkretnego planu (fake ID)
    await page.goto('/trips/123e4567-e89b-12d3-a456-426614174000');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('redirect parameter works after login', async ({ page }) => {
    const testEmail = `test-redirect-${Date.now()}@test.com`;
    const testPassword = 'TestPass123!';

    // Rejestracja użytkownika
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Poczekaj na auto-login i redirect
    await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

    // Wyloguj
    const userInitial = testEmail.substring(0, 1).toUpperCase();
    await page.locator(`nav button:has-text("${userInitial}")`).click();
    await page.click('button:has-text("Wyloguj"), button:has-text("Logout")');
    await expect(page).toHaveURL(/\/auth\/login/);

    // Próba dostępu do /trips/new (powinien zapisać redirect)
    await page.goto('/trips/new');
    await expect(page).toHaveURL(/\/auth\/login.*redirect/);

    // Zaloguj się
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Po logowaniu powinien wrócić do /trips/new
    await expect(page).toHaveURL(/\/trips\/new/, { timeout: 10000 });
  });

});
```

---

### 4.3 Test E2E #3: Data Isolation (RLS)

**Plik:** `tests/e2e/data-isolation-rls.spec.ts`

**Opis:** Test weryfikujący Row Level Security - użytkownik A nie może widzieć planów użytkownika B.

**User Stories pokryte:** US-012

**Kod testu:**

```typescript
// tests/e2e/data-isolation-rls.spec.ts

import { test, expect } from '@playwright/test';

/**
 * TEST E2E #3: Data Isolation (Row Level Security)
 *
 * Weryfikuje że RLS policies w Supabase blokują dostęp do cudzych planów.
 *
 * Pokrywa User Story: US-012 (FR-011)
 *
 * Czas wykonania: ~2-3 minuty
 */

test.describe('Data Isolation - Row Level Security', () => {

  let userAEmail: string;
  let userAPassword: string;
  let userAPlanId: string;

  let userBEmail: string;
  let userBPassword: string;

  test.beforeAll(async () => {
    // Przygotuj dane testowe
    const timestamp = Date.now();
    userAEmail = `user-a-${timestamp}@test.com`;
    userAPassword = 'UserAPass123!';

    userBEmail = `user-b-${timestamp}@test.com`;
    userBPassword = 'UserBPass123!';
  });

  test('User A creates a plan', async ({ page }) => {
    // Zarejestruj User A
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', userAEmail);
    await page.fill('input[name="password"]', userAPassword);
    await page.fill('input[name="confirmPassword"]', userAPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

    // Utwórz plan
    await page.click('a:has-text("Create New Plan")');
    await page.fill('input[name="destination"]', 'Paris, France');
    await page.fill('input[name="startDate"]', '2025-10-01');
    await page.fill('input[name="endDate"]', '2025-10-05');
    await page.fill('textarea[name="description"]', 'Romantic getaway');
    await page.click('button:has-text("Generate with AI")');

    // Poczekaj na AI generation
    await expect(page).toHaveURL(/\/trips\/[a-z0-9-]+$/, { timeout: 120000 });

    // Zapisz ID planu User A
    const url = page.url();
    userAPlanId = url.split('/trips/')[1];
    console.log(`[TEST] User A Plan ID: ${userAPlanId}`);

    // Weryfikuj że plan jest widoczny
    await expect(page.locator('text=Paris, France')).toBeVisible();
  });

  test('User B cannot access User A plan', async ({ page }) => {
    // Zarejestruj User B
    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', userBEmail);
    await page.fill('input[name="password"]', userBPassword);
    await page.fill('input[name="confirmPassword"]', userBPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

    // Weryfikuj pusty dashboard (User B nie ma planów)
    await expect(page.locator('text=You don\'t have any plans yet')).toBeVisible();

    // Próba dostępu do planu User A przez bezpośredni URL
    await page.goto(`/trips/${userAPlanId}`);

    // RLS powinien zablokować dostęp
    // Oczekiwany rezultat: 404 lub "No access" message lub redirect do /trips

    // Opcja 1: Redirect do dashboardu
    await expect(page).toHaveURL(/\/trips$/, { timeout: 5000 });

    // Opcja 2: Error message
    // await expect(page.locator('text=You don\'t have access')).toBeVisible();

    // Opcja 3: 404 page
    // await expect(page.locator('text=Not Found')).toBeVisible();

    // Weryfikuj że plan User A NIE jest widoczny
    await expect(page.locator('text=Paris, France')).not.toBeVisible();

    console.log('[TEST] ✅ RLS correctly blocked access to User A plan');
  });

  test('User A can still access their own plan', async ({ page }) => {
    // Zaloguj jako User A
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', userAEmail);
    await page.fill('input[name="password"]', userAPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

    // Dostęp do swojego planu powinien działać
    await page.goto(`/trips/${userAPlanId}`);
    await expect(page).toHaveURL(new RegExp(`/trips/${userAPlanId}`));
    await expect(page.locator('text=Paris, France')).toBeVisible();

    console.log('[TEST] ✅ User A can still access their own plan');
  });

});
```

---

### 4.4 Test E2E #4: Form Validation

**Plik:** `tests/e2e/form-validation.spec.ts`

**Opis:** Test walidacji formularzy (email format, password length, required fields).

**Kod testu:**

```typescript
// tests/e2e/form-validation.spec.ts

import { test, expect } from '@playwright/test';

/**
 * TEST E2E #4: Form Validation
 *
 * Weryfikuje walidację client-side dla formularzy rejestracji, logowania i tworzenia planu.
 *
 * Czas wykonania: ~1 minuta
 */

test.describe('Form Validation', () => {

  test.describe('Signup Form Validation', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/signup');
    });

    test('shows error for invalid email format', async ({ page }) => {
      await page.fill('input[name="email"]', 'notanemail');
      await page.fill('input[name="password"]', 'Test1234');
      await page.fill('input[name="confirmPassword"]', 'Test1234');
      await page.click('button[type="submit"]');

      // Weryfikuj error message
      await expect(page.locator('text=Nieprawidłowy format email, text=Invalid email format')).toBeVisible();
    });

    test('shows error for password too short', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', 'short');
      await page.fill('input[name="confirmPassword"]', 'short');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=8 znaków, text=8 characters')).toBeVisible();
    });

    test('shows error for password mismatch', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="confirmPassword"]', 'Different123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=nie pasują, text=do not match')).toBeVisible();
    });

    test('submit button disabled when fields empty', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');

      // Przycisk powinien być disabled gdy pola puste
      await expect(submitButton).toBeDisabled();

      // Po wypełnieniu wszystkich pól powinien być enabled
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', 'Password123');
      await page.fill('input[name="confirmPassword"]', 'Password123');

      await expect(submitButton).toBeEnabled();
    });

  });

  test.describe('Login Form Validation', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
    });

    test('shows error for empty email', async ({ page }) => {
      await page.fill('input[name="password"]', 'Password123');
      await page.click('button[type="submit"]');

      // HTML5 validation powinien zablokować submit
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('required');
    });

  });

  test.describe('Create Plan Form Validation', () => {

    test.beforeEach(async ({ page }) => {
      // Najpierw zaloguj się
      const testEmail = `test-validation-${Date.now()}@test.com`;
      await page.goto('/auth/signup');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'Test1234');
      await page.fill('input[name="confirmPassword"]', 'Test1234');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

      // Otwórz formularz tworzenia planu
      await page.click('a:has-text("Create New Plan")');
    });

    test('required fields are marked with asterisk', async ({ page }) => {
      // Weryfikuj obecność asterisków przy wymaganych polach
      await expect(page.locator('label:has-text("*")')).toHaveCount(3); // destination, start_date, end_date
    });

    test('submit button disabled when required fields empty', async ({ page }) => {
      const submitButton = page.locator('button:has-text("Generate with AI")');

      // Przycisk powinien być disabled
      await expect(submitButton).toBeDisabled();

      // Po wypełnieniu wymaganych pól powinien być enabled
      await page.fill('input[name="destination"]', 'Paris');
      await page.fill('input[name="startDate"]', '2025-12-01');
      await page.fill('input[name="endDate"]', '2025-12-05');

      await expect(submitButton).toBeEnabled();
    });

    test('end date must be after start date', async ({ page }) => {
      await page.fill('input[name="destination"]', 'Paris');
      await page.fill('input[name="startDate"]', '2025-12-10');
      await page.fill('input[name="endDate"]', '2025-12-05'); // Wcześniejsza niż start

      // HTML5 validation lub custom validation powinien wykryć błąd
      // (to wymaga implementacji custom validation w komponencie)
    });

  });

});
```

---

### 4.5 Testy manualne

#### 4.5.1 Checklist: Autentykacja (6 test cases)

| ID | Test Case | Kroki | Oczekiwany rezultat | Status |
|----|-----------|-------|---------------------|--------|
| **MT-001** | Rejestracja z poprawnymi danymi | 1. Wejdź `/auth/signup`<br>2. Email: `test@test.com`<br>3. Hasło: `Test1234!`<br>4. Potwierdź hasło<br>5. Submit | ✅ Konto utworzone<br>✅ Auto-login<br>✅ Redirect `/trips` | [ ] |
| **MT-002** | Rejestracja z istniejącym emailem | 1. Użyj email z MT-001<br>2. Submit | ❌ Błąd: "Email już zarejestrowany" | [ ] |
| **MT-003** | Logowanie z poprawnymi danymi | 1. Wejdź `/auth/login`<br>2. Wpisz credentials<br>3. Submit | ✅ Zalogowany<br>✅ Redirect `/trips` | [ ] |
| **MT-004** | Logowanie z błędnym hasłem | 1. Email poprawny<br>2. Hasło błędne<br>3. Submit | ❌ Błąd: "Nieprawidłowy email lub hasło" | [ ] |
| **MT-005** | Wylogowanie | 1. Kliknij avatar<br>2. "Wyloguj się" | ✅ Redirect `/auth/login`<br>✅ Brak dostępu do `/trips` | [ ] |
| **MT-006** | Redirect po logowaniu | 1. Wejdź `/trips/new` (niezalogowany)<br>2. Redirect do login<br>3. Zaloguj się | ✅ Powrót do `/trips/new` | [ ] |

#### 4.5.2 Checklist: CRUD Operations (6 test cases)

| ID | Test Case | Kroki | Oczekiwany rezultat | Status |
|----|-----------|-------|---------------------|--------|
| **MT-007** | Utworzenie planu bez AI | 1. `/trips/new`<br>2. Wypełnij formularz<br>3. Submit (bez AI) | ✅ Plan zapisany<br>✅ Redirect do szczegółów | [ ] |
| **MT-008** | Generowanie planu przez AI | 1. Wypełnij formularz<br>2. "Generate with AI" | ✅ Loading state<br>✅ Plan wygenerowany (30-90s)<br>✅ AI content widoczny | [ ] |
| **MT-009** | Lista planów | 1. Wejdź `/trips` | ✅ Wszystkie plany użytkownika widoczne<br>✅ Status "completed" | [ ] |
| **MT-010** | Szczegóły planu | 1. Kliknij plan | ✅ Destination, daty, description<br>✅ AI-generated content<br>✅ Przyciski Edit/Delete | [ ] |
| **MT-011** | Edycja planu | 1. Edit<br>2. Zmień destination<br>3. Save | ✅ Zmiany zapisane<br>✅ Redirect do szczegółów | [ ] |
| **MT-012** | Usunięcie planu | 1. Delete<br>2. Potwierdź modal | ✅ Plan usunięty<br>✅ Redirect `/trips`<br>✅ Plan zniknął z listy | [ ] |

#### 4.5.3 Checklist: UI/UX (5 test cases)

| ID | Test Case | Oczekiwany rezultat | Status |
|----|-----------|---------------------|--------|
| **MT-013** | Responsywność mobile (375px) | ✅ Layout nie przerywa się<br>✅ Formularz użyteczny<br>✅ Nawigacja działa | [ ] |
| **MT-014** | Loading states | ✅ Spinner podczas AI generation<br>✅ Disabled inputs podczas submit<br>✅ Tekst "Loading..." | [ ] |
| **MT-015** | Error alerts | ✅ Czerwony alert dla błędów<br>✅ Zielony dla sukcesu<br>✅ Możliwość zamknięcia (dismissible) | [ ] |
| **MT-016** | Empty states | ✅ "No plans yet" dla nowego użytkownika<br>✅ Przycisk "Create first plan" | [ ] |
| **MT-017** | Navigation consistency | ✅ Logo przekierowuje do `/`<br>✅ "My Plans" do `/trips`<br>✅ User menu widoczny | [ ] |

#### 4.5.4 Checklist: Accessibility WCAG 2.1 Level AA (5 test cases)

| ID | Test Case | Narzędzie | Oczekiwany rezultat | Status |
|----|-----------|-----------|---------------------|--------|
| **MT-018** | Keyboard navigation | Manualne | ✅ Tab przez wszystkie inputy<br>✅ Enter submits form<br>✅ Esc zamyka modals | [ ] |
| **MT-019** | Screen reader compatibility | NVDA/JAWS | ✅ Labels odczytywane<br>✅ Errors ogłaszane<br>✅ Role ARIA poprawne | [ ] |
| **MT-020** | Color contrast | WAVE/Lighthouse | ✅ Minimum 4.5:1 dla tekstu<br>✅ Brak błędów kontrastu | [ ] |
| **MT-021** | Focus indicators | Manualne | ✅ Widoczny focus ring<br>✅ Nie usuwany przez CSS | [ ] |
| **MT-022** | Alt text dla obrazów | Lighthouse | ✅ Wszystkie obrazy mają alt<br>✅ Ikony mają aria-label | [ ] |

#### 4.5.5 Checklist: Cross-browser Testing (4 browsers)

| Browser | Wersja | Signup/Login | CRUD | AI Generation | Status |
|---------|--------|--------------|------|---------------|--------|
| **Chrome** | Latest | [ ] | [ ] | [ ] | [ ] |
| **Firefox** | Latest | [ ] | [ ] | [ ] | [ ] |
| **Safari** | Latest | [ ] | [ ] | [ ] | [ ] |
| **Edge** | Latest | [ ] | [ ] | [ ] | [ ] |

---

### 4.6 Testy bezpieczeństwa

#### Security Checklist (9 items)

| ID | Security Test | Metoda weryfikacji | Oczekiwany rezultat | Status |
|----|---------------|-------------------|---------------------|--------|
| **SEC-001** | RLS enabled for `trips` table | SQL Query: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename='trips'` | ✅ `rowsecurity = true` | [ ] |
| **SEC-002** | RLS policies exist | SQL Query: `SELECT * FROM pg_policies WHERE tablename='trips'` | ✅ 4 policies (SELECT, INSERT, UPDATE, DELETE) | [ ] |
| **SEC-003** | Passwords hashed (bcrypt) | Supabase Dashboard: Auth → Users → Password field | ✅ Hash widoczny (nie plaintext) | [ ] |
| **SEC-004** | JWT tokens secure | Browser DevTools → Application → Local Storage | ✅ Token encrypted<br>✅ Expiry < 1h | [ ] |
| **SEC-005** | XSS protection | Wpisz `<script>alert('XSS')</script>` w description | ❌ Script NIE wykonany<br>✅ Text escaped | [ ] |
| **SEC-006** | SQL injection protection | Wpisz `'; DROP TABLE trips; --` w destination | ❌ Query NIE wykonany<br>✅ Supabase parameterized queries | [ ] |
| **SEC-007** | HTTPS enforced (production) | Sprawdź URL produkcyjny | ✅ `https://` wymuszony<br>❌ Brak `http://` | [ ] |
| **SEC-008** | Environment variables secure | Sprawdź `.env` w `.gitignore` | ✅ `.env` nie commitowany<br>✅ Secrets w Vercel Env Vars | [ ] |
| **SEC-009** | CORS properly configured | DevTools → Network → Sprawdź headers | ✅ CORS headers poprawne<br>✅ Origin restricted | [ ] |

**Narzędzia opcjonalne:**
- **OWASP ZAP** - automatyczne skanowanie vulnerabilities
- **Burp Suite** - manual penetration testing
- **npm audit** - sprawdzenie dependencies vulnerabilities

**Kryteria akceptacji Security Tests:**
- ✅ Wszystkie 9 checkpointów PASS
- ✅ Brak vulnerabilities P0-Critical
- ✅ RLS policies działają poprawnie (SEC-001, SEC-002)
- ✅ XSS i SQL injection zablokowane (SEC-005, SEC-006)

---

## 5. Środowisko testowe

### 5.1 Konfiguracja lokalna

#### 5.1.1 Wymagania systemowe

| Komponent | Wersja minimalna | Wersja zalecana |
|-----------|------------------|-----------------|
| **Node.js** | 20.x | 20.11.0+ (LTS) |
| **npm** | 10.x | 10.2.0+ |
| **Git** | 2.x | Latest |
| **Browsers** | - | Chrome, Firefox, Safari (latest) |

#### 5.1.2 Instalacja środowiska testowego

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/your-org/vibetravels.git
cd vibetravels/10x-astro-starter

# 2. Zainstaluj dependencies
npm install

# 3. Zainstaluj Playwright browsers
npx playwright install --with-deps

# 4. Skopiuj .env.example do .env.local
cp .env.example .env.local

# 5. Uzupełnij zmienne środowiskowe w .env.local
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_KEY=your-anon-key
# OPENAI_API_KEY=your-api-key

# 6. Uruchom Supabase lokalnie (opcjonalnie)
npx supabase start

# 7. Uruchom aplikację
npm run dev
# Aplikacja dostępna na http://localhost:4321
```

#### 5.1.3 Uruchomienie testów lokalnie

```bash
# Uruchom wszystkie testy E2E (headless)
npm run test:e2e

# Uruchom testy E2E z UI (Playwright UI Mode)
npm run test:e2e:ui

# Uruchom testy E2E w trybie debug
npm run test:e2e:debug

# Uruchom konkretny test
npx playwright test tests/e2e/complete-user-journey.spec.ts

# Uruchom testy z konkretnym browserem
npx playwright test --project=chromium
npx playwright test --project=firefox

# Wygeneruj raport HTML
npx playwright show-report
```

### 5.2 Konfiguracja CI/CD (GitHub Actions)

#### 5.2.1 Environment variables w GitHub Secrets

W repozytorium GitHub → Settings → Secrets and variables → Actions, dodaj:

| Secret Name | Opis | Przykładowa wartość |
|-------------|------|---------------------|
| `SUPABASE_URL` | URL Supabase project | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR...` |
| `OPENAI_API_KEY` | OpenAI API key (lub OpenRouter) | `sk-...` |
| `VERCEL_TOKEN` | Token do deploymentu (opcjonalnie) | `vercel_token_xxx` |

#### 5.2.2 GitHub Actions Workflow (już utworzony w sekcji 6)

Workflow jest uruchamiany automatycznie na:
- Push do `main` lub `develop`
- Pull Request do `main`

### 5.3 Test Data Management

#### 5.3.1 Strategia danych testowych

**Dla testów E2E:**
- **Email:** Generuj unikalny email dla każdego testu: `test-${Date.now()}@test.com`
- **Hasło:** Używaj stałego hasła testowego: `TestPassword123!`
- **Plany podróży:** Używaj fixtures z przykładowymi danymi

**Fixtures:** `tests/fixtures/test-data.ts`

```typescript
// tests/fixtures/test-data.ts

export const TEST_PLANS = {
  paris: {
    destination: 'Paris, France',
    start_date: '2025-12-01',
    end_date: '2025-12-05',
    description: 'Romantic getaway in the City of Light',
  },
  tokyo: {
    destination: 'Tokyo, Japan',
    start_date: '2025-10-15',
    end_date: '2025-10-22',
    description: 'First time in Japan, interested in culture and food',
  },
  newYork: {
    destination: 'New York, USA',
    start_date: '2025-09-01',
    end_date: '2025-09-07',
    description: 'Business trip with some sightseeing',
  },
};

export const TEST_USERS = {
  validUser: {
    email: 'test-valid@vibetravels.test',
    password: 'ValidPass123!',
  },
  invalidUser: {
    email: 'notanemail',
    password: 'short',
  },
};

export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@vibetravels.test`;
}
```

#### 5.3.2 Cleanup Strategy

**Strategia dla MVP minimum:**
- ❌ **Brak automatycznego cleanup** - użytkownicy testowi pozostają w bazie
- Uzasadnienie: MVP minimum, brak czasu na implementację cleanup API

**Strategia dla produkcji (future enhancement):**
- ✅ Dodać API endpoint `/api/test/cleanup` (tylko dla test environment)
- ✅ Automatyczne usuwanie użytkowników testowych starszych niż 24h
- ✅ Używać dedykowanej bazy testowej (nie produkcyjnej)

#### 5.3.3 Environment Variables dla testów

**Plik:** `.env.test` (lokalny, nie commitowany)

```bash
# .env.test

# Supabase (test environment)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (test API key z limitem)
OPENAI_API_KEY=sk-test-xxx

# Test-specific settings
TEST_USER_PREFIX=playwright-test
TEST_TIMEOUT=120000
PLAYWRIGHT_HEADLESS=true
```

**Uwaga:** `.env.test` powinien być dodany do `.gitignore`

---

## 6. Narzędzia do testowania

### 6.1 Playwright (E2E Tests) - **WYMAGANY**

**Instalacja:**

```bash
npm install -D @playwright/test
npx playwright install --with-deps
```

**Konfiguracja:** `playwright.config.ts`

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla VibeTravels MVP
 *
 * Dokumentacja: https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  // Katalog z testami
  testDir: './tests/e2e',

  // Pełna paralelizacja (każdy test w osobnym worker)
  fullyParallel: true,

  // Wymuszenie lokalnego uruchomienia (nie commit z .only)
  forbidOnly: !!process.env.CI,

  // Retry w CI (na wypadek flakiness)
  retries: process.env.CI ? 2 : 0,

  // Liczba workers
  workers: process.env.CI ? 1 : undefined, // CI: sequential, Local: parallel

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'], // Console output
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Globalne ustawienia dla wszystkich testów
  use: {
    // Base URL aplikacji
    baseURL: process.env.BASE_URL || 'http://localhost:4321',

    // Trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'retain-on-failure',

    // Timeout dla akcji (np. click, fill)
    actionTimeout: 10000,

    // Ignoruj błędy HTTPS w development
    ignoreHTTPSErrors: true,
  },

  // Timeout dla całego testu
  timeout: 180000, // 3 minuty (AI generation może trwać 30-90s)

  // Timeout dla expect
  expect: {
    timeout: 10000,
  },

  // Projekty (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports (opcjonalnie)
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Uruchom dev server przed testami (lokalnie)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minuty na start serwera
  },
});
```

**Scripts w `package.json`:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

### 6.2 Vitest (Unit Tests) - OPCJONALNY

**Instalacja:**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Konfiguracja:** `vitest.config.ts`

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        '*.config.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Setup file:** `tests/setup.ts`

```typescript
// tests/setup.ts

import '@testing-library/jest-dom';

// Mock Supabase client
vi.mock('../src/db/supabase.client', () => ({
  supabaseClient: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));
```

**Scripts w `package.json`:**

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:coverage": "vitest run --coverage"
  }
}
```

---

### 6.3 GitHub Actions (CI/CD Pipeline) - **WYMAGANY**

**Plik:** `.github/workflows/ci.yml`

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline - VibeTravels MVP

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ========================================
  # JOB 1: BUILD AND TEST
  # ========================================
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    timeout-minutes: 15

    env:
      # Environment variables dla testów
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      BASE_URL: http://localhost:4321

    steps:
      # 1. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Setup Node.js
      - name: Setup Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: '10x-astro-starter/package-lock.json'

      # 3. Install dependencies
      - name: Install dependencies
        working-directory: ./10x-astro-starter
        run: npm ci

      # 4. TypeScript type checking
      - name: TypeScript type check
        working-directory: ./10x-astro-starter
        run: npm run type-check

      # 5. Build application
      - name: Build application
        working-directory: ./10x-astro-starter
        run: npm run build

      # 6. Install Playwright browsers
      - name: Install Playwright browsers
        working-directory: ./10x-astro-starter
        run: npx playwright install --with-deps chromium

      # 7. Run E2E tests
      - name: Run Playwright E2E tests
        working-directory: ./10x-astro-starter
        run: npm run test:e2e -- --project=chromium

      # 8. Upload test results (on failure)
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: 10x-astro-starter/playwright-report/
          retention-days: 7

      # 9. Upload test screenshots/videos (on failure)
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: 10x-astro-starter/test-results/
          retention-days: 7

      # 10. Comment PR with test results (opcjonalnie)
      - name: Comment PR with test results
        if: github.event_name == 'pull_request' && always()
        uses: daun/playwright-report-comment@v3
        with:
          report-path: 10x-astro-starter/playwright-report

  # ========================================
  # JOB 2: DEPLOY (only on main branch)
  # ========================================
  deploy:
    name: Deploy to Vercel
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./10x-astro-starter
          vercel-args: '--prod'
```

**Wymagane GitHub Secrets:**
1. `SUPABASE_URL` - URL Supabase project
2. `SUPABASE_KEY` - Supabase anon key
3. `OPENAI_API_KEY` - OpenAI API key
4. `VERCEL_TOKEN` - Token Vercel (opcjonalnie, do deploymentu)
5. `VERCEL_ORG_ID` - Vercel Organization ID (opcjonalnie)
6. `VERCEL_PROJECT_ID` - Vercel Project ID (opcjonalnie)

**Kryteria sukcesu CI/CD:**
- ✅ Build przechodzi bez błędów
- ✅ TypeScript type-check przechodzi
- ✅ Minimum 1 test E2E przechodzi
- ✅ Brak błędów P0-Critical
- ✅ Pipeline wykonuje się < 15 minut

---

### 6.4 Manual Testing Tools

| Narzędzie | Cel | Link |
|-----------|-----|------|
| **Browser DevTools** | Debugging, Network inspection | Built-in |
| **Lighthouse** | Performance, Accessibility, SEO | Chrome DevTools |
| **WAVE** | Accessibility testing | https://wave.webaim.org/ |
| **axe DevTools** | Accessibility testing | Chrome Extension |
| **React DevTools** | React component inspection | Chrome/Firefox Extension |
| **Responsively** | Multi-device testing | https://responsively.app/ |

**Lighthouse checklist:**
- ✅ Performance score > 80
- ✅ Accessibility score > 90
- ✅ Best Practices score > 90
- ✅ SEO score > 80

---

## 7. Harmonogram testów

### 7.1 Timeline dla Tygodnia 2 (Dni 8-14)

**Założenia:**
- Tydzień 1 (Dni 1-7): Implementacja auth + CRUD + AI
- Tydzień 2 (Dni 8-14): Testy + bugfixing + deploy

| Dzień | Zadania | Czas | Deliverables | Priorytet |
|-------|---------|------|--------------|-----------|
| **Dzień 8** | **Setup Playwright + Test E2E #1** | **6-8h** | | **P0** |
| | - Instalacja Playwright + konfiguracja | 1-2h | `playwright.config.ts` | P0 |
| | - Implementacja `complete-user-journey.spec.ts` | 4-5h | Test E2E #1 | P0 |
| | - Pierwsze uruchomienie i debugowanie | 1h | Test działa lokalnie | P0 |
| **Dzień 9** | **Stabilizacja Test E2E #1 + CI/CD** | **6-8h** | | **P0** |
| | - Fixing flakiness (wait strategies, selectors) | 2-3h | Test stabilny < 5% failure | P0 |
| | - Setup GitHub Actions workflow | 2h | `.github/workflows/ci.yml` | P0 |
| | - Konfiguracja secrets w GitHub | 1h | Secrets dodane | P0 |
| | - Test E2E działa w CI/CD | 2h | Pipeline green ✅ | P0 |
| **Dzień 10** | **Testy E2E #2-4** | **4-6h** | | **P1** |
| | - Test E2E #2: Protected Routes | 1-2h | `protected-routes.spec.ts` | P1 |
| | - Test E2E #3: Data Isolation (RLS) | 2-3h | `data-isolation-rls.spec.ts` | P1 |
| | - Test E2E #4: Form Validation | 1h | `form-validation.spec.ts` | P1 |
| **Dzień 11** | **Integration Tests (opcjonalnie)** | **4-6h** | | **P1** |
| | - Test integracji AI API | 2-3h | `tests/integration/ai-api.test.ts` | P1 |
| | - Test integracji Supabase CRUD | 2-3h | `tests/integration/supabase.test.ts` | P1 |
| **Dzień 12** | **Testy manualne + Security** | **6-8h** | | **P0** |
| | - Checklist autentykacji (6 test cases) | 1-2h | MT-001 to MT-006 ✅ | P0 |
| | - Checklist CRUD (6 test cases) | 1-2h | MT-007 to MT-012 ✅ | P0 |
| | - Checklist UI/UX (5 test cases) | 1h | MT-013 to MT-017 ✅ | P1 |
| | - Security checklist (9 items) | 2-3h | SEC-001 to SEC-009 ✅ | P0 |
| | - Cross-browser testing | 1h | Chrome, Firefox, Safari ✅ | P1 |
| **Dzień 13** | **Bugfixing + Regression Testing** | **4-6h** | | **P0** |
| | - Analiza błędów z testów | 1h | Lista bugów | P0 |
| | - Fixing P0-Critical bugs | 2-3h | Bugi naprawione | P0 |
| | - Re-run wszystkich testów E2E | 1h | Regression pass ✅ | P0 |
| | - Verification w CI/CD | 1h | Pipeline green ✅ | P0 |
| **Dzień 14** | **Finalne testy + Dokumentacja** | **4-6h** | | **P0** |
| | - Smoke testing full flow | 1h | Happy path działa | P0 |
| | - Accessibility testing (WAVE, Lighthouse) | 1-2h | A11y checklist ✅ | P1 |
| | - Performance testing (Lighthouse) | 1h | Performance > 80 | P2 |
| | - Dokumentacja wyników testów | 1-2h | `TEST_SUMMARY.md` | P0 |
| | - Final deployment verification | 1h | Production działa | P0 |

**Szacowany czas razem:** 30-42 godzin na pełne testowanie MVP

**Minimalne wymagania do zaliczenia (jeśli brakuje czasu):**
- ✅ Dzień 8-9: Test E2E #1 + CI/CD (12-16h) - **MUST HAVE**
- ✅ Dzień 12: Testy manualne + Security (6-8h) - **MUST HAVE**
- ✅ Dzień 13: Bugfixing P0 (4-6h) - **MUST HAVE**

**Razem minimum:** 22-30 godzin

---

### 7.2 Kamienie milowe (Milestones)

| Milestone | Data | Kryteria akceptacji | Status |
|-----------|------|---------------------|--------|
| **M1: Test E2E #1 działa lokalnie** | Dzień 8 | ✅ Test wykonuje się bez błędów<br>✅ Wszystkie kroki przechodzą<br>✅ Czas < 3 min | [ ] |
| **M2: CI/CD pipeline działa** | Dzień 9 | ✅ GitHub Actions workflow green<br>✅ Test E2E #1 działa w CI | [ ] |
| **M3: Wszystkie testy E2E gotowe** | Dzień 10 | ✅ 4 testy E2E przechodzą<br>✅ Coverage 100% wymagań | [ ] |
| **M4: Testy manualne zakończone** | Dzień 12 | ✅ 22 checkpoints wykonane<br>✅ Security checklist ✅ | [ ] |
| **M5: Zero P0-Critical bugs** | Dzień 13 | ✅ Wszystkie bugi P0 naprawione<br>✅ Regression pass ✅ | [ ] |
| **M6: Gotowy do produkcji** | Dzień 14 | ✅ Dokumentacja gotowa<br>✅ Production deployment OK | [ ] |

---

## 8. Kryteria akceptacji testów

### 8.1 Definicja "PASS" dla testu

#### Dla testów automatycznych (E2E, Unit, Integration):

Test jest **PASS**, gdy:
1. ✅ **Wszystkie asercje (assertions) spełnione** - żaden `expect()` nie failuje
2. ✅ **Brak błędów runtime** - test wykonuje się od początku do końca
3. ✅ **Czas wykonania w limitach** - test < 3 min (dla E2E), < 5 sek (dla unit)
4. ✅ **Stabilność** - test przechodzi minimum 19/20 uruchomień (< 5% flakiness rate)
5. ✅ **CI/CD green** - test przechodzi w GitHub Actions

#### Dla testów manualnych:

Test jest **PASS**, gdy:
1. ✅ **Wszystkie kroki wykonane** zgodnie z instrukcją
2. ✅ **Rezultat zgodny z oczekiwaniami** opisanymi w test case
3. ✅ **Brak defektów P0-Critical** wykrytych podczas testu
4. ✅ **Dokumentacja** - screenshots/video dla błędów (jeśli są)

---

### 8.2 Minimalne wymagania do zaliczenia projektu

Projekt jest **gotowy do zaliczenia**, gdy:

#### ✅ Wymagania P0 (MUST HAVE):

1. **Test E2E #1 (Complete User Journey) działa**
   - ✅ Test przechodzi lokalnie
   - ✅ Test przechodzi w CI/CD (GitHub Actions)
   - ✅ Weryfikuje 100% user stories (US-001 do US-010)
   - ✅ Stabilny (< 5% flakiness)

2. **Testy manualne wykonane**
   - ✅ Checklist autentykacji (6/6) ✅
   - ✅ Checklist CRUD (6/6) ✅
   - ✅ Brak błędów P0-Critical

3. **Security checklist zweryfikowany**
   - ✅ RLS enabled + policies działają (9/9) ✅
   - ✅ XSS i SQL injection zablokowane
   - ✅ Passwords hashed (bcrypt)

4. **CI/CD pipeline działa**
   - ✅ GitHub Actions workflow green
   - ✅ Build + TypeScript check + Tests

5. **Brak błędów P0-Critical**
   - ❌ Zero błędów blokujących
   - ⚠️ Błędy P1-Major mogą być akceptowane (z dokumentacją)

#### ⚠️ Wymagania P1 (Important, ale nie blokujące):

- Testy E2E #2-4 przechodzą
- Testy integracji AI działają
- Cross-browser testing wykonany
- Accessibility checklist (5/5) ✅

#### ❌ Wymagania P2 (Nice to have, opcjonalne):

- Unit tests
- Performance testing (Lighthouse > 80)
- Integration tests
- Wszystkie browsers (Chrome, Firefox, Safari, Edge)

---

### 8.3 Kryteria sukcesu dla każdego typu testu

| Typ testu | Kryteria PASS | Acceptable Failure Rate |
|-----------|---------------|-------------------------|
| **E2E Tests** | ✅ Wszystkie asercje spełnione<br>✅ Czas < 3 min<br>✅ Działa w CI/CD | < 5% (1/20 failures OK) |
| **Unit Tests** | ✅ Wszystkie asercje spełnione<br>✅ Czas < 5 sek<br>✅ Coverage > 70% | 0% (zero failures) |
| **Integration Tests** | ✅ API responses poprawne<br>✅ Database state consistent<br>✅ Error handling works | < 5% |
| **Manual Tests** | ✅ Wszystkie kroki wykonane<br>✅ Rezultat zgodny z oczekiwaniami<br>✅ Brak P0 bugs | N/A (manual) |
| **Security Tests** | ✅ Wszystkie checkpoints PASS<br>✅ Zero vulnerabilities P0-Critical<br>✅ RLS policies work | 0% (zero failures) |

---

### 8.4 Flakiness Rate & Test Execution Time

**Flakiness Rate:**
- ✅ **Akceptowalne:** < 5% failure rate (test może failnąć max 1/20 uruchomień)
- ⚠️ **Ostrzeżenie:** 5-10% failure rate (wymaga investigation)
- ❌ **Nieakceptowalne:** > 10% failure rate (test musi być naprawiony)

**Strategie redukcji flakiness:**
1. Używaj explicit waits zamiast `waitForTimeout()`
2. Używaj stabilnych selektorów (data-testid, aria-labels)
3. Unikaj hard-coded timeouts
4. Izoluj testy (każdy test niezależny)
5. Cleanup after each test

**Test Execution Time:**
- ✅ **E2E test:** < 3 minuty (w tym 30-90s na AI generation)
- ✅ **Unit test:** < 5 sekund
- ✅ **Integration test:** < 30 sekund
- ✅ **Full suite E2E (4 tests):** < 10 minut

**Timeout configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 180000, // 3 min dla całego testu
  expect: {
    timeout: 10000, // 10 sek dla expect()
  },
  use: {
    actionTimeout: 10000, // 10 sek dla click, fill, etc.
  },
});
```

---

## 9. Role i odpowiedzialności

### 9.1 Role w procesie testowania

| Rola | Odpowiedzialności | Osoba |
|------|-------------------|-------|
| **QA Engineer** | - Implementacja testów automatycznych<br>- Wykonanie testów manualnych<br>- Raportowanie błędów<br>- Weryfikacja fixów | [Imię] |
| **Developer** | - Code review testów<br>- Bugfixing P0-P1<br>- Współpraca z QA przy flaky tests<br>- Implementacja testability features | [Imię] |
| **Tech Lead** | - Akceptacja planu testów<br>- Review test coverage<br>- Decyzje o priorytetach<br>- Approval do deploy | [Imię] |
| **Product Owner** | - Akceptacja kryteriów testowych<br>- Priorytetyzacja bugów<br>- Final approval MVP | [Imię] |
| **CI/CD Engineer** | - Setup GitHub Actions<br>- Konfiguracja test environment<br>- Monitoring pipeline | [Imię] |

### 9.2 Workflow testowania

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKFLOW TESTOWANIA                       │
└─────────────────────────────────────────────────────────────────┘

1. QA Engineer implementuje testy (E2E, manual)
   ↓
2. Developer robi code review testów
   ↓
3. QA uruchamia testy lokalnie
   ↓
4. QA commituje testy do repo
   ↓
5. CI/CD automatycznie uruchamia testy
   ↓
6a. Testy PASS → OK, kontynuuj
│
6b. Testy FAIL → QA raportuje błędy
   ↓
7. Developer fixuje błędy (P0-P1)
   ↓
8. QA weryfikuje fixy (regression testing)
   ↓
9. Tech Lead akceptuje test coverage
   ↓
10. Product Owner akceptuje MVP
   ↓
11. Deploy do produkcji ✅
```

### 9.3 Communication Channels

| Kanał | Użycie | Frequency |
|-------|--------|-----------|
| **Daily Standup** | Status testów, blockers | Codziennie 10:00 |
| **Slack #testing** | Bug reports, quick questions | Realtime |
| **GitHub Issues** | Bug tracking, formal reports | Per bug |
| **Test Report Email** | Weekly summary | Piątek EOD |
| **Retrospective** | Lessons learned | Po zakończeniu testów |

---

## 10. Procedury raportowania błędów

### 10.1 Bug Severity Classification

| Severity | Opis | Przykłady | SLA Fix |
|----------|------|-----------|---------|
| **P0 (Critical)** | Blokuje zaliczenie projektu.<br>Podstawowa funkcjonalność nie działa. | - Nie można się zarejestrować<br>- AI generation zawsze failuje<br>- RLS nie działa (data leak) | **24h** |
| **P1 (Major)** | Ważna funkcjonalność nie działa.<br>Możliwe workaround. | - Edycja planu nie zapisuje zmian<br>- Loading state nie wyświetla się<br>- Form validation nie działa | **48h** |
| **P2 (Minor)** | Drobne problemy UX/UI.<br>Nie wpływa na core functionality. | - Błędny alignment przycisku<br>- Typo w tekście<br>- Brak spacji w komunikacie | **1 tydzień** |
| **P3 (Trivial)** | Kosmetyczne problemy.<br>Nie wpływa na użytkownika. | - Komentarz w kodzie<br>- Console.log nie usunięte<br>- Code formatting | **Backlog** |

---

### 10.2 Bug Report Template

**Tytuł:** `[SEVERITY] Krótki opis błędu (max 60 znaków)`

**Przykład:** `[P0] User cannot signup - Supabase error 500`

**Opis:**

```markdown
## 🐛 Opis błędu

Krótki opis co nie działa.

## 📋 Kroki reprodukcji

1. Wejdź na `/auth/signup`
2. Wypełnij formularz: email `test@test.com`, hasło `Test1234!`
3. Kliknij "Utwórz konto"
4. Observe error

## ✅ Oczekiwany rezultat

Użytkownik powinien być zarejestrowany i automatycznie zalogowany.

## ❌ Aktualny rezultat

Error alert: "Failed to create account. Error 500."

## 🖼️ Screenshots/Video

[Attach screenshot lub link do Loom video]

## 🌍 Środowisko

- **Browser:** Chrome 120.0.6099.109
- **OS:** Windows 11
- **Environment:** Local development (localhost:4321)
- **User:** test-1234567890@test.com

## 📊 Console Errors

```
POST http://127.0.0.1:54321/auth/v1/signup 500 (Internal Server Error)
Error: Failed to create account
    at SignupForm.tsx:87
```

## 🔍 Dodatkowe informacje

- Błąd występuje tylko dla emaili z domeną `@test.com`
- Supabase logs pokazują: "Email domain blacklisted"
- Workaround: Użyj innej domeny (np. `@example.com`)

## 🏷️ Labels

- Severity: `P0-Critical`
- Component: `Auth / Signup`
- Assigned to: `@developer-name`
```

---

### 10.3 Test Execution Reports (Playwright HTML)

Playwright automatycznie generuje HTML report:

```bash
# Po uruchomieniu testów
npx playwright show-report
```

Report zawiera:
- ✅ Lista wszystkich testów (pass/fail)
- ⏱️ Czas wykonania każdego testu
- 📸 Screenshots i videos (dla failed tests)
- 📊 Trace viewer (krok po kroku)
- 🔍 Error messages i stack traces

**Lokalizacja:** `playwright-report/index.html`

**Udostępnianie:**
- Lokalnie: Otwórz w przeglądarce
- CI/CD: Artifacts w GitHub Actions (retention 7 dni)

---

### 10.4 CI/CD Artifacts (GitHub Actions)

Po każdym uruchomieniu pipeline w GitHub Actions:

1. **Playwright Report** - HTML report z wynikami testów
   - Lokalizacja: Actions → Workflow run → Artifacts → `playwright-report`
   - Retention: 7 dni

2. **Test Results** - Screenshots, videos, traces (only on failure)
   - Lokalizacja: Actions → Workflow run → Artifacts → `test-results`
   - Retention: 7 dni

3. **Test Summary** - Markdown summary w PR comment
   - Automatycznie dodawany do Pull Request
   - Zawiera: liczba testów pass/fail, duration, link do artifacts

**Przykład PR comment:**

```markdown
## 🧪 Test Results

✅ **4/4 tests passed** in 8m 32s

| Test Suite | Status | Duration |
|------------|--------|----------|
| complete-user-journey.spec.ts | ✅ PASS | 2m 45s |
| protected-routes.spec.ts | ✅ PASS | 0m 32s |
| data-isolation-rls.spec.ts | ✅ PASS | 3m 18s |
| form-validation.spec.ts | ✅ PASS | 0m 57s |

📊 [View full report](https://github.com/your-org/vibetravels/actions/runs/123456)
```

---

### 10.5 Test Summary Template

**Plik:** `.github/TEST_SUMMARY.md` (tworzone na koniec testów)

```markdown
# Test Summary - VibeTravels MVP

**Data:** 2025-10-24
**Wersja:** MVP 1.0
**Tester:** [Imię]
**Status:** ✅ PASS (gotowy do produkcji)

---

## 📊 Podsumowanie wyników

### Testy automatyczne (E2E)

| Test Suite | Pass | Fail | Duration |
|------------|------|------|----------|
| complete-user-journey.spec.ts | ✅ | - | 2m 45s |
| protected-routes.spec.ts | ✅ | - | 0m 32s |
| data-isolation-rls.spec.ts | ✅ | - | 3m 18s |
| form-validation.spec.ts | ✅ | - | 0m 57s |
| **TOTAL** | **4/4** | **0** | **8m 32s** |

**Coverage wymagań:** 100% (12/12 User Stories)

### Testy manualne

| Kategoria | Checkpoints | Pass | Fail |
|-----------|-------------|------|------|
| Autentykacja | 6 | 6 | 0 |
| CRUD Operations | 6 | 6 | 0 |
| UI/UX | 5 | 5 | 0 |
| Accessibility | 5 | 4 | 1 |
| Cross-browser | 4 | 4 | 0 |
| **TOTAL** | **26** | **25** | **1** |

**Issues:** MT-022 (Alt text) - P2 Minor, nie blokujący

### Testy bezpieczeństwa

| Security Check | Status |
|----------------|--------|
| RLS enabled | ✅ PASS |
| RLS policies | ✅ PASS |
| Passwords hashed | ✅ PASS |
| JWT tokens secure | ✅ PASS |
| XSS protection | ✅ PASS |
| SQL injection protection | ✅ PASS |
| HTTPS enforced (prod) | ✅ PASS |
| Env vars secure | ✅ PASS |
| CORS configured | ✅ PASS |
| **TOTAL** | **9/9 PASS** |

---

## 🐛 Błędy znalezione

### P0 (Critical) - 0 błędów
*Brak błędów P0*

### P1 (Major) - 0 błędów
*Brak błędów P1*

### P2 (Minor) - 1 błąd

**#1: Brak alt text dla niektórych ikon**
- **Severity:** P2
- **Status:** OPEN (backlog)
- **Description:** Ikony w nawigacji nie mają aria-label
- **Impact:** Screen reader users nie wiedzą co oznaczają ikony
- **Workaround:** Można nawigować bez ikon (są labele tekstowe)

### P3 (Trivial) - 2 błędy
*Lista w backlog*

---

## ✅ Kryteria zaliczenia - Checklist

### MUST HAVE (P0)

- [x] Mechanizm kontroli dostępu (signup/login/logout)
- [x] CRUD dla planów podróży (Create, Read, Update, Delete)
- [x] Logika biznesowa AI (generowanie planów)
- [x] Minimum 1 test E2E działa w CI/CD
- [x] Pipeline CI/CD (build + test)
- [x] Row Level Security (RLS) działa
- [x] Brak błędów P0-Critical

### NICE TO HAVE (P1-P2)

- [x] 4 testy E2E przechodzą
- [x] Testy manualne wykonane (26 checkpoints)
- [x] Security checklist (9/9) ✅
- [x] Cross-browser testing (4 browsers)
- [x] Accessibility testing (5/5) ✅
- [ ] Unit tests (opcjonalne, pominięte)
- [ ] Performance testing (backlog)

---

## 📈 Metryki

- **Test Coverage (wymagań):** 100% (12/12 User Stories)
- **Automated Tests:** 4 E2E tests
- **Manual Tests:** 26 checkpoints
- **Total Test Execution Time:** 8m 32s (E2E)
- **Flakiness Rate:** 0% (0/20 failures)
- **CI/CD Success Rate:** 100% (20/20 builds green)

---

## 🎯 Rekomendacje

### Do zrobienia przed produkcją:

1. ✅ **DONE:** Wszystkie wymagania P0 spełnione
2. ⚠️ **MINOR:** Dodać alt text dla ikon (#1) - P2, może być w backlog

### Do zrobienia po MVP (future enhancements):

1. Dodać unit tests dla walidacji (Vitest)
2. Zaimplementować password reset flow (4 komponenty)
3. Dodać performance monitoring (Lighthouse CI)
4. Rozszerzyć E2E tests o edge cases
5. Dodać load testing (k6 lub Artillery)

---

## 🚀 Decyzja końcowa

**Status:** ✅ **APPROVED FOR PRODUCTION**

**Uzasadnienie:**
- Wszystkie wymagania P0 spełnione
- 1 test E2E działa w CI/CD (wymagane do zaliczenia)
- Brak błędów P0-Critical
- Testy manualne + security checklist ✅
- Coverage 100% user stories

**Podpis:**
- QA Engineer: [Imię] - [Data]
- Tech Lead: [Imię] - [Data]
- Product Owner: [Imię] - [Data]
```

---

## 11. Appendix

### 11.1 Glossary (Słowniczek)

| Termin | Definicja |
|--------|-----------|
| **E2E (End-to-End)** | Test weryfikujący cały flow użytkownika od początku do końca |
| **RLS (Row Level Security)** | Mechanizm Supabase filtrujący dane na poziomie bazy (user widzi tylko swoje plany) |
| **Flakiness** | Test który czasami przechodzi, czasami failuje (non-deterministic) |
| **Playwright** | Framework do testów E2E (browser automation) |
| **Vitest** | Framework do unit testów (Vite-native) |
| **CI/CD** | Continuous Integration / Continuous Deployment (GitHub Actions) |
| **MVP** | Minimum Viable Product - minimalna wersja produktu do zaliczenia |
| **P0/P1/P2/P3** | Priorytety testów/bugów (P0 = Critical, P3 = Trivial) |
| **JWT** | JSON Web Token - token używany do autentykacji |
| **Assertion** | Warunek który musi być spełniony (expect() w testach) |
| **Fixture** | Dane testowe używane w testach (test data) |

### 11.2 Useful Links

| Resource | Link |
|----------|------|
| **Playwright Docs** | https://playwright.dev/docs/intro |
| **Supabase Auth Docs** | https://supabase.com/docs/guides/auth |
| **Astro Testing Guide** | https://docs.astro.build/en/guides/testing/ |
| **GitHub Actions Docs** | https://docs.github.com/en/actions |
| **WCAG 2.1 Guidelines** | https://www.w3.org/WAI/WCAG21/quickref/ |
| **OWASP Testing Guide** | https://owasp.org/www-project-web-security-testing-guide/ |

### 11.3 Troubleshooting Guide

#### Problem: Test E2E timeout po 30 sekundach

**Przyczyna:** Domyślny timeout Playwright to 30s, AI generation trwa 30-90s

**Rozwiązanie:**
```typescript
// Zwiększ timeout w playwright.config.ts
export default defineConfig({
  timeout: 180000, // 3 minuty
});

// Lub lokalnie w teście
test('...', async ({ page }) => {
  test.setTimeout(180000); // 3 minuty
});
```

---

#### Problem: Test E2E flaky - czasami przechodzi, czasami failuje

**Przyczyny:**
1. Hard-coded `waitForTimeout()` - czas nie zawsze wystarcza
2. Niestabilne selektory - element zmienia class/id
3. Race conditions - element nie załadowany przed click
4. Network issues - API request timeout

**Rozwiązania:**
```typescript
// ❌ ZŁE: Hard-coded timeout
await page.waitForTimeout(5000);

// ✅ DOBRE: Wait for specific element
await page.waitForSelector('button:has-text("Delete")', { state: 'visible' });

// ✅ DOBRE: Wait for URL change
await expect(page).toHaveURL(/\/trips/, { timeout: 10000 });

// ✅ DOBRE: Wait for network idle
await page.waitForLoadState('networkidle');

// ✅ DOBRE: Stabilne selektory (data-testid)
await page.click('[data-testid="delete-button"]');
```

---

#### Problem: CI/CD test przechodzi lokalnie, ale failuje w GitHub Actions

**Przyczyny:**
1. Brak environment variables (secrets)
2. Różne timings (CI wolniejsze)
3. Headless mode vs headed mode
4. Browser differences

**Rozwiązania:**
```yaml
# .github/workflows/ci.yml

# 1. Dodaj wszystkie secrets
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

# 2. Zwiększ retry count w CI
jobs:
  test:
    steps:
      - run: npx playwright test --retries=2

# 3. Uruchom tylko chromium w CI (szybciej)
      - run: npx playwright test --project=chromium
```

---

#### Problem: Supabase RLS blokuje INSERT/UPDATE mimo że user jest zalogowany

**Przyczyna:** JWT token nie jest przekazywany w request lub policy RLS ma błąd

**Rozwiązanie:**
```typescript
// Sprawdź czy token jest w localStorage
const token = localStorage.getItem('supabase.auth.token');
console.log('Token:', token);

// Sprawdź session w Supabase
const { data: { session } } = await supabaseClient.auth.getSession();
console.log('Session:', session);

// Sprawdź policy RLS w Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'trips';

-- Popraw policy jeśli auth.uid() nie jest ustawiony
ALTER POLICY "Users can insert own trips" ON trips
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

#### Problem: AI generation zawsze failuje z error 401 Unauthorized

**Przyczyna:** Nieprawidłowy API key lub brak API key w environment variables

**Rozwiązanie:**
```bash
# 1. Sprawdź .env.local
cat .env.local | grep OPENAI_API_KEY
# Powinno być: OPENAI_API_KEY=sk-proj-xxx

# 2. Sprawdź czy Astro wczytuje env
console.log(import.meta.env.OPENAI_API_KEY);

# 3. Restartuj dev server (env variables są cache'owane)
npm run dev
```

---

#### Problem: Playwright nie znajduje elementu mimo że jest widoczny

**Przyczyna:** Element ładuje się async lub selector jest nieprawidłowy

**Rozwiązanie:**
```typescript
// ❌ ZŁE: Natychmiastowy click (element może nie być załadowany)
await page.click('button');

// ✅ DOBRE: Explicit wait
await page.waitForSelector('button:has-text("Submit")', { state: 'visible' });
await page.click('button:has-text("Submit")');

// ✅ LEPSZE: Playwright auto-wait (preferowane)
await page.click('button:has-text("Submit")'); // auto-waits do 30s

// ✅ DEBUGOWANIE: Zrób screenshot
await page.screenshot({ path: 'debug.png', fullPage: true });
```

---

### 11.4 Common Playwright Patterns

#### Pattern 1: Login helper (re-use w testach)

```typescript
// tests/helpers/auth.helpers.ts

import { Page } from '@playwright/test';

export async function signupAndLogin(page: Page, email: string, password: string) {
  await page.goto('/auth/signup');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');

  // Wait for auto-login and redirect
  await page.waitForURL(/\/trips/, { timeout: 10000 });
}

export async function logout(page: Page, userInitial: string) {
  await page.locator(`nav button:has-text("${userInitial}")`).click();
  await page.click('button:has-text("Wyloguj"), button:has-text("Logout")');
  await page.waitForURL(/\/auth\/login/);
}

// Użycie w teście
import { signupAndLogin } from './helpers/auth.helpers';

test('user can create plan', async ({ page }) => {
  await signupAndLogin(page, 'test@test.com', 'Pass123!');
  // ... reszta testu
});
```

---

#### Pattern 2: Custom fixtures (shared state)

```typescript
// tests/fixtures/auth.fixture.ts

import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login przed każdym testem
    const email = `test-${Date.now()}@test.com`;
    const password = 'Test1234!';

    await page.goto('/auth/signup');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/trips/);

    // Use: Test ma dostęp do zalogowanej strony
    await use(page);

    // Teardown: Logout po teście (opcjonalnie)
    // ... logout code ...
  },
});

// Użycie w teście
import { test } from './fixtures/auth.fixture';

test('user can create plan', async ({ authenticatedPage }) => {
  // authenticatedPage jest już zalogowana!
  await authenticatedPage.goto('/trips/new');
  // ... reszta testu
});
```

---

#### Pattern 3: Page Object Model (POM)

```typescript
// tests/pages/signup.page.ts

import { Page, expect } from '@playwright/test';

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/signup');
  }

  async fillForm(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.fill('input[name="confirmPassword"]', password);
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async expectSuccessRedirect() {
    await expect(this.page).toHaveURL(/\/trips/, { timeout: 10000 });
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }
}

// Użycie w teście
import { SignupPage } from './pages/signup.page';

test('signup with valid credentials', async ({ page }) => {
  const signupPage = new SignupPage(page);

  await signupPage.goto();
  await signupPage.fillForm('test@test.com', 'Test1234!');
  await signupPage.submit();
  await signupPage.expectSuccessRedirect();
});
```

---

### 11.5 Sample Test Reports

#### Example: GitHub Actions PR Comment

```markdown
## 🧪 E2E Test Results - VibeTravels MVP

✅ **All tests passed!** (4/4)

| Test Suite | Status | Duration | Browser |
|------------|--------|----------|---------|
| Complete User Journey | ✅ PASS | 2m 45s | Chromium |
| Protected Routes | ✅ PASS | 0m 32s | Chromium |
| Data Isolation (RLS) | ✅ PASS | 3m 18s | Chromium |
| Form Validation | ✅ PASS | 0m 57s | Chromium |

**Total Duration:** 8m 32s
**Flakiness Rate:** 0% (0 retries needed)

📊 [View full Playwright report](https://github.com/your-org/vibetravels/actions/runs/123456/artifacts/playwright-report)
📸 [View test artifacts](https://github.com/your-org/vibetravels/actions/runs/123456/artifacts/test-results)

---

✅ **Ready to merge** - All checks passed
```

---

## 🎉 Koniec planu testów

**Status:** ✅ Gotowy do implementacji

**Następne kroki:**
1. Review planu testów z zespołem
2. Akceptacja przez Tech Lead i Product Owner
3. Setup environment (Playwright, GitHub Actions)
4. Implementacja testów według harmonogramu (Dzień 8-14)
5. Raportowanie wyników

**Kontakt:**
- QA Team: qa@vibetravels.com
- Tech Lead: tech@vibetravels.com

**Wersja dokumentu:** 1.0
**Data ostatniej aktualizacji:** 24 października 2025

---

**Legenda priorytetów:**
- ✅ = MUST HAVE (P0) - wymagane do zaliczenia
- ⚠️ = Important (P1) - zalecane
- ❌ = Nice to have (P2) - opcjonalne

**Legenda statusów:**
- [ ] = TODO (do zrobienia)
- [x] = DONE (zrobione)
- ✅ = PASS (test przeszedł)
- ❌ = FAIL (test nie przeszedł)
