/**
 * @component DoctorNavbar
 * @desc      Top navigation bar for the doctor portal, using TopNavbar
 *            with doctor-specific clinical navigation links.
 */
import { LayoutDashboard, Users, Clock, FilePlus, FlaskConical } from 'lucide-react';
import TopNavbar from './TopNavbar';

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.href = '/login';
};

export default function DoctorNavbar() {
  const navItems = [
    { type: 'link', to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', to: '/doctor/queue', label: 'Patient Queue', icon: Users },
    { type: 'link', to: '/doctor/availability', label: 'Schedule & Availability', icon: Clock },
    { type: 'link', to: '/doctor/prescriptions/new', label: 'Issue Prescription', icon: FilePlus },
    { type: 'link', to: '/doctor/lab-orders', label: 'Lab Orders', icon: FlaskConical },
  ];

  return <TopNavbar portalLabel="Doctor Portal" theme="doctor" navItems={navItems} onLogout={handleLogout} />;
}