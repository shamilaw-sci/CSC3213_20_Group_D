/**
 * @component Badge
 * @desc      Colour-coded status/severity pill used across all Care4U pages.
 *            Never relies on colour alone — every variant always renders a
 *            text label alongside colour, per accessibility standard (Section 5.5).
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} status   - active | expired | pending | completed | cancelled | confidential | normal
 * @param {string} severity - mild | moderate | severe (alternative to status, for allergy/condition badges)
 * @param {string} label    - optional override for the displayed text
 */
const Badge = ({ status, severity, label: labelOverride }) => {
  const statusStyles = {
    active: 'bg-success/10 text-success',
    completed: 'bg-muted text-muted-foreground',
    expired: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-destructive/10 text-destructive',
    pending: 'bg-urgent/10 text-urgent-foreground',
    confidential: 'bg-urgent/10 text-urgent-foreground',
    normal: 'bg-muted text-muted-foreground',
  };

  const severityStyles = {
    mild: 'bg-success/10 text-success',
    moderate: 'bg-urgent/10 text-urgent-foreground',
    severe: 'bg-destructive text-destructive-foreground',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    expired: 'Expired',
    cancelled: 'Cancelled',
    pending: 'Pending',
    confidential: 'Confidential',
    normal: 'Standard',
  };

  const severityLabels = {
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe',
  };

  const style = severity ? (severityStyles[severity] || severityStyles.mild)
    : (statusStyles[status] || statusStyles.normal);

  const text = labelOverride || (severity ? (severityLabels[severity] || severity) : (statusLabels[status] || status));

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
};

export default Badge;