/**
 * @component DoctorNavbar
 * @desc      Top navigation bar for the doctor portal, using TopNavbar
 *            with doctor-specific clinical navigation links.
 */

import {
  LayoutDashboard,
  Users,
  FilePlus,
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

export default function DoctorNavbar() {
  const navItems = [
    {
      type: 'link',
      to: '/doctor/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      type: 'link',
      to: '/doctor/queue',
      label: 'Patient Queue',
      icon: Users,
    },
    {
      type: 'link',
      to: '/doctor/issue-prescription',
      label: 'Issue Prescription',
      icon: FilePlus,
    },
    {
      type: 'link',
      to: '/doctor/profile',
      label: 'My Profile',
      icon: UserRound,
    },
  ];

  return (
    <TopNavbar
      portalLabel="Doctor Portal"
      theme="doctor"
      navItems={navItems}
      onLogout={handleLogout}
    />
  );
}