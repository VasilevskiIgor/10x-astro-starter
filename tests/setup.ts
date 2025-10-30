/**
 * Vitest Test Setup
 *
 * Global test configuration and setup for all unit tests.
 * This file runs before all test files.
 */

import "@testing-library/jest-dom";
import { afterEach } from "vitest";

/**
 * Cleanup after each test
 * Ensures no test pollution between test cases
 */
afterEach(() => {
  // Reset any mocks after each test
  vi.clearAllMocks();
});

/**
 * Global test utilities
 */
global.console = {
  ...console,
  // Suppress console errors in tests unless explicitly needed
  error: vi.fn(),
  warn: vi.fn(),
};
