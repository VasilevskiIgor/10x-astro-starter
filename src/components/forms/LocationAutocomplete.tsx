/**
 * LocationAutocomplete Component
 *
 * Autocomplete input for location selection using Nominatim API
 * Features:
 * - Real-time search with debouncing
 * - Popular destinations as fallback
 * - Keyboard navigation
 * - Validation feedback
 */

import * as React from 'react';
import { searchLocations, getPopularDestinations, debounce, type LocationSuggestion } from '@/lib/nominatim';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  language?: string;
}

// ============================================================================
// Component
// ============================================================================

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  placeholder = 'np. Paryż, Francja',
  language = 'pl',
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [showPopular, setShowPopular] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // ============================================================================
  // Search Function
  // ============================================================================

  const performSearch = React.useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        setShowPopular(true);
        const popular = getPopularDestinations(language);
        setSuggestions(popular);
        return;
      }

      setIsLoading(true);
      setShowPopular(false);

      try {
        const results = await searchLocations(query, language);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  // Debounced search
  const debouncedSearch = React.useMemo(() => debounce(performSearch, 500), [performSearch]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    debouncedSearch(newValue);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      setShowPopular(true);
      const popular = getPopularDestinations(language);
      setSuggestions(popular);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setIsOpen(false);
      if (onBlur) {
        onBlur();
      }
    }, 200);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
    setShowPopular(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // ============================================================================
  // Click Outside Handler
  // ============================================================================

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============================================================================
  // Scroll Highlighted Item Into View
  // ============================================================================

  React.useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'destination-error' : undefined}
          aria-autocomplete="list"
          aria-controls="location-suggestions"
          aria-expanded={isOpen}
          className={`mt-1 block w-full rounded-md border px-3 py-2 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : !error && value
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />

        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <svg
              className="h-4 w-4 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="location-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg max-h-60 overflow-auto"
        >
          {showPopular && (
            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-200">
              Popularne destynacje
            </div>
          )}

          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              data-index={index}
              role="option"
              aria-selected={highlightedIndex === index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                highlightedIndex === index ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
              }`}
            >
              <svg
                className={`h-4 w-4 flex-shrink-0 ${highlightedIndex === index ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{suggestion.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && suggestions.length === 0 && value.trim().length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg px-3 py-4 text-center"
        >
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-gray-600">Nie znaleziono lokalizacji</p>
          <p className="text-xs text-gray-500 mt-1">Spróbuj innej nazwy lub sprawdź pisownię</p>
        </div>
      )}
    </div>
  );
};
