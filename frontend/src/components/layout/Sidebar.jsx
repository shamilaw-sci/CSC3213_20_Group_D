/**
 * @component Sidebar
 * @desc      Patient portal sidebar navigation.
 *            Links to all patient pages. Highlights the active route.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/patient/profile',         label: 'My Profile' },
  { to: '/patient/medical-records', label: 'Medical Records' },
  { to: '/patient/prescriptions',   label: 'Prescriptions' },
];

const Sidebar = () => {
  return (
    <aside style={{ width: '220px', minHeight: '100vh', backgroundColor: '#1E3A5F', padding: '24px 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2E75B6' }}>
        <p style={{ color: '#93C5FD', fontSize: '12px', margin: 0 }}>Care4U</p>
        <p style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0' }}>Patient Portal</p>
      </div>
      <nav style={{ marginTop: '16px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'block',
              padding: '12px 20px',
              color: isActive ? '#FFFFFF' : '#93C5FD',
              backgroundColor: isActive ? '#2E75B6' : 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;