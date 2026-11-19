/**
 * ARENA CX control-surface kit: buttons, toggles, sliders, segmented
 * controls, panels and text inputs — all custom-styled to match the
 * cyberpunk identity (no generic dashboard chrome).
 */

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export type BtnVariant = 'default' | 'primary' | 'danger' | 'ghost' | 'accent';
export type BtnSize = 'sm' | 'md' | 'lg';

export function Btn({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn('btn', `btn--${variant}`, `btn--${size}`, className)}
      {...rest}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Text input
// ---------------------------------------------------------------------------

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={cn('text-input', className)} spellCheck={false} {...rest} />;
}

// ---------------------------------------------------------------------------
// Toggle (square pixel knob)
// ---------------------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn('toggle', checked && 'toggle--on')}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track">
        <span className="toggle-knob" />
      </span>
      {(label || hint) && (
        <span className="toggle-text">
          {label ? <span className="toggle-label">{label}</span> : null}
          {hint ? <span className="toggle-hint">{hint}</span> : null}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{format ? format(value) : value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  icon?: ReactNode;
}

export function Segmented<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: SegmentOption<V>[];
  onChange: (next: V) => void;
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={cn('segmented-btn', value === opt.value && 'is-active')}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel + Field
// ---------------------------------------------------------------------------

export function Panel({
  title,
  icon,
  actions,
  children,
  className,
  tone = 'default',
}: {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <section className={cn('panel', tone === 'danger' && 'panel--danger', className)}>
      {(title || actions) && (
        <header className="panel-head">
          <div className="panel-title">
            {icon}
            {title ? <h3>{title}</h3> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  inline,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={cn('field', inline && 'field--inline')}>
      <div className="field-label">
        <span>{label}</span>
        {hint ? <em>{hint}</em> : null}
      </div>
      <div className="field-control">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag chip
// ---------------------------------------------------------------------------

export function Tag({ tone = 'violet', children }: { tone?: 'violet' | 'accent' | 'muted' | 'danger'; children: ReactNode }) {
  return <span className={cn('tag', `tag--${tone}`)}>{children}</span>;
}
