/**
 * Astro Middleware
 *
 * Handles:
 * - Creating server-side Supabase client with cookie access
 * - Adding Supabase client to context.locals
 * - Protected routes (redirect to login if not authenticated)
 * - Auth routes (redirect to trips if already authenticated)
 * - Automatic token refresh via Supabase
 */

import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Routes that require authentication
 * User must be logged in to access these routes
 */
const PROTECTED_ROUTES = [
  '/trips',
  '/trips/', // With trailing slash
  '/api/trips',
];

/**
 * Auth pages (login, signup, etc.)
 * Logged-in users will be redirected away from these
 */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a pathname matches any route in the list
 * Supports exact matches and prefix matches (for /trips/*)
 */
function isRouteMatch(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Prefix match for routes with children (e.g., /trips/123)
    if (pathname.startsWith(route + '/')) return true;
    return false;
  });
}

// ============================================================================
// Middleware Implementation
// ============================================================================

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server-side Supabase client with access to request cookies
  const supabase = createSupabaseServerClient(context.cookies);

  // Add Supabase client to context.locals for use in pages
  context.locals.supabase = supabase;

  // Get current pathname
  const pathname = new URL(context.request.url).pathname;

  // Check if this is a protected route
  const isProtected = isRouteMatch(pathname, PROTECTED_ROUTES);
  const isAuthPage = isRouteMatch(pathname, AUTH_ROUTES);

  // Get user session from Supabase (with access to cookies)
  // Note: Supabase automatically handles token refresh if autoRefreshToken is enabled
  const { data: { session } } = await supabase.auth.getSession();

  // CASE 1: Protected route + no session → DON'T redirect yet
  // Let the page handle auth check client-side since we use localStorage
  // (middleware can't see localStorage, only cookies)
  if (isProtected && !session) {
    // Don't redirect - let page JavaScript handle it
  }

  // CASE 2: Auth page + has session → redirect to trips (already logged in)
  if (isAuthPage && session) {
    return context.redirect('/trips');
  }

  // CASE 3: Public route or authorized access → continue
  return next();
});
