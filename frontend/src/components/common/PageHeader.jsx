/**
 * @file    PageHeader.jsx
 * @module  Common
 * @desc    Shared Care4U authenticated-page hero header.
 *          Uses the current module theme to provide consistent
 *          hierarchy, visual identity, responsive layout,
 *          metadata, actions, and optional custom visual content.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const PageHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  visual = null,
  meta = null,
  actions = null,
  mobileSideBySide = false,
  className = '',
}) => {
  return (
    <section
      className={`
        care4u-page-hero
        rounded-[1.6rem]
        shadow-[0_18px_45px_rgba(15,23,42,0.12)]
        ${className}
      `}
    >
      <div
        className="
          relative z-10
          min-h-[190px]
          px-5 py-7
          sm:px-8 sm:py-9
          lg:px-10 lg:py-10
          flex items-center
        "
      >
        <div
          className={
            mobileSideBySide
              ? `
                w-full
                grid
                grid-cols-[minmax(0,1fr)_auto]
                items-start
                gap-4
                sm:gap-6
                lg:flex
                lg:flex-row
                lg:items-center
                lg:justify-between
                lg:gap-8
              `
              : `
                w-full
                flex flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-8
              `
          }
        >

          {/* Main page identity */}
          <div className="max-w-3xl min-w-0">

            {eyebrow && (
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3 py-1.5
                  rounded-full
                  bg-white/10
                  border border-white/15
                  backdrop-blur-sm
                  text-white/90
                  mb-4
                "
              >

                {Icon && (
                  <Icon
                    className="w-3.5 h-3.5"
                    strokeWidth={2.5}
                  />
                )}

                <span
                  className="
                    text-[10px]
                    sm:text-[11px]
                    font-extrabold
                    uppercase
                    tracking-[0.18em]
                  "
                >
                  {eyebrow}
                </span>

              </div>
            )}

            <h1
              className={`
                font-extrabold
                text-white
                tracking-[-0.035em]
                leading-[1.08]
                ${
                  mobileSideBySide
                    ? `
                      text-[1.65rem]
                      sm:text-[2.25rem]
                      lg:text-[2.8rem]
                    `
                    : `
                      text-[2rem]
                      sm:text-[2.5rem]
                      lg:text-[2.8rem]
                    `
                }
              `}
            >
              {title}
            </h1>

            {description && (
              <p
                className={`
                  mt-4
                  max-w-2xl
                  text-white/80
                  leading-relaxed
                  ${
                    mobileSideBySide
                      ? 'text-xs sm:text-base'
                      : 'text-sm sm:text-base'
                  }
                `}
              >
                {description}
              </p>
            )}

            {actions && (
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                  mt-6
                "
              >
                {actions}
              </div>
            )}

          </div>

          {/* Optional context / visual */}
          {(visual || meta) && (
            <div
              className={
                mobileSideBySide
                  ? `
                    flex
                    flex-col
                    items-end
                    gap-3
                    shrink-0
                    lg:flex-col
                    lg:items-end
                    xl:flex-row
                    xl:items-center
                  `
                  : `
                    flex
                    flex-col
                    sm:flex-row
                    lg:flex-col
                    xl:flex-row
                    items-start
                    sm:items-center
                    lg:items-end
                    xl:items-center
                    gap-4
                    shrink-0
                  `
              }
            >

              {visual && (
                <div className="shrink-0">
                  {visual}
                </div>
              )}

              {meta && (
                <div
                  className={`
                    rounded-2xl
                    bg-white
                    border border-white/80
                    shadow-[0_12px_30px_rgba(0,0,0,0.10)]
                    text-foreground
                    ${
                      mobileSideBySide
                        ? `
                          min-w-0
                          p-2.5
                          sm:min-w-[180px]
                          sm:px-4
                          sm:py-3.5
                        `
                        : `
                          min-w-[180px]
                          px-4
                          py-3.5
                        `
                    }
                  `}
                >
                  {meta}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default PageHeader;