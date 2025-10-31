/**
 * RuleEditor Component
 *
 * Form for creating and editing business rules.
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import type { Rule, RuleStatus, RulePriority } from "./RulePreview";

export interface RuleEditorProps {
  rule?: Rule;
  onSave: (rule: Partial<Rule>) => Promise<void>;
  onCancel: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
  const [name, setName] = React.useState(rule?.name || "");
  const [description, setDescription] = React.useState(rule?.description || "");
  const [status, setStatus] = React.useState<RuleStatus>(rule?.status || "draft");
  const [priority, setPriority] = React.useState<RulePriority>(rule?.priority || "medium");
  const [expression, setExpression] = React.useState(rule?.condition.expression || "");
  const [actionType, setActionType] = React.useState<"validate" | "transform" | "notify" | "reject">(
    rule?.action.type || "validate"
  );
  const [actionMessage, setActionMessage] = React.useState(rule?.action.message || "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name,
        description,
        status,
        priority,
        condition: {
          expression,
          parameters: {},
        },
        action: {
          type: actionType,
          config: {},
          message: actionMessage,
        },
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to save rule");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorAlert type="error" message={error} />}

      <div>
        <label htmlFor="rule-name" className="block text-sm font-medium text-gray-700 mb-1">
          Rule Name *
        </label>
        <input
          id="rule-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="rule-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="rule-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="rule-status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="rule-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RuleStatus)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label htmlFor="rule-priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="rule-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as RulePriority)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="rule-expression" className="block text-sm font-medium text-gray-700 mb-1">
          Condition Expression *
        </label>
        <textarea
          id="rule-expression"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          required
          rows={4}
          placeholder="e.g., trip.duration > 7 && trip.budget < 1000"
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="rule-action-type" className="block text-sm font-medium text-gray-700 mb-1">
            Action Type
          </label>
          <select
            id="rule-action-type"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as "validate" | "transform" | "notify" | "reject")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="validate">Validate</option>
            <option value="transform">Transform</option>
            <option value="notify">Notify</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <div>
          <label htmlFor="rule-action-message" className="block text-sm font-medium text-gray-700 mb-1">
            Action Message
          </label>
          <input
            id="rule-action-message"
            type="text"
            value={actionMessage}
            onChange={(e) => setActionMessage(e.target.value)}
            placeholder="Optional message"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
