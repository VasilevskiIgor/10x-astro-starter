/**
 * Browser-side Supabase Client
 *
 * SIMPLIFIED APPROACH:
 * Uses standard Supabase client with localStorage, then manually syncs session to cookies.
 * This is more reliable than trying to use @supabase/ssr cookie handlers in browser.
 *
 * Flow:
 * 1. User logs in → session saved to localStorage (standard Supabase behavior)
 * 2. After login, LoginForm calls syncSessionToCookies() → session saved to cookies
 * 3. On page load, we check localStorage and sync to cookies if needed
 * 4. Middleware reads cookies → session available server-side
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Standard Supabase client using localStorage
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

/**
 * Sync current session from localStorage to cookies
 * This makes the session available to server-side middleware
 */
export async function syncSessionToCookies() {
  if (typeof document === 'undefined') return;

  const { data: { session } } = await supabaseBrowser.auth.getSession();

  if (session) {
    // Set cookies with session tokens
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;

    console.log('[supabase-browser] Session synced to cookies');
  } else {
    // Clear cookies if no session
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0';

    console.log('[supabase-browser] Cookies cleared (no session)');
  }
}

// Auto-sync on auth state change
if (typeof window !== 'undefined') {
  supabaseBrowser.auth.onAuthStateChange((event, session) => {
    console.log('[supabase-browser] Auth state changed:', event, !!session);
    syncSessionToCookies();
  });
}
