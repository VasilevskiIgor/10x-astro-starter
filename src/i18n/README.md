# 🌍 Internationalization (i18n)

VibeTravels supports multiple languages using a custom i18n implementation with Astro 5's native i18n features.

## Supported Languages

- 🇵🇱 **Polski** (pl) - Default
- 🇬🇧 **English** (en)

## Quick Start

### For Astro Pages

```astro
---
// src/pages/example.astro
import Layout from "@/layouts/Layout.astro";
---

<Layout title="Example Page">
  <h1 data-i18n="common.app_name">Magic Travel App</h1>
  <p data-i18n="auth.login_subtitle">Zaloguj się do swojego konta</p>
</Layout>

<script>
  import { t, getLocaleFromStorage } from "@/i18n";

  const locale = getLocaleFromStorage();

  // Translate all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (key) {
      element.textContent = t(key as any, locale);
    }
  });
</script>
```

### For React Components

```tsx
import { useTranslation } from "@/i18n";

export function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t("common.app_name")}</h1>
      <p>{t("auth.login_subtitle")}</p>
      <p>Current language: {locale}</p>
    </div>
  );
}
```

### Direct Translation Function

```typescript
import { t, getLocaleFromStorage } from "@/i18n";

const locale = getLocaleFromStorage();
const translatedText = t("auth.login_title", locale);
```

## Translation Files

Translation keys are stored in JSON files:

- `src/i18n/locales/pl.json` - Polish translations
- `src/i18n/locales/en.json` - English translations

### Structure

```json
{
  "common": {
    "app_name": "Magic Travel App",
    "email": "Email",
    "password": "Password"
  },
  "auth": {
    "login_title": "Welcome Back",
    "login_button": "Sign In"
  }
}
```

## Adding New Translations

1. **Add key to both language files:**

```json
// src/i18n/locales/pl.json
{
  "my_feature": {
    "title": "Mój Tytuł"
  }
}

// src/i18n/locales/en.json
{
  "my_feature": {
    "title": "My Title"
  }
}
```

2. **Update TypeScript types** in `src/i18n/types.ts`:

```typescript
export interface Translations {
  // ... existing
  my_feature: {
    title: string;
  };
}

export type TranslationKey =
  | `common.${keyof Translations["common"]}`
  | `my_feature.${keyof Translations["my_feature"]}`;
```

3. **Use in your code:**

```tsx
const { t } = useTranslation();
<h1>{t("my_feature.title")}</h1>
```

## Language Switcher

The `LanguageSwitcher` component is already included in the navigation bar.

To use it in other places:

```astro
---
import LanguageSwitcher from "@/components/LanguageSwitcher";
---

<LanguageSwitcher client:load />
```

## How It Works

1. **User selects language** via `LanguageSwitcher` component
2. **Preference saved** to `localStorage` under key `locale`
3. **Page reloads** to apply new language
4. **All components read** locale from `localStorage` via `getLocaleFromStorage()`
5. **Translations applied** using `t()` function or `useTranslation()` hook

## AI Content Localization

For AI-generated content, use the `getAILanguageInstruction()` helper:

```typescript
import { getAILanguageInstruction, getLocaleFromStorage } from "@/i18n";

const locale = getLocaleFromStorage();
const languageInstruction = getAILanguageInstruction(locale);

const prompt = `${languageInstruction}

Create a travel itinerary for Tokyo...`;
```

This ensures AI generates content in the user's preferred language.

## Utilities Reference

### `t(key, locale, params?)`

Translate a key to target locale.

```typescript
t("auth.login_title", "en"); // "Welcome Back"
t("auth.login_title", "pl"); // "Witaj ponownie"
```

### `useTranslation()`

React hook for translations.

```typescript
const { t, locale } = useTranslation();
```

### `getLocaleFromStorage()`

Get current locale from localStorage.

```typescript
const locale = getLocaleFromStorage(); // "pl" | "en"
```

### `saveLocaleToStorage(locale)`

Save locale to localStorage.

```typescript
saveLocaleToStorage("en");
```

### `detectLocale()`

Auto-detect locale from localStorage or browser language.

```typescript
const locale = detectLocale();
```

### `getAILanguageInstruction(locale)`

Get language instruction for AI prompts.

```typescript
const instruction = getAILanguageInstruction("en");
// "Please respond in English."
```

## Best Practices

1. **Always use translation keys**, never hardcode text
2. **Add translations for both languages** when adding new features
3. **Update TypeScript types** to maintain type safety
4. **Test in both languages** before committing
5. **Use descriptive keys** like `auth.login_title` not `text1`

## Troubleshooting

### Translations not showing

- Check if locale is being read correctly: `console.log(getLocaleFromStorage())`
- Verify translation key exists in both `pl.json` and `en.json`
- Ensure `data-i18n` attributes are translated in client-side script

### Language not persisting

- Check browser console for localStorage errors
- Verify `saveLocaleToStorage()` is called when language changes
- Clear browser cache and try again

### Type errors

- Ensure new keys are added to `Translations` interface
- Update `TranslationKey` type with new namespaces
- Run `npm run type-check` to verify

## Future Improvements

- [ ] Add more languages (Spanish, German, etc.)
- [ ] Server-side rendering with locale detection
- [ ] Automatic translation of meta tags and page titles
- [ ] Date/time formatting based on locale
- [ ] Number formatting based on locale
- [ ] RTL support for Arabic/Hebrew
