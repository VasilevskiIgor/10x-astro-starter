# Tworzenie użytkownika testowego w Supabase Local

## Problem
Masz lokalny Supabase uruchomiony (`http://127.0.0.1:54321`), ale nie masz użytkownika do testowania logowania.

---

## Rozwiązanie: Utwórz użytkownika testowego

### **Opcja 1: Przez Supabase Studio (ZALECANE)**

1. **Otwórz Supabase Studio:**
   ```
   http://127.0.0.1:54323
   ```

2. **Przejdź do:**
   - Authentication → Users

3. **Kliknij "Add user" (+ icon)**

4. **Wypełnij formularz:**
   - Email: `test@example.com`
   - Password: `password123`
   - Auto Confirm User: **✅ ZAZNACZ** (ważne!)

5. **Kliknij "Create user"**

6. **Gotowe!** Możesz teraz zalogować się:
   - Email: `test@example.com`
   - Password: `password123`

---

### **Opcja 2: Przez SQL Editor**

1. **Otwórz Supabase Studio:**
   ```
   http://127.0.0.1:54323
   ```

2. **Przejdź do:**
   - SQL Editor

3. **Wklej i uruchom:**
   ```sql
   -- Utwórz użytkownika testowego
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     confirmation_token,
     recovery_token,
     email_change_token_new,
     email_change,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin,
     confirmation_sent_at
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'test@example.com',
     crypt('password123', gen_salt('bf')),
     NOW(),
     '',
     '',
     '',
     '',
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{}',
     FALSE,
     NOW()
   );
   ```

4. **Kliknij "Run"**

5. **Gotowe!** User został utworzony.

---

### **Opcja 3: Przez API (curl)**

```bash
curl -X POST http://127.0.0.1:54321/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Uwaga:** Jeśli email confirmation jest włączone, user będzie musiał potwierdzić email. Dla testów lepiej użyć Opcji 1 z "Auto Confirm".

---

## Testowanie logowania

### **1. Otwórz aplikację:**
```
http://localhost:3000/auth/login
```

### **2. Wypełnij formularz:**
- Email: `test@example.com`
- Password: `password123`

### **3. Kliknij "Sign In"**

### **4. Sprawdź konsolę:**
Powinieneś zobaczyć:
```
[LoginForm] Button clicked! isLoading: false | email: test@example.com | password: ***
[LoginForm] Form submitted! { email: "test@example.com", password: "password123" }
[LoginForm] Attempting login with email: test@example.com
[LoginForm] Login successful: { user: {...}, session: {...} }
```

### **5. Jeśli widzisz błąd:**
```
[LoginForm] Login error: { message: "Invalid login credentials" }
```

**To znaczy:**
- User nie istnieje
- Hasło jest błędne
- Email nie został potwierdzony (jeśli wymaga confirmation)

---

## Sprawdzenie czy user istnieje

### **Przez SQL:**
```sql
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'test@example.com';
```

**Jeśli zwraca wiersz:**
- ✅ User istnieje
- Sprawdź kolumnę `email_confirmed_at` - jeśli NULL, to email nie jest potwierdzony

**Jeśli nie zwraca nic:**
- ❌ User nie istnieje - użyj Opcji 1 lub 2 powyżej

---

## Wyłączenie email confirmation (dla testów)

Jeśli chcesz wyłączyć wymaganie potwierdzenia email (ułatwia testy):

1. **Otwórz Supabase Studio:**
   ```
   http://127.0.0.1:54323
   ```

2. **Przejdź do:**
   - Authentication → Settings

3. **Znajdź:**
   - "Enable email confirmations"

4. **Odznacz checkbox**

5. **Zapisz**

Teraz nowi użytkownicy będą automatycznie potwierdzeni.

---

## Resetowanie hasła (jeśli zapomniałeś)

```sql
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'test@example.com';
```

---

## Następne kroki

Po utworzeniu użytkownika testowego:

1. ✅ Zaloguj się na `/auth/login`
2. ✅ Przekierowanie do home page
3. ✅ Kliknij "Create New Trip"
4. ✅ Formularz powinien działać bez zawieszania się!

---

## Troubleshooting

### Problem: "Invalid login credentials"
**Rozwiązanie:**
- Sprawdź czy user istnieje (SQL powyżej)
- Sprawdź czy hasło się zgadza
- Sprawdź czy email jest potwierdzony

### Problem: "Email not confirmed"
**Rozwiązanie:**
- Wyłącz email confirmation (instrukcja powyżej)
- Lub potwierdź email przez SQL:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = 'test@example.com';
  ```

### Problem: Supabase Studio nie działa
**Sprawdź:**
- Czy lokalny Supabase jest uruchomiony
- Otwórz terminal i uruchom:
  ```bash
  cd 10x-astro-starter
  npx supabase start
  ```

---

## Gotowe! 🎉

Po utworzeniu użytkownika, logowanie powinno działać.

**Test:**
1. `/auth/login`
2. Email: `test@example.com`
3. Password: `password123`
4. Sign In
5. ✅ Przekierowanie do `/`
