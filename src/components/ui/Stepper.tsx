import { useState } from 'react';
import { Minus, Pencil, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { clamp } from '../../utils/id';

/**
 * Numeric stepper with increment / decrement buttons and a manual-edit
 * mode (click the value or the pencil to type an exact number).
 * Used for all six independent statistics in the control panel.
 */
export function Stepper({
  value,
  onSetValue,
  min = 0,
  max = 999,
  accent = 'violet',
  disabled,
}: {
  value: number;
  onSetValue: (next: number) => void;
  min?: number;
  max?: number;
  accent?: 'violet' | 'accent' | 'neutral';
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isNaN(parsed)) onSetValue(clamp(parsed, min, max));
    setEditing(false);
    setDraft('');
  };

  const beginEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  return (
    <div className={cn('stepper', `stepper--${accent}`)}>
      <button
        type="button"
        className="stepper-btn"
        aria-label="Decrease"
        disabled={disabled || value <= min}
        onClick={() => onSetValue(clamp(value - 1, min, max))}
      >
        <Minus size={14} />
      </button>

      {editing ? (
        <input
          className="stepper-value stepper-input"
          autoFocus
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setEditing(false);
              setDraft('');
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="stepper-value"
          onClick={beginEdit}
          title="Click to edit manually"
          disabled={disabled}
        >
          {value}
        </button>
      )}

      <button
        type="button"
        className="stepper-btn"
        aria-label="Increase"
        disabled={disabled || value >= max}
        onClick={() => onSetValue(clamp(value + 1, min, max))}
      >
        <Plus size={14} />
      </button>

      {!editing && (
        <button
          type="button"
          className="stepper-edit"
          onClick={beginEdit}
          title="Edit manually"
          aria-label="Edit value manually"
          disabled={disabled}
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  );
}
