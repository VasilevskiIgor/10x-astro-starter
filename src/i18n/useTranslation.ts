/**
 * React Hook for i18n
 *
 * Custom hook for using translations in React components
 */

import { useState, useEffect, useCallback } from "react";
import type { Locale, TranslationKey } from "./types";
import { t, getLocaleFromStorage } from "./utils";

/**
 * React hook for translations
 * Automatically detects locale from localStorage and provides translation function
 *
 * @returns Object with t function and current locale
 *
 * @example
 * const { t, locale } = useTranslation();
 * return <h1>{t("auth.login_title")}</h1>
 */
export function useTranslation() {
  const [locale, setLocale] = useState<Locale>("pl");

  useEffect(() => {
    // Get locale from localStorage on mount
    const currentLocale = getLocaleFromStorage();
    setLocale(currentLocale);

    // Listen for locale changes (when language switcher is used)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "locale" && (e.newValue === "pl" || e.newValue === "en")) {
        setLocale(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Return translation function with current locale already applied
  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string>) => {
      return t(key, locale, params);
    },
    [locale]
  );

  return { t: translate, locale };
}
