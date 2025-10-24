/**
 * UserMenu Component
 *
 * Interactive dropdown menu for authenticated users.
 * Features:
 * - Display user email
 * - Logout button with loading state
 * - Click outside to close
 * - Keyboard navigation (Escape to close)
 */

import * as React from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserMenuProps {
  user: User;
}

// ============================================================================
// Component
// ============================================================================

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const userInitial = user.email?.[0]?.toUpperCase() || 'U';

  // Handle logout
  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await supabaseBrowser.auth.signOut();
      // Redirect to login after successful logout
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      // Show error to user (optional - could use toast notification)
      alert('Wystąpił błąd podczas wylogowania. Spróbuj ponownie.');
    }
  }, []);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-full hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-opacity"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu użytkownika"
      >
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
          <span className="text-blue-600 font-semibold text-sm">
            {userInitial}
          </span>
        </div>
        {/* Chevron icon */}
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 animate-fadeIn"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Zalogowany jako</p>
            <p className="text-sm font-medium text-gray-900 truncate" title={user.email || ''}>
              {user.email}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            role="menuitem"
          >
            {isLoggingOut ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Wylogowywanie...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Wyloguj się</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles (optional - using inline Tailwind instead)
// ============================================================================

// Add fadeIn animation to global.css if needed:
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(-4px); }
//   to { opacity: 1; transform: translateY(0); }
// }
