/**
 * SignupForm Component
 *
 * Registration form using Supabase Auth.
 * Features:
 * - Email/Password registration
 * - Password confirmation
 * - Client-side validation
 * - Error handling
 * - Loading state
 * - Auto-login and redirect after successful signup
 */

import * as React from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { supabaseBrowser } from "@/lib/supabase-browser";

// ============================================================================
// Type Definitions
// ============================================================================

export interface SignupFormProps {
  redirectTo?: string;
}

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

const validateEmail = (email: string): string | null => {
  if (!email) return "Email jest wymagany";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Nieprawidłowy format email";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "Hasło jest wymagane";
  if (password.length < 8) return "Hasło musi mieć co najmniej 8 znaków";
  return null;
};

const validatePasswordMatch = (password: string, confirm: string): string | null => {
  if (password !== confirm) return "Hasła nie pasują do siebie";
  return null;
};

// ============================================================================
// Component
// ============================================================================

export const SignupForm: React.FC<SignupFormProps> = ({ redirectTo = "/trips" }) => {
  const [formData, setFormData] = React.useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const matchError = validatePasswordMatch(formData.password, formData.confirmPassword);

    if (emailError || passwordError || matchError) {
      setError(emailError || passwordError || matchError);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabaseBrowser.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // MVP: Email confirmation is DISABLED in Supabase
      // User is automatically logged in after signup
      if (data.session) {
        setSuccessMessage("Konto utworzone! Przekierowujemy...");
        // Small delay for UX (show success message)
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1000);
      } else {
        // This should not happen with email confirmation disabled
        // But handle gracefully just in case
        setError("Konto utworzone, ale nie udało się zalogować automatycznie. Spróbuj zalogować się ręcznie.");
      }
    } catch (error: any) {
      // Handle Supabase errors
      if (error.message?.includes("already registered")) {
        setError("Ten adres email jest już zarejestrowany");
      } else if (error.message?.includes("User already registered")) {
        setError("Ten adres email jest już zarejestrowany");
      } else if (error.message?.includes("password")) {
        setError("Hasło jest zbyt słabe. Użyj silniejszego hasła.");
      } else {
        setError(error.message || "Wystąpił błąd podczas rejestracji");
      }
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof SignupFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (error) {
      setError(null);
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
          value={formData.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
          placeholder="twoj@email.com"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
          aria-describedby="email-error"
        />
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="password"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Hasło{" "}
          <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={(e) => handleFieldChange("password", e.target.value)}
          disabled={isLoading}
          required
          autoComplete="new-password"
          placeholder="Min. 8 znaków"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
          aria-describedby="password-error"
        />
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="confirmPassword"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Potwierdź hasło{" "}
          <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
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
          disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword}
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
              Rejestracja...
            </>
          ) : (
            "Utwórz konto"
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground2)]">
        <p>
          Masz już konto?{" "}
          <a
            href="/auth/login"
            className="text-[var(--colorBrandForegroundLink)] hover:text-[var(--colorBrandBackgroundHover)] hover:underline font-[var(--fontWeightSemibold)] transition-colors duration-100"
          >
            Zaloguj się
          </a>
        </p>
      </div>
    </form>
  );
};
