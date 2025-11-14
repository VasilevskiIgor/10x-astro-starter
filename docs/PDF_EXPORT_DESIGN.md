# PDF Export - Projekt i Plan Implementacji

## 📋 Przegląd

Dokument opisuje projekt szablonu PDF do eksportu gotowych podróży z aplikacji oraz plan techniczny implementacji.

---

## 🎨 Projekt Szablonu PDF

### Struktura Strony

#### 1. OKŁADKA (Cover Page)

```
┌─────────────────────────────────────────┐
│  [LOGO APLIKACJI]                       │
│                                         │
│         PLAN PODRÓŻY                    │
│                                         │
│     ✈️  DESTINATION (Duża czcionka)    │
│                                         │
│     📅 12 maja - 19 maja 2025          │
│     ⏱️  7 dni, 6 nocy                  │
│                                         │
│     [ZDJĘCIE DESTYNACJI - opcjonalne]   │
│                                         │
│                                         │
│  Wygenerowano: 14 listopada 2025        │
└─────────────────────────────────────────┘
```

**Zawartość:**
- Logo i nazwa aplikacji
- Tytuł: Destination
- Daty podróży (start_date → end_date)
- Długość pobytu (obliczona)
- Opcjonalne zdjęcie destynacji
- Data generowania PDF

---

#### 2. PODSUMOWANIE I MAPA

```
┌─────────────────────────────────────────┐
│  PODSUMOWANIE PODRÓŻY                   │
│  ────────────────────────────────────   │
│  [AI Generated Summary - 2-3 akapity]   │
│                                         │
│  MAPA TRASY                             │
│  ────────────────────────────────────   │
│  ┌───────────────────────────────┐     │
│  │  [MAPA Z PINAMI LOKALIZACJI]  │     │
│  │  • Pin 1: Activity A          │     │
│  │  • Pin 2: Activity B          │     │
│  └───────────────────────────────┘     │
│                                         │
│  REKOMENDACJE                           │
│  ────────────────────────────────────   │
│  🚗 Transport: [transport info]         │
│  🏨 Zakwaterowanie: [accommodation]     │
│  💰 Budżet: [budget info]               │
│  🌤️  Najlepszy czas: [best_time]       │
└─────────────────────────────────────────┘
```

**Zawartość:**
- Podsumowanie AI (`ai_generated_content.summary`)
- Statyczna mapa ze wszystkimi lokalizacjami aktywności
- Kluczowe rekomendacje (`recommendations`)

---

#### 3. SZCZEGÓŁOWY PLAN DNIA (dla każdego dnia)

```
┌─────────────────────────────────────────┐
│  DZIEŃ 1 • Piątek, 12 maja 2025         │
│  Day Title                              │
│  ────────────────────────────────────   │
│  📝 Podsumowanie dnia                   │
│  Brief day summary...                   │
│                                         │
│  AKTYWNOŚCI                             │
│  ────────────────────────────────────   │
│  ⏰ 09:00 (2h) 💰 $$                    │
│  📍 Activity Title                      │
│  Location: Specific Place               │
│  ─────────────────────────────          │
│  Activity description...                │
│  💡 TIP: Helpful tips...                │
│                                         │
│  ⏰ 14:30 (1.5h) 💰 $                   │
│  📍 Next Activity                       │
│  Location: Another Place                │
│  ─────────────────────────────          │
│  Description...                         │
│  💡 TIP: More tips...                   │
└─────────────────────────────────────────┘
```

**Zawartość dla każdego dnia:**
- Nagłówek: numer dnia, data, tytuł
- Podsumowanie dnia (`day.summary`)
- Lista aktywności:
  - Czas rozpoczęcia (`activity.time`)
  - Czas trwania (`activity.duration_minutes`)
  - Koszt (`activity.cost_estimate`)
  - Tytuł i lokalizacja
  - Opis
  - Wskazówki (`activity.tips`)

---

#### 4. INFORMACJE PRAKTYCZNE

```
┌─────────────────────────────────────────┐
│  INFORMACJE PRAKTYCZNE                  │
│  ────────────────────────────────────   │
│  🚗 TRANSPORT                           │
│  [recommendations.transportation]       │
│                                         │
│  🏨 ZAKWATEROWANIE                      │
│  [recommendations.accommodation]        │
│                                         │
│  💰 BUDŻET I KOSZTY                     │
│  [recommendations.budget]               │
│                                         │
│  🌤️  NAJLEPSZY CZAS                    │
│  [recommendations.best_time]            │
│                                         │
│  CHECKLIST PRZED PODRÓŻĄ                │
│  □ Paszport / Dowód                     │
│  □ Bilety                               │
│  □ Rezerwacje                           │
│  □ Ubezpieczenie                        │
│  □ Karty płatnicze                      │
│  □ Leki                                 │
│  □ Ładowarki i adaptery                 │
│                                         │
│  Wygenerowano przez [App Name]          │
└─────────────────────────────────────────┘
```

**Zawartość:**
- Szczegółowe rekomendacje
- Checklist przed podróżą
- Branding aplikacji

---

## 🗺️ Integracja Mapy - Opcje

### Opcja 1: Google Maps Static API ⭐ (Zalecana)

**URL Pattern:**
```
https://maps.googleapis.com/maps/api/staticmap?
  size=800x600&
  maptype=roadmap&
  markers=color:red|label:1|Location1&
  markers=color:red|label:2|Location2&
  key=GOOGLE_MAPS_API_KEY
```

**Pros:**
- ✅ Wysokiej jakości mapy
- ✅ Automatyczne geocodowanie po nazwie
- ✅ Customizacja markerów i stylu
- ✅ 28,000 darmowych requestów/miesiąc

**Cons:**
- ❌ Wymaga Google API key
- ❌ Płatne powyżej limitu

**Implementacja:**
```typescript
function generateGoogleMapUrl(activities: ActivityDetail[]): string {
  const markers = activities
    .map((act, idx) =>
      `markers=color:red%7Clabel:${idx + 1}%7C${encodeURIComponent(act.location)}`
    )
    .join('&');

  return `https://maps.googleapis.com/maps/api/staticmap?` +
         `size=800x600&maptype=roadmap&${markers}&` +
         `key=${process.env.GOOGLE_MAPS_API_KEY}`;
}
```

---

### Opcja 2: Mapbox Static Images API

**URL Pattern:**
```
https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/
  pin-s-1+ff0000(lng1,lat1),pin-s-2+ff0000(lng2,lat2)/
  auto/800x600?access_token=MAPBOX_TOKEN
```

**Pros:**
- ✅ Piękne, nowoczesne mapy
- ✅ 50,000 darmowych requestów/miesiąc
- ✅ Świetna customizacja

**Cons:**
- ❌ Wymaga geocodowania lokalizacji (dodatkowy krok)
- ❌ Wymaga współrzędnych (lng, lat)

**Uwaga:** Wymagane będzie dodanie geocodowania do aplikacji lub zapisywanie współrzędnych przy tworzeniu aktywności.

---

### Opcja 3: OpenStreetMap (Free)

**URL Pattern (via staticmap.openstreetmap.de):**
```
https://staticmap.openstreetmap.de/staticmap.php?
  center=LAT,LNG&
  zoom=12&
  size=800x600&
  markers=LAT1,LNG1,red-1&
  markers=LAT2,LNG2,red-2
```

**Pros:**
- ✅ Całkowicie darmowe
- ✅ Open source
- ✅ Bez limitów API

**Cons:**
- ❌ Niższa jakość map
- ❌ Ograniczona customizacja
- ❌ Wymaga geocodowania

---

## 💻 Stack Technologiczny

### Rekomendacja: @react-pdf/renderer

```bash
npm install @react-pdf/renderer
```

**Dlaczego @react-pdf/renderer?**
- ✅ React komponenty → łatwa integracja z projektem
- ✅ TypeScript support
- ✅ Server-side rendering (SSR)
- ✅ Wsparcie dla obrazów, styli, layoutów
- ✅ Aktywnie rozwijany
- ✅ Świetna dokumentacja

**Struktura komponentów:**

```typescript
// src/lib/pdf/TripPDFDocument.tsx
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';

export const TripPDFDocument = ({ trip }: { trip: TripDetailDTO }) => (
  <Document>
    <CoverPage trip={trip} />
    <SummaryPage trip={trip} />
    {trip.ai_generated_content.days.map((day, idx) => (
      <DayPage key={idx} day={day} dayNumber={idx + 1} />
    ))}
    <PracticalInfoPage trip={trip} />
  </Document>
);
```

---

## 🏗️ Plan Implementacji

### Faza 1: Setup i Struktura (2-3h)

**Zadania:**
1. ✅ Instalacja zależności
   ```bash
   npm install @react-pdf/renderer
   npm install -D @types/react-pdf
   ```

2. ✅ Struktura folderów
   ```
   src/lib/pdf/
   ├── TripPDFDocument.tsx      # Główny komponent Document
   ├── components/
   │   ├── CoverPage.tsx         # Okładka
   │   ├── SummaryPage.tsx       # Podsumowanie + mapa
   │   ├── DayPage.tsx           # Strona dnia
   │   ├── ActivityItem.tsx      # Pojedyncza aktywność
   │   └── PracticalInfoPage.tsx # Informacje praktyczne
   ├── styles.ts                 # Wspólne style PDF
   └── utils.ts                  # Pomocnicze funkcje

   src/pages/api/trips/[id]/
   └── export-pdf.ts             # API endpoint do generowania PDF
   ```

3. ✅ Konfiguracja TypeScript
   - Dodanie typów dla @react-pdf/renderer

---

### Faza 2: Komponenty PDF (4-6h)

**Zadania:**

1. **Stworzenie bazowych stylów** (`src/lib/pdf/styles.ts`)
   ```typescript
   import { StyleSheet, Font } from '@react-pdf/renderer';

   // Opcjonalnie: dodanie custom fontów
   Font.register({
     family: 'Roboto',
     src: 'https://fonts.gstatic.com/s/roboto/v30/...'
   });

   export const styles = StyleSheet.create({
     page: { padding: 30, fontFamily: 'Roboto' },
     coverPage: { /* ... */ },
     heading: { fontSize: 24, marginBottom: 10 },
     // ... więcej stylów
   });
   ```

2. **CoverPage komponent**
   - Logo aplikacji
   - Destination (duży tytuł)
   - Daty i długość podróży
   - Opcjonalne zdjęcie destynacji

3. **SummaryPage komponent**
   - AI summary
   - Statyczna mapa (Image z URL)
   - Sekcja rekomendacji

4. **DayPage komponent**
   - Nagłówek dnia
   - Lista aktywności (używa ActivityItem)

5. **ActivityItem komponent**
   - Czas, koszt, tytuł, lokalizacja
   - Opis i tips

6. **PracticalInfoPage komponent**
   - Rozszerzone rekomendacje
   - Checklist

---

### Faza 3: Integracja Mapy (2-3h)

**Zadania:**

1. **Wybór dostawcy map**
   - Rekomendacja: Google Maps Static API
   - Dodanie `GOOGLE_MAPS_API_KEY` do `.env`

2. **Funkcja generowania URL mapy** (`src/lib/pdf/utils.ts`)
   ```typescript
   export function generateMapUrl(
     activities: ActivityDetail[],
     destination: string
   ): string {
     // Implementacja generowania URL z markerami
   }
   ```

3. **Integracja w SummaryPage**
   ```tsx
   <Image
     src={generateMapUrl(trip.ai_generated_content.days.flatMap(d => d.activities))}
     style={styles.map}
   />
   ```

---

### Faza 4: API Endpoint (2h)

**Zadania:**

1. **Stworzenie `/api/trips/[id]/export-pdf.ts`**
   ```typescript
   import type { APIRoute } from 'astro';
   import { renderToStream } from '@react-pdf/renderer';
   import { TripPDFDocument } from '@/lib/pdf/TripPDFDocument';

   export const prerender = false;

   export const GET: APIRoute = async ({ params, locals }) => {
     // 1. Pobierz trip
     const trip = await tripService.getById(params.id, locals.supabase);

     // 2. Wygeneruj PDF
     const stream = await renderToStream(
       <TripPDFDocument trip={trip} />
     );

     // 3. Zwróć jako response
     return new Response(stream as any, {
       headers: {
         'Content-Type': 'application/pdf',
         'Content-Disposition': `attachment; filename="trip-${trip.destination}.pdf"`
       }
     });
   };
   ```

2. **Walidacja i error handling**
   - Sprawdzenie czy trip istnieje
   - Czy user ma dostęp
   - Czy AI content jest wygenerowane

---

### Faza 5: UI Integration (1-2h)

**Zadania:**

1. **Dodanie przycisku Export PDF w TripDetail.tsx**
   ```tsx
   <button
     onClick={() => window.open(`/api/trips/${trip.id}/export-pdf`, '_blank')}
     className="btn-primary"
   >
     📄 Eksportuj PDF
   </button>
   ```

2. **Loading state podczas generowania**
   - Opcjonalnie: pokazanie progress bar
   - Komunikat "Generowanie PDF..."

3. **Error handling w UI**
   - Obsługa błędów (brak AI content, błąd API)

---

### Faza 6: Testowanie i Optymalizacja (2-3h)

**Zadania:**

1. **Testy funkcjonalne**
   - Test z różną liczbą dni (1 dzień vs 7 dni)
   - Test z długimi opisami
   - Test bez zdjęć / map
   - Test z różnymi statusami trip

2. **Optymalizacja wydajności**
   - Caching map URLs
   - Lazy loading obrazów
   - Kompresja PDF

3. **Responsywność PDF**
   - Test na różnych przeglądarkach
   - Test wydruku

---

## 📊 Struktura Danych

### Mapping TripDetailDTO → PDF Sections

```typescript
TripDetailDTO {
  // COVER PAGE
  destination          → Tytuł okładki
  start_date          → Data rozpoczęcia
  end_date            → Data zakończenia

  // SUMMARY PAGE
  ai_generated_content: {
    summary           → Podsumowanie podróży

    recommendations: {
      transportation  → Ikona 🚗 Transport
      accommodation   → Ikona 🏨 Zakwaterowanie
      budget          → Ikona 💰 Budżet
      best_time       → Ikona 🌤️ Najlepszy czas
    }

    // MAPA
    days[].activities[].location → Markery na mapie

    // DAY PAGES (dla każdego dnia)
    days[]: {
      day_number      → "DZIEŃ X"
      date            → Data w nagłówku
      title           → Tytuł dnia
      summary         → Podsumowanie dnia

      activities[]: {
        time          → ⏰ Godzina
        duration_minutes → (Xh)
        cost_estimate → 💰 $, $$, $$$
        title         → 📍 Tytuł aktywności
        location      → Lokalizacja
        description   → Opis
        tips          → 💡 TIP: wskazówki
      }
    }
  }

  // PRACTICAL INFO PAGE
  // (te same recommendations, ale rozszerzone)
}
```

---

## 🎯 Dodatkowe Funkcjonalności (Nice to Have)

### Opcjonalne usprawnienia:

1. **Personalizacja PDF**
   - Wybór języka (PL/EN)
   - Wybór stylu (kolorystyki)
   - Włączenie/wyłączenie sekcji

2. **Interaktywne elementy**
   - QR kod do online wersji trip
   - Linki do booking.com, Google Maps

3. **Zdjęcia destynacji**
   - Integracja z Unsplash API
   - Automatyczne dodanie zdjęcia destynacji na okładkę

4. **Multi-format export**
   - JSON export
   - DOCX export
   - Print-optimized HTML

---

## 📝 Checklist Implementacji

- [ ] Instalacja @react-pdf/renderer
- [ ] Struktura folderów PDF
- [ ] Komponenty PDF:
  - [ ] CoverPage
  - [ ] SummaryPage
  - [ ] DayPage
  - [ ] ActivityItem
  - [ ] PracticalInfoPage
- [ ] Style PDF (styles.ts)
- [ ] Integracja mapy (Google Maps Static API)
- [ ] API endpoint `/api/trips/[id]/export-pdf`
- [ ] UI: przycisk Export w TripDetail
- [ ] Testy
- [ ] Dokumentacja

---

## 🔗 Przydatne Linki

- [@react-pdf/renderer Docs](https://react-pdf.org/)
- [Google Maps Static API](https://developers.google.com/maps/documentation/maps-static/overview)
- [Mapbox Static Images](https://docs.mapbox.com/api/maps/static-images/)
- [OpenStreetMap Static](https://wiki.openstreetmap.org/wiki/Static_map_images)

---

## ⏱️ Szacowany Czas Implementacji

| Faza | Czas |
|------|------|
| 1. Setup i struktura | 2-3h |
| 2. Komponenty PDF | 4-6h |
| 3. Integracja mapy | 2-3h |
| 4. API endpoint | 2h |
| 5. UI integration | 1-2h |
| 6. Testowanie | 2-3h |
| **TOTAL** | **13-19h** |

---

## 💰 Koszty (przy użyciu Google Maps)

- **Google Maps Static API**: 28,000 requestów/miesiąc darmowo
- Powyżej: $2 za 1000 requestów
- **Szacunek**: przy 100 eksportach PDF/dzień = ~3000/miesiąc → w limicie darmowym

---

*Dokument stworzony: 2025-11-14*
