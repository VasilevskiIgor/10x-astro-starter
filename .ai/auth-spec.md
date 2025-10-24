# Specyfikacja Techniczna - Moduł Autentykacji VibeTravels

**Wersja:** 1.0
**Data:** 22 października 2025
**Status:** Draft - Do Implementacji

---

## Spis treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura Interfejsu Użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika Backendowa](#3-logika-backendowa)
4. [System Autentykacji](#4-system-autentykacji)
5. [Przepływy Użytkownika](#5-przepływy-użytkownika)
6. [Obsługa Błędów i Walidacja](#6-obsługa-błędów-i-walidacja)
7. [Bezpieczeństwo](#7-bezpieczeństwo)
8. [Struktura Plików](#8-struktura-plików)

---

## 1. Wprowadzenie

### 1.1 Cel dokumentu

Niniejsza specyfikacja definiuje szczegółową architekturę modułu autentykacji dla aplikacji VibeTravels, obejmującego funkcjonalności rejestracji, logowania, wylogowania i odzyskiwania hasła użytkowników.

### 1.2 Zakres funkcjonalny

Zgodnie z wymaganiami z `prd.md`, moduł realizuje następujące user stories:

- **US-001**: Rejestracja użytkownika (FR-001)
- **US-002**: Logowanie użytkownika (FR-002)
- **US-003**: Wylogowanie użytkownika (FR-003)
- **US-011**: Ochrona protected routes
- **US-012**: Ochrona planów innych użytkowników

### 1.3 Ograniczenia i założenia

- **Minimalny zakres MVP**: Email/hasło jako jedyna metoda autentykacji (bez Google OAuth)
- **Backend**: Supabase Auth jako dostawca autentykacji
- **Framework**: Astro 5 w trybie SSR (`output: "server"`)
- **Komponenty interaktywne**: React 19 (bez dyrektyw Next.js)
- **Styling**: Tailwind CSS 4 + Shadcn/ui
- **Walidacja**: Brak formalnej biblioteki schema validation (implementacja manualna)

### 1.4 Ważne uwagi dotyczące zgodności z PRD

**⚠️ ROZBIEŻNOŚCI Z PRD - WYMAGANE DECYZJE:**

1. **Routing URL**:
   - **PRD używa**: `/signup`, `/login`, `/dashboard`
   - **Auth-Spec używa**: `/auth/signup`, `/auth/login`, `/trips`
   - **DECYZJA**: Dla zachowania spójności z obecną strukturą projektu (gdzie już istnieje `/auth/login`), **zalecamy pozostać przy** `/auth/*` dla stron autentykacji. Dashboard może pozostać jako `/trips` (bardziej RESTful).
   - **ALTERNATYWA**: Można zmienić na routing z PRD - wymaga refactoringu istniejących plików.

2. **Password Reset**:
   - **PRD**: Nie wspomina o password reset w zakresie minimalnym
   - **Auth-Spec**: Zawiera pełną specyfikację (4 komponenty)
   - **DECYZJA**: Password Reset oznaczony jako **OPCJONALNY** (nice to have). Może być pominięty w MVP minimum, ale jest wartościowy dla UX.

3. **Nazwa tabeli/route**:
   - **PRD**: Konsekwentnie używa `dashboard` jako nazwy strony głównej
   - **Auth-Spec + Istniejący kod**: Używa `/trips` jako głównej ścieżki
   - **DECYZJA**: `/trips` jest poprawne - to nie dashboard, to lista planów podróży (RESTful API convention).

---

## 2. Architektura Interfejsu Użytkownika

### 2.1 Struktura stron (Astro Pages)

#### 2.1.1 Strona rejestracji: `/auth/signup`

**Plik**: `src/pages/auth/signup.astro`

**Odpowiedzialności**:
- Renderowanie layoutu strony rejestracji (SSR)
- Osadzenie komponentu React `SignupForm` z dyrektywą `client:only="react"`
- Obsługa parametru URL `?redirect=<path>` dla przekierowania po sukcesie
- Przekierowanie zalogowanych użytkowników do dashboardu (sprawdzenie sesji server-side)

**Struktura strony**:
```astro
---
import Layout from '@/layouts/Layout.astro';
import { SignupForm } from '@/components/forms/SignupForm';

// Server-side check: jeśli użytkownik już zalogowany, przekieruj do dashboardu
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect('/trips');
}

// Pobierz URL przekierowania z query params
const url = new URL(Astro.request.url);
const redirectTo = url.searchParams.get('redirect') || '/trips';
---

<Layout title="Utwórz konto - VibeTravels">
  <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Utwórz konto</h1>
        <p class="mt-2 text-sm text-gray-600">
          Zacznij planować swoje wymarzone podróże
        </p>
      </div>

      <!-- Signup Form Card -->
      <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <SignupForm client:only="react" redirectTo={redirectTo} />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Masz już konto?{' '}
          <a href="/auth/login" class="text-blue-600 hover:text-blue-700 font-semibold">
            Zaloguj się
          </a>
        </p>
      </div>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
          ← Wróć do strony głównej
        </a>
      </div>
    </div>
  </main>
</Layout>
```

**Kryteria akceptacji**:
- ✅ Niezalogowany użytkownik widzi formularz rejestracji
- ✅ Zalogowany użytkownik jest automatycznie przekierowany do `/trips`
- ✅ Parametr `?redirect=` jest przekazywany do komponentu formularza
- ✅ Responsywny design (mobile-first)

---

#### 2.1.2 Strona logowania: `/auth/login`

**Plik**: `src/pages/auth/login.astro`

**Odpowiedzialności**:
- Renderowanie layoutu strony logowania (SSR)
- Osadzenie komponentu React `LoginForm` z dyrektywą `client:only="react"`
- Obsługa parametru URL `?redirect=<path>` dla przekierowania po sukcesie
- Przekierowanie zalogowanych użytkowników do dashboardu (sprawdzenie sesji server-side)
- Link do strony odzyskiwania hasła

**Struktura strony**:
```astro
---
import Layout from '@/layouts/Layout.astro';
import { LoginForm } from '@/components/forms/LoginForm';

// Server-side check: jeśli użytkownik już zalogowany, przekieruj
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect('/trips');
}

const url = new URL(Astro.request.url);
const redirectTo = url.searchParams.get('redirect') || '/trips';
---

<Layout title="Zaloguj się - VibeTravels">
  <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Witaj ponownie</h1>
        <p class="mt-2 text-sm text-gray-600">
          Zaloguj się do swojego konta
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <LoginForm client:only="react" redirectTo={redirectTo} />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 space-y-3 text-center">
        <p class="text-sm text-gray-600">
          Nie masz konta?{' '}
          <a href="/auth/signup" class="text-blue-600 hover:text-blue-700 font-semibold">
            Zarejestruj się
          </a>
        </p>

        <p class="text-sm">
          <a href="/auth/forgot-password" class="text-gray-600 hover:text-gray-900">
            Nie pamiętasz hasła?
          </a>
        </p>
      </div>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-gray-500 hover:text-gray-700">
          ← Wróć do strony głównej
        </a>
      </div>
    </div>
  </main>
</Layout>
```

**Kryteria akceptacji**:
- ✅ Niezalogowany użytkownik widzi formularz logowania
- ✅ Zalogowany użytkownik jest automatycznie przekierowany
- ✅ Link do strony rejestracji i odzyskiwania hasła
- ✅ Parametr `redirect` jest zachowany

---

#### 2.1.3 Strona odzyskiwania hasła: `/auth/forgot-password`

**Plik**: `src/pages/auth/forgot-password.astro`

**Odpowiedzialności**:
- Renderowanie layoutu strony resetowania hasła
- Osadzenie komponentu React `ForgotPasswordForm`
- Wyświetlenie komunikatu o wysłaniu emaila z linkiem resetującym

**Struktura strony**:
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
---

<Layout title="Resetowanie hasła - VibeTravels">
  <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Nie pamiętasz hasła?</h1>
        <p class="mt-2 text-sm text-gray-600">
          Wyślemy Ci link do resetowania hasła
        </p>
      </div>

      <!-- Forgot Password Form Card -->
      <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <ForgotPasswordForm client:only="react" />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center">
        <a href="/auth/login" class="text-sm text-gray-600 hover:text-gray-900">
          ← Wróć do logowania
        </a>
      </div>
    </div>
  </main>
</Layout>
```

---

#### 2.1.4 Strona resetowania hasła: `/auth/reset-password`

**Plik**: `src/pages/auth/reset-password.astro`

**Odpowiedzialności**:
- Renderowanie layoutu strony ustawienia nowego hasła
- Walidacja tokenu z URL (`?token=...`)
- Osadzenie komponentu React `ResetPasswordForm`
- Obsługa wygasłego/nieprawidłowego tokenu

**Struktura strony**:
```astro
---
import Layout from '@/layouts/Layout.astro';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

// Pobierz token z URL
const url = new URL(Astro.request.url);
const accessToken = url.searchParams.get('access_token');
const type = url.searchParams.get('type');

// Sprawdź czy to jest link recovery
if (!accessToken || type !== 'recovery') {
  return Astro.redirect('/auth/login?error=invalid_token');
}
---

<Layout title="Ustaw nowe hasło - VibeTravels">
  <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Ustaw nowe hasło</h1>
        <p class="mt-2 text-sm text-gray-600">
          Wprowadź nowe hasło do swojego konta
        </p>
      </div>

      <!-- Reset Password Form Card -->
      <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
        <ResetPasswordForm client:only="react" accessToken={accessToken} />
      </div>
    </div>
  </main>
</Layout>
```

---

### 2.2 Komponenty React (Client-side)

#### 2.2.1 Komponent `SignupForm`

**Plik**: `src/components/forms/SignupForm.tsx`

**Props**:
```typescript
interface SignupFormProps {
  redirectTo?: string; // Domyślnie: '/trips'
}
```

**State**:
```typescript
interface SignupFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

**Odpowiedzialności**:
- Renderowanie formularza z polami: email, password, confirmPassword
- Walidacja client-side przed wysłaniem:
  - Email: format email (regex)
  - Password: min 8 znaków
  - ConfirmPassword: zgodność z password
- Wysłanie żądania rejestracji do Supabase Auth
- Obsługa błędów (email już istnieje, słabe hasło, błąd serwera)
- Automatyczne logowanie po sukcesie i przekierowanie do `redirectTo`
- Loading state podczas rejestracji

**Schemat walidacji**:
```typescript
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email jest wymagany';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Nieprawidłowy format email';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Hasło jest wymagane';
  if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków';
  return null;
};

const validatePasswordMatch = (password: string, confirm: string): string | null => {
  if (password !== confirm) return 'Hasła nie pasują do siebie';
  return null;
};
```

**Integracja z Supabase**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Walidacja client-side
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const matchError = validatePasswordMatch(password, confirmPassword);

  if (emailError || passwordError || matchError) {
    setError(emailError || passwordError || matchError);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) throw error;

    // Sukcesowa rejestracja
    // Uwaga: Supabase może wymagać potwierdzenia email - sprawdź konfigurację
    if (data.session) {
      // Auto-login successful
      setSuccessMessage('Konto utworzone! Przekierowujemy...');
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1500);
    } else {
      // Email confirmation required
      setSuccessMessage('Konto utworzone! Sprawdź email, aby potwierdzić rejestrację.');
    }
  } catch (error: any) {
    // Obsługa błędów Supabase
    if (error.message?.includes('already registered')) {
      setError('Ten adres email jest już zarejestrowany');
    } else if (error.message?.includes('password')) {
      setError('Hasło jest zbyt słabe. Użyj silniejszego hasła.');
    } else {
      setError(error.message || 'Wystąpił błąd podczas rejestracji');
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Struktura UI**:
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Error Alert */}
  {error && (
    <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />
  )}

  {/* Success Alert */}
  {successMessage && (
    <ErrorAlert type="success" message={successMessage} />
  )}

  {/* Email Field */}
  <div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
      Email <span className="text-red-600" aria-label="wymagane">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      disabled={isLoading}
      required
      autoComplete="email"
      placeholder="twoj@email.com"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      aria-describedby="email-error"
    />
  </div>

  {/* Password Field */}
  <div>
    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
      Hasło <span className="text-red-600" aria-label="wymagane">*</span>
    </label>
    <input
      type="password"
      id="password"
      name="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      disabled={isLoading}
      required
      autoComplete="new-password"
      placeholder="Min. 8 znaków"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      aria-describedby="password-error"
    />
  </div>

  {/* Confirm Password Field */}
  <div>
    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
      Potwierdź hasło <span className="text-red-600" aria-label="wymagane">*</span>
    </label>
    <input
      type="password"
      id="confirmPassword"
      name="confirmPassword"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      disabled={isLoading}
      required
      autoComplete="new-password"
      placeholder="Powtórz hasło"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    />
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    disabled={isLoading || !email || !password || !confirmPassword}
    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <>
        <Spinner className="mr-2" />
        Rejestracja...
      </>
    ) : (
      'Utwórz konto'
    )}
  </button>
</form>
```

---

#### 2.2.2 Komponent `LoginForm`

**Plik**: `src/components/forms/LoginForm.tsx`

**Props**:
```typescript
interface LoginFormProps {
  redirectTo?: string; // Domyślnie: '/trips'
}
```

**State**:
```typescript
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**Odpowiedzialności**:
- Renderowanie formularza z polami: email, password
- Walidacja client-side przed wysłaniem (format email)
- Wysłanie żądania logowania do Supabase Auth
- Obsługa błędów (nieprawidłowe dane, email niepotwierdzony)
- Przekierowanie do `redirectTo` po sukcesie
- Loading state podczas logowania

**Integracja z Supabase**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsLoading(true);
  setError(null);

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Sukces - przekieruj
    window.location.href = redirectTo;
  } catch (error: any) {
    // Obsługa błędów
    if (error.message?.includes('Invalid login credentials')) {
      setError('Nieprawidłowy email lub hasło');
    } else if (error.message?.includes('Email not confirmed')) {
      setError('Potwierdź swój adres email przed zalogowaniem');
    } else {
      setError(error.message || 'Wystąpił błąd podczas logowania');
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Struktura UI**: Podobna do `SignupForm`, ale z dwoma polami (email, password)

---

#### 2.2.3 Komponent `ForgotPasswordForm`

**Plik**: `src/components/forms/ForgotPasswordForm.tsx`

**Props**: Brak

**State**:
```typescript
interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

**Odpowiedzialności**:
- Renderowanie formularza z polem: email
- Walidacja email (format)
- Wysłanie żądania resetowania hasła do Supabase Auth
- Wyświetlenie komunikatu sukcesu (email został wysłany)
- Obsługa błędów

**Integracja z Supabase**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const emailError = validateEmail(email);
  if (emailError) {
    setError(emailError);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    setSuccessMessage('Link do resetowania hasła został wysłany na Twój email');
  } catch (error: any) {
    setError(error.message || 'Wystąpił błąd podczas wysyłania emaila');
  } finally {
    setIsLoading(false);
  }
};
```

---

#### 2.2.4 Komponent `ResetPasswordForm`

**Plik**: `src/components/forms/ResetPasswordForm.tsx`

**Props**:
```typescript
interface ResetPasswordFormProps {
  accessToken: string; // Token z URL
}
```

**State**:
```typescript
interface ResetPasswordFormState {
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

**Odpowiedzialności**:
- Renderowanie formularza z polami: newPassword, confirmPassword
- Walidacja hasła (min 8 znaków, zgodność)
- Wysłanie żądania aktualizacji hasła do Supabase Auth
- Przekierowanie do logowania po sukcesie
- Obsługa błędów (token wygasł, słabe hasło)

**Integracja z Supabase**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const passwordError = validatePassword(newPassword);
  const matchError = validatePasswordMatch(newPassword, confirmPassword);

  if (passwordError || matchError) {
    setError(passwordError || matchError);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // Najpierw ustaw sesję z tokena
    const { error: sessionError } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Nie potrzebne dla recovery
    });

    if (sessionError) throw sessionError;

    // Następnie zaktualizuj hasło
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    setSuccessMessage('Hasło zostało zmienione! Przekierowujemy do logowania...');
    setTimeout(() => {
      window.location.href = '/auth/login?success=password_reset';
    }, 2000);
  } catch (error: any) {
    if (error.message?.includes('expired')) {
      setError('Link wygasł. Wygeneruj nowy link resetujący.');
    } else {
      setError(error.message || 'Wystąpił błąd podczas zmiany hasła');
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

### 2.3 Komponent nawigacji z obsługą użytkownika

#### 2.3.1 Aktualizacja `Header.astro` lub `Navigation.astro`

**Plik**: `src/components/Navigation.astro` (nowy lub istniejący)

**Odpowiedzialności**:
- Renderowanie nawigacji z danymi użytkownika (server-side)
- Wyświetlenie przycisku "Zaloguj się" / "Zarejestruj się" dla niezalogowanych
- Wyświetlenie menu użytkownika (email, wyloguj) dla zalogowanych
- Komponent React dla interaktywnego menu dropdown

**Struktura**:
```astro
---
// Server-side: Pobierz sesję użytkownika
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
const user = session?.user;
---

<nav class="bg-white shadow-sm border-b">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      {/* Logo */}
      <a href="/" class="text-xl font-bold text-blue-600">
        VibeTravels
      </a>

      {/* Navigation Links */}
      <div class="flex items-center space-x-4">
        {user ? (
          <>
            <a href="/trips" class="text-gray-700 hover:text-gray-900">
              Moje plany
            </a>
            <UserMenu client:only="react" user={user} />
          </>
        ) : (
          <>
            <a href="/auth/login" class="text-gray-700 hover:text-gray-900">
              Zaloguj się
            </a>
            <a
              href="/auth/signup"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Zarejestruj się
            </a>
          </>
        )}
      </div>
    </div>
  </div>
</nav>
```

#### 2.3.2 Komponent `UserMenu` (React)

**Plik**: `src/components/navigation/UserMenu.tsx`

**Props**:
```typescript
interface UserMenuProps {
  user: {
    email?: string;
    id: string;
  };
}
```

**Odpowiedzialności**:
- Renderowanie dropdown menu z danymi użytkownika
- Przycisk "Wyloguj" z obsługą kliknięcia
- Wywołanie `supabaseClient.auth.signOut()` i przekierowanie

**Implementacja**:
```tsx
export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabaseClient.auth.signOut();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {user.email?.[0].toUpperCase()}
          </span>
        </div>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
          <div className="px-4 py-2 border-b">
            <p className="text-sm text-gray-500">Zalogowany jako</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
          </button>
        </div>
      )}
    </div>
  );
};
```

---

### 2.4 Middleware dla protected routes (Astro Middleware)

**Plik**: `src/middleware/index.ts` (aktualizacja istniejącego)

**Odpowiedzialności**:
- Sprawdzenie sesji użytkownika na każdym żądaniu
- Przekierowanie niezalogowanych użytkowników z protected routes do `/auth/login`
- Dodanie informacji o użytkowniku do `context.locals`
- Obsługa parametru `?redirect=` dla powrotu po logowaniu

**Implementacja**:
```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '@/db/supabase.client';

// Lista protected routes (ścieżki wymagające autentykacji)
const PROTECTED_ROUTES = [
  '/trips',
  '/trips/new',
  '/trips/',
  '/api/trips',
];

// Lista public routes (dostępne dla wszystkich)
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Dodaj supabase client do context.locals (już istnieje)
  context.locals.supabase = supabaseClient;

  // Pobierz aktualną ścieżkę
  const pathname = new URL(context.request.url).pathname;

  // Sprawdź czy route jest chroniona
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Jeśli to publiczna route, kontynuuj
  if (!isProtectedRoute) {
    return next();
  }

  // Sprawdź sesję użytkownika
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  // Jeśli brak sesji i route jest chroniona, przekieruj do logowania
  if (!session && isProtectedRoute) {
    const redirectUrl = encodeURIComponent(pathname);
    return context.redirect(`/auth/login?redirect=${redirectUrl}`);
  }

  // Dodaj użytkownika do context.locals dla użycia w stronach
  if (session) {
    context.locals.user = session.user;
    context.locals.session = session;
  }

  return next();
});
```

**Aktualizacja `env.d.ts`**:
```typescript
/// <reference types="astro/client" />

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User; // NOWE
      session?: Session; // NOWE
    }
  }
}
```

---

### 2.5 Hook `useAuth` (React)

**Plik**: `src/hooks/useAuth.ts` (już istnieje - aktualizacja opcjonalna)

**Obecna implementacja jest już poprawna**. Hook sprawdza status autentykacji po stronie klienta i nasłuchuje zmian w auth state.

**Opcjonalne rozszerzenie** - dodanie metod rejestracji i logowania:

```typescript
export function useAuth() {
  // ... istniejący kod ...

  const signUp = React.useCallback(async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }, []);

  return {
    ...state,
    signOut,
    signUp,
    signIn,
    resetPassword,
  };
}
```

---

## 3. Logika Backendowa

### 3.1 Konfiguracja Supabase

**Plik**: `src/db/supabase.client.ts` (już istnieje - brak zmian)

Obecna konfiguracja jest poprawna:
- Używa zmiennych środowiskowych `SUPABASE_URL` i `SUPABASE_KEY`
- Tworzy klienta Supabase z typami bazy danych
- Eksportuje funkcję `createSupabaseClientWithAuth` dla authenticated requests

**Brak wymaganych zmian**.

---

### 3.2 Endpointy API (opcjonalne dla MVP minimum)

Dla minimalnego MVP **nie są wymagane dodatkowe endpointy API** do autentykacji, ponieważ:
- Supabase Auth obsługuje wszystkie operacje po stronie klienta (signup, login, logout, password reset)
- Middleware Astro obsługuje ochronę routes server-side

**Opcjonalnie** możemy dodać endpoint do sprawdzenia statusu sesji:

#### 3.2.1 GET `/api/auth/me`

**Plik**: `src/pages/api/auth/me.ts`

**Cel**: Sprawdzenie statusu autentykacji i pobranie danych użytkownika

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { data: { session }, error } = await locals.supabase.auth.getSession();

  if (error || !session) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      user: {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.3 Aktualizacja istniejących API endpoints

Wszystkie istniejące endpointy API do zarządzania wycieczkami (`/api/trips`, `/api/trips/:id`) **już obsługują autentykację** poprzez:

1. **RLS (Row Level Security) w Supabase**: Tabela `trips` ma polityki RLS, które filtrują dane po `user_id`
2. **Access Token w headers**: Middleware przekazuje token użytkownika do Supabase

**Brak wymaganych zmian w istniejących endpoints**.

---

### 3.4 Zarządzanie sesją

#### 3.4.1 Persystencja sesji

Supabase automatycznie zarządza sesją poprzez:
- **LocalStorage**: Przechowuje access token i refresh token po stronie klienta
- **Cookies**: Opcjonalnie można skonfigurować cookie-based sessions (bardziej bezpieczne dla SSR)

**Rekomendowana konfiguracja** dla Astro SSR - użycie cookies:

**Aktualizacja**: `src/db/supabase.client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || '...';

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ZMIANA: Użyj cookies zamiast localStorage dla lepszej kompatybilności SSR
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Funkcja dla server-side authenticated requests
export function createSupabaseClientWithAuth(accessToken: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// NOWA funkcja: Tworzenie klienta Supabase z cookie-based auth dla SSR
export function createSupabaseServerClient(cookieStore: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: any) => void;
  delete: (name: string) => void;
}) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key) => cookieStore.get(key) || null,
        setItem: (key, value) => cookieStore.set(key, value, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        }),
        removeItem: (key) => cookieStore.delete(key),
      },
    },
  });
}
```

**Uwaga**: Dla MVP minimum możemy pozostać przy LocalStorage (prostsze, wystarczające). Cookie-based auth to enhancement dla produkcji.

---

## 4. System Autentykacji

### 4.1 Przepływ rejestracji (Signup Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                      REJESTRACJA UŻYTKOWNIKA                     │
└─────────────────────────────────────────────────────────────────┘

1. User → `/auth/signup`
   ├─ Server-side: Sprawdź session
   ├─ Jeśli zalogowany → redirect `/trips`
   └─ Jeśli niezalogowany → renderuj formularz

2. User → Wypełnia formularz (email, password, confirmPassword)
   └─ Client-side validation:
      ├─ Email format ✓
      ├─ Password min 8 chars ✓
      └─ Passwords match ✓

3. User → Klika "Utwórz konto"
   └─ SignupForm.tsx:
      ├─ setIsLoading(true)
      ├─ Wywołanie: supabaseClient.auth.signUp({ email, password })
      └─ Obsługa odpowiedzi:
         ├─ Sukces + session → Auto-login → redirect `/trips`
         ├─ Sukces + email confirmation required → Komunikat "Sprawdź email"
         └─ Błąd → Wyświetl error message

4. Supabase Auth:
   ├─ Walidacja email (unique)
   ├─ Haszowanie hasła (bcrypt)
   ├─ Zapis do tabeli `auth.users`
   └─ Opcjonalnie: Wysłanie email potwierdzającego

5. (Jeśli email confirmation wymagane) User → Klika link w emailu
   └─ Supabase → Potwierdza email → Użytkownik może się zalogować
```

**Konfiguracja Supabase Auth** (w Supabase Dashboard):
- **Email Confirmation**: Włączone (rekomendowane) lub wyłączone (dla szybszego testowania)
- **Email Templates**: Customizacja emaili z logo VibeTravels
- **Redirect URLs**: Whitelist `http://localhost:3000/auth/callback` (dev) i `https://vibetravels.com/auth/callback` (prod)

---

### 4.2 Przepływ logowania (Login Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGOWANIE UŻYTKOWNIKA                       │
└─────────────────────────────────────────────────────────────────┘

1. User → `/auth/login?redirect=/trips/123`
   ├─ Server-side: Sprawdź session
   ├─ Jeśli zalogowany → redirect `/trips`
   └─ Jeśli niezalogowany → renderuj formularz

2. User → Wypełnia formularz (email, password)
   └─ Client-side validation:
      └─ Email format ✓

3. User → Klika "Zaloguj się"
   └─ LoginForm.tsx:
      ├─ setIsLoading(true)
      ├─ Wywołanie: supabaseClient.auth.signInWithPassword({ email, password })
      └─ Obsługa odpowiedzi:
         ├─ Sukces → window.location.href = redirectTo
         └─ Błąd → Wyświetl error message:
            ├─ "Invalid login credentials" → "Nieprawidłowy email lub hasło"
            └─ "Email not confirmed" → "Potwierdź email przed logowaniem"

4. Supabase Auth:
   ├─ Sprawdź credentials (email + hashed password)
   ├─ Jeśli poprawne → Generuj JWT access_token + refresh_token
   └─ Zwróć session object

5. Client:
   ├─ Supabase JS SDK zapisuje tokens w localStorage
   ├─ Ustawia session w auth state
   └─ Przekierowanie do redirectTo URL
```

---

### 4.3 Przepływ wylogowania (Logout Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WYLOGOWANIE UŻYTKOWNIKA                       │
└─────────────────────────────────────────────────────────────────┘

1. User → Klika "Wyloguj się" w UserMenu
   └─ UserMenu.tsx:
      ├─ setIsLoggingOut(true)
      ├─ Wywołanie: supabaseClient.auth.signOut()
      └─ window.location.href = '/auth/login'

2. Supabase Auth:
   ├─ Usuń session z localStorage
   ├─ Invalidate access_token na serwerze
   └─ Wywołaj callback onAuthStateChange(SIGNED_OUT)

3. Client:
   ├─ useAuth hook reaguje na zmianę stanu
   ├─ setState({ user: null, session: null, isAuthenticated: false })
   └─ Przekierowanie do `/auth/login`
```

---

### 4.4 Przepływ resetowania hasła (Password Reset Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                   RESETOWANIE HASŁA                              │
└─────────────────────────────────────────────────────────────────┘

KROK 1: Żądanie resetu
─────────────────────
1. User → `/auth/forgot-password`
   └─ Renderuj ForgotPasswordForm

2. User → Wpisuje email i klika "Wyślij link"
   └─ ForgotPasswordForm.tsx:
      ├─ Wywołanie: supabaseClient.auth.resetPasswordForEmail(email, {
      │    redirectTo: 'http://localhost:3000/auth/reset-password'
      │  })
      └─ Sukces → "Link został wysłany na Twój email"

3. Supabase Auth:
   ├─ Generuj recovery token
   ├─ Wyślij email z linkiem:
   │  `https://vibetravels.com/auth/reset-password?access_token=XXX&type=recovery`
   └─ Token ważny przez 1 godzinę

KROK 2: Ustawienie nowego hasła
────────────────────────────────
4. User → Klika link w emailu
   └─ Browser → `/auth/reset-password?access_token=XXX&type=recovery`

5. Server (reset-password.astro):
   ├─ Sprawdź czy access_token i type=recovery obecne
   ├─ Jeśli nie → redirect `/auth/login?error=invalid_token`
   └─ Jeśli tak → renderuj ResetPasswordForm z tokenem

6. User → Wpisuje nowe hasło i potwierdza
   └─ ResetPasswordForm.tsx:
      ├─ setSession({ access_token }) (ustaw sesję recovery)
      ├─ Wywołanie: supabaseClient.auth.updateUser({ password: newPassword })
      └─ Sukces → "Hasło zmienione!" → redirect `/auth/login?success=password_reset`

7. Supabase Auth:
   ├─ Zwaliduj recovery token
   ├─ Zhaszuj nowe hasło
   ├─ Zaktualizuj `auth.users`
   └─ Invalidate recovery token
```

---

### 4.5 Przepływ ochrony routes (Protected Routes Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                    OCHRONA PROTECTED ROUTES                      │
└─────────────────────────────────────────────────────────────────┘

1. User → Próbuje dostać się do `/trips/new` (protected route)
   └─ Request przechodzi przez Middleware

2. Middleware (src/middleware/index.ts):
   ├─ const pathname = '/trips/new'
   ├─ const isProtected = PROTECTED_ROUTES.includes(pathname) → true
   ├─ Wywołanie: supabaseClient.auth.getSession()
   └─ Sprawdzenie:
      ├─ Jeśli session === null → redirect `/auth/login?redirect=/trips/new`
      └─ Jeśli session !== null → next() (kontynuuj do strony)

3a. SCENARIUSZ: User niezalogowany
    └─ Browser → `/auth/login?redirect=/trips/new`
       ├─ User loguje się
       └─ Po sukcesie → redirect `/trips/new` (z parametru redirect)

3b. SCENARIUSZ: User zalogowany
    └─ Request przechodzi do strony `/trips/new`
       ├─ Middleware dodaje `context.locals.user` i `context.locals.session`
       └─ Strona renderuje się normalnie

4. Strona Astro:
   └─ Może użyć `Astro.locals.user` do personalizacji treści
```

---

### 4.6 Row Level Security (RLS) w Supabase

**Cel**: Zapewnienie, że użytkownik może widzieć i modyfikować tylko swoje własne plany podróży.

**Polityki RLS** (już zdefiniowane w PRD):

```sql
-- Policy: Users can only view their own trips
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

**Jak to działa**:
1. Każdy request do Supabase zawiera JWT access token w headerze `Authorization`
2. Supabase parsuje token i ustawia `auth.uid()` w kontekście sesji
3. Polityki RLS filtrują wiersze tabeli `trips` automatycznie:
   - SELECT: Zwraca tylko wiersze gdzie `user_id = auth.uid()`
   - INSERT: Sprawdza czy `user_id` w nowym wierszu == `auth.uid()`
   - UPDATE/DELETE: Sprawdza czy wiersz należy do `auth.uid()`

**Rezultat**:
- User A (id=123) nie może zobaczyć planów User B (id=456)
- Próba dostępu do cudzego planu przez API zwraca 404 (brak wyników)
- Próba modyfikacji cudzego planu zwraca błąd RLS

---

## 5. Przepływy Użytkownika

### 5.1 US-001: Rejestracja nowego użytkownika

**Aktorzy**: Nowy użytkownik (niezalogowany)

**Warunki początkowe**: Użytkownik nie ma konta

**Główny przepływ**:
1. Użytkownik wchodzi na stronę główną `/`
2. Użytkownik klika przycisk "Zarejestruj się" w nawigacji
3. System przekierowuje do `/auth/signup`
4. System sprawdza sesję server-side (middleware)
5. System renderuje stronę rejestracji z formularzem
6. Użytkownik wypełnia:
   - Email: `user@example.com`
   - Hasło: `SecurePass123`
   - Potwierdź hasło: `SecurePass123`
7. Użytkownik klika "Utwórz konto"
8. System waliduje dane client-side:
   - ✅ Email ma poprawny format
   - ✅ Hasło ma min. 8 znaków
   - ✅ Hasła są identyczne
9. System wywołuje `supabaseClient.auth.signUp()`
10. Supabase tworzy konto i zwraca session
11. System zapisuje session w localStorage
12. System wyświetla komunikat "Konto utworzone!"
13. System przekierowuje do `/trips` (dashboard)

**Warunki końcowe**:
- Użytkownik ma założone konto
- Użytkownik jest zalogowany
- Użytkownik widzi pusty dashboard

**Scenariusze alternatywne**:

**5a. Email już istnieje**:
- W kroku 10: Supabase zwraca błąd "User already registered"
- System wyświetla: "Ten adres email jest już zarejestrowany"
- Przepływ kończy się niepowodzeniem

**5b. Wymagane potwierdzenie email** (jeśli włączone w Supabase):
- W kroku 10: Supabase zwraca sukces ale bez session
- System wyświetla: "Sprawdź email, aby potwierdzić rejestrację"
- Użytkownik klika link w emailu
- Supabase potwierdza email
- Użytkownik może się zalogować

**5c. Hasła nie pasują**:
- W kroku 8: Walidacja client-side wykrywa niezgodność
- System wyświetla: "Hasła nie pasują do siebie"
- Przepływ wraca do kroku 6

---

### 5.2 US-002: Logowanie użytkownika

**Aktorzy**: Zarejestrowany użytkownik (niezalogowany)

**Warunki początkowe**: Użytkownik ma konto, nie jest zalogowany

**Główny przepływ**:
1. Użytkownik próbuje wejść na `/trips` (protected route)
2. Middleware wykrywa brak sesji
3. System przekierowuje do `/auth/login?redirect=/trips`
4. System renderuje stronę logowania z formularzem
5. Użytkownik wypełnia:
   - Email: `user@example.com`
   - Hasło: `SecurePass123`
6. Użytkownik klika "Zaloguj się"
7. System wywołuje `supabaseClient.auth.signInWithPassword()`
8. Supabase weryfikuje credentials i zwraca session
9. System zapisuje session w localStorage
10. System przekierowuje do `/trips` (z parametru redirect)
11. Użytkownik widzi swoje plany podróży

**Warunki końcowe**:
- Użytkownik jest zalogowany
- Session jest aktywna
- Użytkownik ma dostęp do protected routes

**Scenariusze alternatywne**:

**5a. Nieprawidłowe hasło**:
- W kroku 8: Supabase zwraca błąd "Invalid login credentials"
- System wyświetla: "Nieprawidłowy email lub hasło"
- Przepływ wraca do kroku 5

**5b. Email niepotwierdzony**:
- W kroku 8: Supabase zwraca błąd "Email not confirmed"
- System wyświetla: "Potwierdź swój email przed zalogowaniem"
- Przepływ kończy się niepowodzeniem

---

### 5.3 US-003: Wylogowanie użytkownika

**Aktorzy**: Zalogowany użytkownik

**Warunki początkowe**: Użytkownik jest zalogowany

**Główny przepływ**:
1. Użytkownik jest na dowolnej stronie aplikacji (np. `/trips`)
2. Użytkownik klika swoje inicjały w prawym górnym rogu (UserMenu)
3. System otwiera dropdown menu
4. Użytkownik widzi swój email i przycisk "Wyloguj się"
5. Użytkownik klika "Wyloguj się"
6. System wywołuje `supabaseClient.auth.signOut()`
7. Supabase usuwa session z localStorage
8. System wywołuje callback `onAuthStateChange(SIGNED_OUT)`
9. Hook `useAuth` aktualizuje stan: `isAuthenticated = false`
10. System przekierowuje do `/auth/login`

**Warunki końcowe**:
- Użytkownik jest wylogowany
- Session nie istnieje
- Użytkownik nie ma dostępu do protected routes

---

### 5.4 US-011: Ochrona protected routes

**Aktorzy**: Niezalogowany użytkownik

**Warunki początkowe**: Użytkownik nie jest zalogowany

**Główny przepływ**:
1. Użytkownik próbuje wejść bezpośrednio na `/trips/123` (URL plan)
2. Request przechodzi przez middleware
3. Middleware wywołuje `supabaseClient.auth.getSession()`
4. Supabase zwraca `session = null`
5. Middleware wykrywa protected route i brak sesji
6. System przekierowuje do `/auth/login?redirect=/trips/123`
7. Użytkownik widzi stronę logowania
8. (Opcjonalnie) Użytkownik loguje się
9. Po sukcesie system przekierowuje z powrotem do `/trips/123`

**Warunki końcowe**:
- Niezalogowany użytkownik nie ma dostępu do protected route
- Po zalogowaniu wraca do oryginalnej ścieżki

---

### 5.5 US-012: Ochrona planów innych użytkowników

**Aktorzy**: Zalogowany User A

**Warunki początkowe**:
- User A jest zalogowany (id=123)
- User B ma plan z id=plan-456 (user_id=user-b)

**Główny przepływ**:
1. User A próbuje wejść na `/trips/plan-456` (cudzym plan)
2. Middleware przepuszcza request (User A jest zalogowany)
3. Strona `/trips/[id].astro` wywołuje:
   ```typescript
   const { data: trip, error } = await supabase
     .from('trips')
     .select('*')
     .eq('id', 'plan-456')
     .single();
   ```
4. Supabase stosuje RLS policy "Users can view own trips"
5. Query filtruje wiersze: `WHERE user_id = auth.uid()`
6. Ponieważ `user_id = user-b` != `auth.uid() = 123`, brak wyników
7. Supabase zwraca `data = null, error = { code: 'PGRST116' }`
8. Strona wykrywa brak danych
9. System wyświetla 404 lub komunikat "Nie masz dostępu do tego planu"
10. Opcjonalnie: przekierowanie do `/trips`

**Warunki końcowe**:
- User A nie widzi planu User B
- Bezpieczeństwo danych zachowane dzięki RLS

---

## 6. Obsługa Błędów i Walidacja

### 6.1 Walidacja formularzy client-side

#### 6.1.1 Walidacja email

**Reguły**:
- Wymagany
- Poprawny format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

**Komunikaty błędów**:
- Pusty: "Email jest wymagany"
- Nieprawidłowy format: "Nieprawidłowy format email"

#### 6.1.2 Walidacja hasła

**Reguły**:
- Wymagane
- Minimum 8 znaków

**Komunikaty błędów**:
- Pusty: "Hasło jest wymagane"
- Zbyt krótkie: "Hasło musi mieć co najmniej 8 znaków"

**Opcjonalne (future enhancement)**:
- Przynajmniej jedna duża litera
- Przynajmniej jedna cyfra
- Przynajmniej jeden znak specjalny

#### 6.1.3 Walidacja potwierdzenia hasła

**Reguły**:
- Musi być identyczne z polem hasło

**Komunikaty błędów**:
- Niezgodne: "Hasła nie pasują do siebie"

---

### 6.2 Obsługa błędów Supabase Auth

| Błąd Supabase | User-friendly komunikat | HTTP Status |
|---------------|------------------------|-------------|
| `Invalid login credentials` | Nieprawidłowy email lub hasło | 400 |
| `User already registered` | Ten adres email jest już zarejestrowany | 400 |
| `Email not confirmed` | Potwierdź swój email przed zalogowaniem | 400 |
| `Weak password` | Hasło jest zbyt słabe. Użyj silniejszego hasła. | 400 |
| `Invalid email` | Nieprawidłowy format email | 400 |
| `Token expired` | Link wygasł. Wygeneruj nowy link resetujący. | 400 |
| `Invalid token` | Link resetujący jest nieprawidłowy | 400 |
| Network error | Błąd połączenia. Sprawdź internet i spróbuj ponownie. | 500 |
| Nieznany błąd | Wystąpił nieoczekiwany błąd. Spróbuj ponownie. | 500 |

**Implementacja error handling**:
```typescript
try {
  const { data, error } = await supabaseClient.auth.signInWithPassword(...);
  if (error) throw error;
  // sukces
} catch (error: any) {
  let userMessage = 'Wystąpił błąd podczas logowania';

  if (error.message?.includes('Invalid login credentials')) {
    userMessage = 'Nieprawidłowy email lub hasło';
  } else if (error.message?.includes('Email not confirmed')) {
    userMessage = 'Potwierdź swój email przed zalogowaniem';
  } else if (error.message?.includes('already registered')) {
    userMessage = 'Ten adres email jest już zarejestrowany';
  }

  setError(userMessage);
}
```

---

### 6.3 Komponent ErrorAlert

**Plik**: `src/components/ui/ErrorAlert.tsx` (już istnieje - może wymagać rozszerzenia)

**Props**:
```typescript
interface ErrorAlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

**Przykładowe style** (Tailwind):
```tsx
const alertStyles = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  type,
  message,
  dismissible = false,
  onDismiss,
}) => {
  return (
    <div className={`p-4 rounded-md border ${alertStyles[type]} flex items-start`}>
      <div className="flex-1">{message}</div>
      {dismissible && onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-current hover:opacity-70">
          ✕
        </button>
      )}
    </div>
  );
};
```

---

### 6.4 Loading states

Wszystkie formularze muszą wyświetlać loading state podczas async operacji:

**Elementy loading state**:
1. **Spinner w przycisku submit**: Animowany ikona ładowania
2. **Tekst przycisku**: "Logowanie..." zamiast "Zaloguj się"
3. **Disabled inputs**: Wszystkie pola formularza disabled
4. **Disabled button**: Przycisk submit disabled

**Przykład**:
```tsx
<button
  type="submit"
  disabled={isLoading || !email || !password}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? (
    <>
      <Spinner className="mr-2 h-4 w-4 animate-spin" />
      Logowanie...
    </>
  ) : (
    'Zaloguj się'
  )}
</button>
```

---

## 7. Bezpieczeństwo

### 7.1 Najlepsze praktyki implementowane

#### 7.1.1 Supabase Auth Security

- ✅ **Haszowanie haseł**: Bcrypt używany automatycznie przez Supabase
- ✅ **JWT Tokens**: Access token wygasa po 1 godzinie, refresh token po 30 dniach
- ✅ **Row Level Security**: Polityki RLS chronią dane użytkowników
- ✅ **Email Verification**: Opcjonalnie wymagane potwierdzenie email
- ✅ **HTTPS Only**: Wymuszenie HTTPS w production

#### 7.1.2 Client-side Security

- ✅ **No credentials in localStorage**: Tylko encrypted JWT tokens
- ✅ **XSS Protection**: React automatycznie escapuje content
- ✅ **CSRF Protection**: Supabase używa tokenu JWT zamiast cookies dla auth
- ✅ **Input Validation**: Wszystkie inputy walidowane przed wysłaniem

#### 7.1.3 Server-side Security

- ✅ **Middleware Protection**: Wszystkie protected routes chronione
- ✅ **Session Validation**: Każdy request weryfikuje ważność session
- ✅ **RLS Enforcement**: Baza danych filtruje dane automatycznie
- ✅ **No User Data Leakage**: API zwraca tylko dane należące do użytkownika

---

### 7.2 Rate Limiting (opcjonalnie dla MVP)

**Dla MVP minimum**: Brak rate limiting (Supabase ma wbudowane limity)

**Dla produkcji** (future enhancement):
- Ograniczenie prób logowania: max 5 prób / 15 minut / IP
- Ograniczenie rejestracji: max 3 rejestracje / godzinę / IP
- Ograniczenie resetowania hasła: max 3 próby / godzinę / email

**Implementacja** (przykład):
```typescript
// src/services/rate-limit.service.ts (już istnieje - możliwe rozszerzenie)
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minut
  keyGenerator: (request) => getIP(request),
});
```

---

### 7.3 Zmienne środowiskowe

**Wymagane env variables**:

```bash
# .env (lokalny development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Production**:
```bash
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Security notes**:
- ✅ Nigdy nie commituj `.env` do gita (już w `.gitignore`)
- ✅ Użyj Vercel Environment Variables dla production
- ✅ `SUPABASE_KEY` to anon key (publiczny, bezpieczny do użycia client-side)
- ⚠️ Service role key (jeśli używany) musi być TYLKO server-side

---

## 8. Struktura Plików

### 8.1 Nowe pliki do utworzenia

```
10x-astro-starter/
├── src/
│   ├── pages/
│   │   └── auth/
│   │       ├── signup.astro              ← NOWY (WYMAGANE)
│   │       ├── login.astro               ← AKTUALIZACJA (już istnieje, WYMAGANE)
│   │       ├── forgot-password.astro     ← NOWY (OPCJONALNE - nice to have)
│   │       └── reset-password.astro      ← NOWY (OPCJONALNE - nice to have)
│   │
│   ├── components/
│   │   ├── forms/
│   │   │   ├── SignupForm.tsx            ← NOWY (WYMAGANE)
│   │   │   ├── LoginForm.tsx             ← AKTUALIZACJA (już istnieje, WYMAGANE)
│   │   │   ├── ForgotPasswordForm.tsx    ← NOWY (OPCJONALNE)
│   │   │   └── ResetPasswordForm.tsx     ← NOWY (OPCJONALNE)
│   │   │
│   │   ├── navigation/
│   │   │   ├── Navigation.astro          ← NOWY
│   │   │   └── UserMenu.tsx              ← NOWY
│   │   │
│   │   └── ui/
│   │       └── ErrorAlert.tsx            ← AKTUALIZACJA (już istnieje)
│   │
│   ├── middleware/
│   │   └── index.ts                      ← AKTUALIZACJA (dodać protected routes)
│   │
│   ├── hooks/
│   │   └── useAuth.ts                    ← AKTUALIZACJA opcjonalna
│   │
│   ├── db/
│   │   └── supabase.client.ts            ← BRAK ZMIAN (już gotowe)
│   │
│   └── env.d.ts                          ← AKTUALIZACJA (dodać user/session)
│
└── .ai/
    └── auth-spec.md                      ← TEN DOKUMENT
```

---

### 8.2 Pliki do aktualizacji

| Plik | Typ zmiany | Opis |
|------|-----------|------|
| `src/middleware/index.ts` | Rozszerzenie | Dodać logikę protected routes |
| `src/env.d.ts` | Dodanie typów | Dodać `user` i `session` do `App.Locals` |
| `src/pages/auth/login.astro` | Refactor | Zmienić na nowy design + redirect handling |
| `src/components/forms/LoginForm.tsx` | Refactor | Uprościć, usunąć debug logi |
| `src/components/ui/ErrorAlert.tsx` | Rozszerzenie | Dodać typy 'success', 'warning', 'info' |
| `src/hooks/useAuth.ts` | Opcjonalne | Dodać metody signUp, signIn, resetPassword |

---

### 8.3 Kolejność implementacji (rekomendowana)

**Faza 1: Setup autentykacji podstawowej (Dzień 1-2)**
1. ✅ Aktualizacja `src/env.d.ts` (dodanie `user`, `session`)
2. ✅ Aktualizacja `src/middleware/index.ts` (protected routes)
3. ✅ Stworzenie `src/components/forms/SignupForm.tsx`
4. ✅ Stworzenie `src/pages/auth/signup.astro`
5. ✅ Refactor `src/components/forms/LoginForm.tsx` (cleanup)
6. ✅ Refactor `src/pages/auth/login.astro` (nowy design)
7. ✅ Testowanie: rejestracja + logowanie działa

**Faza 2: Wylogowanie i nawigacja (Dzień 2)**
8. ✅ Stworzenie `src/components/navigation/UserMenu.tsx`
9. ✅ Stworzenie `src/components/navigation/Navigation.astro`
10. ✅ Integracja nawigacji w `src/layouts/Layout.astro`
11. ✅ Testowanie: wylogowanie działa

**Faza 3: Resetowanie hasła (Dzień 3) - OPCJONALNE dla MVP minimum**
12. ⚠️ Stworzenie `src/components/forms/ForgotPasswordForm.tsx` (OPTIONAL)
13. ⚠️ Stworzenie `src/pages/auth/forgot-password.astro` (OPTIONAL)
14. ⚠️ Stworzenie `src/components/forms/ResetPasswordForm.tsx` (OPTIONAL)
15. ⚠️ Stworzenie `src/pages/auth/reset-password.astro` (OPTIONAL)
16. ⚠️ Konfiguracja Supabase (email templates, redirect URLs) (OPTIONAL)
17. ⚠️ Testowanie: cały flow password reset (OPTIONAL)

**UWAGA**: Password Reset jest nice to have, nie blokuje zaliczenia projektu. Można pominąć jeśli brakuje czasu.

**Faza 4: Testy i polish (Dzień 3-4)**
18. ✅ Testy manualne wszystkich scenariuszy
19. ✅ Testy error handling
20. ✅ Responsywność mobile
21. ✅ Accessibility (ARIA labels, keyboard navigation)
22. ✅ Code review i cleanup

---

## 9. Kryteria Akceptacji - Checklist

### ✅ US-001: Rejestracja użytkownika (FR-001)
- [ ] Strona `/auth/signup` renderuje formularz rejestracji
- [ ] Formularz zawiera pola: email, password, confirmPassword
- [ ] Walidacja client-side: email format, password min 8 znaków, hasła pasują
- [ ] Komunikaty błędów wyświetlane dla każdego pola
- [ ] Po sukcesie: użytkownik automatycznie zalogowany
- [ ] Po sukcesie: przekierowanie do `/trips`
- [ ] Obsługa błędu: email już zarejestrowany
- [ ] Zalogowany użytkownik wchodząc na `/auth/signup` jest przekierowany do `/trips`

### ✅ US-002: Logowanie użytkownika (FR-002)
- [ ] Strona `/auth/login` renderuje formularz logowania
- [ ] Formularz zawiera pola: email, password
- [ ] Walidacja client-side: email format
- [ ] Po sukcesie: przekierowanie do URL z parametru `?redirect=`
- [ ] Domyślne przekierowanie: `/trips`
- [ ] Obsługa błędu: nieprawidłowe credentials
- [ ] Obsługa błędu: email niepotwierdzony
- [ ] Link do strony rejestracji i odzyskiwania hasła

### ✅ US-003: Wylogowanie (FR-003)
- [ ] Przycisk "Wyloguj się" widoczny w nawigacji (UserMenu)
- [ ] Kliknięcie wylogowuje użytkownika
- [ ] Session usunięta z localStorage
- [ ] Przekierowanie do `/auth/login`
- [ ] Użytkownik nie ma dostępu do protected routes po wylogowaniu

### ✅ US-011: Ochrona protected routes (FR-011)
- [ ] Middleware sprawdza sesję na każdym request
- [ ] Protected routes: `/trips`, `/trips/*`
- [ ] Niezalogowany użytkownik przekierowany do `/auth/login?redirect=<path>`
- [ ] Zalogowany użytkownik ma dostęp do protected routes
- [ ] Po zalogowaniu: przekierowanie do oryginalnej ścieżki

### ✅ US-012: Ochrona danych użytkowników (FR-011)
- [ ] RLS policies włączone dla tabeli `trips`
- [ ] Użytkownik widzi tylko swoje plany
- [ ] Próba dostępu do cudzego planu zwraca 404
- [ ] API endpoints filtrują dane po `user_id` automatycznie

### ⚠️ Password Reset (OPCJONALNE - nice to have, nie blokujące)
- [ ] Strona `/auth/forgot-password` z formularzem
- [ ] Email z linkiem resetującym wysłany przez Supabase
- [ ] Link zawiera token i przekierowuje do `/auth/reset-password`
- [ ] Strona `/auth/reset-password` z formularzem nowego hasła
- [ ] Po sukcesie: hasło zmienione, przekierowanie do logowania

**UWAGA**: Ten feature nie jest wymagany do zaliczenia projektu według PRD. Można pominąć jeśli brakuje czasu.

---

## 10. Konfiguracja Supabase Auth

### 10.1 Ustawienia w Supabase Dashboard

**Authentication → Settings**:

1. **Email Auth**:
   - ✅ Enable Email Signup
   - ✅ Enable Email Login
   - ⚠️ **Disable Email Confirmations** (dla MVP minimum - szybsze testowanie)
   - 🔄 **Enable Email Confirmations** (dla produkcji - zalecane)

2. **Email Templates**:
   - Customize "Confirm signup" template (logo, branding)
   - Customize "Reset password" template
   - Customize "Magic Link" template (jeśli używane)

3. **Redirect URLs** (whitelist):
   - `http://localhost:3000/auth/callback` (development)
   - `https://vibetravels.com/auth/callback` (production)
   - `http://localhost:3000/auth/reset-password` (password reset - dev)
   - `https://vibetravels.com/auth/reset-password` (password reset - prod)

4. **Security**:
   - ✅ Enable Secure Password Policy (min 8 chars)
   - ✅ Enable CAPTCHA (dla produkcji - opcjonalnie)
   - ✅ Rate Limiting (domyślnie włączone)

---

### 10.2 SQL Migrations (jeśli potrzebne)

**Sprawdzenie polityk RLS**:
```sql
-- Sprawdź czy RLS jest włączony
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'trips';

-- Jeśli rowsecurity = false, włącz RLS:
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Sprawdź istniejące policies
SELECT * FROM pg_policies WHERE tablename = 'trips';
```

**Jeśli polityki nie istnieją**, uruchom SQL z PRD (linie 363-383).

---

## 11. Testowanie

### 11.1 Test Cases - Rejestracja

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|-------------------|
| TC-001: Poprawna rejestracja | 1. Wejdź `/auth/signup`<br>2. Wpisz email, hasło (8+ chars), potwierdź<br>3. Kliknij "Utwórz konto" | ✅ Konto utworzone<br>✅ Auto-login<br>✅ Redirect `/trips` |
| TC-002: Email już istnieje | 1. Użyj email istniejącego użytkownika<br>2. Submit | ❌ Błąd: "Email już zarejestrowany" |
| TC-003: Hasła nie pasują | 1. Wpisz różne hasła w password i confirm<br>2. Submit | ❌ Błąd: "Hasła nie pasują" |
| TC-004: Hasło za krótkie | 1. Wpisz hasło < 8 znaków<br>2. Submit | ❌ Błąd: "Min. 8 znaków" |
| TC-005: Nieprawidłowy email | 1. Wpisz "notanemail"<br>2. Submit | ❌ Błąd: "Nieprawidłowy format" |

---

### 11.2 Test Cases - Logowanie

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|-------------------|
| TC-006: Poprawne logowanie | 1. Wejdź `/auth/login`<br>2. Wpisz poprawne credentials<br>3. Submit | ✅ Zalogowany<br>✅ Redirect `/trips` |
| TC-007: Nieprawidłowe hasło | 1. Wpisz poprawny email, złe hasło<br>2. Submit | ❌ Błąd: "Nieprawidłowy email lub hasło" |
| TC-008: Redirect parameter | 1. Wejdź `/auth/login?redirect=/trips/123`<br>2. Zaloguj się | ✅ Redirect `/trips/123` |
| TC-009: Już zalogowany | 1. Zaloguj się<br>2. Wejdź `/auth/login` | ✅ Auto-redirect `/trips` |

---

### 11.3 Test Cases - Protected Routes

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|-------------------|
| TC-010: Dostęp bez logowania | 1. Wyloguj się<br>2. Wejdź `/trips` | ✅ Redirect `/auth/login?redirect=/trips` |
| TC-011: Dostęp po zalogowaniu | 1. Zaloguj się<br>2. Wejdź `/trips` | ✅ Dostęp do strony |
| TC-012: Cudzy plan | 1. Zaloguj jako User A<br>2. Wejdź URL planu User B | ❌ 404 lub "Brak dostępu" |

---

## 12. Podsumowanie

### 12.1 Kluczowe decyzje architektoniczne

1. **Astro SSR z React islands**: Większość stron to Astro (SSR), formularze to React (client:only)
2. **Supabase Auth**: Pełna obsługa autentykacji przez Supabase (signup, login, password reset)
3. **Middleware protection**: Astro middleware chroni protected routes server-side
4. **RLS w bazie**: Row Level Security filtruje dane użytkowników na poziomie bazy
5. **LocalStorage dla tokens**: JWT tokens przechowywane client-side (standard Supabase)
6. **No API endpoints**: Formularze komunikują się bezpośrednio z Supabase (client-side)

---

### 12.2 Kompromisy MVP minimum vs Full version

| Feature | MVP Minimum | Full Version (future) |
|---------|------------|---------------------|
| Auth metody | Email/hasło | + Google OAuth, Magic Links |
| Email confirmation | Wyłączone (szybsze) | Włączone (bezpieczne) |
| Session storage | localStorage | + Cookie-based (SSR-friendly) |
| Rate limiting | Brak | Implementacja custom |
| Password strength | Min 8 chars | + Wymogi: duże litery, cyfry, symbole |
| 2FA | Brak | Opcjonalne 2FA |
| Account deletion | Brak | Self-service usuwanie konta |

---

### 12.3 Timeline implementacji

**Dzień 1-2**: Setup + Rejestracja + Logowanie (6-8h)
**Dzień 2**: Wylogowanie + Nawigacja (2-3h)
**Dzień 3**: Password Reset (3-4h)
**Dzień 3-4**: Testy + Polish (3-4h)

**Razem**: ~15-20 godzin pracy

---

### 12.4 Następne kroki po akceptacji specyfikacji

1. ✅ Code review specyfikacji z zespołem
2. ✅ Akceptacja architektury
3. ✅ Konfiguracja Supabase Auth (email templates, redirect URLs)
4. 🔧 Implementacja według kolejności z sekcji 8.3
5. 🧪 Testowanie według test cases z sekcji 11
6. 🚀 Deployment na Vercel
7. 📝 Aktualizacja dokumentacji projektu

---

**Koniec specyfikacji technicznej**

---

## Appendix A: Supabase Auth API Reference

### A.1 Najważniejsze metody Supabase Auth

```typescript
// Rejestracja
supabaseClient.auth.signUp({
  email: string,
  password: string,
  options?: {
    emailRedirectTo?: string,
    data?: object, // user metadata
  }
})

// Logowanie
supabaseClient.auth.signInWithPassword({
  email: string,
  password: string,
})

// Wylogowanie
supabaseClient.auth.signOut()

// Resetowanie hasła (krok 1: wyślij email)
supabaseClient.auth.resetPasswordForEmail(
  email: string,
  options?: {
    redirectTo: string,
  }
)

// Resetowanie hasła (krok 2: ustaw nową sesję)
supabaseClient.auth.setSession({
  access_token: string,
  refresh_token: string,
})

// Resetowanie hasła (krok 3: zaktualizuj hasło)
supabaseClient.auth.updateUser({
  password: string,
})

// Pobierz aktualną sesję
supabaseClient.auth.getSession()

// Pobierz aktualnego użytkownika
supabaseClient.auth.getUser()

// Nasłuchuj zmian auth state
supabaseClient.auth.onAuthStateChange((event, session) => {
  // event: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
})
```

---

## Appendix B: Przykładowe zmienne środowiskowe

```bash
# .env.local (development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# .env.production (production - Vercel)
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**UWAGA**:
- `SUPABASE_KEY` to **anon key** (publiczny, bezpieczny do użycia client-side)
- **Service role key** NIE POWINIEN być używany w aplikacji (tylko backend-to-backend)

---

## Appendix C: Accessibility Checklist

### C.1 Formularze

- [ ] Wszystkie pola mają `<label>` z atrybutem `for`
- [ ] Wymagane pola mają `required` i wizualny wskaźnik `*`
- [ ] Błędy walidacji powiązane z polami przez `aria-describedby`
- [ ] Komunikaty błędów ogłaszane przez screen reader (`role="alert"`)
- [ ] Focus management: błędy przenoszą focus na pierwsze pole z błędem
- [ ] Keyboard navigation: Tab przez wszystkie pola, Enter submits
- [ ] Loading state: `aria-busy="true"` podczas ładowania

### C.2 Nawigacja

- [ ] Skip to main content link dla screen readers
- [ ] UserMenu dropdown: `aria-expanded` i `aria-controls`
- [ ] Przycisk wylogowania: jasny label "Wyloguj się"
- [ ] Keyboard navigation: Escape zamyka dropdown

### C.3 Strony

- [ ] Każda strona ma unikalny `<title>`
- [ ] Główny heading `<h1>` na każdej stronie
- [ ] Logiczna hierarchia headingów (h1 → h2 → h3)
- [ ] Landmark regions: `<main>`, `<nav>`, `<header>`
- [ ] Color contrast: minimum 4.5:1 dla tekstu

---

**Koniec dokumentu**
