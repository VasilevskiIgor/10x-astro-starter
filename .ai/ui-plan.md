# Architektura UI dla VibeTravels MVP

## 1. Przegląd struktury UI

VibeTravels MVP to aplikacja webowa do planowania podróży z wykorzystaniem AI, zbudowana w oparciu o Astro 5 + React 19 + TypeScript 5 + Tailwind CSS 4. Architektura UI została zaprojektowana z myślą o prostocie, dostępności i responsywności, skupiając się na głównym przypadku użycia: tworzeniu i zarządzaniu planami podróży z AI-generated itinerariami.

**Kluczowe założenia architektoniczne:**
- Server-side rendering z Astro dla wydajności i SEO
- Client-side state management (React Context/Zustand) dla interaktywnych komponentów
- Mobile-first responsive design z breakpoints: 320px+, 768px+, 1024px+
- Comprehensive accessibility implementation (ARIA, keyboard navigation, semantic HTML)
- Progressive enhancement z graceful degradation
- Single light theme focus dla MVP efficiency

## 2. Lista widoków

### 2.1 Authentication Views

**`/login` - Strona logowania**
- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika
- **Kluczowe informacje:** Formularz logowania (email, hasło), link do rejestracji, komunikaty błędów
- **Kluczowe komponenty:** AuthenticationForm, Button, Input, Alert, Header
- **UX, dostępność i względy bezpieczeństwa:**
  - Real-time validation z clear error messages
  - Focus management i keyboard navigation
  - Password visibility toggle
  - CSRF protection i secure headers
  - Screen reader support z ARIA labels

**`/signup` - Strona rejestracji**
- **Ścieżka:** `/signup`
- **Główny cel:** Rejestracja nowego użytkownika
- **Kluczowe informacje:** Formularz rejestracji (email, hasło, potwierdzenie), walidacja siły hasła, link do logowania
- **Kluczowe komponenty:** AuthenticationForm, Button, Input, Alert, Header
- **UX, dostępność i względy bezpieczeństwa:**
  - Progressive validation (email format, password strength)
  - Clear success/error feedback
  - Auto-login po rejestracji
  - Input sanitization i XSS prevention
  - Accessible form labels i error announcements

**`/` - Strona główna**
- **Ścieżka:** `/`
- **Główny cel:** Landing page z przekierowaniem zalogowanych użytkowników
- **Kluczowe informacje:** Opis aplikacji, przyciski Sign Up/Log In, informacja o AI functionality
- **Kluczowe komponenty:** Header, Button, Container, Hero section
- **UX, dostępność i względy bezpieczeństwa:**
  - Clear call-to-action buttons
  - Responsive hero section
  - SEO-optimized content
  - Fast loading z preloaded critical resources

### 2.2 Main Application Views

**`/dashboard` - Dashboard główny**
- **Ścieżka:** `/dashboard`
- **Główny cel:** Przeglądanie i zarządzanie podróżami użytkownika
- **Kluczowe informacje:** Lista podróży z paginacją, informacje o każdej podróży (destination, daty, status), rate limit information
- **Kluczowe komponenty:** TripCard, Pagination, EmptyState, Header, UserMenu, RateLimitIndicator
- **UX, dostępność i względy bezpieczeństwa:**
  - Paginacja z domyślnym limitem 20 tripów na stronę
  - Sortowanie (newest first jako default)
  - Engaging empty state z call-to-action
  - Keyboard navigation przez listę
  - Screen reader announcements dla dynamic content
  - Optimistic updates dla basic trip information

**`/trips/new` - Formularz tworzenia podróży**
- **Ścieżka:** `/trips/new`
- **Główny cel:** Tworzenie nowej podróży z opcjonalnym generowaniem AI
- **Kluczowe informacje:** Formularz (destination, start_date, end_date, description), checkbox "Generate with AI", rate limit information
- **Kluczowe komponenty:** TripForm, DateRangePicker, Button, RateLimitModal, Breadcrumb
- **UX, dostępność i względy bezpieczeństwa:**
  - Real-time validation (end >= start, max 365 dni)
  - Native HTML5 date inputs z custom styling
  - Rate limit display przed generowaniem
  - Form data persistence w localStorage
  - Clear error messages z field-specific validation
  - Auto-focus na pierwsze pole

**`/trips/[id]` - Szczegóły podróży**
- **Ścieżka:** `/trips/[id]`
- **Główny cel:** Wyświetlanie pełnych szczegółów podróży z AI-generated content
- **Kluczowe informacje:** Podstawowe dane (destination, daty, description), AI-generated content (summary, day-by-day itinerary, recommendations), status podróży
- **Kluczowe komponenty:** AIContentDisplay, Button, Breadcrumb, StatusIndicator, ActionButtons
- **UX, dostępność i względy bezpieczeństwa:**
  - Single scrollable view z clear visual hierarchy
  - Collapsible sections dla długich itinerariów
  - Print-friendly CSS layout
  - Prominent edit/delete buttons z confirmation modal
  - Authorization check (tylko właściciel ma dostęp)
  - Semantic HTML structure z proper headings

**`/trips/[id]/edit` - Formularz edycji podróży**
- **Ścieżka:** `/trips/[id]/edit`
- **Główny cel:** Edycja podstawowych danych podróży
- **Kluczowe informacje:** Pre-filled formularz z aktualnymi danymi, edytowalne pola (destination, dates, description), AI content nieedytowalny
- **Kluczowe komponenty:** TripForm, Button, Breadcrumb, ConfirmationModal
- **UX, dostępność i względy bezpieczeństwa:**
  - Pre-filled form z current data
  - Same validation rules jak w formularzu tworzenia
  - Clear save/cancel actions
  - Optimistic updates z rollback capability
  - Preserve context podczas edycji
  - Clear indication że AI content nie jest edytowalny

### 2.3 Error/Status Views

**`/error` - Strona błędów**
- **Ścieżka:** `/error`
- **Główny cel:** Obsługa błędów aplikacji
- **Kluczowe informacje:** Kod błędu, opis błędu w języku użytkownika, opcje działania
- **Kluczowe komponenty:** ErrorState, Button, Container
- **UX, dostępność i względy bezpieczeństwa:**
  - User-friendly error messages
  - Clear action options (retry, go back, contact support)
  - Proper HTTP status codes
  - Error logging dla debugging
  - Accessible error announcements

**`/unauthorized` - Strona błędu autoryzacji**
- **Ścieżka:** `/unauthorized`
- **Główny cel:** Informowanie o braku uprawnień
- **Kluczowe informacje:** Komunikat o braku dostępu, opcje logowania
- **Kluczowe komponenty:** ErrorState, Button, Container
- **UX, dostępność i względy bezpieczeństwa:**
  - Clear access denied message
  - Redirect options do login
  - Security logging
  - No sensitive information exposure

### 2.4 Modal/Overlay Views

**Confirmation Modal - Potwierdzenie usunięcia**
- **Główny cel:** Potwierdzenie nieodwracalnej akcji usunięcia
- **Kluczowe informacje:** Nazwa podróży, ostrzeżenie o nieodwracalności
- **Kluczowe komponenty:** ConfirmationModal, Button
- **UX, dostępność i względy bezpieczeństwa:**
  - Focus trap w modal
  - ESC key do zamknięcia
  - Clear destructive action styling
  - Screen reader announcements

**Rate Limit Modal - Informacja o limitach**
- **Główny cel:** Informowanie o przekroczeniu limitów AI generation
- **Kluczowe informacje:** Typ limitu, reset time, pozostałe generacje
- **Kluczowe komponenty:** RateLimitModal, Button
- **UX, dostępność i względy bezpieczeństwa:**
  - Clear limit explanation
  - Countdown timer do resetu
  - Helpful alternatives suggestions
  - Accessible modal implementation

**AI Generation Progress Modal - Progress generowania**
- **Główny cel:** Pokazanie postępu generowania AI
- **Kluczowe informacje:** Progress bar, szacowany czas, status message
- **Kluczowe komponenty:** AIProgressModal, ProgressBar, Button
- **UX, dostępność i względy bezpieczeństwa:**
  - Real-time progress updates
  - Estimated completion time
  - Cancellation option (opcjonalnie)
  - Accessible progress announcements

## 3. Mapa podróży użytkownika

### 3.1 Flow: Nowy użytkownik rejestruje się i tworzy plan
```
/ → /signup → /dashboard → /trips/new → [AI Progress Modal] → /trips/[id]
```

**Szczegółowy przepływ:**
1. **Landing page** - Clear call-to-action do rejestracji
2. **Rejestracja** - Smooth form z real-time validation
3. **Dashboard** - Empty state z guidance do first trip
4. **Formularz tworzenia** - Intuitive form z AI generation option
5. **AI Progress** - Clear progress indication (30-60 sekund)
6. **Szczegóły podróży** - Rich display z AI-generated content

### 3.2 Flow: Użytkownik loguje się i przegląda plany
```
/ → /login → /dashboard → /trips/[id] → /trips/[id]/edit → /trips/[id]
```

**Szczegółowy przepływ:**
1. **Logowanie** - Quick access do existing account
2. **Dashboard** - Overview wszystkich podróży z paginacją
3. **Szczegóły** - Deep dive w konkretną podróż
4. **Edycja** - Quick edit podstawowych danych
5. **Powrót** - Updated details z success feedback

### 3.3 Flow: Użytkownik edytuje i usuwa plan
```
/dashboard → /trips/[id] → /trips/[id]/edit → /trips/[id] → [Confirmation Modal] → /dashboard
```

**Szczegółowy przepływ:**
1. **Lista podróży** - Quick access do management
2. **Szczegóły** - Context przed edycją
3. **Edycja** - Focused editing experience
4. **Potwierdzenie** - Clear success feedback
5. **Usuwanie** - Safe deletion z confirmation
6. **Powrót** - Updated list bez usuniętej podróży

### 3.4 Flow: Obsługa błędów i limitów
```
[Protected Route] → /unauthorized → /login
[Rate Limit Exceeded] → Rate Limit Modal → /dashboard
[AI Generation Failed] → /trips/[id] (status: failed) → Retry option
```

**Szczegółowy przepływ:**
1. **Security** - Graceful handling unauthorized access
2. **Rate Limits** - Clear communication o limits
3. **AI Failures** - Recovery options z retry capability

## 4. Układ i struktura nawigacji

### 4.1 Persistent Header
**Dla niezalogowanych użytkowników:**
```
[Logo: VibeTravels] ——————————————————————————————————————— [Sign Up] [Log In]
```

**Dla zalogowanych użytkowników:**
```
[Logo: VibeTravels] ——————————————————————————————————————— [User Avatar ▼]
                                                           │ Dashboard
                                                           │ Profile  
                                                           │ Logout
```

### 4.2 Breadcrumb Navigation
```
Dashboard > Trips > Tokyo, Japan > Edit
```

### 4.3 Mobile Navigation
**Bottom Tab Bar (mobile):**
```
┌─────────────────────────────────────┐
│ 🏠     ✈️      ➕      👤      ⚙️   │
│ Home   Trips   Add   Profile  More  │
└─────────────────────────────────────┘
```

### 4.4 Contextual Navigation
**W szczegółach podróży:**
```
[← Back to Dashboard] [Edit] [Delete] [Share] (future)
```

**W formularzu edycji:**
```
[← Back to Trip] [Cancel] [Save Changes]
```

### 4.5 Navigation States
- **Loading:** Skeleton screens, progress indicators
- **Error:** Clear error messages z retry options
- **Empty:** Engaging empty states z CTAs
- **Offline:** Cached data display z offline indicator

## 5. Kluczowe komponenty

### 5.1 Form Components
**TripForm Component:**
- Real-time validation z error messages
- Native HTML5 inputs z custom styling
- Auto-focus i keyboard navigation
- Form data persistence w localStorage

**AuthenticationForm Component:**
- Email/password validation
- Password strength indicators
- Security features (visibility toggle)
- Clear error messaging

### 5.2 Display Components
**TripCard Component:**
- Responsive card layout
- Status indicators z color coding
- Hover effects i click interactions
- Accessibility z proper semantics

**AIContentDisplay Component:**
- Structured display z AI-generated content
- Collapsible sections dla long content
- Print-friendly formatting
- Progressive disclosure

### 5.3 Navigation Components
**Header Component:**
- Responsive design z mobile menu
- User authentication status
- Rate limit indicators
- Logo branding

**Breadcrumb Component:**
- Clear navigation hierarchy
- Clickable navigation links
- Responsive truncation
- Accessibility landmarks

### 5.4 Modal Components
**ConfirmationModal Component:**
- Focus trap i keyboard navigation
- Clear destructive action styling
- ESC key handling
- Screen reader support

**RateLimitModal Component:**
- Clear limit explanations
- Countdown timers
- Helpful alternatives
- Accessible implementation

**AIProgressModal Component:**
- Real-time progress updates
- Estimated completion times
- Cancellation options
- Progress announcements

### 5.5 State Components
**EmptyState Component:**
- Engaging illustrations
- Clear call-to-action buttons
- Helpful guidance messages
- Multiple variants (no trips, no results)

**LoadingState Component:**
- Skeleton screens dla lists
- Progress bars dla operations
- Spinners dla quick actions
- Context-aware loading

**ErrorState Component:**
- Clear error messages
- Retry options
- Help links
- Recovery suggestions

### 5.6 Interactive Components
**Pagination Component:**
- Previous/Next navigation
- Page number display
- Keyboard accessibility
- Responsive design

**Sorting Component:**
- Multiple sort options
- Visual sort indicators
- Active state indication
- Accessibility labels

**Search Component:**
- Real-time search z debouncing
- Highlighted matches
- No results state
- Search suggestions

### 5.7 Feedback Components
**Toast Component:**
- Success/error/warning/info types
- Auto-dismiss z manual close
- Stackable notifications
- Accessible announcements

**Alert Component:**
- Page-level notifications
- Dismissible options
- Action buttons
- Context-aware styling

### 5.8 Layout Components
**Container Component:**
- Responsive max-width
- Consistent padding
- Centered layout
- Breakpoint-aware

**Grid Component:**
- CSS Grid implementation
- Responsive columns
- Consistent gaps
- Flexible alignment

**Card Component:**
- Consistent styling
- Hover effects
- Semantic structure
- Focus management

### 5.9 Utility Components
**Button Component:**
- Multiple variants (primary, secondary, destructive)
- Size options (small, medium, large)
- State handling (loading, disabled)
- Accessibility features

**Input Component:**
- Type variants (text, email, password, date)
- Validation states
- Error messaging
- Help text support

**Badge Component:**
- Status indicators
- Count displays
- Color coding
- Size variants

### 5.10 Advanced Components
**DateRangePicker Component:**
- Start/end date selection
- Validation constraints
- Calendar popup
- Keyboard navigation

**FileUpload Component:**
- Drag and drop support
- File type validation
- Progress indicators
- Preview functionality

### 5.11 Accessibility Features
**Focus Management:**
- Visible focus indicators
- Focus trap w modals
- Skip links
- Logical tab order

**Screen Reader Support:**
- ARIA labels i descriptions
- Live regions dla dynamic content
- Semantic HTML structure
- Alt text dla images

**Keyboard Navigation:**
- All interactive elements accessible
- Keyboard shortcuts
- Escape key handling
- Arrow key navigation

### 5.12 Performance Optimizations
**Lazy Loading:**
- Images below the fold
- Non-critical components
- Route-based code splitting
- Progressive enhancement

**Caching:**
- API response caching
- Component state persistence
- User preferences storage
- LocalStorage utilization

**Optimistic Updates:**
- Immediate UI feedback
- Rollback on error
- Loading states
- Smooth transitions

---

**Dokument wersja:** 1.0  
**Data utworzenia:** 2025-01-15  
**Status:** Gotowy do implementacji ✅  
**Zgodność z PRD:** Pełna zgodność z wymaganiami minimalnymi  
**Zgodność z API:** Pełna integracja z planowanymi endpointami  
**Zgodność z Session Notes:** Wszystkie rekomendacje uwzględnione
