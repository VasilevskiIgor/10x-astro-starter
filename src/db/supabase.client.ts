import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

// Use environment variables if available (server-side), otherwise use defaults (client-side)
const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Creates a Supabase client with a custom access token
 * This is used for authenticated API requests where we need RLS to work
 */
export function createSupabaseClientWithAuth(accessToken: string) {
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
