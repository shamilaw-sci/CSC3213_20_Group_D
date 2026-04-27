/**
 * @component Card
 * @desc      Reusable white card container with optional title.
 *            Used to group related content across all Care4U pages.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} title     - Optional card heading
 * @param {node}   children  - Card body content
 * @param {string} className - Additional Tailwind classes
 */
const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;