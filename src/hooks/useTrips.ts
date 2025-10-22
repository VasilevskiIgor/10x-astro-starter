/**
 * useTrips Hook
 *
 * Custom hook for fetching and managing trips data.
 * Features:
 * - Fetches trips from API with authentication
 * - Pagination support
 * - Status filtering
 * - Loading and error states
 * - Refetch capability
 */

import * as React from 'react';
import { supabaseClient } from '@/db/supabase.client';
import type { PaginatedTripsResponse, TripListItemDTO, TripsQueryParams } from '@/types/dto';

// ============================================================================
// Type Definitions
// ============================================================================

interface UseTripsState {
  trips: TripListItemDTO[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface UseTripsReturn extends UseTripsState {
  fetchTrips: (params?: TripsQueryParams) => Promise<void>;
  refetch: () => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTrips(initialParams?: TripsQueryParams): UseTripsReturn {
  const [state, setState] = React.useState<UseTripsState>({
    trips: [],
    isLoading: true,
    error: null,
    pagination: {
      total: 0,
      limit: initialParams?.limit || 20,
      offset: initialParams?.offset || 0,
      has_more: false,
    },
  });

  const [queryParams, setQueryParams] = React.useState<TripsQueryParams>({
    limit: initialParams?.limit || 20,
    offset: initialParams?.offset || 0,
    status: initialParams?.status,
    sort: initialParams?.sort || 'created_at:desc',
  });

  const fetchTrips = React.useCallback(async (params?: TripsQueryParams) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get session to retrieve access token
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Build query string
      const finalParams = { ...queryParams, ...params };
      const queryString = new URLSearchParams();

      queryString.append('limit', String(finalParams.limit || 20));
      queryString.append('offset', String(finalParams.offset || 0));

      if (finalParams.status) {
        queryString.append('status', finalParams.status);
      }

      if (finalParams.sort) {
        queryString.append('sort', finalParams.sort);
      }

      // Fetch trips from API
      const response = await fetch(`/api/trips?${queryString.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch trips');
      }

      const data: PaginatedTripsResponse = await response.json();

      setState({
        trips: data.data,
        isLoading: false,
        error: null,
        pagination: data.pagination,
      });

      // Update query params
      setQueryParams(finalParams);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'An error occurred while fetching trips',
      }));
    }
  }, [queryParams]);

  const refetch = React.useCallback(async () => {
    await fetchTrips(queryParams);
  }, [fetchTrips, queryParams]);

  const nextPage = React.useCallback(async () => {
    if (state.pagination.has_more) {
      await fetchTrips({
        ...queryParams,
        offset: state.pagination.offset + state.pagination.limit,
      });
    }
  }, [fetchTrips, queryParams, state.pagination]);

  const prevPage = React.useCallback(async () => {
    if (state.pagination.offset > 0) {
      await fetchTrips({
        ...queryParams,
        offset: Math.max(0, state.pagination.offset - state.pagination.limit),
      });
    }
  }, [fetchTrips, queryParams, state.pagination]);

  // Fetch trips on mount
  React.useEffect(() => {
    fetchTrips();
  }, []);

  return {
    ...state,
    fetchTrips,
    refetch,
    nextPage,
    prevPage,
  };
}
