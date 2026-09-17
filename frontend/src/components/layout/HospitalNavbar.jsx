/**
 * @file    HospitalNavbar.jsx
 * @module  Hospital
 * @desc    Top navigation bar for the hospital portal.
 *          Provides access to the hospital dashboard, OPD queue,
 *          emergency operations, and logout.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { API_BASE_URL } from '../../services/api';

import {
  Activity,
  LayoutDashboard,
  Users,
} from 'lucide-react';

import TopNavbar from './TopNavbar';

/**
 * Logs the authenticated hospital staff member out of Care4U.
 *
 * @returns {Promise<void>}
 */
const handleLogout = async () => {
  try {
    await fetch(
      `${API_BASE_URL}/api/auth/logout`,
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

/**
 * @component HospitalNavbar
 * @desc      Hospital-specific navigation using the shared Care4U
 *            TopNavbar component.
 */
const HospitalNavbar = () => {
  const navItems = [
    {
      type: 'link',
      to: '/hospital/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      type: 'link',
      to: '/hospital/opd',
      label: 'OPD Queue',
      icon: Users,
    },
    {
      type: 'link',
      to: '/hospital/emergency',
      label: 'Emergency',
      icon: Activity,
    },
  ];

  return (
    <TopNavbar
    portalLabel="Hospital Portal"
    theme="hospital"
    navItems={navItems}
    onLogout={handleLogout}
    />
  );
};

export default HospitalNavbar;