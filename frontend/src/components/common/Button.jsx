/**
 * @component Button
 * @desc      Reusable button component with variants, sizes, loading state,
 *            and an optional leading icon. Used across all Care4U pages.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string}   variant  - primary | brand | urgent | secondary | danger | ghost
 * @param {string}   size     - sm | md | lg
 * @param {boolean}  loading  - shows spinner and disables button when true
 * @param {boolean}  disabled - disables the button
 * @param {ReactNode} icon    - optional icon element (e.g. from lucide-react) rendered before children
 * @param {Function} onClick  - click handler
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

  const variants = {
    // Clinical teal - default action across the app
    primary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary',
    // Deep teal - hero CTAs, marketing/landing surfaces
    brand: 'bg-brand-deep text-brand-deep-foreground hover:opacity-90 focus:ring-brand-deep',
    // Amber - reserved ONLY for Emergency / urgent, time-critical actions
    urgent: 'bg-urgent text-urgent-foreground hover:opacity-90 focus:ring-urgent',
    secondary: 'bg-white text-primary border border-primary hover:bg-secondary focus:ring-primary',
    danger: 'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive',
    ghost: 'bg-transparent text-primary hover:bg-secondary focus:ring-primary shadow-none',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  );
};

export default Button;