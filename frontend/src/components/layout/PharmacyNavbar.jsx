/**
 * @component PharmacyNavbar
 * @desc      Top navigation bar for the pharmacy portal, using TopNavbar
 *            with prescription lookup, dispensing history, and profile links.
 */

import {
  LayoutDashboard,
  QrCode,
  CheckSquare,
  UserRound,
} from 'lucide-react';

import TopNavbar from './TopNavbar';

const handleLogout = async () => {
  try {
    await fetch(
      'http://localhost:5000/api/auth/logout',
      {
        method: 'POST',
        credentials: 'include',
      }
    );
  } catch {
    /* ignore */
  }

  window.location.href = '/login';
};

export default function PharmacyNavbar() {
  const navItems = [
    {
      type: 'link',
      to: '/pharmacy/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      type: 'link',
      to: '/pharmacy/patient-lookup',
      label: 'Dispense & QR Verification',
      icon: QrCode,
    },
    {
      type: 'link',
      to: '/pharmacy/history',
      label: 'Dispensed History',
      icon: CheckSquare,
    },
    {
      type: 'link',
      to: '/pharmacy/profile',
      label: 'My Profile',
      icon: UserRound,
    },
  ];

  return (
    <TopNavbar
      portalLabel="Pharmacy Portal"
      theme="pharmacy"
      navItems={navItems}
      onLogout={handleLogout}
    />
  );
}