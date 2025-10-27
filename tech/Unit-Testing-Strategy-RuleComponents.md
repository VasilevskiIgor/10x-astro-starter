# Unit Testing Strategy - Rule Components
## Analiza i Rekomendacje

**Data:** 2025-10-27
**Komponenty:** RulePreview, RuleCondition, RuleAction, RuleEditor, RulesList
**Framework:** Vitest + React Testing Library + Happy DOM

---

## Spis Treści

1. [Priorytety Testowania](#priorytety-testowania)
2. [Komponenty do Przetestowania](#komponenty-do-przetestowania)
3. [Helper Functions (Najwyższy Priorytet)](#helper-functions)
4. [Komponenty Prezentacyjne](#komponenty-prezentacyjne)
5. [Komponenty z Logiką Biznesową](#komponenty-z-logiką-biznesową)
6. [Komponenty Kontenerowe](#komponenty-kontenerowe)
7. [Przykłady Testów](#przykłady-testów)
8. [Coverage Goals](#coverage-goals)

---

## Priorytety Testowania

### 🔴 CRITICAL (Wysoki Priorytet)
Elementy zawierające logikę biznesową, obliczenia, transformacje danych.
**Powód:** Błędy tutaj wpływają bezpośrednio na funkcjonalność aplikacji.

### 🟡 HIGH (Średni Priorytet)
Komponenty z interakcjami użytkownika, walidacją, obsługą zdarzeń.
**Powód:** Błędy wpływają na UX i mogą prowadzić do niespodziewanego zachowania.

### 🟢 MEDIUM (Niski Priorytet)
Komponenty prezentacyjne z minimalną logiką.
**Powód:** Wizualne błędy są łatwe do wykrycia, niskie ryzyko.

### ⚪ LOW (Opcjonalny)
Czyste komponenty prezentacyjne, style, layout.
**Powód:** Lepiej testować przez snapshot tests lub visual regression.

---

## Komponenty do Przetestowania

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRIORITY MATRIX                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 CRITICAL                                                     │
│  ├─ formatDate() [RulePreview]                                  │
│  ├─ calculateDuration() [TripDetail - reference]                │
│  ├─ getPriorityColor() [RulePreview]                            │
│  ├─ getStatusColor() [RulePreview]                              │
│  ├─ getActionIcon() [RuleAction]                                │
│  └─ getActionColor() [RuleAction]                               │
│                                                                 │
│  🟡 HIGH                                                         │
│  ├─ RulePreview - handleDelete()                                │
│  ├─ RulePreview - handleToggleStatus()                          │
│  ├─ RulePreview - conditional rendering logic                   │
│  ├─ RuleEditor - handleSubmit()                                 │
│  ├─ RuleEditor - form validation                                │
│  └─ RulesList - filtering logic (useMemo)                       │
│                                                                 │
│  🟢 MEDIUM                                                       │
│  ├─ RuleCondition - parameter rendering                         │
│  ├─ RuleAction - config rendering                               │
│  ├─ RulePreview - modal state management                        │
│  └─ ErrorAlert - dismissible logic                              │
│                                                                 │
│  ⚪ LOW                                                          │
│  ├─ Static UI rendering                                         │
│  ├─ CSS classes application                                     │
│  └─ Icon components                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Helper Functions

### 🔴 CRITICAL - Dlaczego testować jako pierwsze?

#### 1. **formatDate()** - RulePreview.tsx
```typescript
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**Dlaczego testować:**
- ✅ Czysta funkcja (pure function) - łatwa do testowania
- ✅ Używana w wielu miejscach (wyświetlanie dat created_at, updated_at)
- ✅ Podatna na błędy (timezone issues, invalid dates, null values)
- ✅ Krytyczna dla UX (źle sformatowane daty mylą użytkowników)
- ✅ Szybka regression detection

**Test cases:**
```typescript
describe('formatDate', () => {
  it('should format valid ISO date string correctly')
  it('should handle timezone differences')
  it('should throw error for invalid date strings')
  it('should handle edge dates (leap years, DST changes)')
  it('should be consistent across locales')
});
```

**Przykłady błędów bez testów:**
- Wyświetlanie "Invalid Date"
- Różne formaty w różnych przeglądarkach
- Błędne timezone (pokazuje wczorajszą datę)

---

#### 2. **getPriorityColor()** - RulePreview.tsx
```typescript
const getPriorityColor = (priority: RulePriority): string => {
  const colors = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[priority];
};
```

**Dlaczego testować:**
- ✅ Mapping logic - łatwy do zepsucia przy refaktoryzacji
- ✅ Krytyczne dla dostępności (color coding dla severity)
- ✅ Type safety verification
- ✅ Defaults handling (co się stanie z niezdefiniowanym priority?)

**Test cases:**
```typescript
describe('getPriorityColor', () => {
  it('should return correct color for each priority level')
  it('should return all required CSS classes')
  it('should handle undefined priority gracefully')
  it('should be type-safe (TypeScript compile check)')
});
```

**Przykłady błędów bez testów:**
- Critical rule pokazywany jako low priority (green zamiast red)
- Missing CSS classes (badge bez border)
- Runtime errors dla nieznanych wartości

---

#### 3. **getStatusColor()** - RulePreview.tsx
```typescript
const getStatusColor = (status: RuleStatus): string => {
  const colors = {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  return colors[status];
};
```

**Dlaczego testować:**
- ✅ Business logic (wizualne rozróżnienie stanów)
- ✅ Często zmieniane (design updates)
- ✅ Konsystencja z innymi częściami aplikacji

---

#### 4. **getActionIcon()** - RuleAction.tsx
```typescript
const getActionIcon = (type: string) => {
  const icons = {
    validate: '✓',
    transform: '↻',
    notify: '🔔',
    reject: '✕',
  };
  return icons[type as keyof typeof icons] || '•';
};
```

**Dlaczego testować:**
- ✅ Default fallback logic ('•')
- ✅ Type casting safety
- ✅ Icon consistency
- ✅ Accessibility (screen readers)

**Test cases:**
```typescript
describe('getActionIcon', () => {
  it('should return correct icon for each action type')
  it('should return default icon for unknown type')
  it('should handle null/undefined input')
  it('should return string type (not undefined)')
});
```

---

#### 5. **getActionColor()** - RuleAction.tsx
```typescript
const getActionColor = (type: string) => {
  const colors = {
    validate: 'text-green-700',
    transform: 'text-blue-700',
    notify: 'text-yellow-700',
    reject: 'text-red-700',
  };
  return colors[type as keyof typeof colors] || 'text-gray-700';
};
```

**Dlaczego testować:**
- ✅ Semantic color mapping (green = success, red = error)
- ✅ Default fallback
- ✅ Accessibility (WCAG contrast ratios)

---

## Komponenty Prezentacyjne

### 🟢 MEDIUM - RuleCondition.tsx

**Co testować:**
```typescript
describe('RuleCondition', () => {
  it('should render expression in monospace font')
  it('should display all parameters as key-value pairs')
  it('should handle empty parameters object')
  it('should format complex objects with JSON.stringify')
  it('should handle parameters with special characters')
  it('should wrap long expressions correctly')
});
```

**Dlaczego testować:**
- ✅ Rendering logic dla różnych typów danych
- ✅ Edge cases (empty objects, null values, circular references)
- ✅ Text overflow handling

**Przykład testu:**
```typescript
it('should render all parameters correctly', () => {
  const condition = {
    expression: 'trip.duration > 7',
    parameters: {
      minDuration: 7,
      maxBudget: 1000,
      nested: { value: 'test' }
    }
  };

  const { getByText } = render(<RuleCondition condition={condition} />);

  expect(getByText('minDuration:')).toBeInTheDocument();
  expect(getByText('7')).toBeInTheDocument();
  expect(getByText('maxBudget:')).toBeInTheDocument();
  expect(getByText('1000')).toBeInTheDocument();
});
```

---

### 🟢 MEDIUM - RuleAction.tsx

**Co testować:**
```typescript
describe('RuleAction', () => {
  it('should render correct icon for action type')
  it('should apply correct color class')
  it('should display message when provided')
  it('should not render message section when missing')
  it('should display all config key-value pairs')
  it('should handle empty config object')
});
```

**Dlaczego testować:**
- ✅ Conditional rendering (message optional)
- ✅ Integration z helper functions
- ✅ Complex object rendering

---

## Komponenty z Logiką Biznesową

### 🟡 HIGH - RulePreview.tsx

#### **handleDelete()** - Async operation
```typescript
const handleDelete = async () => {
  setIsDeleting(true);
  try {
    await onDelete(rule.id);
    setShowDeleteConfirm(false);
  } catch (err: any) {
    setError(err.message || 'Failed to delete rule');
    setIsDeleting(false);
  }
};
```

**Dlaczego testować:**
- ✅ Async flow (loading states, success, error)
- ✅ State management (isDeleting, error, modal)
- ✅ Error handling
- ✅ Callback invocation

**Test cases:**
```typescript
describe('RulePreview - handleDelete', () => {
  it('should set isDeleting to true while deleting')
  it('should call onDelete with correct rule id')
  it('should close modal on success')
  it('should display error message on failure')
  it('should keep modal open on error')
  it('should not reset isDeleting on success')
});
```

**Przykład testu:**
```typescript
it('should handle delete error correctly', async () => {
  const onDelete = vi.fn().mockRejectedValue(new Error('Network error'));
  const rule = mockRule();

  const { getByText, getByRole } = render(
    <RulePreview rule={rule} onDelete={onDelete} />
  );

  // Open delete modal
  const deleteButton = getByText('Delete');
  fireEvent.click(deleteButton);

  // Confirm delete
  const confirmButton = getByText('Delete', { selector: 'button' });
  fireEvent.click(confirmButton);

  await waitFor(() => {
    expect(getByText('Network error')).toBeInTheDocument();
  });

  // Modal should still be visible
  expect(getByRole('dialog')).toBeInTheDocument();
});
```

---

#### **handleToggleStatus()** - State mutation
```typescript
const handleToggleStatus = () => {
  if (!onToggleStatus) return;
  const newStatus: RuleStatus = rule.status === 'active' ? 'inactive' : 'active';
  onToggleStatus(rule.id, newStatus);
};
```

**Dlaczego testować:**
- ✅ Logic branching (active ↔ inactive)
- ✅ Guard clause (!onToggleStatus)
- ✅ Callback with computed value

**Test cases:**
```typescript
describe('RulePreview - handleToggleStatus', () => {
  it('should toggle active to inactive')
  it('should toggle inactive to active')
  it('should not crash when onToggleStatus is undefined')
  it('should call onToggleStatus with rule id and new status')
  it('should not change draft status (edge case)')
});
```

---

#### **Conditional Rendering** - Complex UI logic
```typescript
{showDetails && (
  <div>
    <RuleCondition condition={rule.condition} />
    <RuleAction action={rule.action} />
  </div>
)}

{showDeleteConfirm && <DeleteModal />}
```

**Dlaczego testować:**
- ✅ Multiple render paths
- ✅ Compact mode behavior
- ✅ Props propagation to children

**Test cases:**
```typescript
describe('RulePreview - conditional rendering', () => {
  it('should show details when showDetails is true')
  it('should hide details when compact is true by default')
  it('should toggle details visibility on button click')
  it('should not render delete modal initially')
  it('should show delete modal when delete button clicked')
  it('should pass correct props to RuleCondition')
  it('should pass correct props to RuleAction')
});
```

---

### 🟡 HIGH - RuleEditor.tsx

#### **handleSubmit()** - Form submission
```typescript
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
      condition: { expression, parameters: {} },
      action: { type: actionType as any, config: {}, message: actionMessage },
    });
  } catch (err: any) {
    setError(err.message || 'Failed to save rule');
    setIsSaving(false);
  }
};
```

**Dlaczego testować:**
- ✅ Form validation (prevent default, required fields)
- ✅ Data transformation (building rule object)
- ✅ Loading states
- ✅ Error handling
- ✅ Success flow

**Test cases:**
```typescript
describe('RuleEditor - handleSubmit', () => {
  it('should prevent default form submission')
  it('should set isSaving to true immediately')
  it('should clear previous errors')
  it('should call onSave with formatted data')
  it('should handle successful save')
  it('should display error on save failure')
  it('should reset isSaving on error')
  it('should validate required fields (name, expression)')
});
```

**Przykład testu:**
```typescript
it('should submit form with correct data', async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const { getByLabelText, getByText } = render(
    <RuleEditor onSave={onSave} onCancel={vi.fn()} />
  );

  // Fill form
  fireEvent.change(getByLabelText('Rule Name *'), {
    target: { value: 'Test Rule' }
  });
  fireEvent.change(getByLabelText('Condition Expression *'), {
    target: { value: 'value > 10' }
  });

  // Submit
  fireEvent.click(getByText('Create Rule'));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      name: 'Test Rule',
      description: '',
      status: 'draft',
      priority: 'medium',
      condition: { expression: 'value > 10', parameters: {} },
      action: { type: 'validate', config: {}, message: '' }
    });
  });
});
```

---

#### **Form Validation** - Built-in HTML5 validation
```typescript
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

<textarea
  value={expression}
  onChange={(e) => setExpression(e.target.value)}
  required
/>
```

**Dlaczego testować:**
- ✅ Required fields enforcement
- ✅ User feedback for validation errors
- ✅ Form can't be submitted if invalid

**Test cases:**
```typescript
describe('RuleEditor - validation', () => {
  it('should not submit form when name is empty')
  it('should not submit form when expression is empty')
  it('should display browser validation messages')
  it('should allow submission when all required fields filled')
});
```

---

### 🟡 HIGH - RulesList.tsx

#### **Filtering Logic** - useMemo optimization
```typescript
const filteredRules = React.useMemo(() => {
  if (filter === 'all') return rules;
  return rules.filter((rule) => rule.status === filter);
}, [rules, filter]);
```

**Dlaczego testować:**
- ✅ Business logic (filtering by status)
- ✅ Performance optimization (useMemo)
- ✅ Edge cases (empty arrays, all filters)

**Test cases:**
```typescript
describe('RulesList - filtering', () => {
  it('should show all rules when filter is "all"')
  it('should show only active rules when filter is "active"')
  it('should show only inactive rules when filter is "inactive"')
  it('should show only draft rules when filter is "draft"')
  it('should handle empty rules array')
  it('should update filtered rules when filter changes')
  it('should recalculate when rules prop changes')
});
```

**Przykład testu:**
```typescript
it('should filter active rules correctly', () => {
  const rules = [
    mockRule({ status: 'active' }),
    mockRule({ status: 'inactive' }),
    mockRule({ status: 'active' }),
  ];

  const { getByText, getAllByTestId } = render(
    <RulesList rules={rules} />
  );

  // Click "Active" filter button
  fireEvent.click(getByText('Active'));

  // Should only show 2 active rules
  const visibleRules = getAllByTestId('rule-preview');
  expect(visibleRules).toHaveLength(2);
});
```

---

#### **Loading & Empty States** - Conditional rendering
```typescript
if (isLoading) {
  return <LoadingSkeleton />;
}

if (error) {
  return <ErrorAlert type="error" message={error} />;
}

if (rules.length === 0) {
  return <EmptyState />;
}
```

**Dlaczego testować:**
- ✅ Multiple render paths
- ✅ User experience for different states
- ✅ Props propagation

**Test cases:**
```typescript
describe('RulesList - states', () => {
  it('should show loading skeleton when isLoading is true')
  it('should show error alert when error is provided')
  it('should show empty state when rules array is empty')
  it('should show rules list when data is available')
  it('should not show loading when data loaded')
});
```

---

## Komponenty Kontenerowe

### 🟢 MEDIUM - Integration Tests

**Dlaczego testować integracje:**
- ✅ Props drilling
- ✅ Callback chains
- ✅ Component communication

**Test cases:**
```typescript
describe('RulesList + RulePreview integration', () => {
  it('should pass correct props to RulePreview')
  it('should handle delete callback from RulePreview')
  it('should handle edit callback from RulePreview')
  it('should update UI when rule is deleted')
  it('should trigger parent callbacks correctly')
});

describe('RulePreview + RuleCondition + RuleAction integration', () => {
  it('should pass condition data correctly')
  it('should pass action data correctly')
  it('should render nested components in correct order')
});
```

---

## Przykłady Testów

### 🔴 Test 1: Helper Function - formatDate()

**Plik:** `tests/unit/components/rules/helpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/components/rules/RulePreview';

describe('formatDate', () => {
  it('should format valid ISO date string correctly', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toMatch(/Jan 15, 2025/);
    expect(result).toMatch(/10:30/);
  });

  it('should handle different timezones consistently', () => {
    const utcDate = '2025-01-15T00:00:00Z';
    const result = formatDate(utcDate);
    expect(result).toBeTruthy();
    expect(result).not.toBe('Invalid Date');
  });

  it('should throw error for invalid date strings', () => {
    expect(() => formatDate('invalid-date')).toThrow();
  });

  it('should handle edge dates correctly', () => {
    const leapYear = '2024-02-29T12:00:00Z';
    const result = formatDate(leapYear);
    expect(result).toMatch(/Feb 29, 2024/);
  });
});
```

---

### 🟡 Test 2: Component with Logic - RulePreview handleDelete()

**Plik:** `tests/unit/components/rules/RulePreview.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { RulePreview } from '@/components/rules/RulePreview';

const mockRule = () => ({
  id: '1',
  name: 'Test Rule',
  description: 'Test description',
  status: 'active' as const,
  priority: 'high' as const,
  condition: { expression: 'value > 10', parameters: {} },
  action: { type: 'validate' as const, config: {}, message: 'Test' },
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  created_by: 'user-123',
});

describe('RulePreview - handleDelete', () => {
  it('should open delete confirmation modal', () => {
    const { getByText, queryByText } = render(
      <RulePreview rule={mockRule()} showActions={true} />
    );

    // Initially, modal should not be visible
    expect(queryByText('Delete Rule?')).not.toBeInTheDocument();

    // Click delete button
    fireEvent.click(getByText('Delete'));

    // Modal should appear
    expect(getByText('Delete Rule?')).toBeInTheDocument();
  });

  it('should call onDelete with correct id on confirmation', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const rule = mockRule();

    const { getByText } = render(
      <RulePreview rule={rule} onDelete={onDelete} showActions={true} />
    );

    // Open modal
    fireEvent.click(getByText('Delete'));

    // Confirm deletion
    const confirmButton = getByText('Delete', { selector: 'button.flex-1' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(rule.id);
    });
  });

  it('should display error message on delete failure', async () => {
    const errorMessage = 'Network error';
    const onDelete = vi.fn().mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <RulePreview rule={mockRule()} onDelete={onDelete} showActions={true} />
    );

    // Open modal and confirm
    fireEvent.click(getByText('Delete'));
    const confirmButton = getByText('Delete', { selector: 'button.flex-1' });
    fireEvent.click(confirmButton);

    // Error should be displayed
    await waitFor(() => {
      expect(getByText(errorMessage)).toBeInTheDocument();
    });

    // Modal should still be open
    expect(getByText('Delete Rule?')).toBeInTheDocument();
  });

  it('should disable buttons while deleting', async () => {
    const onDelete = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByText } = render(
      <RulePreview rule={mockRule()} onDelete={onDelete} showActions={true} />
    );

    fireEvent.click(getByText('Delete'));
    const confirmButton = getByText('Delete', { selector: 'button.flex-1' }) as HTMLButtonElement;
    fireEvent.click(confirmButton);

    // Button should show "Deleting..." and be disabled
    await waitFor(() => {
      expect(getByText('Deleting...')).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
    });
  });
});
```

---

### 🟡 Test 3: Form Component - RuleEditor

**Plik:** `tests/unit/components/rules/RuleEditor.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { RuleEditor } from '@/components/rules/RuleEditor';

describe('RuleEditor - form submission', () => {
  it('should submit form with correct data structure', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    const { getByLabelText, getByText } = render(
      <RuleEditor onSave={onSave} onCancel={onCancel} />
    );

    // Fill required fields
    fireEvent.change(getByLabelText('Rule Name *'), {
      target: { value: 'Budget Validation' }
    });

    fireEvent.change(getByLabelText('Description'), {
      target: { value: 'Validates trip budget' }
    });

    fireEvent.change(getByLabelText('Condition Expression *'), {
      target: { value: 'trip.budget > 1000' }
    });

    fireEvent.change(getByLabelText('Action Message'), {
      target: { value: 'Budget too high' }
    });

    // Submit form
    fireEvent.click(getByText('Create Rule'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Budget Validation',
        description: 'Validates trip budget',
        status: 'draft',
        priority: 'medium',
        condition: {
          expression: 'trip.budget > 1000',
          parameters: {}
        },
        action: {
          type: 'validate',
          config: {},
          message: 'Budget too high'
        }
      });
    });
  });

  it('should validate required fields', async () => {
    const onSave = vi.fn();
    const { getByText } = render(
      <RuleEditor onSave={onSave} onCancel={vi.fn()} />
    );

    // Try to submit without filling required fields
    fireEvent.click(getByText('Create Rule'));

    // onSave should not be called due to HTML5 validation
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should display error message on save failure', async () => {
    const errorMessage = 'Validation failed';
    const onSave = vi.fn().mockRejectedValue(new Error(errorMessage));

    const { getByLabelText, getByText } = render(
      <RuleEditor onSave={onSave} onCancel={vi.fn()} />
    );

    // Fill required fields
    fireEvent.change(getByLabelText('Rule Name *'), {
      target: { value: 'Test' }
    });
    fireEvent.change(getByLabelText('Condition Expression *'), {
      target: { value: 'test' }
    });

    // Submit
    fireEvent.click(getByText('Create Rule'));

    // Error should appear
    await waitFor(() => {
      expect(getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should populate form when editing existing rule', () => {
    const existingRule = {
      id: '1',
      name: 'Existing Rule',
      description: 'Test description',
      status: 'active' as const,
      priority: 'high' as const,
      condition: { expression: 'x > 5', parameters: {} },
      action: { type: 'notify' as const, config: {}, message: 'Alert' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      created_by: 'user-1'
    };

    const { getByLabelText, getByText } = render(
      <RuleEditor rule={existingRule} onSave={vi.fn()} onCancel={vi.fn()} />
    );

    // Fields should be pre-filled
    expect((getByLabelText('Rule Name *') as HTMLInputElement).value).toBe('Existing Rule');
    expect((getByLabelText('Description') as HTMLTextAreaElement).value).toBe('Test description');
    expect((getByLabelText('Condition Expression *') as HTMLTextAreaElement).value).toBe('x > 5');
    expect(getByText('Update Rule')).toBeInTheDocument();
  });
});
```

---

### 🟢 Test 4: List Component - RulesList Filtering

**Plik:** `tests/unit/components/rules/RulesList.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RulesList } from '@/components/rules/RulesList';
import type { Rule } from '@/components/rules/RulePreview';

const createMockRule = (overrides?: Partial<Rule>): Rule => ({
  id: Math.random().toString(),
  name: 'Test Rule',
  description: 'Description',
  status: 'active',
  priority: 'medium',
  condition: { expression: 'test', parameters: {} },
  action: { type: 'validate', config: {}, message: 'Test' },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
  ...overrides,
});

describe('RulesList - filtering', () => {
  it('should display all rules initially', () => {
    const rules = [
      createMockRule({ status: 'active', name: 'Rule 1' }),
      createMockRule({ status: 'inactive', name: 'Rule 2' }),
      createMockRule({ status: 'draft', name: 'Rule 3' }),
    ];

    const { getByText } = render(<RulesList rules={rules} />);

    expect(getByText('Rule 1')).toBeInTheDocument();
    expect(getByText('Rule 2')).toBeInTheDocument();
    expect(getByText('Rule 3')).toBeInTheDocument();
  });

  it('should filter active rules only', () => {
    const rules = [
      createMockRule({ status: 'active', name: 'Active 1' }),
      createMockRule({ status: 'inactive', name: 'Inactive 1' }),
      createMockRule({ status: 'active', name: 'Active 2' }),
    ];

    const { getByText, queryByText } = render(<RulesList rules={rules} />);

    // Click "Active" filter
    fireEvent.click(getByText('Active'));

    // Should show only active rules
    expect(getByText('Active 1')).toBeInTheDocument();
    expect(getByText('Active 2')).toBeInTheDocument();
    expect(queryByText('Inactive 1')).not.toBeInTheDocument();
  });

  it('should show empty state when no rules match filter', () => {
    const rules = [
      createMockRule({ status: 'active' }),
    ];

    const { getByText } = render(<RulesList rules={rules} />);

    // Filter by "draft"
    fireEvent.click(getByText('Draft'));

    // Should show empty message
    expect(getByText('No draft rules found.')).toBeInTheDocument();
  });

  it('should display loading skeleton when isLoading is true', () => {
    const { container } = render(<RulesList rules={[]} isLoading={true} />);

    // Should have loading skeletons
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display error alert when error is provided', () => {
    const errorMessage = 'Failed to load rules';
    const { getByText } = render(
      <RulesList rules={[]} error={errorMessage} />
    );

    expect(getByText(errorMessage)).toBeInTheDocument();
  });
});
```

---

## Coverage Goals

### Minimum Coverage Requirements

```
┌─────────────────────────────────────────────────────────────┐
│                     COVERAGE TARGETS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Helper Functions:                    95%+ coverage         │
│  ├─ formatDate()                      100%                  │
│  ├─ getPriorityColor()                100%                  │
│  ├─ getStatusColor()                  100%                  │
│  ├─ getActionIcon()                   100%                  │
│  └─ getActionColor()                  100%                  │
│                                                             │
│  Business Logic Components:           85%+ coverage         │
│  ├─ RulePreview (handlers)            90%                   │
│  ├─ RuleEditor (form logic)           85%                   │
│  └─ RulesList (filtering)             90%                   │
│                                                             │
│  Presentational Components:           70%+ coverage         │
│  ├─ RuleCondition                     75%                   │
│  ├─ RuleAction                        75%                   │
│  └─ ErrorAlert                        70%                   │
│                                                             │
│  Overall Project Coverage:            80%+                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Priority Order

1. **Phase 1 (Week 1)** - Critical Functions
   - ✅ formatDate()
   - ✅ getPriorityColor()
   - ✅ getStatusColor()
   - ✅ getActionIcon()
   - ✅ getActionColor()

2. **Phase 2 (Week 2)** - Component Logic
   - ✅ RulePreview - handleDelete()
   - ✅ RulePreview - handleToggleStatus()
   - ✅ RuleEditor - handleSubmit()
   - ✅ RulesList - filtering logic

3. **Phase 3 (Week 3)** - Rendering & States
   - ✅ Conditional rendering tests
   - ✅ Loading states
   - ✅ Error states
   - ✅ Empty states

4. **Phase 4 (Week 4)** - Integration Tests
   - ✅ Component interactions
   - ✅ Props propagation
   - ✅ Callback chains

---

## Test Setup

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      }
    },
  },
});
```

### Test Utilities
```typescript
// tests/utils/test-utils.tsx
import { render } from '@testing-library/react';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};

export const mockRule = (overrides?: Partial<Rule>): Rule => ({
  id: '1',
  name: 'Test Rule',
  status: 'active',
  priority: 'medium',
  condition: { expression: 'test', parameters: {} },
  action: { type: 'validate', config: {}, message: '' },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
  ...overrides,
});
```

---

## Podsumowanie

### Dlaczego te elementy są priorytetem:

1. **Helper Functions (🔴 CRITICAL)**
   - Pure functions - najłatwiejsze do testowania
   - Wysokie ryzyko błędów (formatting, mapping)
   - Używane w wielu miejscach
   - Szybkie feedback loop

2. **Business Logic (🟡 HIGH)**
   - Bezpośredni wpływ na funkcjonalność
   - Async operations - więcej edge cases
   - State management - trudniejsze do debugowania
   - Error handling - krytyczne dla UX

3. **Rendering Logic (🟢 MEDIUM)**
   - Conditional rendering - multiple paths
   - Props propagation - integration testing
   - Loading/error states - user experience

4. **Styling (⚪ LOW)**
   - Visual regression tests lepsze
   - Łatwe do wykrycia manualnie
   - Niskie ryzyko funkcjonalne

### Expected Benefits:

✅ **Regression Prevention** - Catch bugs before production
✅ **Refactoring Confidence** - Safe code changes
✅ **Documentation** - Tests as living documentation
✅ **Faster Development** - Less manual testing
✅ **Better Architecture** - Testable code = better design

### ROI (Return on Investment):

```
Helper Functions:       ████████████ 95% (Very High)
Business Logic:         ████████░░░░ 80% (High)
Rendering Logic:        █████░░░░░░░ 50% (Medium)
Styling:                ██░░░░░░░░░░ 20% (Low)
```

---

**Wygenerowano:** 2025-10-27
**Framework:** Vitest + React Testing Library
**Projekt:** Travel App Planner - Rule Components
