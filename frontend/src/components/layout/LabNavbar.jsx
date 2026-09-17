/**
 * @file    LabNavbar.jsx
 * @desc    Persistent navigation for active laboratory workflows.
 */

import { ClipboardList, LayoutDashboard } from 'lucide-react';

import TopNavbar from './TopNavbar';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function LabNavbar() {
  const clearUser = useAuthStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Laboratory logout error:', error);
    } finally {
      clearUser();
      window.location.href = '/login';
    }
  };

  const navItems = [
    {
      type: 'link',
      to: '/laboratory/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      type: 'link',
      to: '/laboratory/queue',
      label: 'Test Requests',
      icon: ClipboardList,
    },
  ];

  return (
    <TopNavbar
      portalLabel="Laboratory Portal"
      theme="laboratory"
      navItems={navItems}
      onLogout={handleLogout}
    />
  );
}
