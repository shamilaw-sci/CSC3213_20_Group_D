/**
 * @component AdminSidebar
 * @desc      Admin panel sidebar with Care4U logo and NavLink navigation
 *            to all admin screens, matching the patient portal's Sidebar style.
 */
import { NavLink, Link } from 'react-router-dom';

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore error
  }
  window.location.href = '/login';
};

const NAV_ITEMS = [
  { to: '/admin/approvals',           label: 'Pending Approvals',   icon: '✓' },
  { to: '/admin/accounts',            label: 'Account Management',  icon: '👤' },
  { to: '/admin/rbac',                label: 'RBAC Visibility',     icon: '🔒' },
  { to: '/admin/audit-log',           label: 'Audit Log',           icon: '📋' },
  { to: '/admin/health-content',      label: 'Health Content',      icon: '📰' },
  { to: '/admin/emergency-oversight', label: 'Emergency Oversight', icon: '🚨' },
  { to: '/admin/analytics',           label: 'Analytics',           icon: '📊' },
  { to: '/admin/qr-reissue',          label: 'QR Reissue',          icon: '⬜' },
  { to: '/admin/settings',            label: 'System Settings',     icon: '⚙️' },
];

export default function AdminSidebar() {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      backgroundColor: '#1E3A5F',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* Logo block — clickable, links to admin overview */}
      <Link
        to="/admin"
        style={{
          padding: '24px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
        }}
      >
        <img
          src="/logo.png"
          alt="Care4U"
          style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }}
        />
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '16px', letterSpacing: '0.3px' }}>
            Care4U
          </div>
          <div style={{ color: '#93C5FD', fontSize: '10px', marginTop: '1px' }}>
            Admin Panel
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <p style={{
          color: '#64748B', fontSize: '10px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          padding: '0 8px', marginBottom: '8px',
        }}>
          Admin
        </p>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="admin-nav-link"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              color:           isActive ? '#FFFFFF' : '#93C5FD',
              backgroundColor: isActive ? 'rgba(46, 117, 182, 0.9)' : 'transparent',
              fontWeight:      isActive ? '600'     : '400',
              boxShadow:       isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              transition:      'background-color 0.15s ease',
            })}
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'transparent',
            border: '1px solid #2E75B6',
            borderRadius: '8px',
            color: '#93C5FD',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          🔓 Logout
        </button>
      </div>

    </aside>
  );
}