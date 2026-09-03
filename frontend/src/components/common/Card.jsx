/**
 * @component Card
 * @desc      Reusable white card container with optional title.
 *            Used to group related content across all Care4U pages.
 *            Supports a "numbered" variant for feature/landing sections
 *            (Nawaloka-style 01/02/03 badge cards).
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {string} title     - Optional card heading
 * @param {node}   children  - Card body content
 * @param {string} number    - Optional number (e.g. "01") to render as a
 *                              badge above the title — for feature grids only
 * @param {node}   icon      - Optional icon element rendered inside the number badge
 * @param {string} className - Additional Tailwind classes
 */
const Card = ({ title, children, number, icon, className = '' }) => {
  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border ${className}`}>
      {(number || icon) && (
        <div className="px-6 pt-6 flex items-center justify-between">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
            {icon || number}
          </span>
          {number && icon && (
            <span className="text-sm font-semibold text-muted-foreground">{number}</span>
          )}
        </div>
      )}
      {title && (
        <div className={`px-6 ${(number || icon) ? 'pt-4 pb-4' : 'py-4'} ${!(number || icon) ? 'border-b border-border' : ''}`}>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      )}
      <div className={title ? 'px-6 pb-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;