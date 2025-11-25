/**
 * TripCard Component
 *
 * Displays a single trip as a card.
 * Features:
 * - Trip destination and dates
 * - Status badge
 * - Click to view details
 * - Visual indicators for AI-generated content
 */

import * as React from "react";
import type { TripListItemDTO } from "@/types/dto";
import { useTranslation } from "@/i18n/useTranslation";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TripCardProps {
  trip: TripListItemDTO;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end days
};

const getStatusBadge = (status: string, translateFn: (key: string) => string) => {
  const badges = {
    draft: {
      color:
        "bg-[var(--colorNeutralBackground4)] text-[var(--colorNeutralForeground2)] border border-[var(--colorNeutralStroke2)]",
      labelKey: "trips.status_draft",
    },
    generating: {
      color:
        "bg-[var(--colorStatusInfoBackground2)] text-[var(--colorStatusInfoForeground1)] border border-[var(--colorStatusInfoBorder1)]",
      labelKey: "trips.status_generating",
    },
    completed: {
      color:
        "bg-[var(--colorStatusSuccessBackground2)] text-[var(--colorStatusSuccessForeground1)] border border-[var(--colorStatusSuccessBorder1)]",
      labelKey: "trips.status_completed",
    },
    failed: {
      color:
        "bg-[var(--colorStatusDangerBackground2)] text-[var(--colorStatusDangerForeground1)] border border-[var(--colorStatusDangerBorder1)]",
      labelKey: "trips.status_failed",
    },
  };

  const badge = badges[status as keyof typeof badges] || badges.draft;

  return (
    <span
      className={`inline-flex items-center rounded-[var(--borderRadiusXLarge)] px-[var(--spacingHorizontalS)] py-[var(--spacingVerticalXXS)] text-[var(--fontSizeBase200)] font-[var(--fontWeightSemibold)] ${badge.color}`}
    >
      {translateFn(badge.labelKey)}
    </span>
  );
};

// ============================================================================
// Component
// ============================================================================

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const { t } = useTranslation();
  const duration = calculateDuration(trip.start_date, trip.end_date);

  const getDayLabel = (days: number) => {
    if (days === 1) return t("trips.day_singular");
    if (days < 5) return t("trips.days_few");
    return t("trips.days_many");
  };

  return (
    <a
      href={`/trips/${trip.id}`}
      className="group block rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke1)] bg-[var(--colorNeutralBackground2)] p-[var(--spacingHorizontalL)] shadow-[var(--shadow4)] transition-all duration-200 hover:border-[var(--colorBrandStroke1)] hover:shadow-[var(--shadow8)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[2px] focus-visible:outline-[var(--colorBrandStroke1)]"
    >
      {/* Header */}
      <div className="mb-[var(--spacingVerticalM)] flex items-start justify-between gap-[var(--spacingHorizontalM)]">
        <div className="flex-1">
          <h3 className="text-[var(--fontSizeBase500)] font-[var(--fontWeightSemibold)] leading-[var(--lineHeightBase500)] text-[var(--colorNeutralForeground1)] group-hover:text-[var(--colorBrandForeground2)] transition-colors duration-200">
            {trip.destination}
          </h3>
          {trip.description && (
            <p className="mt-[var(--spacingVerticalXS)] line-clamp-2 text-[var(--fontSizeBase300)] leading-[var(--lineHeightBase300)] text-[var(--colorNeutralForeground2)]">
              {trip.description}
            </p>
          )}
        </div>
        <div>{getStatusBadge(trip.status, t)}</div>
      </div>

      {/* Dates */}
      <div className="mb-[var(--spacingVerticalM)] flex items-center gap-[var(--spacingHorizontalXS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground2)]">
        <svg
          className="h-5 w-5 text-[var(--colorNeutralForeground3)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>
          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
        </span>
        <span className="text-[var(--colorNeutralForeground3)]">•</span>
        <span>
          {duration} {getDayLabel(duration)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-[var(--fontSizeBase200)] text-[var(--colorNeutralForeground3)]">
          {trip.ai_model && (
            <div className="flex items-center gap-[var(--spacingHorizontalXXS)]">
              <svg
                className="h-4 w-4 text-[var(--colorBrandForeground2)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span>{t("trips.ai_generated")}</span>
            </div>
          )}
        </div>
        <div className="text-[var(--fontSizeBase200)] text-[var(--colorNeutralForeground3)]">
          {t("trips.created")} {formatDate(trip.created_at)}
        </div>
      </div>
    </a>
  );
};
