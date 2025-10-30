/**
 * RuleCondition Component
 *
 * Displays rule condition with syntax highlighting and parameter preview.
 */

import * as React from "react";

export interface RuleConditionData {
  expression: string;
  parameters: Record<string, any>;
}

export interface RuleConditionProps {
  condition: RuleConditionData;
}

export const RuleCondition: React.FC<RuleConditionProps> = ({ condition }) => {
  return (
    <div className="space-y-2">
      {/* Expression */}
      <div className="rounded bg-white p-3 font-mono text-sm border border-blue-300">
        <pre className="text-blue-900 whitespace-pre-wrap break-words">{condition.expression}</pre>
      </div>

      {/* Parameters */}
      {Object.keys(condition.parameters).length > 0 && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-blue-800 mb-2">Parameters:</h5>
          <div className="space-y-1">
            {Object.entries(condition.parameters).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-blue-700">{key}:</span>
                <span className="text-blue-900 font-mono">
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
