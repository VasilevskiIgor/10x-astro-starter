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

import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "@/db/database.types";

// Use process.env for server-side environment variables (works on Vercel)
const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/**
 * Create a Supabase client for server-side use (middleware, API routes)
 * with access to request cookies
 *
 * UPDATED: Now reads our custom sb-access-token and sb-refresh-token cookies
 * that are synced from localStorage by the browser client
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  // Try to get tokens from our custom cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  // If we have custom cookies, create client with those tokens
  if (accessToken && refreshToken) {
    const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
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

    // Set the session from our custom cookies
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return client;
  }

  // Fallback: standard Supabase SSR client (for when using official cookies)
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
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
