/**
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
 */
const Input = ({
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
  ...rest
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-3.5 py-2.5 text-sm text-foreground bg-white
          border rounded-lg transition-colors
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
          ${error ? 'border-destructive' : 'border-input hover:border-muted-foreground'}
        `}
        {...rest}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default Input;