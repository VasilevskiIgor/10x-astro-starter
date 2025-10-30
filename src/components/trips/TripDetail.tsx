/**
 * TripDetail Component
 *
 * Displays full details of a trip including AI-generated content.
 * Features:
 * - Fetches trip data from API
 * - Displays basic info and AI itinerary
 * - Edit and delete actions
 * - Loading and error states
 */

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { TripDetailDTO } from "@/types/dto";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TripDetailProps {
  tripId: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

// ============================================================================
// Component
// ============================================================================

export const TripDetail: React.FC<TripDetailProps> = ({ tripId }) => {
  const [trip, setTrip] = React.useState<TripDetailDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Fetch trip details
  React.useEffect(() => {
    const fetchTrip = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Nie udało się pobrać podróży");
        }

        const data: TripDetailDTO = await response.json();
        setTrip(data);
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd podczas pobierania szczegółów podróży");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("Nie jesteś zalogowany. Zaloguj się.");
      }

      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się usunąć podróży");
      }

      // Redirect to trips list after successful deletion
      window.location.href = "/trips";
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas usuwania podróży");
      setIsDeleting(false);
    }
  };

  // Handle AI generation
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        throw new Error("Nie jesteś zalogowany. Zaloguj się.");
      }

      console.log("[TripDetail] Starting AI generation for trip:", tripId);

      const response = await fetch(`/api/trips/${tripId}/generate-ai`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          temperature: 0.7,
          force_regenerate: false,
        }),
      });

      const responseData = await response.json();
      console.log("[TripDetail] AI generation response:", response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.error?.message || "Nie udało się wygenerować planu AI");
      }

      // Update trip with AI content
      setTrip((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              ai_generated_content: responseData.ai_generated_content,
              ai_model: responseData.ai_model,
              ai_tokens_used: responseData.ai_tokens_used,
              ai_generation_time_ms: responseData.ai_generation_time_ms,
            }
          : null
      );

      console.log("[TripDetail] AI generation successful");
    } catch (err: any) {
      console.error("[TripDetail] AI generation error:", err);
      setAiError(err.message || "Wystąpił błąd podczas generowania planu AI");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="mt-4 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="mt-8 h-64 rounded-lg bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorAlert type="error" message={error} />;
  }

  // No trip found
  if (!trip) {
    return <ErrorAlert type="error" message="Podróż nie znaleziona" />;
  }

  const duration = calculateDuration(trip.start_date, trip.end_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{trip.destination}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </div>
            <span className="text-gray-400">•</span>
            <span>
              {duration} {duration === 1 ? "dzień" : duration < 5 ? "dni" : "dni"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <a
            href={`/trips/${trip.id}/edit`}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edytuj
          </a>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Usuń
          </button>
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Opis</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{trip.description}</p>
        </div>
      )}

      {/* AI Generated Content */}
      {trip.ai_generated_content && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center mb-4">
            <svg className="mr-2 h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-purple-900">Plan podróży wygenerowany przez AI</h2>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <p className="text-gray-700">{trip.ai_generated_content.summary}</p>
          </div>

          {/* Day-by-day itinerary */}
          <div className="space-y-6">
            {trip.ai_generated_content.days.map((day) => (
              <div key={day.day_number} className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-md font-semibold text-gray-900">
                  Dzień {day.day_number}: {day.title}
                </h3>
                <p className="text-sm text-gray-500">{formatDate(day.date)}</p>
                {day.summary && <p className="mt-2 text-sm text-gray-700">{day.summary}</p>}

                {/* Activities */}
                <div className="mt-4 space-y-3">
                  {day.activities.map((activity, idx) => (
                    <div key={idx} className="border-l-2 border-purple-300 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-purple-600">{activity.time}</span>
                            <span className="text-sm font-semibold text-gray-900">{activity.title}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span>📍 {activity.location}</span>
                            <span>⏱️ {activity.duration_minutes} min</span>
                            <span>💰 {activity.cost_estimate}</span>
                          </div>
                          {activity.tips && <p className="mt-2 text-xs text-gray-600">💡 {activity.tips}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {trip.ai_generated_content.recommendations && (
            <div className="mt-6 rounded-lg bg-white p-4">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Rekomendacje</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Transport:</span>
                  <p className="text-sm text-gray-600">{trip.ai_generated_content.recommendations.transportation}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Zakwaterowanie:</span>
                  <p className="text-sm text-gray-600">{trip.ai_generated_content.recommendations.accommodation}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Budżet:</span>
                  <p className="text-sm text-gray-600">{trip.ai_generated_content.recommendations.budget}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Najlepszy czas:</span>
                  <p className="text-sm text-gray-600">{trip.ai_generated_content.recommendations.best_time}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No AI content message */}
      {!trip.ai_generated_content && trip.status === "draft" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          {aiError && <ErrorAlert type="error" message={aiError} />}
          <p className="text-gray-600">Ta podróż nie ma jeszcze wygenerowanego planu AI.</p>
          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="mt-4 inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAI ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generowanie...
              </>
            ) : (
              "Generuj plan podróży AI"
            )}
          </button>
        </div>
      )}

      {/* Generating status */}
      {trip.status === "generating" && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6 text-center">
          <div className="flex items-center justify-center">
            <svg
              className="mr-3 h-8 w-8 animate-spin text-purple-600"
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
            <div>
              <p className="font-medium text-purple-900">Generowanie planu podróży AI...</p>
              <p className="text-sm text-purple-700">To może potrwać do 90 sekund</p>
            </div>
          </div>
        </div>
      )}

      {/* Failed status */}
      {trip.status === "failed" && !trip.ai_generated_content && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <ErrorAlert type="error" message="Generowanie AI nie powiodło się. Spróbuj ponownie." />
          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isGeneratingAI ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Ponowna próba...
              </>
            ) : (
              "Spróbuj ponownie"
            )}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Usunąć podróż?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Czy na pewno chcesz usunąć "{trip.destination}"? Tej operacji nie można cofnąć.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Usuwanie..." : "Usuń"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
