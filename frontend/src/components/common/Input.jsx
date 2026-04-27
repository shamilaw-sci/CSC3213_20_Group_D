/**
 * @component Input
 * @desc      Reusable text input with label and error display.
 *            Used in all Care4U forms.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string}   label       - Field label text
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
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-medium text-slate-500 uppercase tracking-wide"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          w-full px-3 py-2 text-sm text-slate-800 bg-white
          border rounded-lg transition-colors
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'}
        `}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;