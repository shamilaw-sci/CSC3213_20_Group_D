/**
 * @component PharmacyNavbar
 * @desc      Top navigation bar for the pharmacy portal, using TopNavbar
 *            with prescription lookup, order delivery tracking, and dispensing.
 */
import { LayoutDashboard, QrCode, Truck, CheckSquare } from 'lucide-react';
import TopNavbar from './TopNavbar';

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.href = '/login';
};

export default function PharmacyNavbar() {
  const navItems = [
    { type: 'link', to: '/pharmacy/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', to: '/pharmacy/verify', label: 'Dispense & QR Verification', icon: QrCode },
    { type: 'link', to: '/pharmacy/orders', label: 'Delivery Orders', icon: Truck },
    { type: 'link', to: '/pharmacy/history', label: 'Dispensed History', icon: CheckSquare },
  ];

  return <TopNavbar portalLabel="Pharmacy Portal" theme="pharmacy" navItems={navItems} onLogout={handleLogout} />;
}