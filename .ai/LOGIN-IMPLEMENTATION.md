# Login System - Implementation Guide

## ✅ Implementacja zakończona

System logowania został zaimplementowany z Supabase Auth.

---

## 📦 Utworzone pliki

### 1. **LoginForm Component**
**Plik:** `src/components/forms/LoginForm.tsx`

**Features:**
- Email/Password authentication
- Real-time error handling
- Loading state
- Auto-redirect after successful login
- Link do rejestracji (placeholder)

### 2. **Login Page**
**Plik:** `src/pages/auth/login.astro`

**Features:**
- Gradient background
- Responsive design
- Support dla `?redirect` query param
- Dev mode debug info

### 3. **useAuth Hook**
**Plik:** `src/hooks/useAuth.ts`

**Exports:**
- `useAuth()` - sprawdzanie stanu autentykacji
- `useRequireAuth(redirectTo)` - auto-redirect jeśli nie zalogowany

**Features:**
- Real-time session monitoring
- Auth state change listener
- Sign out functionality

### 4. **Auth Guard w TripForm**
**Modified:** `src/components/forms/TripForm.tsx`

**Changes:**
- Import `useRequireAuth` hook
- Sprawdzenie autentykacji przed renderowaniem
- Loading state podczas sprawdzania
- Auto-redirect do `/auth/login?redirect=/trips/new`

### 5. **Navigation Links**
**Modified:** `src/components/Welcome.astro`

**Changes:**
- Dodano przycisk "Sign In" (purple)
- Przycisk "Create New Trip" (blue)
- Responsive layout (vertical on mobile, horizontal on desktop)

---

## 🚀 Jak przetestować

### **Scenariusz 1: Logowanie z istniejącym użytkownikiem**

1. **Uruchom dev server:**
   ```bash
   cd 10x-astro-starter
   npm run dev
   ```

2. **Otwórz aplikację:**
   ```
   http://localhost:3000
   ```

3. **Kliknij "Sign In"**
   - Powinieneś zobaczyć stronę logowania

4. **Wypełnij formularz:**
   - Email: `twoj-email@example.com` (użytkownik z Supabase)
   - Password: `twoje-haslo`

5. **Kliknij "Sign In"**
   - ✅ Powinien pojawić się spinner: "Signing in..."
   - ✅ Przekierowanie do strony głównej `/`

6. **Sprawdź konsolę przeglądarki:**
   ```
   [LoginForm] Attempting login with email: twoj-email@example.com
   [LoginForm] Login successful: { user: {...}, session: {...} }
   ```

---

### **Scenariusz 2: Próba dostępu do /trips/new bez logowania**

1. **Otwórz w nowej karcie incognito:**
   ```
   http://localhost:3000/trips/new
   ```

2. **Oczekiwane zachowanie:**
   - ✅ Krótkie wyświetlenie "Checking authentication..."
   - ✅ Auto-redirect do `/auth/login?redirect=/trips/new`

3. **Zaloguj się:**
   - Wypełnij formularz i kliknij "Sign In"
   - ✅ Po zalogowaniu przekierowanie z powrotem do `/trips/new`

4. **Sprawdź konsolę:**
   ```
   [useAuth] Checking authentication status...
   [useAuth] Session: NOT AUTHENTICATED
   [useRequireAuth] Not authenticated, redirecting to: /auth/login
   ```

---

### **Scenariusz 3: Błędne dane logowania**

1. **Otwórz `/auth/login`**

2. **Wypełnij formularz z błędnymi danymi:**
   - Email: `test@example.com`
   - Password: `wrongpassword`

3. **Kliknij "Sign In"**

4. **Oczekiwane zachowanie:**
   - ✅ Error alert: "Invalid email or password. Please try again."
   - ✅ Przycisk wraca do stanu "Sign In"
   - ✅ Formularz pozostaje wypełniony

5. **Zacznij pisać w polu:**
   - ✅ Error alert powinien zniknąć

---

### **Scenariusz 4: Flow "Create New Trip" z logowaniem**

1. **Otwórz stronę główną** (incognito/wylogowany)
   ```
   http://localhost:3000
   ```

2. **Kliknij "Create New Trip"**
   - ✅ Redirect do `/auth/login?redirect=/trips/new`

3. **Zaloguj się**
   - ✅ Po sukcesie redirect do `/trips/new`

4. **Wypełnij formularz:**
   - Destination: "Paris, France"
   - Start Date: 2025-12-01
   - End Date: 2025-12-07
   - Description: "Test trip"

5. **Kliknij "Create Trip"**
   - ✅ Hook `useCreateTrip` powinien teraz działać poprawnie
   - ✅ W konsoli: `[useCreateTrip] Access token retrieved: YES`

---

## 🔍 Debugging

### Sprawdź konsolę przeglądarki

Powinieneś widzieć sekwencję logów:

#### **Przy wejściu na /trips/new (niezalogowany):**
```
[useAuth] Checking authentication status...
[useAuth] Session: NOT AUTHENTICATED
[useRequireAuth] Not authenticated, redirecting to: /auth/login
```

#### **Przy logowaniu:**
```
[LoginForm] Attempting login with email: user@example.com
[LoginForm] Login successful: { user: {...}, session: {...} }
```

#### **Po zalogowaniu - wejście na /trips/new:**
```
[useAuth] Checking authentication status...
[useAuth] Session: AUTHENTICATED
```

#### **Przy submit formularza:**
```
[useCreateTrip] Starting createTrip with data: {...}
[useCreateTrip] Getting access token...
[useCreateTrip] Access token retrieved: YES
[useCreateTrip] Making API request...
```

---

## 🛠️ Konfiguracja Supabase

Upewnij się, że masz skonfigurowane:

### **1. Environment Variables**
Plik `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### **2. Email Auth w Supabase**

W Supabase Dashboard:
1. **Authentication → Providers**
2. Sprawdź czy **Email** provider jest włączony
3. **Email Confirm** - możesz wyłączyć dla testów

### **3. Użytkownik testowy**

Jeśli nie masz użytkownika, utwórz go w Supabase Dashboard:
1. **Authentication → Users**
2. Kliknij "Add user"
3. Podaj email i password
4. Kliknij "Create user"

Lub użyj SQL:
```sql
-- W Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
);
```

---

## 🎯 Co zostało zaimplementowane

### ✅ Login Flow
- [x] Strona logowania `/auth/login`
- [x] LoginForm component
- [x] Supabase Auth integration
- [x] Error handling
- [x] Redirect after login
- [x] Query param `?redirect` support

### ✅ Auth Guard
- [x] `useAuth` hook
- [x] `useRequireAuth` hook
- [x] Auto-redirect jeśli nie zalogowany
- [x] Loading state podczas sprawdzania auth
- [x] TripForm protected

### ✅ Navigation
- [x] Link "Sign In" na home page
- [x] Link "Create New Trip" na home page
- [x] Responsive buttons

### ✅ Integration
- [x] useCreateTrip używa Supabase session token
- [x] Logi debug w konsoli
- [x] Error handling w całym flow

---

## ⏭️ TODO (nie w tym zakresie)

### Registration Page
- [ ] `/auth/register` strona
- [ ] RegisterForm component
- [ ] Email confirmation flow

### Profile Management
- [ ] `/profile` strona
- [ ] Wyświetlanie danych użytkownika
- [ ] Sign out button

### Password Reset
- [ ] "Forgot password" link
- [ ] Password reset flow

### Social Auth (opcjonalne)
- [ ] Google OAuth
- [ ] GitHub OAuth

---

## 📊 Architecture

```
┌─────────────────┐
│   Home Page     │
│   (/)           │
└────────┬────────┘
         │
         ├─ Click "Sign In"
         │  └─> /auth/login
         │
         └─ Click "Create New Trip"
            └─> /trips/new
                 │
                 ├─ useRequireAuth()
                 │  ├─ isAuthenticated: false
                 │  └─> redirect to /auth/login?redirect=/trips/new
                 │
                 └─ isAuthenticated: true
                    └─> Render TripForm
                         └─> useCreateTrip()
                              └─> getAccessToken() from Supabase session
```

---

## 🐛 Known Issues / Limitations

### 1. **Brak strony rejestracji**
- Link "Register here" w LoginForm prowadzi do `/auth/register`
- Ta strona nie istnieje (TODO)
- Użytkownicy muszą być utworzeni w Supabase Dashboard

### 2. **Brak sign out button**
- Nie ma UI do wylogowania
- Można wylogować się przez console: `supabaseClient.auth.signOut()`

### 3. **Session persistence**
- Session jest przechowywana w localStorage przez Supabase
- Auto-refresh token działa out-of-the-box

### 4. **Email confirmation**
- Jeśli włączone w Supabase, będzie wymagana
- Dla testów można wyłączyć

---

## 🎉 Gotowe do testowania!

**Instrukcje:**
1. Upewnij się, że masz użytkownika w Supabase
2. Sprawdź env variables (SUPABASE_URL, SUPABASE_KEY)
3. Uruchom `npm run dev`
4. Kliknij "Sign In" na home page
5. Zaloguj się
6. Kliknij "Create New Trip"
7. Formularz powinien działać bez zawieszania się! 🚀

**Jeśli masz problemy:**
- Sprawdź konsolę przeglądarki (F12)
- Sprawdź Network tab (czy request do Supabase auth jest wysyłany)
- Sprawdź Supabase Dashboard → Authentication → Users

---

## 📝 Summary

**Status:** ✅ READY FOR TESTING

**Files created:** 3 new files
**Files modified:** 2 files
**Total code:** ~450 lines

**Czas implementacji:** ~20 minut

**Next step:** Test login flow i zgłoś wyniki! 🎯
