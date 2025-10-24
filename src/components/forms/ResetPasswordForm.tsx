/**
 * ResetPasswordForm Component
 *
 * New password setup form using Supabase Auth.
 * Features:
 * - New password and confirmation inputs
 * - Client-side validation
 * - Error handling
 * - Auto-redirect to login after success
 * - Loading state
 */

import * as React from 'react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { supabaseBrowser } from '@/lib/supabase-browser';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ResetPasswordFormProps {
  accessToken: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

const validatePassword = (password: string): string | null => {
  if (!password) return 'Hasło jest wymagane';
  if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków';
  return null;
};

const validatePasswordMatch = (password: string, confirm: string): string | null => {
  if (password !== confirm) return 'Hasła nie pasują do siebie';
  return null;
};

// ============================================================================
// Component
// ============================================================================

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  accessToken
}) => {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    const passwordError = validatePassword(newPassword);
    const matchError = validatePasswordMatch(newPassword, confirmPassword);

    if (passwordError || matchError) {
      setError(passwordError || matchError);
      return;
    }

    setIsLoading(true);

    try {
      // First, set the session with the access token from URL
      const { error: sessionError } = await supabaseBrowser.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not needed for recovery
      });

      if (sessionError) throw sessionError;

      // Then update the password
      const { error } = await supabaseBrowser.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage('Hasło zostało zmienione! Przekierowujemy do logowania...');
      setTimeout(() => {
        window.location.href = '/auth/login?success=password_reset';
      }, 2000);
    } catch (error: any) {
      if (error.message?.includes('expired')) {
        setError('Link wygasł. Wygeneruj nowy link resetujący.');
      } else {
        setError(error.message || 'Wystąpił błąd podczas zmiany hasła');
      }
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--spacingVerticalL)]" noValidate>
      {/* Error Alert */}
      {error && (
        <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {/* Success Alert */}
      {successMessage && (
        <ErrorAlert type="success" message={successMessage} />
      )}

      {/* New Password Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="newPassword"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Nowe hasło <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="wymagane">*</span>
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (error) setError(null);
          }}
          disabled={isLoading}
          required
          autoComplete="new-password"
          placeholder="Min. 8 znaków"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
        />
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="confirmPassword"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Potwierdź hasło <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="wymagane">*</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError(null);
          }}
          disabled={isLoading}
          required
          autoComplete="new-password"
          placeholder="Powtórz hasło"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !newPassword || !confirmPassword}
          className="w-full inline-flex items-center justify-center gap-[var(--spacingHorizontalS)] px-[var(--spacingHorizontalL)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorBrandForeground1)] bg-[var(--colorBrandBackground)] rounded-[var(--borderRadiusMedium)] shadow-[var(--shadow2)] hover:bg-[var(--colorBrandBackgroundHover)] active:bg-[var(--colorBrandBackgroundPressed)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
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
              Zmiana hasła...
            </>
          ) : (
            'Zmień hasło'
          )}
        </button>
      </div>
    </form>
  );
};
