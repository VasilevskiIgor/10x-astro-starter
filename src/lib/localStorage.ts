/**
 * LocalStorage helper functions for persisting trip draft data
 *
 * Implements auto-save functionality to prevent data loss when users
 * navigate away or close the browser.
 */

import type { TripFormData } from "./validation-client";

// ============================================================================
// Type Definitions
// ============================================================================

interface LocalStorageTripDraft {
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  savedAt: string; // ISO timestamp
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "vibetravels_new_trip_draft";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a draft is still valid (not expired)
 */
export function isDraftValid(savedAt: string): boolean {
  const savedTime = new Date(savedAt).getTime();
  const now = Date.now();
  return now - savedTime < DRAFT_EXPIRY_MS;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Saves trip form data to localStorage
 */
export function saveTripDraft(data: TripFormData): void {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return;
  }

  const draft: LocalStorageTripDraft = {
    destination: data.destination,
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save trip draft:", error);
  }
}

/**
 * Loads trip form data from localStorage
 * Returns null if no valid draft exists
 */
export function loadTripDraft(): Partial<TripFormData> | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const draft: LocalStorageTripDraft = JSON.parse(stored);

    // Check if draft is expired
    if (!isDraftValid(draft.savedAt)) {
      clearTripDraft();
      return null;
    }

    return {
      destination: draft.destination,
      startDate: draft.startDate,
      endDate: draft.endDate,
      description: draft.description,
      generateAI: false, // Always default to false
    };
  } catch (error) {
    console.error("Failed to load trip draft:", error);
    clearTripDraft();
    return null;
  }
}

/**
 * Clears trip draft from localStorage
 */
export function clearTripDraft(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear trip draft:", error);
  }
}

/**
 * Creates a debounced version of saveTripDraft
 * Used to avoid excessive localStorage writes during typing
 */
export function createDebouncedSave(delayMs = 500) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (data: TripFormData) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveTripDraft(data);
      timeoutId = null;
    }, delayMs);
  };
}
