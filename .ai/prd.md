# Dokument wymagań produktu (PRD) - VibeTravels
## Wersja Post-Certification (Dalszy Rozwój)

Wersja: 3.0 (Post-Certification Growth)
Data: 24 listopada 2025
Autor: Product Team
Status: Active Development

**🎉 Status projektu:** Certyfikat zdobyty! Projekt przechodzi w fazę dalszego rozwoju i komercjalizacji.

---

## 1. Przegląd produktu

### 1.1 Nazwa produktu
VibeTravels - AI-Powered Travel Planning Platform

### 1.2 Cel projektu
Rozwinięcie funkcjonalnej aplikacji webowej w pełnoprawny produkt komercyjny:
- ✅ **Zrealizowane (Faza Certyfikacji):**
  - Mechanizm kontroli dostępu użytkownika (logowanie/rejestracja)
  - Zarządzanie danymi CRUD (plany podróży)
  - Logika biznesowa z AI (generowanie planów)
  - Testy end-to-end
  - Pipeline CI/CD

- 🚀 **Nowe funkcjonalności (Faza Post-Certification):**
  - Internationalization (i18n) - wsparcie dla wielu języków
  - Ulepszone UX/UI
  - Zaawansowane funkcje AI
  - System premium i monetyzacja
  - Integracje z serwisami zewnętrznymi

### 1.3 Roadmap rozwoju

**Phase 1: Internationalization (Q4 2025) - IN PROGRESS**
- Implementacja Astro i18n
- Wsparcie dla języka polskiego i angielskiego
- Language switcher w UI
- Tłumaczenie AI-generated content

**Phase 2: UX/UI Enhancement (Q1 2026)**
- Responsive design dla wszystkich urządzeń
- Animacje i transitions
- Lepsze loading states i error handling
- Dark mode

**Phase 3: Advanced Features (Q1-Q2 2026)**
- Google OAuth
- Email notifications (Resend)
- PDF export planów podróży
- Współdzielenie planów z innymi użytkownikami
- Rating system dla wygenerowanych planów

**Phase 4: Monetization (Q2 2026)**
- Stripe integration
- System Premium (więcej generacji AI, zaawansowane funkcje)
- Subscription management

**Phase 5: Scale (Q3 2026)**
- Analytics i metryki
- A/B testing
- Performance optimization
- SEO improvements

---

## 2. Problem użytkownika (uproszczony)

### 2.1 Problem
Planowanie wycieczek jest czasochłonne i wymaga zbierania informacji z wielu źródeł.

### 2.2 Rozwiązanie
Aplikacja pozwala użytkownikom wygenerować podstawowy plan podróży używając AI, zapisać go i zarządzać swoimi planami.

---

## 3. Wymagania funkcjonalne (MINIMUM)

### 3.1 Autentykacja (Kontrola dostępu - WYMAGANE)

**FR-001: Rejestracja użytkownika**
- System umożliwia rejestrację poprzez email i hasło
- System waliduje format email i siłę hasła (min. 8 znaków)
- System zapisuje użytkownika w bazie danych Supabase
- Po rejestracji użytkownik jest automatycznie zalogowany

**FR-002: Logowanie użytkownika**
- System umożliwia logowanie przez email i hasło
- System weryfikuje credentials w Supabase
- Po poprawnym logowaniu użytkownik jest przekierowywany do dashboardu
- Sesja użytkownika jest zapamiętywana

**FR-003: Wylogowanie**
- System umożliwia wylogowanie (przycisk "Logout")
- Po wylogowaniu użytkownik jest przekierowywany do strony logowania

### 3.2 CRUD dla planów podróży (WYMAGANE)

**FR-004: CREATE - Tworzenie nowego planu**
- Zalogowany użytkownik może utworzyć nowy plan podróży
- Formularz zawiera pola:
  - Destination (text, wymagane)
  - Start Date (date, wymagane)
  - End Date (date, wymagane)
  - Description (textarea, opcjonalne)
- Przycisk "Generate with AI" uruchamia generowanie przez AI
- System zapisuje plan w bazie danych powiązany z użytkownikiem

**FR-005: READ - Przeglądanie listy planów**
- Zalogowany użytkownik widzi listę swoich planów
- Lista wyświetla: destination, daty, status (generating/completed)
- Użytkownik może kliknąć plan, aby zobaczyć szczegóły

**FR-006: READ - Szczegóły planu**
- System wyświetla pełne szczegóły wybranego planu
- Szczegóły zawierają: destination, daty, description, AI-generated content
- Widoczne są przyciski: "Edit", "Delete"

**FR-007: UPDATE - Edycja planu**
- Użytkownik może edytować podstawowe dane planu
- Edytowalne pola: destination, start_date, end_date, description
- Przycisk "Save" zapisuje zmiany w bazie bez wpływu na AI content
- Przycisk "Regenerate AI Content" pozwala wygenerować nową treść AI z zaktualizowanymi parametrami

**FR-008: DELETE - Usuwanie planu**
- Użytkownik może usunąć swój plan
- System wyświetla modal potwierdzający "Are you sure?"
- Po potwierdzeniu plan jest usuwany z bazy (hard delete dla uproszczenia)
- Użytkownik jest przekierowywany do listy planów

### 3.3 Logika biznesowa - AI (WYMAGANE)

**FR-009: Generowanie planu przez AI**
- System wysyła request do OpenRouter.ai (lub bezpośrednio OpenAI)
- Request zawiera: destination, start_date, end_date, description
- AI generuje prosty plan podróży (dzień po dniu)
- System parsuje odpowiedź i zapisuje w bazie jako część planu
- Status planu zmienia się z "generating" na "completed"

**FR-010: Wyświetlanie AI-generated content**
- Wygenerowana treść jest wyświetlana w szczegółach planu
- Format: prosty tekst lub lista punktów (dzień 1, dzień 2, etc.)

**FR-011: Regeneracja AI content z nowymi parametrami**
- W formularzu edycji użytkownik może zaktualizować parametry podróży
- Przycisk "Regenerate AI Content" wywołuje regenerację z nowymi parametrami
- System wyświetla potwierdzenie przed nadpisaniem istniejącej treści AI
- Regeneracja aktualizuje zarówno parametry podróży jak i treść AI
- Regeneracja podlega tym samym limitom rate-limit co pierwsze generowanie

### 3.4 Bezpieczeństwo (WYMAGANE)

**FR-012: Autoryzacja dostępu do planów**
- Użytkownik może widzieć tylko swoje plany
- System blokuje dostęp do planów innych użytkowników (403 error)
- Próba dostępu do cudzego planu przekierowuje do dashboardu

### 3.5 Internationalization (Phase 1 - POST-CERTIFICATION)

**FR-013: Wybór języka interfejsu**
- Użytkownik może wybrać język interfejsu (polski lub angielski)
- Language switcher dostępny w nawigacji/headerze
- Wybór języka jest zapisywany w localStorage
- Wszystkie statyczne teksty UI są tłumaczone

**FR-014: Tłumaczenie AI-generated content**
- System wykrywa aktualnie wybrany język użytkownika
- AI prompt zawiera informację o języku docelowym
- Wygenerowane plany podróży są w języku wybranym przez użytkownika
- Możliwość regeneracji planu w innym języku

**FR-015: Persistencja preferencji językowych**
- Wybór języka jest zapamiętywany między sesjami (localStorage)
- Po ponownym zalogowaniu użytkownik widzi interfejs w swoim języku
- (Future) Synchronizacja preferencji językowych w profilu użytkownika (Supabase)

**FR-016: SEO i routing dla i18n**
- URLs pozostają bez locale prefix dla uproszczenia (domyślnie PL)
- HTML lang attribute jest dynamicznie ustawiany
- Meta tags są tłumaczone dla lepszego SEO

---

## 4. Granice produktu (Wersja Post-Certification)

### 4.1 Zrealizowane w fazie certyfikacji ✅

**Core MVP (Zakończone):**
- ✅ Autentykacja (email/hasło)
- ✅ CRUD dla planów podróży
- ✅ Generowanie planów przez AI
- ✅ Regeneracja AI content z nowymi parametrami
- ✅ Row Level Security (Supabase)
- ✅ Testy E2E (Playwright)
- ✅ CI/CD Pipeline (GitHub Actions)

### 4.2 W trakcie implementacji (Phase 1) 🚧

**Internationalization:**
- 🚧 Wsparcie dla języków: polski i angielski
- 🚧 Language switcher w UI
- 🚧 Tłumaczenie wszystkich tekstów interfejsu
- 🚧 AI content w wybranym języku

### 4.3 Zaplanowane funkcjonalności (Future Phases) 📋

**Phase 2-5 (2026):**
- Google OAuth
- System Premium i płatności (Stripe)
- Email notifications (Resend)
- PDF export planów
- Rating i feedback system
- Współdzielenie planów
- Advanced landing page
- Analytics i metryki
- Filtry i wyszukiwanie w dashboardzie
- Dark mode
- Mobile app (React Native / PWA)

---

## 5. Historyjki użytkowników (MINIMUM - 12 stories)

### 5.1 Autentykacja (3 stories)

**US-001: Rejestracja użytkownika**
Jako nowy użytkownik
Chcę założyć konto
Aby móc tworzyć i zarządzać planami podróży

Kryteria akceptacji:
- Formularz rejestracji z polami: email, password, confirm password
- Walidacja email (format) i hasła (min 8 znaków)
- Po rejestracji: automatyczne logowanie + przekierowanie do dashboardu
- Komunikat "Account created successfully"

**US-002: Logowanie użytkownika**
Jako zarejestrowany użytkownik
Chcę się zalogować
Aby uzyskać dostęp do moich planów

Kryteria akceptacji:
- Formularz logowania z polami: email, password
- Walidacja credentials w Supabase
- Po logowaniu: przekierowanie do dashboardu z listą planów
- Jeśli błędne credentials: komunikat "Invalid email or password"

**US-003: Wylogowanie**
Jako zalogowany użytkownik
Chcę się wylogować
Aby zakończyć sesję

Kryteria akceptacji:
- Przycisk "Logout" widoczny w nawigacji
- Kliknięcie wylogowuje użytkownika
- Przekierowanie do strony logowania
- Sesja jest zakończona (brak dostępu do protected routes)

### 5.2 CRUD - Create (2 stories)

**US-004: Otwarcie formularza nowego planu**
Jako zalogowany użytkownik
Chcę otworzyć formularz tworzenia planu
Aby dodać nową podróż

Kryteria akceptacji:
- Dashboard zawiera przycisk "Create New Plan"
- Kliknięcie otwiera formularz na nowej stronie/modal
- Formularz zawiera pola: Destination, Start Date, End Date, Description
- Wszystkie pola poza Description są wymagane

**US-005: Generowanie planu przez AI**
Jako użytkownik wypełniający formularz
Chcę wygenerować plan używając AI
Aby otrzymać propozycję itinerarium

Kryteria akceptacji:
- Formularz zawiera przycisk "Generate with AI"
- Po kliknięciu: loading state "Generating..."
- System wysyła dane do OpenRouter/OpenAI
- Po otrzymaniu odpowiedzi: plan zapisany w bazie ze statusem "completed"
- Użytkownik przekierowany do szczegółów planu
- Widoczna jest wygenerowana treść od AI

### 5.3 CRUD - Read (2 stories)

**US-006: Przeglądanie listy planów**
Jako zalogowany użytkownik
Chcę zobaczyć listę moich planów
Aby wybrać który chcę przejrzeć

Kryteria akceptacji:
- Dashboard wyświetla tabelę/listę planów użytkownika
- Każdy wiersz zawiera: Destination, Start Date, End Date, Status
- Jeśli brak planów: komunikat "You don't have any plans yet. Create your first one!"
- Kliknięcie planu otwiera szczegóły

**US-007: Przeglądanie szczegółów planu**
Jako użytkownik z planami
Chcę zobaczyć szczegóły konkretnego planu
Aby przeczytać wygenerowane itinerarium

Kryteria akceptacji:
- Strona szczegółów wyświetla: Destination, Start Date, End Date, Description
- Wyświetlana jest treść wygenerowana przez AI
- Widoczne są przyciski: "Edit", "Delete", "Back to Dashboard"
- Tylko właściciel planu ma dostęp (authorization)

### 5.4 CRUD - Update (2 stories)

**US-008: Otwarcie formularza edycji**
Jako użytkownik przeglądający plan
Chcę edytować podstawowe dane planu
Aby zaktualizować informacje

Kryteria akceptacji:
- Przycisk "Edit" w szczegółach planu otwiera formularz edycji
- Formularz jest pre-filled aktualnymi danymi
- Edytowalne pola: Destination, Start Date, End Date, Description
- Sekcja "AI-Generated Content" z przyciskiem "Regenerate AI Content"

**US-009: Zapisanie zmian w planie**
Jako użytkownik edytujący plan
Chcę zapisać zmiany
Aby zaktualizować plan w bazie

Kryteria akceptacji:
- Formularz edycji zawiera przycisk "Save Changes"
- Po kliknięciu: walidacja danych
- System aktualizuje rekord w bazie danych
- Użytkownik przekierowany do szczegółów (zaktualizowane dane widoczne)
- Komunikat "Plan updated successfully"

**US-009a: Regeneracja AI content z nowymi parametrami**
Jako użytkownik edytujący plan
Chcę wygenerować nową treść AI z zaktualizowanymi parametrami
Aby dopasować itinerarium do zmienionych szczegółów podróży

Kryteria akceptacji:
- Formularz edycji zawiera przycisk "Regenerate AI Content"
- Przed regeneracją: modal potwierdzający "Are you sure? This will replace existing AI content"
- Po potwierdzeniu: system waliduje formularz
- Jeśli walidacja OK: system aktualizuje parametry + regeneruje AI (status: 'generating')
- Loading state podczas generowania (może trwać 30-60 sekund)
- Po sukcesie: przekierowanie do szczegółów z nową treścią AI
- Jeśli błąd: komunikat błędu, możliwość ponownej próby

### 5.5 CRUD - Delete (1 story)

**US-010: Usunięcie planu**
Jako użytkownik z planem
Chcę usunąć niepotrzebny plan
Aby utrzymać porządek

Kryteria akceptacji:
- Przycisk "Delete" w szczegółach planu
- Kliknięcie otwiera modal potwierdzający "Are you sure you want to delete this plan?"
- Modal zawiera przyciski "Cancel" i "Delete"
- Po kliknięciu "Delete": plan usuwany z bazy (hard delete)
- Użytkownik przekierowany do dashboardu
- Komunikat "Plan deleted successfully"

### 5.6 Bezpieczeństwo (2 stories)

**US-011: Ochrona protected routes**
Jako niezalogowany użytkownik
Nie powinienem mieć dostępu do dashboardu i planów
Aby zapewnić bezpieczeństwo danych

Kryteria akceptacji:
- Próba dostępu do /dashboard bez logowania: przekierowanie do /login
- Próba dostępu do /plans/:id bez logowania: przekierowanie do /login
- Po zalogowaniu: user może uzyskać dostępu do protected routes

**US-012: Ochrona planów innych użytkowników**
Jako zalogowany użytkownik
Nie powinienem widzieć planów innych użytkowników
Aby chronić prywatność

Kryteria akceptacji:
- Próba dostępu do planu innego użytkownika (przez URL): błąd 403
- System wyświetla "You don't have access to this plan"
- Użytkownik przekierowany do swojego dashboardu
- W liście planów widoczne są TYLKO plany użytkownika (query z WHERE user_id)

### 5.7 Internationalization (4 stories - POST-CERTIFICATION)

**US-013: Wybór języka interfejsu**
Jako użytkownik aplikacji
Chcę wybrać język interfejsu (polski lub angielski)
Aby korzystać z aplikacji w preferowanym języku

Kryteria akceptacji:
- Language switcher widoczny w header/navigation (ikona flagi lub dropdown)
- Kliknięcie otwiera menu z opcjami: "Polski" i "English"
- Wybór języka natychmiast zmienia wszystkie teksty UI
- Wybór jest zapisywany w localStorage
- Po odświeżeniu strony język pozostaje wybrany

**US-014: Przeglądanie aplikacji w języku angielskim**
Jako anglojęzyczny użytkownik
Chcę używać aplikacji w pełni po angielsku
Aby komfortowo korzystać z wszystkich funkcji

Kryteria akceptacji:
- Wszystkie strony (login, signup, dashboard, trip details, edit) są przetłumaczone
- Wszystkie komponenty (buttony, formularze, komunikaty) są w EN
- Error messages i success notifications są w EN
- Validation messages są w EN
- Meta tags i page titles są w EN

**US-015: Generowanie planu AI w wybranym języku**
Jako użytkownik tworzący plan podróży
Chcę aby AI wygenerowało plan w moim języku
Aby łatwiej zrozumieć proponowane itinerarium

Kryteria akceptacji:
- System wykrywa aktualnie wybrany język (PL lub EN)
- AI prompt zawiera instrukcję generowania w odpowiednim języku
- Wygenerowany plan jest w języku użytkownika
- Plan wygenerowany po polsku zawiera polskie nazwy i opisy
- Plan wygenerowany po angielsku zawiera angielskie nazwy i opisy

**US-016: Regeneracja planu w innym języku**
Jako użytkownik z istniejącym planem
Chcę zmienić język interfejsu i zobaczyć moje plany
Aby dostosować aplikację do moich potrzeb

Kryteria akceptacji:
- Po zmianie języka interfejsu, UI natychmiast się aktualizuje
- Istniejące AI-generated content pozostaje w oryginalnym języku
- Użytkownik może użyć "Regenerate AI Content" aby wygenerować plan w nowym języku
- System informuje użytkownika że może zregenerować content w nowym języku

---

## 6. Architektura techniczna (uproszczona)

### 6.1 Stack technologiczny (Post-Certification)

**Frontend:**
- Framework: Astro 5 (static site generation + server-side rendering)
- Interactive components: React 19
- Language: TypeScript 5
- Styling: Tailwind CSS 4
- i18n: Astro i18n (native support) + custom translation utilities

**Backend:**
- BaaS: Supabase (PostgreSQL + Auth + Storage)
- Database: PostgreSQL (via Supabase)
- Auth: Supabase Auth (email/password)
- Row Level Security: Enabled dla wszystkich tablic

**AI:**
- OpenRouter.ai → Multiple models (GPT-4, Claude, Gemini)
- Fallback: OpenAI API direct
- Multi-language support w prompts

**Hosting:**
- Vercel (production) - FREE tier
- Preview deployments dla PR reviews
- Alternatywa: DigitalOcean, Netlify

**CI/CD:**
- GitHub Actions (free dla public repos)

**Testing:**
- Playwright (E2E tests)
- Alternatywa: Cypress

### 6.2 Struktura bazy danych (MINIMUM)

**Tabela: users** (zarządzana przez Supabase Auth)
- id: uuid (PK)
- email: text (unique)
- created_at: timestamp

**Tabela: trips** (główna tabela dla CRUD)
- id: uuid (PK, auto-generated)
- user_id: uuid (FK → auth.users.id, NOT NULL)
- destination: text (NOT NULL)
- start_date: date (NOT NULL)
- end_date: date (NOT NULL)
- description: text (nullable)
- ai_generated_content: text (nullable, treść od AI)
- status: text (default: 'draft', values: 'draft'|'generating'|'completed')
- created_at: timestamp (default: now())
- updated_at: timestamp (default: now())

**Row Level Security (RLS) - KRYTYCZNE:**
```sql
-- Policy: Users can only see their own trips
CREATE POLICY "Users can view own trips"
ON trips FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own trips
CREATE POLICY "Users can insert own trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own trips
CREATE POLICY "Users can update own trips"
ON trips FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own trips
CREATE POLICY "Users can delete own trips"
ON trips FOR DELETE
USING (auth.uid() = user_id);
```

### 6.3 API Endpoints (minimum)

**Supabase Auth (built-in):**
- POST /auth/v1/signup - rejestracja
- POST /auth/v1/token?grant_type=password - logowanie
- POST /auth/v1/logout - wylogowanie

**Supabase Database (via Supabase JS SDK):**
- Wszystkie operacje CRUD przez supabase.from('trips')
- RLS automatycznie filtruje dane dla zalogowanego użytkownika

**Custom API (Astro API Routes):**
- POST /api/trips/:id/generate-ai - generowanie AI dla nowego planu
- POST /api/trips/:id/regenerate - aktualizacja parametrów + regeneracja AI content

### 6.4 AI Prompt (prosty)

```javascript
// Prosty prompt dla OpenAI
const prompt = `Create a simple travel itinerary for the following trip:

Destination: ${destination}
Start Date: ${startDate}
End Date: ${endDate}
${description ? `Additional info: ${description}` : ''}

Please provide a day-by-day itinerary with suggestions for places to visit and activities.
Keep it concise and practical.`;

// Request do OpenAI/OpenRouter
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo', // lub gpt-4
    messages: [
      {role: 'system', content: 'You are a helpful travel planning assistant.'},
      {role: 'user', content: prompt}
    ],
    max_tokens: 500
  })
});

const data = await response.json();
const aiContent = data.choices[0].message.content;

// Zapisz aiContent do bazy w kolumnie ai_generated_content
```

---

## 7. Testy (MINIMUM - 1 test wymagany)

### 7.1 Test E2E (Playwright) - WYMAGANY

**Test: User creates a plan end-to-end**

```typescript
// tests/create-plan.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up, log in, create a plan, and delete it', async ({ page }) => {
  // 1. Sign up
  await page.goto('/signup');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.fill('input[name="confirmPassword"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 2. Should be redirected to dashboard
  await expect(page).toHaveURL('/dashboard');
  
  // 3. Create new plan
  await page.click('text=Create New Plan');
  await page.fill('input[name="destination"]', 'Paris');
  await page.fill('input[name="startDate"]', '2025-12-01');
  await page.fill('input[name="endDate"]', '2025-12-05');
  await page.fill('textarea[name="description"]', 'Romantic getaway');
  await page.click('button:has-text("Generate with AI")');
  
  // 4. Wait for AI generation and redirect
  await page.waitForURL('/plans/*', { timeout: 30000 });
  
  // 5. Verify plan details are shown
  await expect(page.locator('text=Paris')).toBeVisible();
  await expect(page.locator('text=2025-12-01')).toBeVisible();
  
  // 6. Delete the plan
  await page.click('button:has-text("Delete")');
  await page.click('button:has-text("Confirm")'); // in modal
  
  // 7. Should be back at dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Plan deleted successfully')).toBeVisible();
});
```

### 7.2 Opcjonalne dodatkowe testy (jeśli czas)

```typescript
// tests/auth.spec.ts
test('user cannot access dashboard without login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

test('user cannot access other users plans', async ({ page, context }) => {
  // Login as user1, create plan, get plan ID
  // Login as user2, try to access user1's plan ID
  // Expect 403 or redirect
});
```

---

## 8. CI/CD Pipeline (WYMAGANY)

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run TypeScript check
        run: npm run type-check
      
      - name: Build application
        run: npm run build
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: playwright-report/

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 8.2 Wymagane secrets w GitHub

W ustawieniach repo GitHub → Settings → Secrets and variables → Actions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (lub OPENROUTER_API_KEY)
- `VERCEL_TOKEN` (jeśli deploy na Vercel)
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 9. User Flows (uproszczone - 3 główne)

### 9.1 Flow: Nowy użytkownik rejestruje się i tworzy plan

1. User wchodzi na stronę główną
2. Kliknie "Sign Up"
3. Wypełnia formularz: email, hasło, potwierdzenie hasła
4. Kliknie "Create Account"
5. Automatyczne logowanie → przekierowanie do /dashboard
6. Dashboard pusty, komunikat "No plans yet"
7. Kliknie "Create New Plan"
8. Wypełnia formularz: Paris, 2025-12-01, 2025-12-05, "Romantic trip"
9. Kliknie "Generate with AI"
10. Loading... (30-60 sek)
11. Przekierowanie do /plans/:id
12. Widzi szczegóły + AI-generated itinerary

### 9.2 Flow: Użytkownik edytuje plan (bez regeneracji AI)

1. User zalogowany, w dashboardzie
2. Kliknie na istniejący plan
3. Widzi szczegóły planu
4. Kliknie "Edit"
5. Formularz edycji pre-filled
6. Zmienia datę końcową z 2025-12-05 na 2025-12-07
7. Kliknie "Save Changes"
8. Przekierowanie do szczegółów (nowa data widoczna)
9. Komunikat "Plan updated"

### 9.2a Flow: Użytkownik edytuje plan i regeneruje AI

1. User zalogowany, w dashboardzie
2. Kliknie na istniejący plan "Paris 5 dni"
3. Widzi szczegóły planu z wygenerowanym itinerarium
4. Kliknie "Edit"
5. Formularz edycji pre-filled
6. Zmienia:
   - Destination: "Paris and Versailles, France"
   - End Date: z 2025-12-05 na 2025-12-08 (wydłuża o 3 dni)
   - Description: dodaje "Include day trip to Versailles Palace"
7. Kliknie "Regenerate AI Content"
8. Modal: "Are you sure? This will replace existing AI content"
9. Potwierdza "Yes, Regenerate"
10. Loading spinner "Regenerating AI Content..." (30-60 sekund)
11. System:
    - Aktualizuje destination, end_date, description
    - Generuje nową treść AI z uwzględnieniem Wersalu i 8 dni
    - Nadpisuje poprzednie itinerarium
12. Przekierowanie do szczegółów
13. Widzi zaktualizowane parametry + nowe itinerarium z Wersalem
14. Komunikat "Trip updated and AI content regenerated successfully"

### 9.3 Flow: Użytkownik usuwa plan

1. User w szczegółach planu
2. Kliknie "Delete"
3. Modal: "Are you sure?"
4. Kliknie "Confirm"
5. Plan usunięty z bazy
6. Przekierowanie do /dashboard
7. Plan zniknął z listy
8. Komunikat "Plan deleted"

---

## 10. Timeline (uproszczony - 2 tygodnie)

### Tydzień 1: Setup + Auth + CRUD

**Dni 1-2: Setup projektu**
- [ ] Setup Astro/Next.js + TypeScript + Tailwind
- [ ] Setup Supabase (create project, database schema)
- [ ] Setup GitHub repo + Actions
- [ ] Basic routing (/login, /signup, /dashboard, /plans/:id)

**Dni 3-4: Autentykacja**
- [ ] Signup form + Supabase integration
- [ ] Login form + session management
- [ ] Logout functionality
- [ ] Protected routes (middleware/guards)

**Dni 5-7: CRUD - Create & Read**
- [ ] Dashboard page (lista planów)
- [ ] Create plan form (bez AI na razie)
- [ ] Plan details page
- [ ] Basic styling (Tailwind)

### Tydzień 2: AI + Update/Delete + Tests + CI/CD

**Dni 8-9: AI integration**
- [ ] OpenAI/OpenRouter API integration
- [ ] "Generate with AI" button functionality
- [ ] Display AI-generated content
- [ ] Error handling

**Dni 10-11: Update & Delete**
- [ ] Edit plan form
- [ ] Update functionality
- [ ] Delete with confirmation modal
- [ ] Authorization checks (RLS)

**Dni 12-13: Tests + CI/CD**
- [ ] Setup Playwright
- [ ] Write 1 E2E test (signup → create plan → delete)
- [ ] Setup GitHub Actions
- [ ] Test pipeline (build + test)

**Dzień 14: Polish + Deploy**
- [ ] Bug fixes
- [ ] Basic error handling
- [ ] Deploy na Vercel
- [ ] Final smoke test

---

## 11. Kryteria zaliczenia - Checklist

### ✅ Wymagane elementy (MUST HAVE)

**1. Mechanizm kontroli dostępu:**
- [ ] Ekran rejestracji (email + hasło)
- [ ] Ekran logowania
- [ ] Wylogowanie
- [ ] Protected routes (dashboard, plans)
- [ ] Session management (Supabase Auth)

**2. Zarządzanie danymi CRUD:**
- [ ] CREATE: Formularz tworzenia planu + zapis do bazy
- [ ] READ: Lista planów + szczegóły planu
- [ ] UPDATE: Edycja planu (destination, daty, description)
- [ ] DELETE: Usuwanie planu z confirmationem
- [ ] Authorization: tylko właściciel widzi swoje plany (RLS)

**3. Logika biznesowa z AI:**
- [ ] Integracja z OpenAI/OpenRouter API
- [ ] Generowanie planu podróży przez AI
- [ ] Parsowanie i zapisywanie AI response
- [ ] Wyświetlanie wygenerowanej treści

**4. PRD i dokumenty:**
- [ ] Ten PRD (wersja minimalna)
- [ ] Dokumenty z modułów 2 i 3 (kontekst projektu)

**5. Testy:**
- [ ] Co najmniej 1 test E2E weryfikujący działanie z perspektywy użytkownika
- [ ] Test sprawdza: signup/login + create plan + delete plan
- [ ] Test uruchamialny lokalnie i w CI

**6. Pipeline CI/CD:**
- [ ] GitHub Actions workflow
- [ ] Build aplikacji w pipeline
- [ ] Uruchamianie testów w pipeline
- [ ] Pipeline działa na push/PR
- [ ] (Opcjonalnie) Automatyczny deploy

---

## 12. Uproszczenia względem pełnego MVP

Wersja minimalna vs Pełna wersja (z PRD v1.0):

| Feature | Wersja minimalna (v2.0) | Pełna wersja (v1.0) |
|---------|-------------------------|---------------------|
| Auth | Email/hasło tylko | + Google OAuth, magic links |
| CRUD | Podstawowy | + Soft delete, archiwizacja |
| AI | Prosty prompt | + Zaawansowany prompt, retry logic |
| UI/UX | Prosty design | Shadcn/ui, animations, loading states |
| Plan details | Tekst od AI | Timeline dzień po dniu, Google Maps links |
| Premium | Brak | Stripe integration, limity free tier |
| Notifications | Brak | Email z planami, reminders |
| PDF Export | Brak | Basic + Premium PDF |
| Rating | Brak | 5-gwiazdkowy system + feedback |
| Tests | 1 E2E test | Comprehensive test suite |
| CI/CD | Basic (build + test) | + Linting, security scans, deploy |
| Documentation | Ten PRD | Pełny PRD + wireframes + examples |

---

## 13. Następne kroki (Immediate actions)

### Dzień 1: Setup

1. **Create GitHub repo**
   ```bash
   mkdir vibetravels-minimum
   cd vibetravels-minimum
   git init
   ```

2. **Init Astro project**
   ```bash
   npm create astro@latest
   # Choose: Empty template, TypeScript (strict), Install dependencies
   cd vibetravels-minimum
   npm install @supabase/supabase-js
   npm install -D tailwindcss @astrojs/tailwind
   npx astro add tailwind
   npx astro add react
   ```

3. **Setup Supabase**
   - Idź do https://supabase.com
   - Create new project (wybierz FREE plan)
   - Zapisz URL i anon key
   - W SQL Editor uruchom:
   ```sql
   -- Create trips table
   CREATE TABLE trips (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id) NOT NULL,
     destination text NOT NULL,
     start_date date NOT NULL,
     end_date date NOT NULL,
     description text,
     ai_generated_content text,
     status text DEFAULT 'draft',
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );

   -- Enable Row Level Security
   ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own trips"
     ON trips FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own trips"
     ON trips FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own trips"
     ON trips FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own trips"
     ON trips FOR DELETE
     USING (auth.uid() = user_id);
   ```

4. **Create .env file**
   ```bash
   # .env.local
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   OPENAI_API_KEY=your_openai_key
   ```

5. **Create basic file structure**
   ```
   src/
   ├── pages/
   │   ├── index.astro          # Home/landing
   │   ├── signup.astro         # Signup page
   │   ├── login.astro          # Login page
   │   ├── dashboard.astro      # Dashboard (lista planów)
   │   ├── plans/
   │   │   ├── new.astro        # Create plan form
   │   │   ├── [id].astro       # Plan details
   │   │   └── [id]/edit.astro  # Edit plan
   ├── components/
   │   ├── Layout.astro         # Main layout
   │   ├── Header.astro         # Navigation
   │   └── ProtectedRoute.astro # Auth guard
   ├── lib/
   │   ├── supabase.ts          # Supabase client
   │   └── openai.ts            # OpenAI integration
   └── types/
       └── index.ts             # TypeScript types
   ```

---

## 14. Przykładowy kod (snippets dla szybkiego startu)

### 14.1 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types
export type Trip = {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
  ai_generated_content?: string;
  status: 'draft' | 'generating' | 'completed';
  created_at: string;
  updated_at: string;
};
```

### 14.2 OpenAI Integration

```typescript
// src/lib/openai.ts
export async function generateTripPlan(
  destination: string,
  startDate: string,
  endDate: string,
  description?: string
): Promise<string> {
  const prompt = `Create a simple travel itinerary for the following trip:

Destination: ${destination}
Start Date: ${startDate}
End Date: ${endDate}
${description ? `Additional info: ${description}` : ''}

Please provide a day-by-day itinerary with suggestions for places to visit and activities.
Keep it concise and practical.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful travel planning assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate trip plan');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 14.3 Signup Page

```astro
---
// src/pages/signup.astro
import Layout from '../components/Layout.astro';
---

<Layout title="Sign Up - VibeTravels">
  <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
    <h1 class="text-2xl font-bold mb-6">Create Account</h1>
    
    <form id="signup-form" class="space-y-4">
      <div>
        <label class="block mb-1">Email</label>
        <input 
          type="email" 
          name="email" 
          required 
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <div>
        <label class="block mb-1">Password</label>
        <input 
          type="password" 
          name="password" 
          required 
          minlength="8"
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <div>
        <label class="block mb-1">Confirm Password</label>
        <input 
          type="password" 
          name="confirmPassword" 
          required 
          minlength="8"
          class="w-full px-3 py-2 border rounded"
        />
      </div>
      
      <button 
        type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sign Up
      </button>
    </form>
    
    <p class="mt-4 text-center">
      Already have an account? 
      <a href="/login" class="text-blue-600 hover:underline">Log in</a>
    </p>
    
    <div id="error" class="mt-4 text-red-600 hidden"></div>
  </div>

  <script>
    import { supabase } from '../lib/supabase';
    
    const form = document.getElementById('signup-form') as HTMLFormElement;
    const errorDiv = document.getElementById('error') as HTMLDivElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.classList.add('hidden');
      
      const formData = new FormData(form);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      
      if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
      } else {
        window.location.href = '/dashboard';
      }
    });
  </script>
</Layout>
```

### 14.4 Dashboard Page

```astro
---
// src/pages/dashboard.astro
import Layout from '../components/Layout.astro';
import { supabase } from '../lib/supabase';

// Server-side: Check if user is authenticated
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/login');
}

// Fetch user's trips
const { data: trips, error } = await supabase
  .from('trips')
  .select('*')
  .order('created_at', { ascending: false });
---

<Layout title="Dashboard - VibeTravels">
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">My Travel Plans</h1>
      <a 
        href="/plans/new"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create New Plan
      </a>
    </div>
    
    {trips && trips.length === 0 && (
      <div class="text-center py-10">
        <p class="text-gray-600 mb-4">You don't have any plans yet.</p>
        <a href="/plans/new" class="text-blue-600 hover:underline">
          Create your first plan
        </a>
      </div>
    )}
    
    {trips && trips.length > 0 && (
      <div class="grid gap-4">
        {trips.map((trip) => (
          <a 
            href={`/plans/${trip.id}`}
            class="block p-4 border rounded hover:shadow-lg transition"
          >
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold">{trip.destination}</h2>
                <p class="text-gray-600">
                  {new Date(trip.start_date).toLocaleDateString()} - 
                  {new Date(trip.end_date).toLocaleDateString()}
                </p>
                {trip.description && (
                  <p class="text-gray-500 mt-2">{trip.description}</p>
                )}
              </div>
              <span class={`px-3 py-1 rounded text-sm ${
                trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                trip.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {trip.status}
              </span>
            </div>
          </a>
        ))}
      </div>
    )}
  </div>
</Layout>
```

### 14.5 Create Plan Form (with AI)

```astro
---
// src/pages/plans/new.astro
import Layout from '../../components/Layout.astro';
import { supabase } from '../../lib/supabase';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  return Astro.redirect('/login');
}
---

<Layout title="Create Plan - VibeTravels">
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Create New Travel Plan</h1>
    
    <form id="create-form" class="space-y-4">
      <div>
        <label class="block mb-1">Destination *</label>
        <input 
          type="text" 
          name="destination" 
          required 
          class="w-full px-3 py-2 border rounded"
          placeholder="e.g., Paris, France"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">Start Date *</label>
          <input 
            type="date" 
            name="startDate" 
            required 
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div>
          <label class="block mb-1">End Date *</label>
          <input 
            type="date" 
            name="endDate" 
            required 
            class="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
      
      <div>
        <label class="block mb-1">Description (optional)</label>
        <textarea 
          name="description" 
          rows="3"
          class="w-full px-3 py-2 border rounded"
          placeholder="Tell us about your trip preferences..."
        ></textarea>
      </div>
      
      <button 
        type="submit"
        id="submit-btn"
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Generate with AI
      </button>
    </form>
    
    <div id="loading" class="hidden mt-4 text-center">
      <p class="text-gray-600">Generating your plan with AI... This may take 30-60 seconds.</p>
      <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mt-2"></div>
    </div>
    
    <div id="error" class="mt-4 text-red-600 hidden"></div>
  </div>

  <script>
    import { supabase } from '../../lib/supabase';
    
    const form = document.getElementById('create-form') as HTMLFormElement;
    const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
    const loadingDiv = document.getElementById('loading') as HTMLDivElement;
    const errorDiv = document.getElementById('error') as HTMLDivElement;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      submitBtn.disabled = true;
      loadingDiv.classList.remove('hidden');
      errorDiv.classList.add('hidden');
      
      const formData = new FormData(form);
      const destination = formData.get('destination') as string;
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;
      const description = formData.get('description') as string;
      
      try {
        // 1. Create trip in database with status 'generating'
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: trip, error: insertError } = await supabase
          .from('trips')
          .insert({
            user_id: user!.id,
            destination,
            start_date: startDate,
            end_date: endDate,
            description,
            status: 'generating',
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // 2. Generate AI content
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: trip.id,
            destination,
            startDate,
            endDate,
            description,
          }),
        });
        
        if (!response.ok) throw new Error('Failed to generate plan');
        
        const { aiContent } = await response.json();
        
        // 3. Update trip with AI content
        await supabase
          .from('trips')
          .update({
            ai_generated_content: aiContent,
            status: 'completed',
          })
          .eq('id', trip.id);
        
        // 4. Redirect to plan details
        window.location.href = `/plans/${trip.id}`;
        
      } catch (err) {
        console.error(err);
        errorDiv.textContent = 'Failed to create plan. Please try again.';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        loadingDiv.classList.add('hidden');
      }
    });
  </script>
</Layout>
```

### 14.6 API Route for AI Generation

```typescript
// src/pages/api/generate-plan.ts
import type { APIRoute } from 'astro';
import { generateTripPlan } from '../../lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { destination, startDate, endDate, description } = body;
    
    const aiContent = await generateTripPlan(
      destination,
      startDate,
      endDate,
      description
    );
    
    return new Response(
      JSON.stringify({ aiContent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate plan' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

## 15. Playwright Test (Minimum 1 wymagany)

### 15.1 Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 15.2 Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 15.3 Main E2E Test

```typescript
// tests/user-journey.spec.ts
import { test, expect } from '@playwright/test';

// Generate unique email for each test run
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';

test.describe('Complete user journey', () => {
  test('user can signup, create plan with AI, edit it, and delete it', async ({ page }) => {
    // 1. SIGNUP
    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
    
    // 2. CREATE PLAN
    await page.click('text=Create New Plan');
    await page.waitForURL('/plans/new');
    
    await page.fill('input[name="destination"]', 'Tokyo, Japan');
    await page.fill('input[name="startDate"]', '2025-06-01');
    await page.fill('input[name="endDate"]', '2025-06-07');
    await page.fill('textarea[name="description"]', 'First time in Japan, interested in culture and food');
    
    await page.click('button:has-text("Generate with AI")');
    
    // Wait for AI generation (may take up to 60 seconds)
    await page.waitForURL(/\/plans\/[a-z0-9-]+/, { timeout: 90000 });
    
    // 3. VERIFY PLAN DETAILS
    await expect(page.locator('text=Tokyo')).toBeVisible();
    await expect(page.locator('text=2025-06-01')).toBeVisible();
    
    // Check if AI content is present (at least some text)
    const aiContent = await page.textContent('body');
    expect(aiContent).toBeTruthy();
    expect(aiContent!.length).toBeGreaterThan(100); // AI should generate substantial content
    
    // 4. EDIT PLAN
    await page.click('button:has-text("Edit")');
    await page.waitForURL(/\/plans\/[a-z0-9-]+\/edit/);
    
    await page.fill('input[name="destination"]', 'Tokyo and Kyoto, Japan');
    await page.fill('input[name="endDate"]', '2025-06-10'); // Extend trip
    await page.click('button:has-text("Save Changes")');
    
    // Should redirect back to plan details
    await page.waitForURL(/\/plans\/[a-z0-9-]+$/);
    await expect(page.locator('text=Tokyo and Kyoto')).toBeVisible();
    await expect(page.locator('text=2025-06-10')).toBeVisible();
    
    // 5. DELETE PLAN
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion in modal
    await page.click('button:has-text("Confirm")');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Plan should be gone
    await expect(page.locator('text=Tokyo and Kyoto')).not.toBeVisible();
    await expect(page.locator('text=You don\'t have any plans yet')).toBeVisible();
  });
  
  test('unauthorized user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
});
```

### 15.4 Package.json Scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 16. Finalne podsumowanie - Wersja minimalna

### ✅ Co jest w scopie (MUST DO):

1. **Auth**: Signup/Login/Logout z email+hasło (Supabase Auth)
2. **CRUD**: Pełny CRUD dla planów podróży
3. **AI**: Generowanie planów przez OpenAI/OpenRouter
4. **Security**: RLS w Supabase, protected routes
5. **Tests**: 1 test E2E (signup → create → edit → delete)
6. **CI/CD**: GitHub Actions (build + test)
7. **Docs**: Ten PRD + dokumenty z modułów 2-
   