/**
 * TripsList Component
 *
 * Displays a paginated list of user's trips.
 * Features:
 * - Fetches trips from API using useTrips hook
 * - Loading states
 * - Empty state for no trips
 * - Error handling
 * - Pagination
 */

import * as React from "react";
import { useTrips } from "@/hooks/useTrips";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TripCard } from "./TripCard";

// ============================================================================
// Component
// ============================================================================

export const TripsList: React.FC = () => {
  const { trips, isLoading, error, pagination, nextPage, prevPage } = useTrips();

  // Loading state
  if (isLoading && trips.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
            <div className="mt-4 h-3 w-3/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorAlert type="error" message={error} />;
  }

  // Empty state
  if (trips.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Brak podróży</h3>
        <p className="mt-1 text-sm text-gray-500">Zacznij od stworzenia swojej pierwszej podróży.</p>
        <div className="mt-6">
          <a
            href="/trips/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg className="mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Utwórz nową podróż
          </a>
        </div>
      </div>
    );
  }

  // Trips list
  return (
    <div className="space-y-6">
      {/* Trips Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={pagination.offset === 0}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Poprzednia
            </button>
            <button
              onClick={nextPage}
              disabled={!pagination.has_more}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Następna
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Pokazuję <span className="font-medium">{pagination.offset + 1}</span> do{" "}
                <span className="font-medium">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span>{" "}
                z <span className="font-medium">{pagination.total}</span> podróży
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginacja">
                <button
                  onClick={prevPage}
                  disabled={pagination.offset === 0}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="sr-only">Poprzednia</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextPage}
                  disabled={!pagination.has_more}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="sr-only">Następna</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
