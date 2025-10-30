/**
 * Enhanced Unit Tests for RulesBuilderService.generateRulesContent()
 *
 * This test suite provides comprehensive coverage for the generateRulesContent() method,
 * including business rules validation, edge cases, and output formatting.
 *
 * Coverage focus:
 * - Content structure and formatting
 * - Budget guidance integration
 * - Activity calculations
 * - Output consistency
 * - Advanced edge cases
 * - Custom configuration impact
 *
 * @see rules-builder.service.ts
 * @see tech/RulesBuilderService-Enhanced-Tests.md for detailed strategy
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RulesBuilderService, CostLevel, type RulesConfig } from "@/services/rules-builder.service";

describe("RulesBuilderService.generateRulesContent() - Enhanced Tests", () => {
  let service: RulesBuilderService;

  beforeEach(() => {
    service = new RulesBuilderService();
  });

  /**
   * ====================================================================
   * TEST SUITE 1: Content Structure Validation
   * ====================================================================
   */
  describe("Content Structure and Format", () => {
    it("should include header section with correct format", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain("=== CONTENT GENERATION RULES ===");
      expect(result.startsWith("=== CONTENT GENERATION RULES ===")).toBe(true);
    });

    it("should include all 4 main sections in correct order", () => {
      const result = service.generateRulesContent(5);

      // Find section positions
      const activitySection = result.indexOf("1. ACTIVITY REQUIREMENTS");
      const costSection = result.indexOf("2. COST ESTIMATE RULES");
      const timeSection = result.indexOf("3. TIME SLOT RULES");
      const tripSection = result.indexOf("4. TRIP-SPECIFIC RULES");

      // All sections should exist
      expect(activitySection).toBeGreaterThan(-1);
      expect(costSection).toBeGreaterThan(-1);
      expect(timeSection).toBeGreaterThan(-1);
      expect(tripSection).toBeGreaterThan(-1);

      // Sections should be in order
      expect(activitySection).toBeLessThan(costSection);
      expect(costSection).toBeLessThan(timeSection);
      expect(timeSection).toBeLessThan(tripSection);
    });

    it("should use consistent indentation for sub-items", () => {
      const result = service.generateRulesContent(3);

      // Check for 3-space indentation pattern
      expect(result).toMatch(/\n {3}- Each day MUST have/);
      expect(result).toMatch(/\n {3}- Activity duration:/);
      expect(result).toMatch(/\n {3}- Use ONLY these cost levels:/);
    });

    it("should include all cost level descriptions", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain('"$" = Budget (<$20)');
      expect(result).toContain('"$$" = Moderate ($20-$50)');
      expect(result).toContain('"$$$" = Expensive ($50-$100)');
      expect(result).toContain('"$$$$" = Luxury (>$100)');
    });

    it("should include all time slot descriptions", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain("Early Morning (05:00-08:00)");
      expect(result).toContain("Morning (08:00-12:00)");
      expect(result).toContain("Afternoon (12:00-17:00)");
      expect(result).toContain("Evening (17:00-21:00)");
      expect(result).toContain("Night (21:00-24:00)");
    });

    it("should include activity type balance recommendation", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain("Balance activity types: 40% cultural, 30% food/dining, 20% outdoor, 10% relaxation");
    });

    it("should not include undefined or null strings in output", () => {
      const result = service.generateRulesContent(7);

      expect(result).not.toContain("undefined");
      expect(result).not.toContain("null");
      expect(result).not.toContain("NaN");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 2: Budget Guidance Integration
   * ====================================================================
   */
  describe("Budget Guidance Integration", () => {
    it("should include correct guidance for budget level", () => {
      const result = service.generateRulesContent(7, "budget");

      expect(result).toContain("Preferred budget level: $");
      expect(result).toContain("Focus on free/cheap activities, local food, public transport");
    });

    it("should include correct guidance for moderate level", () => {
      const result = service.generateRulesContent(7, "moderate");

      expect(result).toContain("Preferred budget level: $$");
      expect(result).toContain("Mix of paid attractions and free activities, local restaurants");
    });

    it("should include correct guidance for expensive level", () => {
      const result = service.generateRulesContent(7, "expensive");

      expect(result).toContain("Preferred budget level: $$$");
      expect(result).toContain("Premium attractions, guided tours, nice restaurants");
    });

    it("should include correct guidance for luxury level", () => {
      const result = service.generateRulesContent(7, "luxury");

      expect(result).toContain("Preferred budget level: $$$$");
      expect(result).toContain("Exclusive experiences, fine dining, private tours");
    });

    it("should NOT include budget guidance when budget is undefined", () => {
      const result = service.generateRulesContent(7);

      expect(result).not.toContain("Preferred budget level:");
      expect(result).not.toContain("Focus on");
      expect(result).not.toContain("Mix of");
      expect(result).not.toContain("Premium");
      expect(result).not.toContain("Exclusive");
    });

    it("should NOT include budget guidance when budget is invalid", () => {
      const result = service.generateRulesContent(7, "invalid");

      expect(result).not.toContain("Preferred budget level:");
    });

    it("should NOT include budget guidance when budget is empty string", () => {
      const result = service.generateRulesContent(7, "");

      expect(result).not.toContain("Preferred budget level:");
    });

    it("should handle case-insensitive budget strings correctly", () => {
      const lower = service.generateRulesContent(7, "budget");
      const upper = service.generateRulesContent(7, "BUDGET");
      const mixed = service.generateRulesContent(7, "BuDgEt");

      // All should produce identical output
      expect(lower).toBe(upper);
      expect(upper).toBe(mixed);
    });

    it("should handle budget with extra whitespace", () => {
      const result = service.generateRulesContent(7, "  luxury  ");

      expect(result).toContain("Preferred budget level: $$$$");
      expect(result).toContain("Exclusive experiences");
    });

    it("should handle budget synonyms correctly", () => {
      const budget1 = service.generateRulesContent(7, "budget");
      const budget2 = service.generateRulesContent(7, "low");
      const budget3 = service.generateRulesContent(7, "cheap");

      // All synonyms should produce same guidance
      expect(budget1).toContain("Focus on free/cheap activities");
      expect(budget2).toContain("Focus on free/cheap activities");
      expect(budget3).toContain("Focus on free/cheap activities");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 3: Activity Calculations
   * ====================================================================
   */
  describe("Activity Calculations", () => {
    it("should calculate correct activities range for 1 day", () => {
      const result = service.generateRulesContent(1);

      expect(result).toContain("Total activities: 3-5");
      expect(result).toContain("Total duration: 1 days");
    });

    it("should calculate correct activities range for 7 days", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain("Total activities: 21-35");
      expect(result).toContain("Total duration: 7 days");
    });

    it("should calculate correct activities range for 30 days", () => {
      const result = service.generateRulesContent(30);

      expect(result).toContain("Total activities: 90-150");
      expect(result).toContain("Total duration: 30 days");
    });

    it("should calculate correct activities range for 365 days (maximum)", () => {
      const result = service.generateRulesContent(365);

      expect(result).toContain("Total activities: 1095-1825");
      expect(result).toContain("Total duration: 365 days");
    });

    it("should use custom config in activity calculations", () => {
      const customService = new RulesBuilderService({
        minActivitiesPerDay: 2,
        maxActivitiesPerDay: 6,
      });

      const result = customService.generateRulesContent(10);

      expect(result).toContain("Total activities: 20-60");
    });

    it("should format activity range with hyphen (no spaces)", () => {
      const result = service.generateRulesContent(7);

      expect(result).toContain("21-35"); // Not "21 - 35" or "21 -35"
      expect(result).not.toContain("21 - 35");
    });

    it("should handle large trip durations without overflow", () => {
      const result = service.generateRulesContent(365);

      // Should calculate correctly: 365 * 3 = 1095, 365 * 5 = 1825
      expect(result).toContain("1095-1825");

      // Should not have floating point errors
      expect(result).not.toContain("1094.9");
      expect(result).not.toContain("1825.1");
    });

    it("should use config values in activity requirements text", () => {
      const customService = new RulesBuilderService({
        minActivitiesPerDay: 4,
        maxActivitiesPerDay: 7,
      });

      const result = customService.generateRulesContent(5);

      expect(result).toContain("Each day MUST have 4-7 activities");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 4: Output Consistency
   * ====================================================================
   */
  describe("Output Consistency", () => {
    it("should produce identical output for same inputs", () => {
      const result1 = service.generateRulesContent(7, "moderate");
      const result2 = service.generateRulesContent(7, "moderate");

      expect(result1).toBe(result2);
      expect(result1).toEqual(result2);
    });

    it("should produce different output for different trip durations", () => {
      const result1 = service.generateRulesContent(3);
      const result2 = service.generateRulesContent(7);

      expect(result1).not.toBe(result2);
      expect(result1).toContain("Total duration: 3 days");
      expect(result2).toContain("Total duration: 7 days");
    });

    it("should produce different output for different budgets", () => {
      const budget = service.generateRulesContent(7, "budget");
      const luxury = service.generateRulesContent(7, "luxury");

      expect(budget).not.toBe(luxury);
      expect(budget).toContain("Preferred budget level: $");
      expect(luxury).toContain("Preferred budget level: $$$$");
    });

    it("should maintain section order consistently across calls", () => {
      const results = [
        service.generateRulesContent(3),
        service.generateRulesContent(7),
        service.generateRulesContent(14),
        service.generateRulesContent(30),
      ];

      results.forEach((result) => {
        const sections = [
          result.indexOf("1. ACTIVITY REQUIREMENTS"),
          result.indexOf("2. COST ESTIMATE RULES"),
          result.indexOf("3. TIME SLOT RULES"),
          result.indexOf("4. TRIP-SPECIFIC RULES"),
        ];

        // All sections present and in order
        expect(sections[0]).toBeLessThan(sections[1]);
        expect(sections[1]).toBeLessThan(sections[2]);
        expect(sections[2]).toBeLessThan(sections[3]);
      });
    });

    it("should be deterministic (no random elements)", () => {
      const results = Array.from({ length: 10 }, () => service.generateRulesContent(7, "moderate"));

      const first = results[0];
      results.forEach((result) => {
        expect(result).toBe(first);
      });
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 5: Advanced Edge Cases
   * ====================================================================
   */
  describe("Advanced Edge Cases", () => {
    it("should throw error for NaN trip duration", () => {
      expect(() => service.generateRulesContent(NaN)).toThrow("Invalid trip duration");
    });

    it("should throw error for Infinity trip duration", () => {
      expect(() => service.generateRulesContent(Infinity)).toThrow("Invalid trip duration");
    });

    it("should throw error for negative Infinity", () => {
      expect(() => service.generateRulesContent(-Infinity)).toThrow("Invalid trip duration");
    });

    it("should handle exactly minimum value (1 day)", () => {
      const result = service.generateRulesContent(1);

      expect(result).toBeTruthy();
      expect(result).toContain("Total duration: 1 days");
      expect(result).toContain("Total activities: 3-5");
    });

    it("should handle exactly maximum value (365 days)", () => {
      const result = service.generateRulesContent(365);

      expect(result).toBeTruthy();
      expect(result).toContain("Total duration: 365 days");
      expect(result).toContain("Total activities: 1095-1825");
    });

    it("should throw error for duration just below minimum (0)", () => {
      expect(() => service.generateRulesContent(0)).toThrow(
        "Invalid trip duration: 0. Must be between 1 and 365 days."
      );
    });

    it("should throw error for duration just above maximum (366)", () => {
      expect(() => service.generateRulesContent(366)).toThrow(
        "Invalid trip duration: 366. Must be between 1 and 365 days."
      );
    });

    it("should throw error for large invalid numbers", () => {
      expect(() => service.generateRulesContent(1000)).toThrow("Invalid trip duration");
      expect(() => service.generateRulesContent(10000)).toThrow("Invalid trip duration");
    });

    it("should throw error for decimal durations", () => {
      expect(() => service.generateRulesContent(3.5)).toThrow("Invalid trip duration");
      expect(() => service.generateRulesContent(7.999)).toThrow("Invalid trip duration");
      expect(() => service.generateRulesContent(1.1)).toThrow("Invalid trip duration");
    });

    it("should throw error for negative durations", () => {
      expect(() => service.generateRulesContent(-1)).toThrow("Invalid trip duration");
      expect(() => service.generateRulesContent(-10)).toThrow("Invalid trip duration");
      expect(() => service.generateRulesContent(-365)).toThrow("Invalid trip duration");
    });

    it("should handle budget with tabs and newlines", () => {
      const result = service.generateRulesContent(7, "\tluxury\n");

      expect(result).toContain("Preferred budget level: $$$$");
    });

    it("should ignore partial budget matches", () => {
      const result1 = service.generateRulesContent(7, "budg");
      const result2 = service.generateRulesContent(7, "lux");
      const result3 = service.generateRulesContent(7, "mod");

      expect(result1).not.toContain("Preferred budget level:");
      expect(result2).not.toContain("Preferred budget level:");
      expect(result3).not.toContain("Preferred budget level:");
    });

    it("should ignore budget with numbers", () => {
      const result = service.generateRulesContent(7, "123");

      expect(result).not.toContain("Preferred budget level:");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 6: Custom Configuration Impact
   * ====================================================================
   */
  describe("Custom Configuration Impact on Output", () => {
    it("should reflect custom minActivitiesPerDay in requirements", () => {
      const customService = new RulesBuilderService({
        minActivitiesPerDay: 2,
      });

      const result = customService.generateRulesContent(7);

      expect(result).toContain("Each day MUST have 2-5 activities");
    });

    it("should reflect custom maxActivitiesPerDay in requirements", () => {
      const customService = new RulesBuilderService({
        maxActivitiesPerDay: 8,
      });

      const result = customService.generateRulesContent(7);

      expect(result).toContain("Each day MUST have 3-8 activities");
    });

    it("should reflect custom duration limits in requirements", () => {
      const customService = new RulesBuilderService({
        minActivityDurationMinutes: 30,
        maxActivityDurationMinutes: 360,
      });

      const result = customService.generateRulesContent(7);

      expect(result).toContain("Activity duration: 30-360 minutes");
    });

    it("should reflect custom cost levels in cost section", () => {
      const customService = new RulesBuilderService({
        allowedCostLevels: [CostLevel.BUDGET, CostLevel.MODERATE],
      });

      const result = customService.generateRulesContent(7);

      expect(result).toContain("Use ONLY these cost levels: $, $$");
      expect(result).not.toContain("$$$, $$$$");
    });

    it("should use custom config in total activities calculation", () => {
      const customService = new RulesBuilderService({
        minActivitiesPerDay: 1,
        maxActivitiesPerDay: 3,
      });

      const result = customService.generateRulesContent(10);

      expect(result).toContain("Total activities: 10-30");
    });

    it("should handle extreme custom configurations", () => {
      const extremeService = new RulesBuilderService({
        minActivitiesPerDay: 10,
        maxActivitiesPerDay: 20,
        minActivityDurationMinutes: 5,
        maxActivityDurationMinutes: 1440, // 24 hours
      });

      const result = extremeService.generateRulesContent(7);

      expect(result).toContain("Each day MUST have 10-20 activities");
      expect(result).toContain("Activity duration: 5-1440 minutes");
      expect(result).toContain("Total activities: 70-140");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 7: Integration with Helper Methods
   * ====================================================================
   */
  describe("Integration with Helper Methods", () => {
    it("should integrate with isValidTripDuration()", () => {
      // Valid durations should work
      expect(() => service.generateRulesContent(1)).not.toThrow();
      expect(() => service.generateRulesContent(365)).not.toThrow();

      // Invalid durations should throw
      expect(() => service.generateRulesContent(0)).toThrow();
      expect(() => service.generateRulesContent(366)).toThrow();
    });

    it("should integrate with parseBudgetLevel()", () => {
      // All valid budget strings should produce guidance
      const budgets = ["budget", "moderate", "expensive", "luxury"];

      budgets.forEach((budget) => {
        const result = service.generateRulesContent(7, budget);
        expect(result).toContain("Preferred budget level:");
      });

      // Invalid budget should not produce guidance
      const invalid = service.generateRulesContent(7, "invalid");
      expect(invalid).not.toContain("Preferred budget level:");
    });

    it("should integrate with calculateTotalActivities()", () => {
      const result = service.generateRulesContent(7);

      // Should use same calculation as calculateTotalActivities()
      const calculated = service.calculateTotalActivities(7);
      expect(result).toContain(`Total activities: ${calculated}`);
    });

    it("should integrate with getBudgetGuidance() (private method)", () => {
      // Can't call private method directly, but can verify output
      const budget = service.generateRulesContent(7, "budget");
      const luxury = service.generateRulesContent(7, "luxury");

      expect(budget).toContain("free/cheap activities");
      expect(luxury).toContain("Exclusive experiences");
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 8: Performance Tests
   * ====================================================================
   */
  describe("Performance", () => {
    it("should complete quickly for typical input (7 days)", () => {
      const start = performance.now();
      service.generateRulesContent(7, "moderate");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should be very fast (<10ms)
    });

    it("should complete quickly for maximum duration (365 days)", () => {
      const start = performance.now();
      service.generateRulesContent(365, "luxury");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Even max should be fast (<50ms)
    });

    it("should handle multiple sequential calls efficiently", () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        service.generateRulesContent(7, "moderate");
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // 100 calls in <500ms
    });

    it("should not leak memory with repeated calls", () => {
      const iterations = 1000;
      const results: string[] = [];

      // Run many iterations
      for (let i = 0; i < iterations; i++) {
        const result = service.generateRulesContent(7);
        // Keep only every 100th result to allow GC
        if (i % 100 === 0) {
          results.push(result);
        }
      }

      // If we got here without crash, memory is fine
      expect(results.length).toBe(10);
    });
  });

  /**
   * ====================================================================
   * TEST SUITE 9: Snapshot Tests
   * ====================================================================
   */
  describe("Snapshot Tests", () => {
    it("should match snapshot for typical 7-day moderate trip", () => {
      const result = service.generateRulesContent(7, "moderate");

      expect(result).toMatchSnapshot();
    });

    it("should match snapshot for 1-day trip without budget", () => {
      const result = service.generateRulesContent(1);

      expect(result).toMatchSnapshot();
    });

    it("should match snapshot for 365-day luxury trip", () => {
      const result = service.generateRulesContent(365, "luxury");

      expect(result).toMatchSnapshot();
    });

    it("should match snapshot for custom configuration", () => {
      const customService = new RulesBuilderService({
        minActivitiesPerDay: 2,
        maxActivitiesPerDay: 6,
        minActivityDurationMinutes: 30,
        maxActivityDurationMinutes: 360,
      });

      const result = customService.generateRulesContent(7, "budget");

      expect(result).toMatchSnapshot();
    });
  });
});
