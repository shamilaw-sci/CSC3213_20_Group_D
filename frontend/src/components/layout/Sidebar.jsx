/**
 * @component Sidebar
 * @desc      Patient portal sidebar with Care4U logo, NavLink navigation,
 *            and active state highlighting.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/patient/profile',         label: 'My Profile' },
  { to: '/patient/medical-records', label: 'Medical Records' },
  { to: '/patient/prescriptions',   label: 'Prescriptions' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      backgroundColor: '#1E3A5F',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* ── Logo block ── */}
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
            Care Beyond Boundaries
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <p style={{
          color: '#64748B', fontSize: '10px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          padding: '0 8px', marginBottom: '8px',
        }}>
          Patient Portal
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

      {/* ── Footer tag ── */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: '#475569',
        fontSize: '11px',
      }}>
        Group D — CSC3213
      </div>

    </aside>
  );
}