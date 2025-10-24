# Implementacja Nawigacji z Uwierzytelnianiem

## 📋 Przegląd

Rozbudowano Layout.astro o inteligentną nawigację, która reaguje na stan uwierzytelnienia użytkownika zgodnie z najlepszymi praktykami Astro i React.

---

## 🏗️ Architektura

### **1. Layout.astro** - Główny layout aplikacji
**Lokalizacja**: `src/layouts/Layout.astro`

**Zmiany**:
- ✅ Dodano komponent `<Navigation />` (server-side rendered)
- ✅ Props: `showNavigation?: boolean` - pozwala ukryć nawigację na wybranych stronach
- ✅ Meta tags: description, lang="pl"
- ✅ Domyślny tytuł: "VibeTravels"

**Przykład użycia**:
```astro
<!-- Nawigacja widoczna (domyślnie) -->
<Layout title="Moje plany">
  <main>...</main>
</Layout>

<!-- Nawigacja ukryta (np. landing page) -->
<Layout title="Witaj" showNavigation={false}>
  <main>...</main>
</Layout>
```

---

### **2. Navigation.astro** - Server-side nawigacja
**Lokalizacja**: `src/components/navigation/Navigation.astro`

**Funkcjonalność**:
- ✅ **Server-side session check**: Sprawdza `Astro.locals.supabase.auth.getSession()`
- ✅ **Conditional rendering**:
  - **Zalogowany użytkownik**: Link "Moje plany" + `<UserMenu />`
  - **Niezalogowany**: Linki "Zaloguj się" + "Zarejestruj się"
- ✅ **Logo**: Link do strony głównej "VibeTravels"
- ✅ **Responsive design**: Tailwind CSS z max-width container

**Zgodność z astro.mdc**:
- ✅ Server-side rendering (SSR)
- ✅ Używa `Astro.locals.supabase` (z middleware)
- ✅ React component z `client:only="react"` dla interaktywności

---

### **3. UserMenu.tsx** - Interaktywne menu użytkownika
**Lokalizacja**: `src/components/navigation/UserMenu.tsx`

**Funkcjonalność**:
- ✅ **Avatar z inicjałem** użytkownika (pierwsza litera email)
- ✅ **Dropdown menu** z:
  - Email użytkownika (skrócony z `truncate`)
  - Przycisk "Wyloguj się" z loading state
- ✅ **Click outside to close** (React useEffect + mousedown event)
- ✅ **Keyboard navigation** (Escape zamyka menu)
- ✅ **Logout handler**:
  - `supabaseClient.auth.signOut()`
  - Redirect do `/auth/login` po sukcesie
  - Error handling z alert (można rozbudować o toast)

**Zgodność z react.mdc**:
- ✅ Functional component z hooks
- ✅ `useCallback` dla event handlers (performance)
- ✅ `useEffect` dla side effects (click outside, keyboard)
- ✅ `useRef` dla DOM reference
- ✅ Custom logic extracted (nie w JSX)
- ✅ Brak Next.js directives ("use client")

**Accessibility**:
- ✅ `aria-expanded`, `aria-haspopup`, `aria-label`
- ✅ `role="menu"`, `role="menuitem"`
- ✅ Keyboard support (Escape)
- ✅ Focus management

---

## 🎨 Styling

### **Tailwind Classes**
- Używa standard Tailwind CSS (nie CSS variables Fluent)
- Responsive: `sm:`, `md:`, `lg:` breakpoints
- Colors: `gray-*`, `blue-*` palette
- Spacing: standard Tailwind spacing scale

### **Animacja fadeIn**
**Lokalizacja**: `src/styles/global.css` (linia ~388)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}
```

**Zastosowanie**: Dropdown menu w `UserMenu.tsx`

---

## 🔄 User Flows

### **Flow 1: Niezalogowany użytkownik**
```
1. User wchodzi na stronę (np. /)
2. Navigation.astro sprawdza session → null
3. Renderuje:
   - Logo "VibeTravels"
   - Link "Zaloguj się" → /auth/login
   - Przycisk "Zarejestruj się" → /auth/signup (blue CTA)
```

### **Flow 2: Zalogowany użytkownik**
```
1. User wchodzi na stronę (np. /trips)
2. Navigation.astro sprawdza session → User object
3. Renderuje:
   - Logo "VibeTravels"
   - Link "Moje plany" → /trips
   - UserMenu z avatar (inicjał email)
```

### **Flow 3: Wylogowanie**
```
1. User klika na avatar w UserMenu
2. Menu dropdown się otwiera (fadeIn animation)
3. User klika "Wyloguj się"
4. UserMenu.tsx:
   - setIsLoggingOut(true) → pokazuje spinner
   - supabaseClient.auth.signOut()
   - window.location.href = '/auth/login'
5. Middleware przekierowuje do /auth/login
6. Session cleared
```

### **Flow 4: Click outside to close**
```
1. User klika na avatar → menu się otwiera
2. User klika poza menu (document)
3. useEffect handler wykrywa kliknięcie outside menuRef
4. setIsOpen(false) → menu się zamyka
```

---

## 🧪 Jak przetestować

### **Test 1: Niezalogowany użytkownik**
1. Wyloguj się lub otwórz incognito
2. Wejdź na `http://localhost:4321/`
3. **Oczekiwane**:
   - ✅ Logo "VibeTravels" (link do /)
   - ✅ Link "Zaloguj się"
   - ✅ Przycisk "Zarejestruj się" (niebieski)
   - ❌ BRAK avatara/menu użytkownika

### **Test 2: Zalogowany użytkownik**
1. Zaloguj się (lub zarejestruj)
2. Wejdź na `/trips`
3. **Oczekiwane**:
   - ✅ Logo "VibeTravels"
   - ✅ Link "Moje plany"
   - ✅ Avatar z inicjałem (np. "T" dla test@example.com)
   - ✅ Chevron icon obok avatara
   - ❌ BRAK linków "Zaloguj się" / "Zarejestruj się"

### **Test 3: Dropdown menu**
1. Zalogowany → kliknij avatar
2. **Oczekiwane**:
   - ✅ Menu dropdown pojawia się (fadeIn animation)
   - ✅ Tekst "Zalogowany jako"
   - ✅ Email użytkownika (pełny)
   - ✅ Przycisk "Wyloguj się" z ikoną
   - ✅ Chevron obrócony o 180° (rotate-180)

### **Test 4: Click outside**
1. Otwórz menu dropdown (klik avatar)
2. Kliknij gdziekolwiek poza menu
3. **Oczekiwane**:
   - ✅ Menu się zamyka

### **Test 5: Escape key**
1. Otwórz menu dropdown
2. Naciśnij klawisz Escape
3. **Oczekiwane**:
   - ✅ Menu się zamyka

### **Test 6: Wylogowanie**
1. Otwórz menu dropdown
2. Kliknij "Wyloguj się"
3. **Oczekiwane**:
   - ✅ Przycisk zmienia się na "Wylogowywanie..." + spinner
   - ✅ Przycisk disabled (cursor-not-allowed)
   - ✅ Po ~1s redirect do `/auth/login`
   - ✅ Session cleared (sprawdź przez ponowne wejście na /trips)

### **Test 7: Ukrywanie nawigacji**
1. Stwórz stronę testową:
   ```astro
   ---
   import Layout from '@/layouts/Layout.astro';
   ---
   <Layout title="Test" showNavigation={false}>
     <main>No navigation here!</main>
   </Layout>
   ```
2. **Oczekiwane**:
   - ✅ Nawigacja NIE renderuje się
   - ✅ Tylko content z `<slot />`

---

## 📊 Zgodność z wymaganiami

### **US-003: Wylogowanie** ✅
- [x] Przycisk "Logout" widoczny w nawigacji (w UserMenu)
- [x] Kliknięcie wylogowuje użytkownika
- [x] Przekierowanie do strony logowania
- [x] Sesja jest zakończona (brak dostępu do protected routes)

### **Astro.mdc** ✅
- [x] Server-side rendering w Navigation.astro
- [x] Używa `Astro.locals.supabase` z middleware
- [x] React component z `client:only="react"`
- [x] No "use client" directives

### **React.mdc** ✅
- [x] Functional components z hooks
- [x] Custom hooks dla logic (`useEffect`, `useCallback`, `useRef`)
- [x] `useCallback` dla event handlers (performance)
- [x] Proper cleanup w `useEffect` (return functions)
- [x] No Next.js directives

---

## 🔧 Możliwe rozszerzenia

### **1. Toast notifications zamiast alert()**
```tsx
// Zamiast:
alert('Wystąpił błąd podczas wylogowania');

// Użyj:
import { toast } from '@/lib/toast'; // np. sonner lub react-hot-toast
toast.error('Wystąpił błąd podczas wylogowania');
```

### **2. Dodatkowe linki w menu**
```tsx
{/* W UserMenu dropdown, przed Logout button */}
<a href="/settings" className="...">
  Ustawienia
</a>
<a href="/profile" className="...">
  Mój profil
</a>
```

### **3. Badge z liczbą planów**
```tsx
{/* W Navigation.astro */}
<a href="/trips" class="...">
  Moje plany
  <span class="badge">{tripsCount}</span>
</a>
```

### **4. Dark mode toggle**
```tsx
{/* W UserMenu dropdown */}
<button onClick={toggleDarkMode} className="...">
  {isDark ? '🌙' : '☀️'} Zmień motyw
</button>
```

---

## 📝 Checklist implementacji

- [x] Layout.astro rozbudowany o Navigation
- [x] Navigation.astro z server-side session check
- [x] UserMenu.tsx z interaktywnym dropdown
- [x] Animacja fadeIn w global.css
- [x] Click outside to close
- [x] Keyboard navigation (Escape)
- [x] Logout handler z loading state
- [x] Accessibility attributes (ARIA)
- [x] Responsive design
- [x] Error handling w logout
- [x] Zgodność z astro.mdc
- [x] Zgodność z react.mdc
- [x] US-003 spełnione

---

**Status**: Gotowe do testowania! 🚀

**Next steps**: Przetestuj lokalnie według sekcji "Jak przetestować" ↑
