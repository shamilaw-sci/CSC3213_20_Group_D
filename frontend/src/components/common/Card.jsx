/**
 * @component Card
 * @desc      Shared Care4U content card used across authenticated modules.
 *            Provides consistent spacing, module-aware accent styling,
 *            soft elevation, optional title, icon, and numbered feature state.
 * @author    Wasana Karunanayaka (S/21/081)
 */

const Card = ({
  title,
  children,
  number,
  icon,
  className = '',
}) => {
  const hasFeatureHeader =
    number ||
    icon;

  return (
    <section
      className={`
        relative
        overflow-hidden
        bg-card
        rounded-2xl
        border border-border/70
        shadow-[0_8px_26px_rgba(15,23,42,0.055)]
        transition-shadow duration-200
        ${className}
      `}
    >
      {/* Module accent */}
      <div
        className="
          absolute
          top-0 left-0 right-0
          h-1
          bg-gradient-to-r
          from-primary
          via-primary/65
          to-transparent
        "
      />

      {/* Optional feature / numbered header */}
      {hasFeatureHeader && (
        <div
          className="
            relative z-10
            flex items-center justify-between
            px-5 sm:px-6
            pt-6
          "
        >
          <span
            className="
              inline-flex
              items-center justify-center
              w-11 h-11
              rounded-xl
              bg-module-soft
              text-primary
              font-bold
            "
          >
            {icon || number}
          </span>

          {number && icon && (
            <span
              className="
                text-xs
                font-bold
                tracking-wider
                text-muted-foreground
              "
            >
              {number}
            </span>
          )}
        </div>
      )}

      {/* Card heading */}
      {title && (
        <header
          className={`
            relative z-10
            px-5 sm:px-6
            ${
              hasFeatureHeader
                ? 'pt-5'
                : 'pt-6'
            }
            pb-5
            border-b border-border/70
          `}
        >
          <h3
            className="
              text-base sm:text-lg
              font-bold
              text-foreground
              leading-snug
            "
          >
            {title}
          </h3>
        </header>
      )}

      {/* Card content */}
      <div
        className={`
          relative z-10
          px-5 sm:px-6
          ${
            title
              ? 'pt-5 sm:pt-6 pb-6'
              : 'py-6'
          }
        `}
      >
        {children}
      </div>
    </section>
  );
};

export default Card;