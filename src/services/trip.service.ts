/**
 * Trip Service
 *
 * Business logic for managing trips including creation, updates, and deletion.
 * Handles interaction with Supabase database and data transformation.
 *
 * @see dto.ts for type definitions
 * @see database.types.ts for database schema
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../db/database.types';
import type {
  CreateTripCommand,
  TripResponseDTO,
  TripListItemDTO,
  TripDetailDTO,
  TripsQueryParams,
  PaginatedTripsResponse,
  UpdateTripCommand,
} from '../types/dto';

/**
 * Service result type for error handling
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Service error with code for specific handling
 */
export interface ServiceError {
  code:
    | 'TRIP_LIMIT_EXCEEDED'
    | 'DATABASE_ERROR'
    | 'INTERNAL_ERROR'
    | 'NOT_FOUND'
    | 'FORBIDDEN';
  message: string;
  details?: unknown;
}

/**
 * Trip Service class
 * Handles all business logic related to trips
 */
export class TripService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Creates a new trip for a user
   *
   * @param userId - User ID from authenticated session
   * @param command - Trip creation data
   * @returns ServiceResult with created trip or error
   *
   * @example
   * const tripService = new TripService(supabase);
   * const result = await tripService.createTrip(userId, {
   *   destination: 'Paris, France',
   *   start_date: '2025-06-01',
   *   end_date: '2025-06-05',
   *   description: 'Romantic getaway'
   * });
   */
  async createTrip(
    userId: string,
    command: CreateTripCommand
  ): Promise<ServiceResult<TripResponseDTO>> {
    try {
      // 1. Sanitize input data
      const sanitizedDestination = this.sanitizeString(command.destination);
      const sanitizedDescription = command.description
        ? this.sanitizeString(command.description)
        : null;

      // 2. Determine trip status based on AI generation flag
      const status = command.generate_ai ? 'generating' : 'draft';

      // 3. Prepare data for database insert
      const tripData: TablesInsert<'trips'> = {
        user_id: userId,
        destination: sanitizedDestination,
        start_date: command.start_date,
        end_date: command.end_date,
        description: sanitizedDescription,
        status: status,
        // Set AI model if generation is requested
        ai_model: command.generate_ai ? 'gpt-3.5-turbo' : null,
      };

      // 4. Insert trip into database
      const { data, error } = await this.supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      // 5. Handle database errors
      if (error) {
        // Check for specific errors
        if (error.message.includes('maximum limit of 100 trips')) {
          return {
            success: false,
            error: {
              code: 'TRIP_LIMIT_EXCEEDED',
              message: 'You have reached the maximum limit of 100 trips',
            },
          };
        }

        console.error('Database error creating trip:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create trip',
            details: error,
          },
        };
      }

      // 6. Transform database row to DTO
      const tripResponse: TripResponseDTO = {
        id: data.id,
        user_id: data.user_id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        status: data.status as 'draft' | 'generating' | 'completed' | 'failed',
        ai_generated_content: data.ai_generated_content as any,
        ai_model: data.ai_model,
        ai_tokens_used: data.ai_tokens_used,
        ai_generation_time_ms: data.ai_generation_time_ms,
        view_count: data.view_count ?? 0,
        last_viewed_at: data.last_viewed_at,
        edit_count: data.edit_count ?? 0,
        last_edited_at: data.last_edited_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // 7. If AI generation is requested, the endpoint will handle it separately
      // POST /api/trips/:id/generate-ai should be called after trip creation
      // This keeps the createTrip method focused on trip creation only
      if (command.generate_ai) {
        console.log(
          `AI generation requested for trip ${tripResponse.id}. ` +
          `Client should call POST /api/trips/${tripResponse.id}/generate-ai`
        );
      }

      return { success: true, data: tripResponse };
    } catch (error) {
      console.error('Unexpected error in createTrip:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while creating the trip',
          details: error,
        },
      };
    }
  }

  /**
   * Gets paginated list of user's trips
   *
   * @param userId - User ID from authenticated session
   * @param params - Query parameters for filtering and pagination
   * @returns ServiceResult with paginated trips list or error
   */
  async listTrips(
    userId: string,
    params: TripsQueryParams
  ): Promise<ServiceResult<PaginatedTripsResponse>> {
    try {
      const limit = params.limit || 20;
      const offset = params.offset || 0;

      // Build query
      let query = this.supabase
        .from('trips')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Apply status filter if provided
      if (params.status) {
        query = query.eq('status', params.status);
      }

      // Apply sorting
      if (params.sort) {
        const [field, direction] = params.sort.split(':');
        query = query.order(field, { ascending: direction === 'asc' });
      } else {
        // Default sort: newest first
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error listing trips:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve trips',
            details: error,
          },
        };
      }

      // Transform to TripListItemDTO (exclude ai_generated_content)
      const trips: TripListItemDTO[] = (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        destination: row.destination,
        start_date: row.start_date,
        end_date: row.end_date,
        description: row.description,
        status: row.status as 'draft' | 'generating' | 'completed' | 'failed',
        ai_model: row.ai_model,
        ai_tokens_used: row.ai_tokens_used,
        ai_generation_time_ms: row.ai_generation_time_ms,
        view_count: row.view_count ?? 0,
        last_viewed_at: row.last_viewed_at,
        edit_count: row.edit_count ?? 0,
        last_edited_at: row.last_edited_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      const response: PaginatedTripsResponse = {
        data: trips,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('Unexpected error in listTrips:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving trips',
          details: error,
        },
      };
    }
  }

  /**
   * Gets a single trip by ID with full details including AI content
   * Updates view_count and last_viewed_at
   *
   * @param userId - User ID from authenticated session
   * @param tripId - Trip ID
   * @returns ServiceResult with trip details or error
   */
  async getTripById(
    userId: string,
    tripId: string
  ): Promise<ServiceResult<TripDetailDTO>> {
    try {
      // Fetch trip
      const { data, error } = await this.supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        // Check if not found
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Trip not found',
            },
          };
        }

        console.error('Database error getting trip:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve trip',
            details: error,
          },
        };
      }

      // Update view metrics
      await this.supabase
        .from('trips')
        .update({
          view_count: (data.view_count ?? 0) + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      // Transform to TripDetailDTO
      const trip: TripDetailDTO = {
        id: data.id,
        user_id: data.user_id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        status: data.status as 'draft' | 'generating' | 'completed' | 'failed',
        ai_generated_content: data.ai_generated_content as any,
        ai_model: data.ai_model,
        ai_tokens_used: data.ai_tokens_used,
        ai_generation_time_ms: data.ai_generation_time_ms,
        view_count: (data.view_count ?? 0) + 1, // Return updated count
        last_viewed_at: new Date().toISOString(),
        edit_count: data.edit_count ?? 0,
        last_edited_at: data.last_edited_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: trip };
    } catch (error) {
      console.error('Unexpected error in getTripById:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving the trip',
          details: error,
        },
      };
    }
  }

  /**
   * Updates a trip's basic information
   * Cannot update AI-generated content
   *
   * @param userId - User ID from authenticated session
   * @param tripId - Trip ID
   * @param command - Update data
   * @returns ServiceResult with updated trip or error
   */
  async updateTrip(
    userId: string,
    tripId: string,
    command: UpdateTripCommand
  ): Promise<ServiceResult<TripResponseDTO>> {
    try {
      // Prepare update data
      const updateData: Partial<TablesInsert<'trips'>> = {};

      if (command.destination !== undefined) {
        updateData.destination = this.sanitizeString(command.destination);
      }
      if (command.start_date !== undefined) {
        updateData.start_date = command.start_date;
      }
      if (command.end_date !== undefined) {
        updateData.end_date = command.end_date;
      }
      if (command.description !== undefined) {
        updateData.description = command.description
          ? this.sanitizeString(command.description)
          : null;
      }

      // Update trip
      const { data, error } = await this.supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select()
        .single();

      if (error) {
        // Check if not found
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Trip not found',
            },
          };
        }

        console.error('Database error updating trip:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update trip',
            details: error,
          },
        };
      }

      // Transform to DTO
      const trip: TripResponseDTO = {
        id: data.id,
        user_id: data.user_id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.description,
        status: data.status as 'draft' | 'generating' | 'completed' | 'failed',
        ai_generated_content: data.ai_generated_content as any,
        ai_model: data.ai_model,
        ai_tokens_used: data.ai_tokens_used,
        ai_generation_time_ms: data.ai_generation_time_ms,
        view_count: data.view_count ?? 0,
        last_viewed_at: data.last_viewed_at,
        edit_count: data.edit_count ?? 0,
        last_edited_at: data.last_edited_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { success: true, data: trip };
    } catch (error) {
      console.error('Unexpected error in updateTrip:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while updating the trip',
          details: error,
        },
      };
    }
  }

  /**
   * Soft deletes a trip (sets deleted_at timestamp)
   *
   * @param userId - User ID from authenticated session
   * @param tripId - Trip ID
   * @returns ServiceResult with success or error
   */
  async deleteTrip(
    userId: string,
    tripId: string
  ): Promise<ServiceResult<void>> {
    try {
      // First check if trip exists
      const { data: existingTrip, error: fetchError } = await this.supabase
        .from('trips')
        .select('id')
        .eq('id', tripId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (fetchError || !existingTrip) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Trip not found',
          },
        };
      }

      // Perform soft delete by setting deleted_at
      const { error } = await this.supabase
        .from('trips')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', tripId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database error deleting trip:', error);
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete trip',
            details: error,
          },
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      console.error('Unexpected error in deleteTrip:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while deleting the trip',
          details: error,
        },
      };
    }
  }

  /**
   * Sanitizes string input to prevent XSS attacks
   *
   * @param input - Raw string input
   * @returns Sanitized string
   */
  private sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
