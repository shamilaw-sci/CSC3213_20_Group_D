/**
 * @component Sidebar
 * @desc      Patient portal sidebar with Care4U navigation.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLabReports } from '../../services/patient.service';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/patient/profile',         label: 'My Profile' },
  { to: '/patient/appointments',    label: 'My Appointments' }, 
  { to: '/patient/doctors',         label: 'Find a Doctor' },
  { to: '/patient/medical-records', label: 'Medical Records' },
  { to: '/patient/prescriptions',   label: 'Prescriptions' },
  { to: '/patient/lab-reports',     label: 'Lab Reports',  hasBadge: true },
];

export default function Sidebar() {
  const navigate = useNavigate();
  // Wire in Zustand
  const { user, clearUser } = useAuthStore();
  
  // Use dynamic user ID, default to empty string to avoid undefined crashes
  const currentUserId = user?.id || '';

  const { data: reports = [] } = useQuery({
    queryKey: ['labReports', currentUserId],
    queryFn: () => getLabReports(currentUserId),
    enabled: !!currentUserId, // Only run the query if we have an ID
    retry: false, 
  });

  const unreadCount = reports.filter(report => report.status === 'completed' && !report.is_read).length;
  const hasNewReports = unreadCount > 0;

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore network error on logout */ }
    
    // Clear Zustand store and route to login
    clearUser();
    navigate('/login', { replace: true });
  };

  return (
    <aside style={{ width: '220px', minHeight: '100vh', backgroundColor: '#1E3A5F', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.png" alt="Care4U" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '16px', letterSpacing: '0.3px' }}>Care4U</div>
          <div style={{ color: '#93C5FD', fontSize: '10px', marginTop: '1px' }}>Care Beyond Boundaries</div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <p style={{ color: '#64748B', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', marginBottom: '8px' }}>
          Patient Portal
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', marginBottom: '4px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', color: isActive ? '#FFFFFF' : '#93C5FD', backgroundColor: isActive ? '#2E75B6' : 'transparent', fontWeight: isActive ? '600' : '400', borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent' })}>
            <span>{item.label}</span>
            {item.hasBadge && hasNewReports && (
               <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>New</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', border: '1px solid #2E75B6', borderRadius: '8px', color: '#93C5FD', fontSize: '14px', cursor: 'pointer' }}>
          🔓 Logout
        </button>
      </div>
    </aside>
  );
}