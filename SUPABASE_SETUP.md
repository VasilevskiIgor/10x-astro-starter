# Konfiguracja Supabase dla MVP - VibeTravels

## 📋 Wymagana konfiguracja dla procesu uwierzytelniania

### 1. **Email Confirmation - WYŁĄCZONE** ✅

Aby użytkownicy mogli logować się natychmiast po rejestracji (bez konieczności potwierdzania emaila):

1. Wejdź do **Supabase Dashboard** → Twój projekt
2. Przejdź do: **Authentication** → **Settings** → **Auth Providers**
3. Znajdź sekcję **Email**
4. **WYŁĄCZ** opcję **"Enable email confirmations"**
   - Unchecked: ✅ (powinno być **odznaczone**)
5. Kliknij **Save**

**Rezultat**: Po `signUp()` użytkownik otrzyma `session` i będzie automatycznie zalogowany.

---

### 2. **Redirect URLs - Whitelist** ✅

Dodaj dozwolone URL dla przekierowań:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. W sekcji **"Redirect URLs"** dodaj:
   - Development: `http://localhost:3000/auth/reset-password`
   - Development: `http://localhost:4321/auth/reset-password` (jeśli port Astro to 4321)
   - Production: `https://twoja-domena.com/auth/reset-password`

**Uwaga**: Bez whitelistowania tych URL, Supabase zablokuje przekierowania z emaili.

---

### 3. **Auto-refresh Tokens** ✅

W `src/db/supabase.client.ts` upewnij się, że konfiguracja ma:

\`\`\`typescript
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // ✅ Włączone (domyślnie true)
    persistSession: true,     // ✅ Sesja w localStorage
    detectSessionInUrl: true, // ✅ Dla password reset links
  },
});
\`\`\`

**To już jest skonfigurowane w projekcie**, ale warto zweryfikować.

---

### 4. **Rate Limiting** (opcjonalne)

Supabase ma wbudowane rate limiting dla auth endpoints:
- **Signup**: domyślnie ~10 requestów / godzinę z tego samego IP
- **Login**: domyślnie ~30 prób / godzinę

Dla MVP minimum te wartości są wystarczające. Możesz je zmienić w:
- Supabase Dashboard → **Authentication** → **Rate Limits**

---

### 5. **Email Templates** (opcjonalne dla MVP)

Jeśli w przyszłości włączysz email confirmation lub będziesz używać password reset:

1. Przejdź do: **Authentication** → **Email Templates**
2. Dostosuj szablony:
   - **Confirm Signup** (nieużywane w MVP z disabled confirmation)
   - **Reset Password** (używane przez `/auth/forgot-password`)
   - **Magic Link** (nieużywane w MVP)

**Dla MVP można pominąć** - domyślne szablony są OK.

---

## 🧪 Testowanie konfiguracji

### Test 1: Rejestracja bez email confirmation

1. Wejdź na `/auth/signup`
2. Zarejestruj nowe konto
3. **Oczekiwany rezultat**:
   - ✅ Komunikat "Konto utworzone! Przekierowujemy..."
   - ✅ Auto-redirect do `/trips` po ~1 sekundzie
   - ✅ BRAK komunikatu "Sprawdź email"

**Jeśli widzisz**: "Sprawdź email" → email confirmation jest **WŁĄCZONE** - wróć do kroku 1.

### Test 2: Logowanie

1. Wejdź na `/auth/login`
2. Zaloguj się z email/hasłem z Test 1
3. **Oczekiwany rezultat**:
   - ✅ Redirect do `/trips`

### Test 3: Protected Routes

1. Wyloguj się (jeśli masz komponent UserMenu)
2. Spróbuj wejść bezpośrednio na `/trips`
3. **Oczekiwany rezultat**:
   - ✅ Middleware przekierowuje do `/auth/login?redirect=/trips`
4. Zaloguj się
5. **Oczekiwany rezultat**:
   - ✅ Po zalogowaniu redirect z powrotem do `/trips`

### Test 4: Auth Routes dla zalogowanych

1. Zaloguj się
2. Spróbuj wejść na `/auth/login`
3. **Oczekiwany rezultat**:
   - ✅ Middleware przekierowuje do `/trips` (już jesteś zalogowany)

---

## 🔧 Troubleshooting

### Problem: "Sprawdź email aby potwierdzić rejestrację"

**Przyczyna**: Email confirmation jest WŁĄCZONE w Supabase.

**Rozwiązanie**:
1. Idź do Supabase Dashboard → Authentication → Settings
2. Znajdź "Enable email confirmations"
3. **Odznacz** tę opcję
4. Zapisz
5. Usuń testowego użytkownika z Authentication → Users
6. Przetestuj ponownie

### Problem: "Invalid token" przy password reset

**Przyczyna**: URL `/auth/reset-password` nie jest na whiteliście.

**Rozwiązanie**:
1. Dodaj URL do Redirect URLs (krok 2 powyżej)
2. Sprawdź czy URL w emailu (od Supabase) pasuje do whitelistowanego

### Problem: Token wygasł po refresh strony

**Przyczyna**: `autoRefreshToken` lub `persistSession` wyłączone.

**Rozwiązanie**:
1. Sprawdź konfigurację w `supabase.client.ts` (krok 3)
2. Upewnij się że oba są `true`

---

## 📝 Checklist MVP

- [ ] Email confirmation **WYŁĄCZONE**
- [ ] Redirect URLs dla password reset **DODANE**
- [ ] `autoRefreshToken: true` w supabase.client.ts
- [ ] Test rejestracji → auto-login działa
- [ ] Test logowania → redirect do /trips
- [ ] Test protected routes → middleware przekierowuje
- [ ] Test auth routes dla zalogowanych → przekierowanie do /trips

---

**Status**: Gotowe do MVP! 🚀
