/**
 * ErrorAlert Component
 *
 * A versatile alert component for displaying error, warning, info, and success messages.
 * Supports dismissible alerts with appropriate styling and accessibility features.
 */

import * as React from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export type AlertType = "error" | "warning" | "info" | "success";

export interface ErrorAlertProps {
  type: AlertType;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// ============================================================================
// Styling Configuration
// ============================================================================

const alertStyles: Record<AlertType, string> = {
  error:
    "bg-[var(--colorStatusDangerBackground1)] border-[var(--colorStatusDangerBorder1)] text-[var(--colorStatusDangerForeground1)]",
  warning:
    "bg-[var(--colorStatusWarningBackground1)] border-[var(--colorStatusWarningBorder1)] text-[var(--colorStatusWarningForeground1)]",
  info: "bg-[var(--colorStatusInfoBackground1)] border-[var(--colorStatusInfoBorder1)] text-[var(--colorStatusInfoForeground1)]",
  success:
    "bg-[var(--colorStatusSuccessBackground1)] border-[var(--colorStatusSuccessBorder1)] text-[var(--colorStatusSuccessForeground1)]",
};

const iconColors: Record<AlertType, string> = {
  error: "text-[var(--colorStatusDangerForeground2)]",
  warning: "text-[var(--colorStatusWarningForeground2)]",
  info: "text-[var(--colorStatusInfoForeground2)]",
  success: "text-[var(--colorStatusSuccessForeground2)]",
};

// ============================================================================
// Icon Components
// ============================================================================

const ErrorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
);

const SuccessIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ type, message, dismissible = false, onDismiss }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  const Icon = {
    error: ErrorIcon,
    warning: WarningIcon,
    info: InfoIcon,
    success: SuccessIcon,
  }[type];

  const role = type === "error" ? "alert" : "status";
  const ariaLive = type === "error" ? "assertive" : "polite";

  const dismissButtonStyles = {
    error: "hover:bg-[var(--colorStatusDangerBackground2)] focus-visible:outline-[var(--colorStatusDangerBorder2)]",
    warning: "hover:bg-[var(--colorStatusWarningBackground2)] focus-visible:outline-[var(--colorStatusWarningBorder2)]",
    info: "hover:bg-[var(--colorStatusInfoBackground2)] focus-visible:outline-[var(--colorStatusInfoBorder2)]",
    success: "hover:bg-[var(--colorStatusSuccessBackground2)] focus-visible:outline-[var(--colorStatusSuccessBorder2)]",
  }[type];

  return (
    <div
      className={`rounded-[var(--borderRadiusMedium)] border p-[var(--spacingHorizontalM)] ${alertStyles[type]} transition-opacity duration-300`}
      role={role}
      aria-live={ariaLive}
    >
      <div className="flex items-start gap-[var(--spacingHorizontalM)]">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColors[type]}`} />
        </div>
        <div className="flex-1">
          <p className="text-[var(--fontSizeBase300)] font-[var(--fontWeightMedium)] leading-[var(--lineHeightBase300)]">
            {message}
          </p>
        </div>
        {dismissible && (
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-[var(--borderRadiusMedium)] p-[var(--spacingHorizontalXS)] transition-colors duration-100 focus-visible:outline-none focus-visible:outline-[2px] focus-visible:outline-offset-[1px] ${dismissButtonStyles}`}
              aria-label="Dismiss alert"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
