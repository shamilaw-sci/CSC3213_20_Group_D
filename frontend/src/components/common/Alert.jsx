/**
 * @component Alert
 * @desc      Displays success, error, warning, or info messages.
 *            Used for API response feedback across all Care4U pages.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} type    - success | error | warning | info
 * @param {string} message - The message text to display
 */
const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span className="font-bold mt-0.5">{icons[type]}</span>
      <p>{message}</p>
    </div>
  );
};

export default Alert;