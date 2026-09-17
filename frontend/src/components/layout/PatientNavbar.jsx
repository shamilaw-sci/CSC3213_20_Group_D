/**
 * @component PatientNavbar
 * @desc      Top navigation bar for the patient portal, using TopNavbar
 *            with patient-specific nav items grouped cleanly to avoid clutter.
 *            Includes the lab-report "New" badge.
 * @author    Wasana Karunanayaka (S/21/081)
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

const handleLogout = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.href = '/login';
};

export default function PatientNavbar() {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';

  const { data: reports = [] } = useQuery({
    queryKey: ['labReports', TEST_PATIENT_ID],
    queryFn: () => getLabReports(TEST_PATIENT_ID),
    enabled: !!TEST_PATIENT_ID,
    retry: false,
  });

  const hasNewReports = reports.filter((r) => r.status === 'completed' && !r.is_read).length > 0;

  // We use dropdown groups to keep the navbar clean while restoring the missing pages
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

  return <TopNavbar portalLabel="Patient Portal" theme="patient" navItems={navItems} onLogout={handleLogout} />;
}