/**
 * @component LabNavbar
 * @desc      Top navigation bar for the laboratory portal, using TopNavbar
 *            with lab request queues, report uploads, and management links.
 */
import { LayoutDashboard, ClipboardList, Upload, CheckCircle2 } from 'lucide-react';
import TopNavbar from './TopNavbar';

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.href = '/login';
};

export default function LabNavbar() {
  const navItems = [
    { type: 'link', to: '/lab/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', to: '/lab/queue', label: 'Test Requests', icon: ClipboardList },
    { type: 'link', to: '/lab/upload', label: 'Upload Report', icon: Upload },
    { type: 'link', to: '/lab/completed', label: 'Completed Tests', icon: CheckCircle2 },
  ];

  return <TopNavbar portalLabel="Laboratory Portal" theme="lab" navItems={navItems} onLogout={handleLogout} />;
}