/**
 * LoginForm Component
 *
 * Login form using Supabase Auth.
 * Features:
 * - Email/Password authentication
 * - Client-side validation
 * - Error handling
 * - Loading state
 * - Redirect after successful login
 */

import * as React from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { supabaseBrowser } from "@/lib/supabase-browser";

// ============================================================================
// Type Definitions
// ============================================================================

export interface LoginFormProps {
  redirectTo?: string;
}

interface LoginFormData {
  email: string;
  password: string;
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

// ============================================================================
// Component
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({ redirectTo = "/trips" }) => {
  console.log("[LoginForm] Component mounted, redirectTo:", redirectTo);

  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[LoginForm] handleSubmit called");
    e.preventDefault();
    setError(null);

    console.log("[LoginForm] Form data:", { email: formData.email, hasPassword: !!formData.password });

    // Client-side validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      console.log("[LoginForm] Validation error:", emailError);
      setError(emailError);
      return;
    }

    setIsLoading(true);
    console.log("[LoginForm] Validation passed, attempting login with email:", formData.email);

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("[LoginForm] Login error:", error);
        throw error;
      }

      console.log("[LoginForm] Login successful!", data);
      console.log("[LoginForm] Session:", data.session);
      console.log("[LoginForm] Cookies after login:", document.cookie);
      console.log("[LoginForm] Redirecting to:", redirectTo);

      // Success - redirect (session is now in cookies automatically via createBrowserClient)
      window.location.href = redirectTo;
    } catch (err) {
      const error = err as Error;
      console.error("[LoginForm] Login failed:", error);

      // Handle Supabase errors
      if (error.message?.includes("Invalid login credentials")) {
        setError("Nieprawidłowy email lub hasło");
      } else if (error.message?.includes("Email not confirmed")) {
        setError("Potwierdź swój adres email przed zalogowaniem");
      } else {
        setError(error.message || "Wystąpił błąd podczas logowania");
      }
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof LoginFormData, value: string) => {
    console.log("[LoginForm] Field changed:", field, "value length:", value.length);
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Debug: Log when button state changes
  React.useEffect(() => {
    console.log("[LoginForm] Form state:", {
      email: formData.email,
      hasPassword: !!formData.password,
      isLoading,
      buttonDisabled: isLoading || !formData.email || !formData.password,
    });
  }, [formData, isLoading]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--spacingVerticalL)]" noValidate>
      {/* Error Alert */}
      {error && <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />}

      {/* Email Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="email"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Email{" "}
          <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="required">
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
          autoComplete="off"
          placeholder="you@example.com"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
        />
      </div>

      {/* Password Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="password"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Password{" "}
          <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="required">
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
          autoComplete="off"
          placeholder="Wprowadź hasło"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          onClick={() => console.log("[LoginForm] Button clicked!")}
          disabled={isLoading || !formData.email || !formData.password}
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
              Logowanie...
            </>
          ) : (
            "Zaloguj się"
          )}
        </button>
      </div>
    </form>
  );
};
