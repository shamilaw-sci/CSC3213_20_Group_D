/**
 * @component TopNavbar
 * @desc      Generic top navigation bar used by every role (Patient, Admin,
 *            Doctor, etc). Renders flat links and/or dropdown groups,
 *            handles active-route highlighting, mobile hamburger collapse,
 *            and a logout action — matching the Nawaloka-style dark top nav.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogOut, ChevronDown, Menu, X } from 'lucide-react';

const TopNavbar = ({ portalLabel, navItems, onLogout }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const linkBase =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors';
  
  // FIXED: Updated for dark background (text-brand-deep-foreground)
  const linkInactive = 'text-brand-deep-foreground/80 hover:text-brand-deep-foreground hover:bg-white/10';
  const linkActive = 'bg-primary text-primary-foreground shadow-sm';

  // FIXED: Applied bg-brand-deep for the Nawaloka-style dark band
  return (
    <header className="sticky top-0 z-40 bg-brand-deep text-brand-deep-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Care4U"
              className="w-10 h-10 rounded-lg object-contain bg-white shadow-sm p-1 border border-primary/15"
            />
            <div className="leading-tight">
              {/* FIXED: Text colors inverted for dark background */}
              <div className="text-brand-deep-foreground font-extrabold text-lg tracking-tight">Care4U</div>
              <div className="text-brand-deep-foreground/70 text-[10px] uppercase tracking-wide font-bold">
                {portalLabel}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav ref={navRef} className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.type === 'group') {
                const isOpen = openGroup === item.label;
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenGroup(isOpen ? null : item.label)}
                      className={`${linkBase} ${linkInactive}`}
                    >
                      <item.icon className="w-4 h-4" strokeWidth={2} />
                      {item.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Dropdown menu remains white (bg-card) for contrast */}
                    {isOpen && (
                      <div className="absolute top-full right-0 mt-3 w-72 bg-card rounded-xl shadow-xl border border-border p-2 z-50">
                        {item.items.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setOpenGroup(null)}
                            className={({ isActive }) =>
                              `flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                isActive ? 'bg-primary/10' : 'hover:bg-secondary'
                              }`
                            }
                          >
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <sub.icon className="w-4 h-4" strokeWidth={2} />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-foreground">{sub.label}</span>
                              {sub.description && (
                                <span className="block text-xs text-muted-foreground">{sub.description}</span>
                              )}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                  <item.icon className="w-4 h-4" strokeWidth={2} />
                  {item.label}
                  {item.badge && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right side: logout (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              // FIXED: Button styling adjusted for dark background
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-brand-deep-foreground/20 text-brand-deep-foreground hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              // FIXED: Hamburger icon adjusted for dark background
              className="md:hidden p-2 rounded-lg text-brand-deep-foreground hover:bg-white/10"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu (kept white for standard mobile dropdown UX) */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-3 space-y-1 shadow-lg">
          {navItems.flatMap((item) => (item.type === 'group' ? item.items : [item])).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-secondary'
                }`
              }
            >
              <item.icon className="w-4 h-4" strokeWidth={2} />
              {item.label}
              {item.badge && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  New
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 mt-2 border-t border-border pt-3"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;