/**
 * @file    PatientNavbar.jsx
 * @module  Patient
 * @desc    Patient navigation links, unread lab-result badge, and logout action.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import { API_BASE_URL } from '../../services/api';

import { useQuery } from '@tanstack/react-query';
import { 
  User, CalendarCheck, Stethoscope, FileText, Pill, 
  FlaskConical, Package, CreditCard 
} from 'lucide-react';
import { getLabReports } from '../../services/patient.service';
import useAuthStore from '../../store/authStore';
import TopNavbar from './TopNavbar';

/**
 * FEATURE: Patient Logout
 * LOGIC: Attempt a session logout with cookies, then open login even if the request fails.
 * The response status is not checked here; the server controls session removal.
 */
const handleLogout = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.href = '/login';
};

/**
 * FEATURE: Patient navigation and new report badge
 * LOGIC: Show patient page links and check for completed lab reports that have not been read.
 */
export default function PatientNavbar() {
  const user = useAuthStore((state) => state.user);
  const patientId = user?.profile_id || user?.id || '';

  const { data: reports = [] } = useQuery({
    queryKey: ['labReports', patientId],
    queryFn: () => getLabReports(patientId),
    enabled: !!patientId,
    retry: false,
  });

  const hasNewReports = reports.filter((r) => r.status === 'completed' && !r.is_read).length > 0;

  // My Health, Pharmacy and Account group the patient links; the lab badge uses completed, unread reports.
  const navItems = [
    { type: 'link', to: '/patient/appointments', label: 'My Appointments', icon: CalendarCheck },
    { type: 'link', to: '/patient/doctors', label: 'Find a Doctor', icon: Stethoscope },
    {
      type: 'group',
      label: 'My Health',
      icon: FileText,
      items: [
        { to: '/patient/medical-records', label: 'Medical Records', icon: FileText, description: 'View your visit history' },
        { to: '/patient/lab-reports', label: 'Lab Reports', icon: FlaskConical, description: 'View test results', badge: hasNewReports },
      ],
    },
    {
      type: 'group',
      label: 'Pharmacy',
      icon: Pill,
      items: [
        { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill, description: 'Digital prescriptions' },
        { to: '/patient/orders', label: 'Medicine Orders', icon: Package, description: 'Track home deliveries' },
      ],
    },
    {
      type: 'group',
      label: 'Account',
      icon: User,
      items: [
        { to: '/patient/profile', label: 'My Profile', icon: User, description: 'Manage personal details' },
        { to: '/patient/payments', label: 'Payment History', icon: CreditCard, description: 'View receipts & billing' },
      ],
    },
  ];

  return /* Patient Portal Menus and Logout Button */ <TopNavbar portalLabel="Patient Portal" theme="patient" navItems={navItems} onLogout={handleLogout} />;
}
