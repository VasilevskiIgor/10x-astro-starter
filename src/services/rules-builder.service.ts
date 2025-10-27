/**
 * Rules Builder Service
 *
 * Generates rule-based content for AI prompts to ensure consistent
 * and high-quality travel itinerary generation.
 *
 * Business Rules:
 * 1. Activity cost estimates must use standardized format ($, $$, $$$, $$$$)
 * 2. Day must have 3-5 activities minimum
 * 3. Activity duration must be between 15 minutes and 8 hours
 * 4. Activities should respect logical time progression
 * 5. Budget rules apply based on cost estimate
 *
 * @see ai.service.ts for integration with AI generation
 */

/**
 * Cost estimate levels
 */
export enum CostLevel {
  BUDGET = '$',
  MODERATE = '$$',
  EXPENSIVE = '$$$',
  LUXURY = '$$$$',
}

/**
 * Activity time slot categories
 */
export enum TimeSlot {
  EARLY_MORNING = 'early_morning', // 05:00-08:00
  MORNING = 'morning', // 08:00-12:00
  AFTERNOON = 'afternoon', // 12:00-17:00
  EVENING = 'evening', // 17:00-21:00
  NIGHT = 'night', // 21:00-24:00
}

/**
 * Rules configuration
 */
export interface RulesConfig {
  minActivitiesPerDay?: number;
  maxActivitiesPerDay?: number;
  minActivityDurationMinutes?: number;
  maxActivityDurationMinutes?: number;
  allowedCostLevels?: CostLevel[];
  strictTimeValidation?: boolean;
}

/**
 * Rule validation result
 */
export interface RuleValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Activity rules
 */
export interface ActivityRules {
  costEstimate: CostLevel;
  minDuration: number;
  maxDuration: number;
  timeSlot: TimeSlot;
  requiresBooking: boolean;
}

/**
 * Default rules configuration
 */
const DEFAULT_RULES_CONFIG: Required<RulesConfig> = {
  minActivitiesPerDay: 3,
  maxActivitiesPerDay: 5,
  minActivityDurationMinutes: 15,
  maxActivityDurationMinutes: 480, // 8 hours
  allowedCostLevels: [
    CostLevel.BUDGET,
    CostLevel.MODERATE,
    CostLevel.EXPENSIVE,
    CostLevel.LUXURY,
  ],
  strictTimeValidation: true,
};

/**
 * Rules Builder Service
 * Generates and validates rules for AI content generation
 */
export class RulesBuilderService {
  private config: Required<RulesConfig>;

  constructor(config: RulesConfig = {}) {
    this.config = {
      ...DEFAULT_RULES_CONFIG,
      ...config,
    };
  }

  /**
   * Generates rules content for AI prompts
   *
   * @param tripDuration - Number of days for the trip
   * @param budget - Optional budget preference
   * @returns Formatted rules content string
   *
   * @example
   * const service = new RulesBuilderService();
   * const rules = service.generateRulesContent(7, 'moderate');
   * // Returns formatted rules for 7-day moderate budget trip
   */
  generateRulesContent(tripDuration: number, budget?: string): string {
    // Validate input
    if (!this.isValidTripDuration(tripDuration)) {
      throw new Error(
        `Invalid trip duration: ${tripDuration}. Must be between 1 and 365 days.`
      );
    }

    const budgetLevel = this.parseBudgetLevel(budget);
    const rules: string[] = [];

    // Header
    rules.push('=== CONTENT GENERATION RULES ===\n');

    // Core rules
    rules.push('1. ACTIVITY REQUIREMENTS:');
    rules.push(
      `   - Each day MUST have ${this.config.minActivitiesPerDay}-${this.config.maxActivitiesPerDay} activities`
    );
    rules.push(
      `   - Activity duration: ${this.config.minActivityDurationMinutes}-${this.config.maxActivityDurationMinutes} minutes`
    );
    rules.push('   - Activities must follow logical time progression');
    rules.push('   - No overlapping activity times\n');

    // Cost rules
    rules.push('2. COST ESTIMATE RULES:');
    rules.push(
      `   - Use ONLY these cost levels: ${this.config.allowedCostLevels.join(', ')}`
    );
    if (budgetLevel) {
      rules.push(`   - Preferred budget level: ${budgetLevel}`);
      rules.push(
        `   - ${this.getBudgetGuidance(budgetLevel)}`
      );
    }
    rules.push('   - "$" = Budget (<$20)');
    rules.push('   - "$$" = Moderate ($20-$50)');
    rules.push('   - "$$$" = Expensive ($50-$100)');
    rules.push('   - "$$$$" = Luxury (>$100)\n');

    // Time slot rules
    rules.push('3. TIME SLOT RULES:');
    rules.push('   - Early Morning (05:00-08:00): Exercise, sunrise activities');
    rules.push('   - Morning (08:00-12:00): Museums, tours, sightseeing');
    rules.push('   - Afternoon (12:00-17:00): Lunch, outdoor activities');
    rules.push('   - Evening (17:00-21:00): Dinner, entertainment');
    rules.push('   - Night (21:00-24:00): Bars, nightlife\n');

    // Trip-specific rules
    rules.push('4. TRIP-SPECIFIC RULES:');
    rules.push(`   - Total duration: ${tripDuration} days`);
    rules.push(`   - Total activities: ${this.calculateTotalActivities(tripDuration)}`);
    rules.push(
      `   - Balance activity types: ${this.getActivityTypeBalance()}`
    );

    return rules.join('\n');
  }

  /**
   * Validates if trip duration is within acceptable range
   */
  isValidTripDuration(duration: number): boolean {
    return (
      Number.isInteger(duration) &&
      duration >= 1 &&
      duration <= 365
    );
  }

  /**
   * Parses budget string to CostLevel enum
   */
  parseBudgetLevel(budget?: string): CostLevel | null {
    if (!budget) return null;

    const normalized = budget.toLowerCase().trim();

    switch (normalized) {
      case 'budget':
      case 'low':
      case 'cheap':
        return CostLevel.BUDGET;
      case 'moderate':
      case 'medium':
      case 'mid':
        return CostLevel.MODERATE;
      case 'expensive':
      case 'high':
        return CostLevel.EXPENSIVE;
      case 'luxury':
      case 'premium':
      case 'deluxe':
        return CostLevel.LUXURY;
      default:
        return null;
    }
  }

  /**
   * Gets budget-specific guidance text
   */
  private getBudgetGuidance(budgetLevel: CostLevel): string {
    switch (budgetLevel) {
      case CostLevel.BUDGET:
        return 'Focus on free/cheap activities, local food, public transport';
      case CostLevel.MODERATE:
        return 'Mix of paid attractions and free activities, local restaurants';
      case CostLevel.EXPENSIVE:
        return 'Premium attractions, guided tours, nice restaurants';
      case CostLevel.LUXURY:
        return 'Exclusive experiences, fine dining, private tours';
    }
  }

  /**
   * Calculates expected total activities for trip duration
   */
  calculateTotalActivities(tripDuration: number): string {
    const min = tripDuration * this.config.minActivitiesPerDay;
    const max = tripDuration * this.config.maxActivitiesPerDay;
    return `${min}-${max}`;
  }

  /**
   * Gets activity type balance recommendation
   */
  private getActivityTypeBalance(): string {
    return '40% cultural, 30% food/dining, 20% outdoor, 10% relaxation';
  }

  /**
   * Validates activity count for a day
   */
  validateActivityCount(activityCount: number): RuleValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    if (activityCount < this.config.minActivitiesPerDay) {
      violations.push(
        `Too few activities: ${activityCount}. Minimum is ${this.config.minActivitiesPerDay}`
      );
    }

    if (activityCount > this.config.maxActivitiesPerDay) {
      violations.push(
        `Too many activities: ${activityCount}. Maximum is ${this.config.maxActivitiesPerDay}`
      );
    }

    if (activityCount === this.config.minActivitiesPerDay) {
      warnings.push('Consider adding more activities for better experience');
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Validates activity duration
   */
  validateActivityDuration(durationMinutes: number): RuleValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    if (durationMinutes < this.config.minActivityDurationMinutes) {
      violations.push(
        `Duration too short: ${durationMinutes}min. Minimum is ${this.config.minActivityDurationMinutes}min`
      );
    }

    if (durationMinutes > this.config.maxActivityDurationMinutes) {
      violations.push(
        `Duration too long: ${durationMinutes}min. Maximum is ${this.config.maxActivityDurationMinutes}min`
      );
    }

    if (durationMinutes > 240) {
      // 4 hours
      warnings.push('Consider splitting long activities into multiple parts');
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Validates cost estimate format
   */
  validateCostEstimate(costEstimate: string): RuleValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    const validCostLevels = this.config.allowedCostLevels.map((c) =>
      c.toString()
    );

    if (!validCostLevels.includes(costEstimate)) {
      violations.push(
        `Invalid cost estimate: "${costEstimate}". Must be one of: ${validCostLevels.join(', ')}`
      );
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Determines time slot from time string
   */
  getTimeSlot(timeString: string): TimeSlot | null {
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = timeString.match(timeRegex);

    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes >= 5 * 60 && totalMinutes < 8 * 60) {
      return TimeSlot.EARLY_MORNING;
    } else if (totalMinutes >= 8 * 60 && totalMinutes < 12 * 60) {
      return TimeSlot.MORNING;
    } else if (totalMinutes >= 12 * 60 && totalMinutes < 17 * 60) {
      return TimeSlot.AFTERNOON;
    } else if (totalMinutes >= 17 * 60 && totalMinutes < 21 * 60) {
      return TimeSlot.EVENING;
    } else {
      return TimeSlot.NIGHT;
    }
  }

  /**
   * Validates time progression (activities don't overlap)
   */
  validateTimeProgression(
    activities: Array<{ time: string; duration_minutes: number }>
  ): RuleValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      const currentEnd = this.addMinutesToTime(
        current.time,
        current.duration_minutes
      );

      if (!currentEnd) {
        violations.push(`Invalid time format: ${current.time}`);
        continue;
      }

      if (this.compareTimeStrings(currentEnd, next.time) > 0) {
        violations.push(
          `Activity overlap detected: Activity at ${current.time} (duration: ${current.duration_minutes}min) overlaps with activity at ${next.time}`
        );
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Adds minutes to time string (HH:MM format)
   */
  private addMinutesToTime(time: string, minutes: number): string | null {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);

    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  /**
   * Compares two time strings
   * Returns: -1 if time1 < time2, 0 if equal, 1 if time1 > time2
   */
  private compareTimeStrings(time1: string, time2: string): number {
    const match1 = time1.match(/^(\d{1,2}):(\d{2})$/);
    const match2 = time2.match(/^(\d{1,2}):(\d{2})$/);

    if (!match1 || !match2) return 0;

    const totalMinutes1 = parseInt(match1[1], 10) * 60 + parseInt(match1[2], 10);
    const totalMinutes2 = parseInt(match2[1], 10) * 60 + parseInt(match2[2], 10);

    return totalMinutes1 < totalMinutes2 ? -1 : totalMinutes1 > totalMinutes2 ? 1 : 0;
  }

  /**
   * Gets current configuration
   */
  getConfig(): Required<RulesConfig> {
    return { ...this.config };
  }
}
