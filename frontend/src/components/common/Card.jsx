/**
 * @component Card
 * @desc      Reusable white card container with optional title.
 *            Used to group related content across all Care4U pages.
 *            Supports a "numbered" variant for feature/landing sections
 *            (Nawaloka-style 01/02/03 badge cards).
 * @author    Wasana Karunanayaka (S/21/081)
 */
const Card = ({ title, children, number, icon, className = '' }) => {
  return (
    <div className={`bg-card relative overflow-hidden rounded-xl shadow-sm border border-border ${className}`}>
      
      {/* Premium UI Polish: Tiny teal gradient at the top of the card */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary/30" />

      {(number || icon) && (
        <div className="px-6 pt-6 flex items-center justify-between relative z-10">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
            {icon || number}
          </span>
          {number && icon && (
            <span className="text-sm font-semibold text-muted-foreground">{number}</span>
          )}
        </div>
      )}
      
      {title && (
        <div className={`px-6 relative z-10 ${(number || icon) ? 'pt-4 pb-4' : 'pt-5 pb-4'} ${!(number || icon) ? 'border-b border-border' : ''}`}>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
      )}
      
      <div className={`relative z-10 ${title ? 'px-6 pb-6' : 'p-6'}`}>
        {children}
      </div>
      
    </div>
  );
};

export default Card;