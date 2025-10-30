export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      ai_generation_logs: {
        Row: {
          completion_tokens: number | null;
          created_at: string;
          error_message: string | null;
          estimated_cost_usd: number | null;
          generation_time_ms: number;
          id: string;
          input_data: Json | null;
          model: string;
          prompt_tokens: number | null;
          response_data: Json | null;
          status: string;
          total_tokens: number | null;
          trip_id: string | null;
          user_id: string;
        };
        Insert: {
          completion_tokens?: number | null;
          created_at?: string;
          error_message?: string | null;
          estimated_cost_usd?: number | null;
          generation_time_ms: number;
          id?: string;
          input_data?: Json | null;
          model: string;
          prompt_tokens?: number | null;
          response_data?: Json | null;
          status: string;
          total_tokens?: number | null;
          trip_id?: string | null;
          user_id: string;
        };
        Update: {
          completion_tokens?: number | null;
          created_at?: string;
          error_message?: string | null;
          estimated_cost_usd?: number | null;
          generation_time_ms?: number;
          id?: string;
          input_data?: Json | null;
          model?: string;
          prompt_tokens?: number | null;
          response_data?: Json | null;
          status?: string;
          total_tokens?: number | null;
          trip_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_activities: {
        Row: {
          cost_estimate: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          location: string | null;
          order_index: number | null;
          time: string | null;
          tips: string | null;
          title: string;
          trip_day_id: string;
          updated_at: string;
        };
        Insert: {
          cost_estimate?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          order_index?: number | null;
          time?: string | null;
          tips?: string | null;
          title: string;
          trip_day_id: string;
          updated_at?: string;
        };
        Update: {
          cost_estimate?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          order_index?: number | null;
          time?: string | null;
          tips?: string | null;
          title?: string;
          trip_day_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_day_id_fkey";
            columns: ["trip_day_id"];
            isOneToOne: false;
            referencedRelation: "trip_days";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_days: {
        Row: {
          created_at: string;
          date: string;
          day_number: number;
          deleted_at: string | null;
          id: string;
          summary: string | null;
          title: string | null;
          trip_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          day_number: number;
          deleted_at?: string | null;
          id?: string;
          summary?: string | null;
          title?: string | null;
          trip_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          day_number?: number;
          deleted_at?: string | null;
          id?: string;
          summary?: string | null;
          title?: string | null;
          trip_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_days_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
      trips: {
        Row: {
          ai_generated_content: Json | null;
          ai_generation_time_ms: number | null;
          ai_model: string | null;
          ai_tokens_used: number | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          destination: string;
          edit_count: number | null;
          end_date: string;
          id: string;
          last_edited_at: string | null;
          last_viewed_at: string | null;
          start_date: string;
          status: string | null;
          updated_at: string;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          ai_generated_content?: Json | null;
          ai_generation_time_ms?: number | null;
          ai_model?: string | null;
          ai_tokens_used?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          destination: string;
          edit_count?: number | null;
          end_date: string;
          id?: string;
          last_edited_at?: string | null;
          last_viewed_at?: string | null;
          start_date: string;
          status?: string | null;
          updated_at?: string;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          ai_generated_content?: Json | null;
          ai_generation_time_ms?: number | null;
          ai_model?: string | null;
          ai_tokens_used?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          destination?: string;
          edit_count?: number | null;
          end_date?: string;
          id?: string;
          last_edited_at?: string | null;
          last_viewed_at?: string | null;
          start_date?: string;
          status?: string | null;
          updated_at?: string;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [];
      };
      user_rate_limits: {
        Row: {
          daily_generations_count: number;
          daily_limit_reset_at: string;
          hourly_generations_count: number;
          hourly_limit_reset_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          daily_generations_count?: number;
          daily_limit_reset_at?: string;
          hourly_generations_count?: number;
          hourly_limit_reset_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          daily_generations_count?: number;
          daily_limit_reset_at?: string;
          hourly_generations_count?: number;
          hourly_limit_reset_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_stats: {
        Row: {
          avg_generation_time_ms: number | null;
          completed_trips: number | null;
          draft_trips: number | null;
          last_trip_created_at: string | null;
          total_tokens_used: number | null;
          total_trips: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      cleanup_old_deleted_records: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_default_rate_limits: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
