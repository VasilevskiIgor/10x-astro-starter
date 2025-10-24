/**
 * Server-side Supabase Client
 *
 * Creates a Supabase client that works with Astro's request/response cookies.
 * This is needed for middleware and server-side routes to access user session.
 *
 * IMPORTANT: This is different from the browser client (supabaseClient).
 * - Browser client: Uses localStorage for session
 * - Server client: Uses cookies for session
 */

import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { Database } from '@/db/database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Create a Supabase client for server-side use (middleware, API routes)
 * with access to request cookies
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Astro's cookies.getAll() returns an AstroCookie[] object
        // We need to convert it to the format Supabase expects: { name, value }[]
        return Array.from(cookies).map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
