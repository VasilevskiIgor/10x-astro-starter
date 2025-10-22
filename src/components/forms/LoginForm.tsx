/**
 * LoginForm Component
 *
 * Simple login form using Supabase Auth.
 * Features:
 * - Email/Password authentication
 * - Error handling
 * - Loading state
 * - Redirect after successful login
 */

import * as React from 'react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { supabaseClient } from '@/db/supabase.client';

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
// Component
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({
  redirectTo = '/'
}) => {
  console.log('[LoginForm] Component mounted, redirectTo:', redirectTo);

  const [formData, setFormData] = React.useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm] Form submitted!', formData);
    setError(null);
    setIsLoading(true);

    try {
      console.log('[LoginForm] Attempting login with email:', formData.email);

      // Use raw fetch like Postman: /token?grant_type=password
      const response = await fetch('http://127.0.0.1:54321/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log('[LoginForm] Response status:', response.status);
      alert('Response status: ' + response.status); // DEBUG

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[LoginForm] Error response:', errorData);
        throw new Error(errorData.error_description || errorData.msg || 'Login failed');
      }

      const data = await response.json();
      console.log('[LoginForm] Login successful, token:', data.access_token?.substring(0, 20));
      alert('✅ Login successful! Token received'); // TEMPORARY DEBUG

      // Store session in Supabase client for future requests
      await supabaseClient.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Redirect after successful login
      window.location.href = redirectTo;
    } catch (error: any) {
      console.error('[LoginForm] Caught error:', error);
      alert('❌ Login error: ' + (error.message || 'Unknown error')); // TEMPORARY DEBUG

      // Handle specific Supabase errors
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in.');
      } else {
        setError(error.message || 'An error occurred during login. Please try again.');
      }

      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof LoginFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    console.log('[LoginForm] Field changed:', field, '=', value, '| Full form:', newFormData);
    setFormData(newFormData);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--spacingVerticalL)]" noValidate>
      {/* Error Alert */}
      {error && (
        <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />
      )}

      {/* Email Field */}
      <div className="flex flex-col gap-[var(--spacingVerticalXS)]">
        <label
          htmlFor="email"
          className="text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorNeutralForeground1)]"
        >
          Email <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="required">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          disabled={isLoading}
          required
          autoComplete="email"
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
          Password <span className="text-[var(--colorStatusDangerForeground1)]" aria-label="required">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          disabled={isLoading}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          className="block w-full rounded-[var(--borderRadiusMedium)] border border-[var(--colorNeutralStroke2)] bg-[var(--colorNeutralBackground1)] px-[var(--spacingHorizontalM)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground1)] placeholder:text-[var(--colorNeutralForeground3)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:bg-[var(--colorNeutralBackground4)] disabled:cursor-not-allowed transition-colors duration-100"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          className="w-full inline-flex items-center justify-center gap-[var(--spacingHorizontalS)] px-[var(--spacingHorizontalL)] py-[var(--spacingVerticalS)] text-[var(--fontSizeBase300)] font-[var(--fontWeightSemibold)] text-[var(--colorBrandForeground1)] bg-[var(--colorBrandBackground)] rounded-[var(--borderRadiusMedium)] shadow-[var(--shadow2)] hover:bg-[var(--colorBrandBackgroundHover)] active:bg-[var(--colorBrandBackgroundPressed)] focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] focus-visible:outline-[var(--colorNeutralStroke3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100"
          onClick={() => console.log('[LoginForm] Button clicked! isLoading:', isLoading, '| email:', formData.email, '| password:', formData.password ? '***' : 'empty')}
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
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center text-[var(--fontSizeBase300)] text-[var(--colorNeutralForeground2)]">
        <p>
          Don't have an account?{' '}
          <a
            href="/auth/register"
            className="text-[var(--colorBrandForegroundLink)] hover:text-[var(--colorBrandBackgroundHover)] hover:underline font-[var(--fontWeightSemibold)] transition-colors duration-100"
          >
            Register here
          </a>
        </p>
      </div>
    </form>
  );
};
