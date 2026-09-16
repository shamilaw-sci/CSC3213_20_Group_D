/**
 * @component PharmacyNavbar
 * @desc      Persistent top navigation for the Pharmacy module.
 *            Links only to active pharmacist workflows.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  Building2,
  History,
  LayoutDashboard,
  UserSearch,
} from 'lucide-react';

import TopNavbar from './TopNavbar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function PharmacyNavbar() {
  const clearUser =
    useAuthStore(
      (state) => state.clearUser
    );

  const handleLogout = async () => {
    try {
      await api.post(
        '/api/auth/logout'
      );
    } catch (error) {
      console.error(
        'Pharmacy logout error:',
        error
      );
    } finally {
      clearUser();
      window.location.href =
        '/login';
    }
  };

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
      label: 'Patient Lookup',
      icon: UserSearch,
    },
    {
      type: 'link',
      to: '/pharmacy/history',
      label: 'Dispensing History',
      icon: History,
    },
    {
      type: 'link',
      to: '/pharmacy/profile',
      label: 'Pharmacy Profile',
      icon: Building2,
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