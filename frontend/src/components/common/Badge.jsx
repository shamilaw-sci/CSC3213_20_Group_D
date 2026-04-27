/**
 * @component Badge
 * @desc      Colour-coded status pill used across all Care4U pages.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} status - active | expired | pending | completed |
 *                          cancelled | confidential | normal
 */
const Badge = ({ status }) => {
  const styles = {
    active:       'bg-green-100 text-green-700',
    completed:    'bg-slate-100 text-slate-600',
    expired:      'bg-red-100 text-red-700',
    cancelled:    'bg-red-100 text-red-700',
    pending:      'bg-orange-100 text-orange-700',
    confidential: 'bg-orange-100 text-orange-700',
    normal:       'bg-slate-100 text-slate-500',
  };

  const labels = {
    active:       'Active',
    completed:    'Completed',
    expired:      'Expired',
    cancelled:    'Cancelled',
    pending:      'Pending',
    confidential: 'Confidential',
    normal:       'Standard',
  };

  const style = styles[status] || styles.normal;
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
};

export default Badge;