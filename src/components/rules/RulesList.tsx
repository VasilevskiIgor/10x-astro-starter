/**
 * RulesList Component
 *
 * Displays a list of rules with filtering and sorting capabilities.
 */

import * as React from "react";
import { RulePreview } from "./RulePreview";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { Rule } from "./RulePreview";

export interface RulesListProps {
  rules: Rule[];
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onToggleStatus?: (ruleId: string, newStatus: "active" | "inactive" | "draft") => void;
}

export const RulesList: React.FC<RulesListProps> = ({
  rules,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [filter, setFilter] = React.useState<"all" | "active" | "inactive" | "draft">("all");

  const filteredRules = React.useMemo(() => {
    if (filter === "all") return rules;
    return rules.filter((rule) => rule.status === filter);
  }, [rules, filter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
            <div className="h-6 w-1/3 rounded bg-gray-200"></div>
            <div className="mt-2 h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorAlert type="error" message={error} />;
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">No rules found. Create your first rule to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {(["all", "active", "inactive", "draft"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === status ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <RulePreview
            key={rule.id}
            rule={rule}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            compact
          />
        ))}
      </div>

      {filteredRules.length === 0 && filter !== "all" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No {filter} rules found.</p>
        </div>
      )}
    </div>
  );
};
