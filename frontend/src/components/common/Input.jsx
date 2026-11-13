/**
 * @file Input.jsx
 * @module Shared controls (Stage 3A review limited to auth consumers)
 * @component Input
 * @desc      Reusable text input with visible label and error display.
 *            Used in all Care4U forms.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string}   label       - Field label text (always visible, never placeholder-only)
 * @param {string}   name        - Input name attribute
 * @param {string}   type        - Input type (text, email, password, date)
 * @param {string}   value       - Controlled value
 * @param {Function} onChange    - Change handler
 * @param {string}   error       - Error message to display below input
 * @param {string}   placeholder - Placeholder text
 * @param {boolean}  required    - Marks field as required
 * @param {boolean}  disabled    - Disables the input
 * @param {boolean}  revealPassword - Opt-in masking toggle; never submits the form
 * @returns {JSX.Element} Associated label/input/error, with optional visibility control.
 */
import { useId, useState } from 'react';

const Input = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  revealPassword = false,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const errorId = `${inputId}-error`;
  const [visible, setVisible] = useState(false);
  const canReveal = revealPassword && type === 'password';
  const describedBy = [rest['aria-describedby'], error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
      <input
        id={inputId}
        name={name}
        type={canReveal && visible ? 'text' : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3.5 py-2.5 text-sm text-foreground bg-white
          border rounded-lg transition-colors
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
          ${error ? 'border-destructive' : 'border-input hover:border-muted-foreground'} ${canReveal ? 'pr-16' : ''}
        `}
        {...rest}
        aria-invalid={error ? true : rest['aria-invalid']}
        aria-describedby={describedBy}
      />
      {canReveal && (
        <button type="button" onClick={() => setVisible(previous => !previous)} disabled={disabled}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label || 'password'}`} aria-pressed={visible}
          className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-primary rounded-r-lg focus-visible:outline-2 focus-visible:outline-offset-2">
          {visible ? 'Hide' : 'Show'}
        </button>
      )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default Input;
