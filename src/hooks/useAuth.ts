/**
 * useAuth Hook
 *
 * React hook for checking authentication status and managing user session.
 * Uses Supabase Auth.
 */

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User, Session } from "@supabase/supabase-js";

// ============================================================================
// Type Definitions
// ============================================================================

interface UseAuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UseAuthReturn extends UseAuthState {
  signOut: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAuth(): UseAuthReturn {
  const [state, setState] = React.useState<UseAuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  React.useEffect(() => {
    console.log("[useAuth] Checking authentication status...");

    // Get initial session
    supabaseBrowser.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[useAuth] Error getting session:", error);
      }

      console.log("[useAuth] Session:", session ? "AUTHENTICATED" : "NOT AUTHENTICATED");

      setState({
        user: session?.user ?? null,
        session: session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      console.log("[useAuth] Auth state changed:", _event, session ? "AUTHENTICATED" : "NOT AUTHENTICATED");

      setState({
        user: session?.user ?? null,
        session: session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    console.log("[useAuth] Signing out...");
    await supabaseBrowser.auth.signOut();
  }, []);

  return {
    ...state,
    signOut,
  };
}

// ============================================================================
// Helper Hook: Redirect if not authenticated
// ============================================================================

export function useRequireAuth(redirectTo = "/auth/login") {
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[useRequireAuth] Not authenticated, redirecting to:", redirectTo);
      const currentPath = window.location.pathname;
      window.location.href = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}
