import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * @component Alert
 * @desc      Displays success, error, warning, or info messages.
 *            Used for API response feedback across all Care4U pages.
 *            Always pairs an icon with a text label — never colour alone.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} type    - success | error | warning | info
 * @param {string} message - The message text to display
 */
const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-success/10 border-success/20 text-success',
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-urgent/10 border-urgent/30 text-urgent-foreground',
    info: 'bg-primary/10 border-primary/20 text-primary',
  };

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${styles[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
      <p>{message}</p>
    </div>
  );
};

export default Alert;