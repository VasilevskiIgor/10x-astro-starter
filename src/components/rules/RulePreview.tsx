/**
 * RulePreview Component
 *
 * Displays a preview of a business rule or validation rule with syntax highlighting.
 * Features:
 * - Rule name and description
 * - Condition preview with syntax highlighting
 * - Action/consequence display
 * - Edit and delete actions
 * - Status badges (active/inactive/draft)
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { RuleEditor } from "@/components/rules/RuleEditor";
import { RuleCondition } from "@/components/rules/RuleCondition";
import { RuleAction } from "@/components/rules/RuleAction";

// ============================================================================
// Type Definitions
// ============================================================================

export type RuleStatus = "active" | "inactive" | "draft";
export type RulePriority = "low" | "medium" | "high" | "critical";

export interface Rule {
  id: string;
  name: string;
  description?: string;
  status: RuleStatus;
  priority: RulePriority;
  condition: RuleConditionData;
  action: RuleActionData;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface RuleConditionData {
  expression: string;
  parameters: Record<string, any>;
}

export interface RuleActionData {
  type: "validate" | "transform" | "notify" | "reject";
  config: Record<string, any>;
  message?: string;
}

export interface RulePreviewProps {
  rule: Rule;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onToggleStatus?: (ruleId: string, newStatus: RuleStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPriorityColor = (priority: RulePriority): string => {
  const colors = {
    low: "bg-gray-100 text-gray-800 border-gray-300",
    medium: "bg-blue-100 text-blue-800 border-blue-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };
  return colors[priority];
};

const getStatusColor = (status: RuleStatus): string => {
  const colors = {
    active: "bg-green-100 text-green-800 border-green-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300",
    draft: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
  return colors[status];
};

// ============================================================================
// Component
// ============================================================================

export const RulePreview: React.FC<RulePreviewProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = React.useState(!compact);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(rule.id);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(rule.id);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete rule");
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = () => {
    if (!onToggleStatus) return;

    const newStatus: RuleStatus = rule.status === "active" ? "inactive" : "active";
    onToggleStatus(rule.id, newStatus);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {error && (
        <div className="p-4">
          <ErrorAlert type="error" message={error} dismissible onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(rule.status)}`}
              >
                {rule.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(rule.priority)}`}
              >
                {rule.priority}
              </span>
            </div>
            {rule.description && <p className="mt-1 text-sm text-gray-600">{rule.description}</p>}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>Created: {formatDate(rule.created_at)}</span>
              {rule.updated_at !== rule.created_at && <span>Updated: {formatDate(rule.updated_at)}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              {compact && (
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? "Hide" : "Show"} Details
                </Button>
              )}
              {onToggleStatus && (
                <Button variant="outline" size="sm" onClick={handleToggleStatus}>
                  {rule.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* Condition Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Condition</h4>
            <RuleCondition condition={rule.condition} />
          </div>

          {/* Action Section */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Action</h4>
            <RuleAction action={rule.action} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Rule?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete "{rule.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1">
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
