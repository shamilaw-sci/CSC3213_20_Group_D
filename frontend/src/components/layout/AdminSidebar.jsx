/**
 * @component AdminSidebar
 * @desc      Admin panel sidebar with Care4U logo and NavLink navigation
 *            to all admin screens, matching the patient portal's Sidebar style.
 */
import { NavLink } from 'react-router-dom';

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
  { to: '/admin/approvals',           label: 'Pending Approvals' },
  { to: '/admin/accounts',            label: 'Account Management' },
  { to: '/admin/rbac',                label: 'RBAC Visibility' },
  { to: '/admin/audit-log',           label: 'Audit Log' },
  { to: '/admin/health-content',      label: 'Health Content' },
  { to: '/admin/emergency-oversight', label: 'Emergency Oversight' },
  { to: '/admin/analytics',           label: 'Analytics' },
  { to: '/admin/qr-reissue',          label: 'QR Reissue' },
  { to: '/admin/settings',            label: 'System Settings' },
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

      {/* Logo block */}
      <div style={{
        padding: '24px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
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
      </div>

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
            style={({ isActive }) => ({
              display: 'block',
              padding: '10px 12px',
              marginBottom: '4px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              color:           isActive ? '#FFFFFF' : '#93C5FD',
              backgroundColor: isActive ? '#2E75B6' : 'transparent',
              fontWeight:      isActive ? '600'     : '400',
              borderLeft:      isActive ? '3px solid #FFFFFF' : '3px solid transparent',
            })}
          >
            {item.label}
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