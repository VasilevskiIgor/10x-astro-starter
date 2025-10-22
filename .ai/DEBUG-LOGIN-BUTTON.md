# Debug: Login Button Not Working

## Problem
Przycisk "Sign In" nie działa.

## Dodane logi debugowania

Dodałem szczegółowe logowanie do `LoginForm.tsx`:

1. **Component mount:** `[LoginForm] Component mounted, redirectTo: ...`
2. **Form submit:** `[LoginForm] Form submitted! { email: "...", password: "..." }`
3. **Login attempt:** `[LoginForm] Attempting login with email: ...`

---

## Instrukcje debugowania

### Krok 1: Otwórz konsolę przeglądarki
- Naciśnij **F12**
- Przejdź do zakładki **Console**

### Krok 2: Odśwież stronę logowania
- Otwórz: `http://localhost:3000/auth/login`
- **Sprawdź logi w konsoli**

**Oczekiwany log:**
```
[LoginForm] Component mounted, redirectTo: /
```

**Jeśli NIE widzisz tego loga:**
- ❌ Komponent React się nie załadował
- **Możliwe przyczyny:**
  1. Błąd kompilacji TypeScript
  2. Błąd w imporcie
  3. Problem z `client:load`
  4. Błąd w components/ui/button.tsx

**Sprawdź:**
- Terminal dev servera (czy są błędy)
- Console → zakładka "Errors" (czerwone błędy)

---

### Krok 3: Wypełnij formularz

**Wpisz:**
- Email: `test@example.com`
- Password: `password123`

**Sprawdź w konsoli:**
- Czy przycisk "Sign In" jest **aktywny** (niebieski)?
- Czy jest **disabled** (szary)?

**Przycisk jest disabled gdy:**
- Email jest pusty
- Password jest pusty
- isLoading = true

---

### Krok 4: Kliknij "Sign In"

**Oczekiwane logi:**
```
[LoginForm] Form submitted! { email: "test@example.com", password: "password123" }
[LoginForm] Attempting login with email: test@example.com
```

**Jeśli widzisz te logi:**
- ✅ Przycisk działa!
- ✅ Formularz wysyła request

**Jeśli NIE widzisz logów:**
- ❌ Event handler nie działa
- **Możliwe przyczyny:**
  1. Button component ma problem
  2. Event preventDefault() blokuje submit
  3. Przycisk jest disabled

---

## Scenariusze debugowania

### Scenariusz A: Brak loga "Component mounted"

**Problem:** Komponent się nie ładuje

**Rozwiązanie:**
1. Sprawdź terminal - czy są błędy kompilacji
2. Sprawdź przeglądarkę - zakładka Console → Errors
3. Sprawdź Network tab - czy plik `LoginForm` jest ładowany

**Możliwy błąd:**
```
Cannot find module '@/components/ui/button'
```

**Fix:** Sprawdź czy `button.tsx` istnieje w `src/components/ui/`

---

### Scenariusz B: Komponent mounted, ale kliknięcie nic nie robi

**Problem:** Button component nie wywołuje `onSubmit`

**Debug:**
Dodaj `onClick` bezpośrednio do buttona (test):

```tsx
<Button
  type="submit"
  onClick={(e) => {
    console.log('[DEBUG] Button clicked!', e);
  }}
  disabled={isLoading || !formData.email || !formData.password}
  className="w-full"
>
  Sign In
</Button>
```

**Jeśli log "Button clicked" się pojawia:**
- ✅ Button działa
- ❌ Problem z `type="submit"` lub `onSubmit` handler

**Jeśli log się NIE pojawia:**
- ❌ Problem z Button component
- **Fix:** Sprawdź `src/components/ui/button.tsx`

---

### Scenariusz C: Przycisk disabled pomimo wypełnionych pól

**Problem:** Warunek `disabled` jest błędny

**Debug w konsoli:**
```javascript
// W zakładce Console, wpisz:
document.querySelector('button[type="submit"]')
```

**Sprawdź:**
- Czy button ma atrybut `disabled`
- Jaki jest computed style

**Tymczasowe rozwiązanie:**
Usuń warunek disabled (dla testów):

```tsx
<Button
  type="submit"
  // disabled={isLoading || !formData.email || !formData.password}  // COMMENTED
  className="w-full"
>
```

---

### Scenariusz D: Supabase Auth błąd

**Problem:** Login request się wysyła, ale zwraca błąd

**Oczekiwany log:**
```
[LoginForm] Login error: { message: "Invalid login credentials", ... }
```

**Sprawdź:**
1. Czy user istnieje w Supabase
2. Czy email/password są poprawne
3. Czy `SUPABASE_URL` i `SUPABASE_KEY` są ustawione

**Fix:**
Zobacz dokumentację w `LOGIN-IMPLEMENTATION.md` → "Konfiguracja Supabase"

---

## Quick Fix: Prosty test bez Supabase

Jeśli chcesz przetestować czy formularz działa (bez prawdziwego logowania):

**Edytuj `LoginForm.tsx`:**

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('[LoginForm] MOCK MODE - Form submitted!', formData);
  setIsLoading(true);

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock success
  console.log('[LoginForm] MOCK - Login successful!');
  window.location.href = redirectTo;
};
```

To pozwoli sprawdzić:
- ✅ Czy przycisk wywołuje handler
- ✅ Czy loading state działa
- ✅ Czy redirect działa

---

## Zgłoś wyniki

Po wykonaniu kroków debugowania, zgłoś:

1. **Czy widzisz log "Component mounted"?** TAK/NIE
2. **Czy przycisk jest disabled po wypełnieniu pól?** TAK/NIE
3. **Czy widzisz log "Form submitted" po kliknięciu?** TAK/NIE
4. **Jakie błędy widzisz w konsoli?** (skopiuj treść)
5. **Jakie błędy widzisz w terminalu dev servera?** (skopiuj treść)

---

## Najczęstsze problemy

### 1. **Przycisk jest disabled (szary)**
**Przyczyna:** Pola email/password są puste
**Fix:** Wypełnij oba pola

### 2. **Brak logów w konsoli**
**Przyczyna:** Komponent nie jest loaded
**Fix:** Sprawdź `client:load` w `login.astro`

### 3. **Błąd "Cannot find module"**
**Przyczyna:** Błędny import
**Fix:** Sprawdź ścieżki importów

### 4. **Błąd "supabaseClient is undefined"**
**Przyczyna:** Brak env variables
**Fix:** Sprawdź `.env` file

### 5. **Infinite loading (spinner nie znika)**
**Przyczyna:** Supabase request się zawiesza
**Fix:** Sprawdź Network tab, zobacz czy request się wysyła

---

## Następne kroki

1. Wykonaj debug steps
2. Zgłoś wyniki
3. Na podstawie wyników zaimplementuję fix

**Potrzebuję szczegółowych logów z konsoli i terminalu!** 🔍
