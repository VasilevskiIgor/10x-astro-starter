# 🧱 Tech Stack — VibeTravels (Post-Certification)

**Status:** 🎉 Certyfikat zdobyty! Projekt w fazie dalszego rozwoju.

## Frontend
- **Astro 5** — szybki, wydajny framework do stron i aplikacji webowych (minimalny JS, świetne SEO)
- **React 19** — interaktywne komponenty w kluczowych miejscach (formularz planowania, dashboard, language switcher)
- **TypeScript 5** — statyczne typowanie i lepsze wsparcie IDE
- **Tailwind CSS 4** — wydajne, spójne stylowanie UI
- **shadcn/ui** — gotowe, dostępne komponenty React do budowy interfejsu
- **🆕 Astro i18n + Custom Utils** — internationalization (Polski/English) z minimalnym overhead

## Backend
- **Supabase** — Backend-as-a-Service z PostgreSQL, Auth i Storage  
  - Obsługa rejestracji, logowania i subskrypcji użytkowników  
  - Przechowywanie planów podróży i historii użytkownika  
  - Open-source, z opcją własnego hostingu

## AI
- **OpenRouter.ai** — dostęp do modeli (GPT-4, Claude, Gemini, itp.)
  - Generowanie spersonalizowanych planów podróży
  - Możliwość kontroli kosztów i wyboru modelu
  - **🆕 Multi-language prompts** — AI generuje plany w języku użytkownika (PL/EN)

## Płatności i e-maile (Planned - Phase 4)
- **Stripe** — obsługa subskrypcji i płatności Premium (webhooks, VAT) - *Do implementacji Q2 2026*
- **Resend** — wysyłka e-maili transakcyjnych (rejestracja, plan gotowy, reset hasła) - *Do implementacji Q1 2026*

## CI/CD i Hosting
- **GitHub Actions** — automatyczne pipeline'y CI/CD
- **Vercel** — hosting aplikacji (FREE tier) z preview deployments
  - Automatyczny deploy z main branch
  - Preview URLs dla każdego PR

## Development Roadmap

### ✅ Phase 0: Certification (Zakończone)
- Autentykacja (Supabase Auth)
- CRUD dla planów podróży
- AI generation (OpenRouter)
- E2E tests (Playwright)
- CI/CD (GitHub Actions)

### 🚧 Phase 1: Internationalization (Q4 2025 - IN PROGRESS)
- **Astro i18n configuration**
- **Polski i Angielski support**
- **Language switcher component**
- **AI prompts w wybranym języku**
- Translation utilities i system

### 📋 Phase 2: UX/UI Enhancement (Q1 2026)
- Responsive design
- Dark mode
- Animations & transitions
- Better error handling

### 📋 Phase 3: Advanced Features (Q1-Q2 2026)
- Google OAuth
- PDF export
- Email notifications
- Plan sharing

### 📋 Phase 4: Monetization (Q2 2026)
- Stripe integration
- Premium tier
- Usage limits dla free tier

### 📋 Phase 5: Scale (Q3 2026)
- Analytics
- Performance optimization
- SEO improvements
- Mobile PWA

## Dlaczego ten stack?
- ✅ Szybkie wdrożenie MVP (zrealizowane!)
- 💸 Niskie koszty utrzymania (Vercel + Supabase FREE tier)
- ⚙️ Skalowalność do fazy Product-Market Fit
- 🔒 Bezpieczna autentykacja (Supabase + RLS)
- 🌍 Multi-language support z minimalnym overhead
- 🚀 Możliwość dalszego rozwoju bez zmiany architektury
