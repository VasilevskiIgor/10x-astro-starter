/**
 * Nominatim API Service
 *
 * Free geocoding service using OpenStreetMap data
 * Provides location autocomplete functionality with Polish language support
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface NominatimLocation {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
}

export interface LocationSuggestion {
  id: number;
  label: string;
  city?: string;
  country?: string;
  coordinates: {
    lat: string;
    lon: string;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const REQUEST_DELAY = 1000; // Nominatim requires 1 request per second
let lastRequestTime = 0;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Rate limiting helper - ensures we don't exceed Nominatim's rate limit
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
}

/**
 * Extract city name from Nominatim address
 */
function extractCityName(address: NominatimLocation["address"]): string | undefined {
  return address.city || address.town || address.village;
}

/**
 * Format location for display
 */
function formatLocationDisplay(location: NominatimLocation): string {
  const city = extractCityName(location.address);
  const country = location.address.country;

  if (city && country) {
    return `${city}, ${country}`;
  }

  // Fallback to display_name but simplify it
  const parts = location.display_name.split(",");
  return parts.slice(0, 2).join(",").trim();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search for locations using Nominatim API
 *
 * @param query - Search query (e.g., "Kraków", "Paris")
 * @param language - Language code (default: 'pl' for Polish)
 * @returns Array of location suggestions
 */
export async function searchLocations(query: string, language = "pl"): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Rate limiting
    await rateLimit();

    // Build URL with parameters
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      addressdetails: "1",
      limit: "10",
      "accept-language": language,
      // Prioritize cities and towns
      featuretype: "city",
    });

    const url = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "MagicTravelApp/1.0", // Nominatim requires User-Agent
      },
    });

    if (!response.ok) {
      console.error("Nominatim API error:", response.status, response.statusText);
      return [];
    }

    const data: NominatimLocation[] = await response.json();

    // Transform to our format
    const suggestions: LocationSuggestion[] = data
      .filter((location) => {
        // Filter to only include cities, towns, villages, and countries
        const validTypes = ["city", "town", "village", "administrative", "country"];
        return validTypes.includes(location.type);
      })
      .map((location) => ({
        id: location.place_id,
        label: formatLocationDisplay(location),
        city: extractCityName(location.address),
        country: location.address.country,
        coordinates: {
          lat: location.lat,
          lon: location.lon,
        },
      }));

    return suggestions;
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}

/**
 * Get popular destinations as fallback
 * Used when user hasn't typed anything or as suggestions
 */
export function getPopularDestinations(language = "pl"): LocationSuggestion[] {
  const destinations =
    language === "pl"
      ? [
          {
            id: 1,
            label: "Kraków, Polska",
            city: "Kraków",
            country: "Polska",
            coordinates: { lat: "50.0647", lon: "19.9450" },
          },
          {
            id: 2,
            label: "Warszawa, Polska",
            city: "Warszawa",
            country: "Polska",
            coordinates: { lat: "52.2297", lon: "21.0122" },
          },
          {
            id: 3,
            label: "Gdańsk, Polska",
            city: "Gdańsk",
            country: "Polska",
            coordinates: { lat: "54.3520", lon: "18.6466" },
          },
          {
            id: 4,
            label: "Wrocław, Polska",
            city: "Wrocław",
            country: "Polska",
            coordinates: { lat: "51.1079", lon: "17.0385" },
          },
          {
            id: 5,
            label: "Paryż, Francja",
            city: "Paryż",
            country: "Francja",
            coordinates: { lat: "48.8566", lon: "2.3522" },
          },
          {
            id: 6,
            label: "Rzym, Włochy",
            city: "Rzym",
            country: "Włochy",
            coordinates: { lat: "41.9028", lon: "12.4964" },
          },
          {
            id: 7,
            label: "Barcelona, Hiszpania",
            city: "Barcelona",
            country: "Hiszpania",
            coordinates: { lat: "41.3851", lon: "2.1734" },
          },
          {
            id: 8,
            label: "Londyn, Wielka Brytania",
            city: "Londyn",
            country: "Wielka Brytania",
            coordinates: { lat: "51.5074", lon: "-0.1278" },
          },
        ]
      : [
          {
            id: 1,
            label: "Krakow, Poland",
            city: "Krakow",
            country: "Poland",
            coordinates: { lat: "50.0647", lon: "19.9450" },
          },
          {
            id: 2,
            label: "Warsaw, Poland",
            city: "Warsaw",
            country: "Poland",
            coordinates: { lat: "52.2297", lon: "21.0122" },
          },
          {
            id: 3,
            label: "Gdansk, Poland",
            city: "Gdansk",
            country: "Poland",
            coordinates: { lat: "54.3520", lon: "18.6466" },
          },
          {
            id: 4,
            label: "Wroclaw, Poland",
            city: "Wroclaw",
            country: "Poland",
            coordinates: { lat: "51.1079", lon: "17.0385" },
          },
          {
            id: 5,
            label: "Paris, France",
            city: "Paris",
            country: "France",
            coordinates: { lat: "48.8566", lon: "2.3522" },
          },
          {
            id: 6,
            label: "Rome, Italy",
            city: "Rome",
            country: "Italy",
            coordinates: { lat: "41.9028", lon: "12.4964" },
          },
          {
            id: 7,
            label: "Barcelona, Spain",
            city: "Barcelona",
            country: "Spain",
            coordinates: { lat: "41.3851", lon: "2.1734" },
          },
          {
            id: 8,
            label: "London, United Kingdom",
            city: "London",
            country: "United Kingdom",
            coordinates: { lat: "51.5074", lon: "-0.1278" },
          },
        ];

  return destinations;
}

/**
 * Debounce helper for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
