/**
 * @file    TopNavbar.jsx
 * @desc    Generic top navigation bar used across all clinical and administrative roles.
 *          Features role-specific color theming, active tab highlighting, 
 *          desktop dropdowns, a responsive mobile drawer with proper group headers, 
 *          and integrated logout functionality.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogOut, ChevronDown, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

/**
 * Role-specific color configurations for the top navbar.
 * Ensures each module feels distinct while maintaining consistent layout.
 */
const themeConfigs = {
  patient: {
    headerBg: 'bg-emerald-950 text-emerald-50 border-b border-emerald-800/60 shadow-md',
    activeTab: 'bg-emerald-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/60',
    userBadge: 'bg-emerald-900/80 border-emerald-700/60 text-emerald-100',
    avatarBg: 'bg-emerald-700 text-white',
  },
  doctor: {
    headerBg: 'bg-blue-950 text-blue-50 border-b border-blue-800/60 shadow-md',
    activeTab: 'bg-blue-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-blue-100/80 hover:text-white hover:bg-blue-900/60',
    userBadge: 'bg-blue-900/80 border-blue-700/60 text-blue-100',
    avatarBg: 'bg-blue-700 text-white',
  },
  hospital: {
    headerBg: 'bg-slate-900 text-slate-50 border-b border-slate-800 shadow-md',
    activeTab: 'bg-indigo-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-slate-200/80 hover:text-white hover:bg-slate-800',
    userBadge: 'bg-slate-800 border-slate-700 text-slate-100',
    avatarBg: 'bg-indigo-700 text-white',
  },
  lab: {
    headerBg: 'bg-purple-950 text-purple-50 border-b border-purple-800/60 shadow-md',
    activeTab: 'bg-purple-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-purple-100/80 hover:text-white hover:bg-purple-900/60',
    userBadge: 'bg-purple-900/80 border-purple-700/60 text-purple-100',
    avatarBg: 'bg-purple-700 text-white',
  },
  pharmacy: {
    headerBg: 'bg-teal-950 text-teal-50 border-b border-teal-800/60 shadow-md',
    activeTab: 'bg-teal-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-teal-100/80 hover:text-white hover:bg-teal-900/60',
    userBadge: 'bg-teal-900/80 border-teal-700/60 text-teal-100',
    avatarBg: 'bg-teal-700 text-white',
  },
  admin: {
    headerBg: 'bg-zinc-950 text-zinc-50 border-b border-zinc-800 shadow-md',
    activeTab: 'bg-rose-600 text-white shadow-sm font-semibold',
    hoverTab: 'text-zinc-200/80 hover:text-white hover:bg-zinc-900',
    userBadge: 'bg-zinc-900 border-zinc-700 text-zinc-100',
    avatarBg: 'bg-rose-700 text-white',
  },
};

const TopNavbar = ({ portalLabel, navItems, onLogout, theme, user: customUser }) => {
  const [openGroup, setOpenGroup] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  const storeUser = useAuthStore((state) => state.user);
  const currentUser = customUser || storeUser;

  const displayName = 
    currentUser?.full_name || 
    currentUser?.name || 
    currentUser?.email?.split('@')[0] || 
    'User';
    
  const displayRole = 
    currentUser?.role 
      ? currentUser.role.replace('_', ' ') 
      : portalLabel?.replace('Portal', '').replace('Panel', '').trim();

  const getThemeKey = () => {
    if (theme && themeConfigs[theme]) return theme;
    
    const label = portalLabel?.toLowerCase() || '';
    if (label.includes('patient')) return 'patient';
    if (label.includes('doctor')) return 'doctor';
    if (label.includes('hospital')) return 'hospital';
    if (label.includes('lab')) return 'lab';
    if (label.includes('pharmacy')) return 'pharmacy';
    if (label.includes('admin')) return 'admin';
    
    return 'patient'; // Default fallback
  };

  const activeTheme = getThemeKey();
  const config = themeConfigs[activeTheme];

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Shared desktop link styling
  const linkBase =
    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer';

  return (
    <header className={`sticky top-0 z-40 ${config.headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* =========================================
              LEFT: LOGO + PORTAL LABEL + USER BADGE
          ========================================= */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Care4U"
                className="w-10 h-10 rounded-lg object-contain bg-white shadow-sm p-1 border border-white/20"
              />
              <div className="leading-tight">
                <div className="font-extrabold text-lg tracking-tight text-white">Care4U</div>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                  {portalLabel}
                </div>
              </div>
            </Link>

            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ml-2 ${config.userBadge}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${config.avatarBg}`}>
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col leading-tight max-w-[130px] truncate">
                <span className="font-semibold truncate">{displayName}</span>
                <span className="text-[9px] opacity-75 capitalize truncate">{displayRole}</span>
              </div>
            </div>
          </div>

          {/* =========================================
              MIDDLE: DESKTOP NAVIGATION
          ========================================= */}
          <nav ref={navRef} className="hidden md:flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {navItems.map((item) => {
              
              // Render Dropdown Group
              if (item.type === 'group') {
                const isOpen = openGroup === item.label;
                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenGroup(isOpen ? null : item.label)}
                      className={`${linkBase} ${config.hoverTab}`}
                      aria-expanded={isOpen}
                    >
                      <item.icon className="w-4 h-4" strokeWidth={2} />
                      {item.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        strokeWidth={2.5}
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute top-full right-0 mt-3 w-72 bg-card text-card-foreground rounded-xl shadow-xl border border-border p-2 z-50">
                        {item.items.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setOpenGroup(null)}
                            className={({ isActive }) =>
                              `flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                              }`
                            }
                          >
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <sub.icon className="w-4 h-4" strokeWidth={2} />
                            </span>
                            <span className="flex-1">
                              <span className="block text-sm font-semibold text-foreground">{sub.label}</span>
                              {sub.description && (
                                <span className="block text-xs text-muted-foreground mt-0.5">{sub.description}</span>
                              )}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Render Standard Link
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `${linkBase} ${isActive ? config.activeTab : config.hoverTab}`}
                >
                  <item.icon className="w-4 h-4" strokeWidth={2} />
                  {item.label}
                  {item.badge && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                      New
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* =========================================
              RIGHT: LOGOUT & HAMBURGER
          ========================================= */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onLogout}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE DRAWER
      ========================================= */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background shadow-xl absolute top-full left-0 w-full z-50">
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-4 py-5 space-y-5">
            
            {/* User Profile Info Card in Mobile View */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className={`w-10 h-10 rounded-full ${config.avatarBg} flex items-center justify-center font-bold text-sm shrink-0`}>
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{displayName}</span>
                <span className="text-xs text-muted-foreground capitalize">{displayRole}</span>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-4">
              {navItems.map((item, idx) => {
                
                // Group Header & Items
                if (item.type === 'group') {
                  return (
                    <div key={item.label || idx} className="space-y-1 pt-2 border-t border-border/50">
                      <p className="px-3.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {item.label}
                      </p>
                      {item.items.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isActive ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-secondary'
                            }`
                          }
                        >
                          <sub.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                          <span className="flex-1">{sub.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  );
                }

                // Standard Flat Link
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground shadow-sm font-bold' : 'text-foreground hover:bg-secondary'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.5} />
                <span>Logout securely</span>
              </button>
            </div>
            
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;