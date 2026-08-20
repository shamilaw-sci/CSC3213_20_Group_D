/**
 * @component Sidebar
 * @desc      Patient portal sidebar with Care4U logo, NavLink navigation,
 *            active state highlighting, and a dynamic Lab Reports notification badge.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLabReports } from '../../services/patient.service';

// TEMPORARY: hardcoded test patient UUID until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

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
  { to: '/patient/profile',         label: 'My Profile' },
  { to: '/patient/doctors',         label: 'Find a Doctor' }, // NEW ITEM
  { to: '/patient/medical-records', label: 'Medical Records' },
  { to: '/patient/prescriptions',   label: 'Prescriptions' },
  { to: '/patient/lab-reports',     label: 'Lab Reports',  hasBadge: true },
];

export default function Sidebar() {
  // Fetch lab reports to check if we need to show the notification badge
  const { data: reports = [] } = useQuery({
    queryKey: ['labReports', TEST_PATIENT_ID],
    queryFn: () => getLabReports(TEST_PATIENT_ID),
    // Silent fail if network error, don't break the sidebar
    retry: false, 
  });

  // Check if there are any completed reports that haven't been read yet
  const unreadCount = reports.filter(report => report.status === 'completed' && !report.is_read).length;
  const hasNewReports = unreadCount > 0;

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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
            <span>{item.label}</span>
            
            {/* Conditional Notification Badge */}
            {item.hasBadge && hasNewReports && (
               <span style={{
                 backgroundColor: '#EF4444', // Tailwind red-500
                 color: 'white',
                 fontSize: '10px',
                 fontWeight: 'bold',
                 padding: '2px 6px',
                 borderRadius: '10px',
                 boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
               }}>
                 New
               </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Logout button ── */}
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