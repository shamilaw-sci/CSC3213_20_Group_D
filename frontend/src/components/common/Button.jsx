/**
 * @component Button
 * @desc      Reusable button component with variants and loading state.
 *            Used across all Care4U pages.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string}   variant  - primary | secondary | danger | ghost
 * @param {string}   size     - sm | md | lg
 * @param {boolean}  loading  - shows spinner and disables button when true
 * @param {boolean}  disabled - disables the button
 * @param {Function} onClick  - click handler
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:   'bg-[#1E3A5F] text-white hover:bg-[#2E75B6] focus:ring-[#1E3A5F]',
    secondary: 'bg-white text-[#1E3A5F] border border-[#1E3A5F] hover:bg-slate-50 focus:ring-[#1E3A5F]',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:     'bg-transparent text-[#1E3A5F] hover:bg-slate-100 focus:ring-[#1E3A5F]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;