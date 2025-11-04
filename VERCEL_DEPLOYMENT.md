# Vercel Deployment Guide

Dokumentacja konfiguracji deployment aplikacji Travel App Planner na platformie Vercel.

## Przegląd zmian

### 1. Zmiany w zależnościach
- Dodano `@astrojs/vercel` adapter dla wsparcia SSR na Vercel

### 2. Aktualizacja konfiguracji Astro

**Plik:** [astro.config.mjs](astro.config.mjs)

Zmieniono adapter z `@astrojs/node` na `@astrojs/vercel/serverless`:

```js
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
```

**Funkcjonalności:**
- `webAnalytics`: Włącza Vercel Web Analytics dla monitorowania wydajności i ruchu

### 3. Konfiguracja Vercel

**Plik:** [vercel.json](vercel.json)

```json
{
  "buildCommand": "npm run build",
  "framework": "astro",
  "outputDirectory": "dist",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

**Kluczowe ustawienia:**
- `buildCommand`: Komenda build (używana tylko jeśli nie używasz `vercel build` w CI/CD)
- `framework`: Auto-detection dla Astro
- `outputDirectory`: Folder z build artifacts
- `regions`: Deployment w regionie Washington D.C. (iad1) dla optymalnej latencji
- `functions.maxDuration`: Limit czasu wykonania API routes (60s dla Pro plan, 10s dla Hobby)
- `env`: Referencje do Vercel Environment Variables (prefiks `@` dla production secrets)

### 4. Vercel Ignore Configuration

**Plik:** [.vercelignore](.vercelignore)

Określa pliki i foldery, które nie powinny być uploadowane do Vercel podczas deployment:

```
# Dependencies
node_modules

# Testing
coverage
playwright-report
test-results

# Development
.vscode
*.log

# CI/CD
.github
.husky

# Local environment
.env
.env.local
```

**Korzyści:**
- Zmniejsza rozmiar uploadowanych artifacts
- Przyspiesza deployment
- Zapobiega uploadowaniu wrażliwych plików lokalnych

## Wymagane GitHub Secrets

Aby workflow CI/CD działał poprawnie, musisz skonfigurować następujące sekrety w repozytorium GitHub:

### Sekrety Vercel
| Secret | Opis | Gdzie znaleźć |
|--------|------|---------------|
| `VERCEL_TOKEN` | Token autoryzacji Vercel CLI | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID organizacji/zespołu Vercel | `.vercel/project.json` po uruchomieniu `vercel link` |
| `VERCEL_PROJECT_ID` | ID projektu Vercel | `.vercel/project.json` po uruchomieniu `vercel link` |

### Sekrety aplikacji
| Secret | Opis |
|--------|------|
| `OPENAI_API_KEY` | Klucz API OpenAI |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter |
| `SUPABASE_URL` | URL instancji Supabase |
| `SUPABASE_KEY` | Service role key Supabase |
| `PUBLIC_SUPABASE_URL` | Publiczny URL Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Publiczny anonymous key Supabase |

## Instrukcja konfiguracji

### Krok 1: Połączenie projektu z Vercel

```bash
cd 10x-astro-starter

# Zainstaluj Vercel CLI globalnie
npm install -g vercel

# Zaloguj się do Vercel
vercel login

# Połącz projekt z istniejącym projektem Vercel
vercel link
```

Po wykonaniu `vercel link` zostanie utworzony folder `.vercel/` z plikiem `project.json` zawierającym `orgId` i `projectId`.

### Krok 2: Pobranie ID projektu

```bash
cat .vercel/project.json
```

Przykładowy output:
```json
{
  "orgId": "team_xxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxx"
}
```

### Krok 3: Wygenerowanie Vercel Token

1. Przejdź do [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Kliknij **Create Token**
3. Nadaj nazwę (np. `GitHub Actions Deploy`)
4. Wybierz scope: **Full Account**
5. Ustaw expiration (rekomendacja: **No Expiration** dla CI/CD)
6. Skopiuj wygenerowany token

### Krok 4: Konfiguracja GitHub Secrets

1. Przejdź do repozytorium GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret** i dodaj wszystkie wymagane sekrety

### Krok 5: Utworzenie środowiska Production w GitHub

1. W ustawieniach repozytorium przejdź do **Environments**
2. Kliknij **New environment**
3. Nazwa: `production`
4. Opcjonalnie skonfiguruj:
   - **Required reviewers**: Wymagaj zatwierdzenia przed deployment
   - **Wait timer**: Opóźnienie przed deployment
   - **Deployment branches**: Ogranicz do `main`

## Workflow CI/CD

**Plik:** [.github/workflows/master.yml](.github/workflows/master.yml)

### Trigger
Workflow uruchamia się automatycznie przy każdym push do branch `main`.

### Concurrency Control
```yaml
concurrency:
  group: production-deployment
  cancel-in-progress: false
```
Zapewnia, że tylko jeden production deployment działa w tym samym czasie. Nie anuluje trwających deploymentów (bezpieczeństwo).

### Stages

#### 1. **Lint Code**
- Sprawdzenie jakości kodu przez ESLint
- Walidacja standardów kodowania
- **Runner:** ubuntu-latest

#### 2. **Unit Tests**
- Uruchomienie testów jednostkowych z coverage
- Upload artefaktów coverage (retention: 30 dni)
- **Depends on:** Lint
- **Runner:** ubuntu-latest

#### 3. **Deploy to Vercel Production**
- **Depends on:** Lint + Unit Tests
- **Environment:** production (z deployment URL)
- **Runner:** ubuntu-latest

**Kroki deployment:**

1. **Checkout & Setup**
   - Checkout kodu z GitHub
   - Setup Node.js zgodnie z `.nvmrc`
   - Instalacja zależności przez `npm ci`

2. **Install Vercel CLI**
   ```bash
   npm install --global vercel@latest
   ```

3. **Pull Vercel Environment**
   ```bash
   vercel pull --yes --environment=production
   ```
   Pobiera konfigurację środowiska production z Vercel (zmienne, ustawienia projektu).

4. **Build Project**
   ```bash
   vercel build --prod
   ```
   - Buduje projekt z optymalizacjami produkcyjnymi
   - Generuje `.vercel/output` folder (Build Output API)
   - Przekazuje wszystkie zmienne środowiskowe (OpenAI, Supabase)
   - **Zaleta:** Build odbywa się w GitHub Actions (kontrola nad CI/CD)

5. **Deploy Prebuilt Artifacts**
   ```bash
   vercel deploy --prebuilt --prod
   ```
   - Uploaduje tylko build artifacts (nie source code)
   - Pomija build step w Vercel
   - Zwraca deployment URL

6. **Post Status Comments**
   - **Success:** Commit comment z deployment URL i linkami
   - **Failure:** Commit comment z informacją o błędzie i linkiem do logów

### Różnice względem pull-request.yml

| Funkcjonalność | pull-request.yml | master.yml |
|----------------|------------------|------------|
| **Trigger** | Pull Request do `main` | Push do `main` |
| **E2E Tests** | ✅ Tak (z Playwright) | ❌ Nie |
| **Deployment** | ❌ Nie | ✅ Vercel Production |
| **Environment** | `integration` | `production` |
| **Vercel Build** | - | ✅ `vercel build --prod` |
| **Komentarz** | PR comment | Commit comment |
| **Concurrency** | Brak | ✅ Production-only |
| **Coverage retention** | 7 dni | 30 dni |

### Zmienne środowiskowe w deployment

#### Job-level Environment Variables
```yaml
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```
Używane przez Vercel CLI do identyfikacji projektu.

#### Step-level Environment Variables (Build)
Przekazywane podczas `vercel build --prod`:
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

**Ważne:** Zmienne środowiskowe muszą być skonfigurowane zarówno w GitHub Secrets, jak i w Vercel Dashboard dla redundancji i lokalnego testowania.

## Veryfikacja deployment

Po zakończeniu workflow, sprawdź:

1. **GitHub Actions tab** - Status workflow powinien być ✅ Success
2. **Commit comments** - Komentarz z deployment URL
3. **Vercel Dashboard** - Deployment pojawi się w projekcie
4. **Aplikacja** - Przetestuj deployment URL

---

## Domeny

### Automatyczna domena Vercel (Darmowa)

**Nie potrzebujesz kupować domeny!** Każdy deployment automatycznie otrzymuje darmowe domeny:

**Domeny produkcyjne:**
```
https://twoj-projekt.vercel.app           # Główna domena produkcyjna
https://twoj-projekt-git-main.vercel.app  # Branch-specific URL
```

**Deployment-specific URLs:**
```
https://twoj-projekt-xyz123.vercel.app    # Każdy deployment ma unikalny URL
```

**Funkcjonalności:**
- ✅ Automatyczne SSL/HTTPS (certyfikaty od Let's Encrypt)
- ✅ Globalny CDN (Vercel Edge Network)
- ✅ HTTP/2 i HTTP/3 support
- ✅ Custom headers i redirects
- ✅ Pełna funkcjonalność (identyczna jak własna domena)

### Własna domena (Opcjonalna)

Możesz podpiąć własną domenę w dowolnym momencie bez zmian w kodzie.

#### Konfiguracja własnej domeny

**1. Kup domenę** u rejestratora:
- Namecheap (~$10-15/rok)
- GoDaddy (~$12-20/rok)
- Cloudflare (~$10/rok)
- Google Domains (~$12/rok)

**2. Dodaj domenę w Vercel:**
```
Vercel Dashboard → Project → Settings → Domains → Add Domain
```

Wprowadź domenę (np. `twojaaplikacja.com` lub `app.twojaaplikacja.com`)

**3. Skonfiguruj DNS u rejestratora:**

Vercel wyświetli instrukcje konfiguracji DNS:

**Opcja A: A Record (root domain)**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Opcja B: CNAME (subdomain lub apex)**
```
Type: CNAME
Name: www (lub app, api, etc.)
Value: cname.vercel-dns.com
```

**Opcja C: Nameservers (rekomendowane dla apex domain)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**4. Weryfikacja:**
DNS propagation zajmuje 5-48h (zazwyczaj <1h). Vercel automatycznie wykryje i wygeneruje SSL.

#### Konfiguracja redirects

**Redirect z www do non-www:**
```json
// vercel.json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.twojaaplikacja.com"
        }
      ],
      "destination": "https://twojaaplikacja.com/:path*",
      "permanent": true
    }
  ]
}
```

**Redirect z vercel.app do własnej domeny:**
Automatyczne przez Vercel Dashboard → Settings → Domains → Redirect

#### Multiple domains

Możesz dodać wiele domen wskazujących na ten sam projekt:
- `twojaaplikacja.com` (primary)
- `www.twojaaplikacja.com` (redirect to primary)
- `app.twojaaplikacja.com` (alias)
- `twojaaplikacja.pl` (alias lub redirect)

**Koszty:**
- Każda dodatkowa domena: Tylko koszt rejestracji u rejestratora
- Konfiguracja w Vercel: **Darmowa**
- SSL certificates: **Darmowe** (automatyczne)

---

## Monitoring i Analytics

### Vercel Web Analytics
Włączone przez konfigurację w `astro.config.mjs`. Dostępne w Vercel Dashboard → Project → Analytics.

**Metryki:**
- Page views
- Unique visitors
- Top pages
- Top referrers
- Devices and browsers

### Vercel Speed Insights
Automatycznie dostępne dla wszystkich deployments.

**Metryki wydajności:**
- Real Experience Score (RES)
- Core Web Vitals (LCP, FID, CLS)
- TTFB (Time to First Byte)

## Troubleshooting

### Problem: Deployment timeout
**Rozwiązanie:**
- Sprawdź czy plan Vercel obsługuje dłuższe timeouty (Hobby: 10s, Pro: 60s)
- Zoptymalizuj funkcje API do szybszego wykonania
- Rozważ użycie background jobs dla długich operacji

### Problem: Missing environment variables
**Rozwiązanie:**
- Upewnij się że wszystkie sekrety są poprawnie skonfigurowane w GitHub
- Weryfikuj nazwy sekretów (case-sensitive)
- Sprawdź czy środowisko `production` istnieje w GitHub

### Problem: Build fails
**Rozwiązanie:**
- Sprawdź logi w GitHub Actions
- Upewnij się że `npm ci` zainstalowało wszystkie zależności
- Zweryfikuj kompatybilność wersji Node.js (.nvmrc)

### Problem: vercel pull fails
**Rozwiązanie:**
- Sprawdź poprawność `VERCEL_TOKEN`
- Upewnij się że `VERCEL_ORG_ID` i `VERCEL_PROJECT_ID` są poprawne
- Zweryfikuj uprawnienia tokena (Full Account scope)

## Best Practices

### 1. Environment Variables
- **Nigdy nie commituj** `.env` do repozytorium
- Używaj GitHub Secrets dla wartości wrażliwych
- Aktualizuj zmienne w Vercel Dashboard oraz GitHub Secrets synchronicznie
- Używaj prefixu `PUBLIC_` dla zmiennych dostępnych w przeglądarce (Astro convention)

### 2. Deployment Strategy
- **Local Testing:** Zawsze testuj zmiany lokalnie przed push do `main`
- **Pull Requests:** Używaj PR dla code review - testy E2E przejdą automatycznie
- **Merge to Main:** Po merge, automatyczny production deployment
- **Rollback:** W razie problemów, revert commit i push - automatyczny re-deploy
- **Preview Deployments:** Rozważ dodanie preview deployments dla feature branches

### 3. Build Separation Pattern (Vercel Official)
```bash
vercel build      # Build w CI/CD
vercel deploy --prebuilt  # Deploy tylko artifacts
```
**Zalety:**
- Build odbywa się w kontrolowanym środowisku GitHub Actions
- Source code nie jest uploadowany do Vercel (bezpieczeństwo)
- Szybszy deployment (tylko artifacts)
- Pełna kontrola nad procesem CI/CD

### 4. Monitoring
- **Analytics:** Regularnie sprawdzaj Vercel Web Analytics (włączone w `astro.config.mjs`)
- **Speed Insights:** Monitoruj Core Web Vitals (LCP, FID, CLS)
- **Deployment Logs:** Sprawdzaj logi w Vercel Dashboard i GitHub Actions
- **Alerts:** Ustaw alerty w Vercel dla błędów deployment i downtime

### 5. Cost Optimization
- **Usage Monitoring:** Regularnie sprawdzaj Vercel Dashboard → Usage
- **Regions:** Ogranicz deployment do jednego regionu (`iad1`) lub najbliższego użytkownikom
- **Function Duration:** Ustaw rozsądne `maxDuration` (obecnie: 60s)
  - Hobby plan: max 10s (free)
  - Pro plan: max 60s ($20/m)
- **Bandwidth:** Monitoruj monthly bandwidth (Hobby: 100GB, Pro: 1TB)
- **Optimizations:**
  - Używaj Vercel Image Optimization
  - Enable Edge Caching dla statycznych assets
  - Implementuj ISR (Incremental Static Regeneration) gdzie możliwe

### 6. Security
- **Secrets Rotation:** Regularnie rotuj API keys (OpenAI, Supabase)
- **Token Expiration:** Vercel Token powinien mieć "No Expiration" dla CI/CD, ale przechowuj bezpiecznie
- **Environment Isolation:** Używaj oddzielnych kluczy dla production i preview
- **GitHub Branch Protection:** Wymagaj PR reviews przed merge do `main`
- **.vercelignore:** Upewnij się że wrażliwe pliki są ignorowane

### 7. Performance
- **Edge Functions:** Rozważ użycie Edge Functions dla API routes (niższa latencja)
- **Code Splitting:** Astro automatycznie splituje kod - monitoruj bundle size
- **Image Optimization:** Używaj `<Image>` komponentu z Astro
- **Caching:** Implementuj odpowiednie cache headers dla statycznych assets

## Dodatkowe zasoby

- [Astro Vercel Adapter Docs](https://docs.astro.build/en/guides/deploy/vercel/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## Wsparcie

W przypadku problemów z konfiguracją:
1. Sprawdź logi GitHub Actions
2. Przejrzyj Vercel deployment logs
3. Zweryfikuj dokumentację Astro i Vercel
4. Sprawdź czy wszystkie sekrety są poprawnie skonfigurowane
