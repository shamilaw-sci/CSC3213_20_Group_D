/**
 * @component AdminNavbar
 * @desc      Top navigation bar for the admin panel, using TopNavbar with
 *            admin navigation grouped into logical management areas.
 */

import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  LockKeyhole,
  ClipboardList,
  Newspaper,
  Siren,
  BarChart3,
  QrCode,
  Settings,
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

const navItems = [
  {
    type: 'link',
    to: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'group',
    label: 'Governance',
    icon: ShieldCheck,
    items: [
      {
        to: '/admin/approvals',
        label: 'Pending Approvals',
        icon: ShieldCheck,
        description: 'Approve or reject new registrations',
      },
      {
        to: '/admin/accounts',
        label: 'Account Management',
        icon: Users,
        description: 'Search and manage all user accounts',
      },
      {
        to: '/admin/rbac',
        label: 'RBAC Visibility',
        icon: LockKeyhole,
        description: 'View role-based access rules',
      },
    ],
  },
  {
    type: 'group',
    label: 'Oversight',
    icon: ClipboardList,
    items: [
      {
        to: '/admin/audit-log',
        label: 'Audit Log',
        icon: ClipboardList,
        description: 'Full system activity history',
      },
      {
        to: '/admin/emergency-oversight',
        label: 'Emergency Oversight',
        icon: Siren,
        description: 'Break-the-glass access review',
      },
      {
        to: '/admin/analytics',
        label: 'Analytics',
        icon: BarChart3,
        description: 'Anonymized system-wide stats',
      },
    ],
  },
  {
    type: 'group',
    label: 'Content & System',
    icon: Settings,
    items: [
      {
        to: '/admin/health-content',
        label: 'Health Content',
        icon: Newspaper,
        description: 'Manage published health articles',
      },
      {
        to: '/admin/qr-reissue',
        label: 'QR Reissue',
        icon: QrCode,
        description: 'Deactivate or reissue patient QR codes',
      },
      {
        to: '/admin/settings',
        label: 'System Settings',
        icon: Settings,
        description: 'Configure OTP, sessions, policies',
      },
    ],
  },
];

export default function AdminNavbar() {
  return (
    <TopNavbar
      portalLabel="Admin Panel"
      theme="admin"
      navItems={navItems}
      onLogout={handleLogout}
    />
  );
}