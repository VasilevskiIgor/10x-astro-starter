/**
 * Browser-side Supabase Client
 *
 * Uses localStorage for session storage (not cookies).
 * This is simpler and works better with Astro SSR mode.
 *
 * Note: Session is stored in localStorage, so server-side middleware
 * won't have access to it. We'll handle auth checks client-side.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Create a Supabase client for browser use
 * Uses localStorage for persistence (not cookies)
 */
export const supabaseBrowser = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
);
