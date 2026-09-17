/**
 * @file    TopNavbar.jsx
 * @desc    Shared Care4U top navigation used across authenticated modules.
 *          Provides module-aware styling, desktop navigation, dropdowns,
 *          responsive mobile navigation, and logout.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  NavLink,
  useLocation,
} from 'react-router-dom';

import {
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';

const MODULE_THEME_MAP = {
  patient: 'patient',
  doctor: 'doctor',
  pharmacy: 'pharmacy',
  lab: 'laboratory',
  laboratory: 'laboratory',
  hospital: 'hospital',
  admin: 'admin',
};

const MODULE_HOME_MAP = {
  patient: '/patient/profile',
  doctor: '/doctor/dashboard',
  pharmacy: '/pharmacy/dashboard',
  laboratory: '/laboratory/dashboard',
  hospital: '/hospital/dashboard',
  admin: '/admin',
};

const TopNavbar = ({
  portalLabel,
  navItems,
  onLogout,
  theme,
  user: customUser,
}) => {
  const [
    openGroup,
    setOpenGroup,
  ] = useState(null);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const navRef =
    useRef(null);

  const location =
    useLocation();

  const storeUser =
    useAuthStore(
      state => state.user
    );

  const currentUser =
    customUser ||
    storeUser;

  const displayName =
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.email?.split('@')[0] ||
    'User';

  const displayRole =
    currentUser?.role
      ? currentUser.role.replaceAll(
          '_',
          ' '
        )
      : portalLabel
          ?.replace(
            'Portal',
            ''
          )
          .replace(
            'Panel',
            ''
          )
          .trim();

  const getThemeKey = () => {
    if (
      theme &&
      MODULE_THEME_MAP[
        theme
      ]
    ) {
      return MODULE_THEME_MAP[
        theme
      ];
    }

    const label =
      portalLabel
        ?.toLowerCase() ||
      '';

    if (
      label.includes(
        'patient'
      )
    ) {
      return 'patient';
    }

    if (
      label.includes(
        'doctor'
      )
    ) {
      return 'doctor';
    }

    if (
      label.includes(
        'pharmacy'
      )
    ) {
      return 'pharmacy';
    }

    if (
      label.includes(
        'hospital'
      )
    ) {
      return 'hospital';
    }

    if (
      label.includes(
        'lab'
      )
    ) {
      return 'laboratory';
    }

    if (
      label.includes(
        'admin'
      )
    ) {
      return 'admin';
    }

    return 'patient';
  };

  const activeModule =
    getThemeKey();

  const homePath =
    MODULE_HOME_MAP[
      activeModule
    ] ||
    '/';

  useEffect(() => {
    const handleClickOutside =
      (
        event
      ) => {
        if (
          navRef.current &&
          !navRef.current.contains(
            event.target
          )
        ) {
          setOpenGroup(
            null
          );
        }
      };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    const closeMenus = window.setTimeout(() => {
      setOpenGroup(null);
      setMobileOpen(false);
    }, 0);

    return () => window.clearTimeout(closeMenus);
  }, [
    location.pathname
  ]);

  const isGroupActive =
    (
      item
    ) => {
      return item.items?.some(
        sub =>
          location.pathname ===
            sub.to ||
          location.pathname.startsWith(
            `${sub.to}/`
          )
      );
    };

  const linkBase =
    'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap';

  return (
    <header
      data-module={
        activeModule
      }
      className="
        sticky top-0 z-40
        bg-card/95
        backdrop-blur-xl
        border-b border-border
        shadow-[0_1px_12px_rgba(15,23,42,0.04)]
      "
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="h-[76px] flex items-center justify-between gap-6">

          {/* Brand */}
          <Link
            to={
              homePath
            }
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="
              w-11 h-11
              rounded-xl
              bg-white
              border border-border
              shadow-sm
              p-1.5
              flex items-center justify-center
              group-hover:shadow-md
              transition-shadow
            ">
              <img
                src="/logo.png"
                alt="Care4U"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="leading-tight">

              <div className="text-[19px] font-extrabold tracking-tight text-foreground">
                Care4U
              </div>

              <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-primary mt-0.5">
                {portalLabel}
              </div>

            </div>
          </Link>

          {/* Desktop navigation */}
          <nav
            ref={
              navRef
            }
            className="hidden md:flex items-center justify-center gap-1 flex-1"
          >
            {navItems.map(
              (
                item
              ) => {

                if (
                  item.type ===
                  'group'
                ) {
                  const isOpen =
                    openGroup ===
                    item.label;

                  const groupActive =
                    isGroupActive(
                      item
                    );

                  return (
                    <div
                      key={
                        item.label
                      }
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroup(
                            isOpen
                              ? null
                              : item.label
                          )
                        }
                        className={`${linkBase} ${
                          groupActive ||
                          isOpen
                            ? 'bg-module-soft text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                        aria-expanded={
                          isOpen
                        }
                      >
                        <item.icon
                          className="w-4 h-4"
                          strokeWidth={
                            2
                          }
                        />

                        {
                          item.label
                        }

                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isOpen
                              ? 'rotate-180'
                              : ''
                          }`}
                          strokeWidth={
                            2.5
                          }
                        />
                      </button>

                      {isOpen && (
                        <div className="
                          absolute
                          top-full
                          right-0
                          mt-3
                          w-72
                          rounded-2xl
                          border border-border
                          bg-card
                          shadow-[0_18px_50px_rgba(15,23,42,0.12)]
                          p-2
                          z-50
                        ">
                          {item.items.map(
                            (
                              sub
                            ) => (
                              <NavLink
                                key={
                                  sub.to
                                }
                                to={
                                  sub.to
                                }
                                className={({
                                  isActive
                                }) =>
                                  `flex items-start gap-3 px-3 py-3 rounded-xl transition-colors ${
                                    isActive
                                      ? 'bg-module-soft'
                                      : 'hover:bg-secondary'
                                  }`
                                }
                              >
                                <span className="
                                  w-9 h-9
                                  rounded-xl
                                  bg-module-soft
                                  text-primary
                                  flex items-center justify-center
                                  shrink-0
                                ">
                                  <sub.icon
                                    className="w-4 h-4"
                                    strokeWidth={
                                      2
                                    }
                                  />
                                </span>

                                <span className="flex-1 min-w-0">

                                  <span className="block text-sm font-bold text-foreground">
                                    {
                                      sub.label
                                    }
                                  </span>

                                  {sub.description && (
                                    <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                                      {
                                        sub.description
                                      }
                                    </span>
                                  )}

                                </span>

                                {sub.badge && (
                                  <span className="
                                    bg-destructive
                                    text-destructive-foreground
                                    text-[9px]
                                    font-bold
                                    px-1.5 py-0.5
                                    rounded-full
                                  ">
                                    New
                                  </span>
                                )}
                              </NavLink>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={
                      item.to
                    }
                    to={
                      item.to
                    }
                    className={({
                      isActive
                    }) =>
                      `${linkBase} ${
                        isActive
                          ? 'bg-module-soft text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`
                    }
                  >
                    <item.icon
                      className="w-4 h-4"
                      strokeWidth={
                        2
                      }
                    />

                    {
                      item.label
                    }

                    {item.badge && (
                      <span className="
                        bg-destructive
                        text-destructive-foreground
                        text-[9px]
                        font-bold
                        px-1.5 py-0.5
                        rounded-full
                      ">
                        New
                      </span>
                    )}
                  </NavLink>
                );
              }
            )}
          </nav>

          {/* Desktop logout / mobile menu */}
          <div className="flex items-center gap-2 shrink-0">

            <button
              type="button"
              onClick={
                onLogout
              }
              className="
                hidden md:inline-flex
                items-center gap-2
                px-4 py-2.5
                rounded-xl
                text-sm font-semibold
                text-foreground
                border border-border
                bg-card
                hover:border-primary/30
                hover:bg-module-soft
                hover:text-primary
                transition-all
              "
            >
              <LogOut
                className="w-4 h-4"
                strokeWidth={
                  2
                }
              />

              Logout
            </button>

            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
              className="
                md:hidden
                w-10 h-10
                rounded-xl
                flex items-center justify-center
                text-foreground
                hover:bg-secondary
                transition-colors
                focus:outline-none
                focus:ring-2
                focus:ring-primary
              "
              aria-label="Toggle navigation menu"
              aria-expanded={
                mobileOpen
              }
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="
          md:hidden
          absolute
          top-full left-0
          w-full
          bg-background
          border-t border-border
          shadow-xl
        ">
          <div className="
            max-h-[calc(100dvh-76px)]
            overflow-y-auto
            px-4 py-5
            space-y-5
          ">

            {/* Keep identity only in mobile menu */}
            <div className="
              flex items-center gap-3
              p-4
              rounded-2xl
              bg-card
              border border-border
              shadow-sm
            ">
              <div className="
                w-11 h-11
                rounded-xl
                bg-module-soft
                text-primary
                flex items-center justify-center
                font-extrabold
                shrink-0
              ">
                {displayName
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  'U'}
              </div>

              <div className="min-w-0">

                <p className="font-bold text-sm text-foreground truncate">
                  {
                    displayName
                  }
                </p>

                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {
                    displayRole
                  }
                </p>

              </div>
            </div>

            <div className="space-y-4">

              {navItems.map(
                (
                  item,
                  index
                ) => {

                  if (
                    item.type ===
                    'group'
                  ) {
                    return (
                      <div
                        key={
                          item.label ||
                          index
                        }
                        className="space-y-1.5"
                      >
                        <p className="
                          px-3
                          pb-1
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.14em]
                          text-muted-foreground
                        ">
                          {
                            item.label
                          }
                        </p>

                        {item.items.map(
                          (
                            sub
                          ) => (
                            <NavLink
                              key={
                                sub.to
                              }
                              to={
                                sub.to
                              }
                              className={({
                                isActive
                              }) =>
                                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                  isActive
                                    ? 'bg-module-soft text-primary'
                                    : 'text-foreground hover:bg-secondary'
                                }`
                              }
                            >
                              <sub.icon
                                className="w-[18px] h-[18px]"
                                strokeWidth={
                                  2
                                }
                              />

                              <span className="flex-1">
                                {
                                  sub.label
                                }
                              </span>

                              {sub.badge && (
                                <span className="
                                  bg-destructive
                                  text-destructive-foreground
                                  text-[9px]
                                  font-bold
                                  px-2 py-0.5
                                  rounded-full
                                ">
                                  New
                                </span>
                              )}
                            </NavLink>
                          )
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={
                        item.to
                      }
                      to={
                        item.to
                      }
                      className={({
                        isActive
                      }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-module-soft text-primary'
                            : 'text-foreground hover:bg-secondary'
                        }`
                      }
                    >
                      <item.icon
                        className="w-5 h-5"
                        strokeWidth={
                          2
                        }
                      />

                      <span className="flex-1">
                        {
                          item.label
                        }
                      </span>

                      {item.badge && (
                        <span className="
                          bg-destructive
                          text-destructive-foreground
                          text-[9px]
                          font-bold
                          px-2 py-0.5
                          rounded-full
                        ">
                          New
                        </span>
                      )}
                    </NavLink>
                  );
                }
              )}

            </div>

            <button
              type="button"
              onClick={
                onLogout
              }
              className="
                w-full
                flex items-center justify-center gap-2
                px-4 py-3
                rounded-xl
                font-bold
                text-sm
                text-destructive
                bg-destructive/10
                hover:bg-destructive/20
                transition-colors
              "
            >
              <LogOut
                className="w-4 h-4"
                strokeWidth={
                  2.5
                }
              />

              Logout
            </button>

          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
