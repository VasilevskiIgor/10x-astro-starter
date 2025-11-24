/**
 * i18n Utilities
 *
 * Core internationalization functions for the application
 */

import type { Locale, TranslationKey, Translations } from "./types";
import { DEFAULT_LOCALE } from "./types";

// Import translation files
import plTranslations from "./locales/pl.json";
import enTranslations from "./locales/en.json";

const translations: Record<Locale, Translations> = {
  pl: plTranslations as Translations,
  en: enTranslations as Translations,
};

/**
 * Get nested value from object using dot notation path
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((current, key) => current?.[key], obj) || path;
}

/**
 * Translate a key to the current locale
 *
 * @param key - Translation key (e.g., "auth.login_title")
 * @param locale - Target locale (defaults to DEFAULT_LOCALE)
 * @param params - Optional parameters for string interpolation
 * @returns Translated string
 *
 * @example
 * t("auth.login_title", "en") // "Welcome Back"
 * t("auth.login_title", "pl") // "Witaj ponownie"
 */
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE, params?: Record<string, string>): string {
  const translation = getNestedValue(translations[locale], key);

  // If params provided, replace placeholders
  if (params) {
    return Object.entries(params).reduce((str, [key, value]) => str.replace(`{${key}}`, value), translation);
  }

  return translation;
}

/**
 * Get current locale from localStorage or use default
 * This is for client-side only
 */
export function getLocaleFromStorage(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem("locale");
  if (stored === "pl" || stored === "en") {
    return stored;
  }

  return DEFAULT_LOCALE;
}

/**
 * Save locale to localStorage
 * This is for client-side only
 */
export function saveLocaleToStorage(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("locale", locale);
}

/**
 * Get locale from various sources with fallback chain:
 * 1. localStorage (client-side)
 * 2. Browser language
 * 3. DEFAULT_LOCALE
 */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  // Check localStorage first
  const stored = getLocaleFromStorage();
  if (stored) return stored;

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "pl" || browserLang === "en") {
    return browserLang;
  }

  return DEFAULT_LOCALE;
}

/**
 * Get translations object for a specific locale
 * Useful for server-side rendering
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): Translations {
  return translations[locale];
}

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
  return locale === "pl" || locale === "en";
}

/**
 * Get AI prompt language instruction based on locale
 * Used for generating AI content in user's preferred language
 */
export function getAILanguageInstruction(locale: Locale): string {
  return locale === "en" ? "Please respond in English." : "Proszę odpowiadać po polsku.";
}
