/**
 * RuleAction Component
 *
 * Displays rule action configuration and message.
 */

import * as React from "react";

export interface RuleActionData {
  type: "validate" | "transform" | "notify" | "reject";
  config: Record<string, any>;
  message?: string;
}

export interface RuleActionProps {
  action: RuleActionData;
}

const getActionIcon = (type: string) => {
  const icons = {
    validate: "✓",
    transform: "↻",
    notify: "🔔",
    reject: "✕",
  };
  return icons[type as keyof typeof icons] || "•";
};

const getActionColor = (type: string) => {
  const colors = {
    validate: "text-green-700",
    transform: "text-blue-700",
    notify: "text-yellow-700",
    reject: "text-red-700",
  };
  return colors[type as keyof typeof colors] || "text-gray-700";
};

export const RuleAction: React.FC<RuleActionProps> = ({ action }) => {
  return (
    <div className="space-y-2">
      {/* Action Type */}
      <div className="flex items-center gap-2">
        <span className={`text-lg ${getActionColor(action.type)}`}>{getActionIcon(action.type)}</span>
        <span className="text-sm font-semibold text-purple-900 capitalize">{action.type}</span>
      </div>

      {/* Message */}
      {action.message && (
        <div className="rounded bg-white p-3 text-sm border border-purple-300">
          <p className="text-purple-900">{action.message}</p>
        </div>
      )}

      {/* Config */}
      {Object.keys(action.config).length > 0 && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-purple-800 mb-2">Configuration:</h5>
          <div className="space-y-1">
            {Object.entries(action.config).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-purple-700">{key}:</span>
                <span className="text-purple-900 font-mono">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
