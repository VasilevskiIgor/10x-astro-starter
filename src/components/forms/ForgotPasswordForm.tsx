/**
 * ForgotPasswordForm Component
 *
 * Password reset request form using Supabase Auth.
 * Features:
 * - Email input for password reset
 * - Client-side validation
 * - Error handling
 * - Success message
 * - Loading state
 */

import * as React from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { supabaseBrowser } from "@/lib/supabase-browser";

// ============================================================================
// Validation Functions
// ============================================================================

const validateEmail = (email: string): string | null => {
  if (!email) return "Email jest wymagany";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Nieprawidłowy format email";
  return null;
};

// ============================================================================
// Component
// ============================================================================

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      // Use current origin, but ensure we're using the correct port
      // This handles cases where dev server might be on different ports
      const redirectUrl = `${window.location.origin}/auth/reset-password`;

      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setSuccessMessage("Link do resetowania hasła został wysłany na Twój email");
      setEmail(""); // Clear the form
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Wystąpił błąd podczas wysyłania emaila");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--spacingVerticalL)]" noValidate>
      {/* Error Alert */}
      {error && <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />}

      {/* Success Alert */}
      {successMessage && <ErrorAlert type="success" message={successMessage} />}

      {/* Email Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="email"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Email{" "}
          <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          disabled={isLoading}
          required
          autoComplete="email"
          placeholder="twoj@email.com"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
          aria-describedby="email-error"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full inline-flex items-center justify-center gap-[var(--spacingHorizontalS)] px-[var(--spacingHorizontalL)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorBrandForeground1)] bg-[var(--colorBrandBackground)] rounded-[var(--borderRadiusMedium)] shadow-[var(--shadow2)] hover:bg-[var(--colorBrandBackgroundHover)] active:bg-[var(--colorBrandBackgroundPressed)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Wysyłanie...
            </>
          ) : (
            "Wyślij link resetujący"
          )}
        </button>
      </div>
    </form>
  );
};
