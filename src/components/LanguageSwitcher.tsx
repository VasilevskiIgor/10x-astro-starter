/**
 * Language Switcher Component
 *
 * Allows users to switch between available languages (Polish/English)
 * Saves preference to localStorage and reloads the page
 */

import { useState, useEffect } from "react";
import type { Locale } from "@/i18n/types";
import { LOCALE_CONFIGS } from "@/i18n/types";
import { getLocaleFromStorage, saveLocaleToStorage } from "@/i18n/utils";

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>("pl");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get current locale from localStorage
    const locale = getLocaleFromStorage();
    setCurrentLocale(locale);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Save to localStorage
    saveLocaleToStorage(newLocale);

    // Reload page to apply new locale
    window.location.reload();
  };

  const currentConfig = LOCALE_CONFIGS[currentLocale];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-2xl">{currentConfig.flag}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close language menu"
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              {Object.values(LOCALE_CONFIGS).map((config) => (
                <button
                  key={config.code}
                  onClick={() => handleLocaleChange(config.code)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                    currentLocale === config.code
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{config.flag}</span>
                  <span>{config.name}</span>
                  {currentLocale === config.code && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
