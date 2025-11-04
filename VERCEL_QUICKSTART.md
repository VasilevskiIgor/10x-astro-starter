# Vercel Deployment - Quick Start Guide

Szybki przewodnik wdrożenia aplikacji Travel App Planner na Vercel z GitHub Actions.

## Przygotowanie (jednorazowe)

### 1. Zainstaluj Vercel CLI

```bash
npm install -g vercel
```

### 2. Zaloguj się do Vercel

```bash
vercel login
```

### 3. Połącz projekt z Vercel

```bash
cd 10x-astro-starter
vercel link
```

**Odpowiedz na pytania:**
- Set up and deploy? → **N** (używamy GitHub Actions)
- Which scope? → Wybierz swój zespół/konto
- Link to existing project? → **Y**
- What's the name of your existing project? → Wprowadź nazwę projektu w Vercel

Po zakończeniu zostanie utworzony folder `.vercel/` z plikiem `project.json`.

### 4. Pobierz ID projektu

```bash
cat .vercel/project.json
```

Zapisz wartości:
- `orgId` → `VERCEL_ORG_ID`
- `projectId` → `VERCEL_PROJECT_ID`

### 5. Wygeneruj Vercel Token

1. Otwórz [Vercel Account → Tokens](https://vercel.com/account/tokens)
2. Kliknij **Create Token**
3. Name: `GitHub Actions Deploy`
4. Scope: **Full Account**
5. Expiration: **No Expiration**
6. Skopiuj wygenerowany token → `VERCEL_TOKEN`

## Konfiguracja GitHub

### 6. Dodaj GitHub Secrets

**Settings → Secrets and variables → Actions → New repository secret**

Dodaj następujące sekrety:

#### Vercel Secrets
```
VERCEL_TOKEN=vercel_xxxxx
VERCEL_ORG_ID=team_xxxxx
VERCEL_PROJECT_ID=prj_xxxxx
```

#### Application Secrets
```
OPENAI_API_KEY=sk-xxxxx
OPENROUTER_API_KEY=sk-or-v1-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxx
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

### 7. Utwórz Environment w GitHub

**Settings → Environments → New environment**

- Name: `production`
- **Optional:** Dodaj Required reviewers (dla większej kontroli)
- **Optional:** Deployment branches → Selected branches → `main`

## Konfiguracja Vercel Dashboard

### 8. Sprawdź ustawienia Git w Vercel

**Vercel Dashboard → Project → Settings → Git**

W sekcji "Connected Git Repository" powinieneś zobaczyć:
- Połączone repozytorium: `VasilevskiIgor/10x-astro-starter`
- Pull Request Comments: **Enabled** (opcjonalnie)
- Commit Comments: Disabled
- `deployment_status` Events: **Enabled**
- `repository_dispatch` Events: **Enabled**

**Uwaga:** W nowym interfejsie Vercel nie ma już opcji "Enable Automatic Deployments from GitHub". Vercel automatycznie deployuje na push do branchy (możesz to zmienić w sekcji "Git" → branch settings jeśli chcesz).

**Nasza strategia:** Używamy GitHub Actions jako głównego CI/CD, a Vercel jako platformy hostingowej. GitHub Actions wywołuje deployment na Vercel tylko gdy testy przejdą pomyślnie.

### 9. Skonfiguruj Environment Variables w Vercel

**Vercel Dashboard → Project → Settings → Environment Variables**

Dodaj te same zmienne co w GitHub Secrets:
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

**Environment:** Production

## Test Deployment

### 10. Push do main branch

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

### 11. Sprawdź workflow

1. Otwórz **GitHub → Actions**
2. Znajdź workflow **Production Deployment**
3. Sprawdź logi każdego kroku
4. Po zakończeniu sprawdź commit comments dla deployment URL

### 12. Weryfikacja

- ✅ Workflow zakończył się sukcesem
- ✅ Deployment URL jest dostępny (format: `https://twoj-projekt.vercel.app`)
- ✅ Aplikacja działa poprawnie
- ✅ Vercel Dashboard pokazuje nowy deployment

**Twoja aplikacja jest teraz dostępna pod darmową domeną Vercel!**

---

## 🌐 Domeny (Opcjonalne)

### Automatyczna domena Vercel (Darmowa)

Każdy deployment automatycznie otrzymuje domeny:
- **Production:** `https://twoj-projekt.vercel.app`
- **Branch:** `https://twoj-projekt-git-main.vercel.app`
- **Deployment:** `https://twoj-projekt-xyz123.vercel.app`

**Nie potrzebujesz kupować domeny!** Domena Vercel jest w pełni funkcjonalna z SSL/HTTPS.

### Własna domena (Opcjonalna)

Jeśli w przyszłości chcesz użyć własnej domeny:

1. **Kup domenę** u rejestratora (np. Namecheap, GoDaddy, Cloudflare)
2. **Dodaj w Vercel Dashboard:**
   ```
   Project → Settings → Domains → Add Domain
   ```
3. **Skonfiguruj DNS** u rejestratora (Vercel pokaże instrukcje)
4. **Gotowe!** Automatyczne SSL i redirect z vercel.app

**Koszt własnej domeny:** ~$10-15/rok (tylko koszt rejestracji, konfiguracja w Vercel darmowa)

## Workflow użytkowania

### Development Flow

```bash
# 1. Utwórz feature branch
git checkout -b feature/new-feature

# 2. Wprowadź zmiany i commituj
git add .
git commit -m "Add new feature"

# 3. Push branch
git push origin feature/new-feature

# 4. Utwórz Pull Request na GitHub
# - PR CI uruchomi się automatycznie (lint, unit tests, E2E tests)
# - Sprawdź czy wszystkie testy przeszły

# 5. Merge PR do main
# - Production deployment uruchomi się automatycznie
# - Sprawdź deployment URL w commit comments
```

### Hotfix Flow

```bash
# 1. Utwórz hotfix branch z main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# 2. Fix bug i commit
git add .
git commit -m "Fix critical bug"

# 3. Push i utwórz PR
git push origin hotfix/critical-bug

# 4. Po review i merge, automatyczny deployment
```

## Troubleshooting

### Problem: Workflow fails na "Pull Vercel Environment"

**Rozwiązanie:**
```bash
# Sprawdź czy sekrety są poprawne
# GitHub → Settings → Secrets → Actions
```

Upewnij się że:
- `VERCEL_TOKEN` jest prawidłowy i aktywny
- `VERCEL_ORG_ID` i `VERCEL_PROJECT_ID` są z `.vercel/project.json`

### Problem: Build fails

**Rozwiązanie:**
```bash
# Testuj build lokalnie
npm run build

# Jeśli lokalnie działa, sprawdź environment variables
# Upewnij się że wszystkie wymagane zmienne są w GitHub Secrets
```

### Problem: Deployment succeeds ale aplikacja nie działa

**Rozwiązanie:**
1. Sprawdź Vercel Dashboard → Deployments → Najnowszy deployment → Logs
2. Sprawdź czy wszystkie Environment Variables są ustawione w Vercel
3. Sprawdź czy `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` są poprawne

### Problem: "Context access might be invalid" warnings w IDE

To są **normalne ostrzeżenia** - IDE nie może zweryfikować czy GitHub Secrets istnieją. Workflow będzie działał poprawnie.

## Przydatne komendy

### Lokalny deployment (testowy)

```bash
# Deploy do Vercel bez CI/CD (dla testów)
vercel

# Deploy do production (bez CI/CD)
vercel --prod
```

**Uwaga:** Używaj tylko do testowania. Produkcyjne deploymenty powinny przechodzić przez GitHub Actions.

### Sprawdzenie statusu deploymentu

```bash
# Lista deploymentów
vercel ls

# Logi ostatniego deploymentu
vercel logs
```

### Rollback (przez GitHub)

```bash
# Znajdź commit przed problemem
git log --oneline

# Revert problematycznego commita
git revert <commit-hash>

# Push - automatyczny deployment
git push origin main
```

## Wsparcie

- 📖 [Pełna dokumentacja](./VERCEL_DEPLOYMENT.md)
- 🚀 [Vercel Documentation](https://vercel.com/docs)
- 🌟 [Astro Vercel Guide](https://docs.astro.build/en/guides/deploy/vercel/)
- 💬 [GitHub Actions Docs](https://docs.github.com/en/actions)

## Checklist

Po przejściu przez ten przewodnik powinieneś mieć:

- ✅ Zainstalowany i skonfigurowany Vercel CLI
- ✅ Projekt połączony z Vercel (`vercel link`)
- ✅ Wszystkie GitHub Secrets skonfigurowane
- ✅ Environment `production` utworzony w GitHub
- ✅ Automatyczne deploymenty Vercel wyłączone
- ✅ Environment Variables w Vercel Dashboard
- ✅ Pierwszy deployment zakończony sukcesem
- ✅ Workflow CI/CD działa poprawnie

**Gratulacje! 🎉 Twoja aplikacja jest gotowa do deployment na Vercel!**
