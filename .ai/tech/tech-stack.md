# 🧱 Tech Stack — VibeTravels MVP

## Frontend
- **Astro 5** — szybki, wydajny framework do stron i aplikacji webowych (minimalny JS, świetne SEO)
- **React 19** — interaktywne komponenty w kluczowych miejscach (formularz planowania, dashboard, PDF preview)
- **TypeScript 5** — statyczne typowanie i lepsze wsparcie IDE
- **Tailwind CSS 4** — wydajne, spójne stylowanie UI
- **shadcn/ui** — gotowe, dostępne komponenty React do budowy interfejsu

## Backend
- **Supabase** — Backend-as-a-Service z PostgreSQL, Auth i Storage  
  - Obsługa rejestracji, logowania i subskrypcji użytkowników  
  - Przechowywanie planów podróży i historii użytkownika  
  - Open-source, z opcją własnego hostingu

## AI
- **OpenRouter.ai** — dostęp do modeli (GPT-4, Claude, Gemini, itp.)  
  - Generowanie spersonalizowanych planów podróży  
  - Możliwość kontroli kosztów i wyboru modelu

## Płatności i e-maile
- **Stripe** — obsługa subskrypcji i płatności Premium (webhooks, VAT)
- **Resend** — wysyłka e-maili transakcyjnych (rejestracja, plan gotowy, reset hasła)

## CI/CD i Hosting
- **GitHub Actions** — automatyczne pipeline’y CI/CD
- **DigitalOcean (Docker)** — hosting aplikacji i bazy danych  
  - Możliwość późniejszej migracji na Vercel / Render

## Dlaczego ten stack?
- ✅ Szybkie wdrożenie MVP  
- 💸 Niskie koszty utrzymania  
- ⚙️ Skalowalność do fazy Product-Market Fit  
- 🔒 Bezpieczna autentykacja i płatności  
- 🚀 Możliwość dalszego rozwoju bez zmiany architektury
