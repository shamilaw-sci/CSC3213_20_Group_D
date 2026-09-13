/**
 * @component PatientNavbar
 * @desc      Top navigation bar for the patient portal, using TopNavbar
 *            with patient-specific nav items and the lab-report "New" badge.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { useQuery } from '@tanstack/react-query';
import { User, CalendarCheck, Stethoscope, FileText, Pill, FlaskConical } from 'lucide-react';
import { getLabReports } from '../../services/patient.service';
import useAuthStore from '../../store/authStore';
import TopNavbar from './TopNavbar';

const handleLogout = async () => {
  try {
    await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
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

  const navItems = [
    { type: 'link', to: '/patient/profile', label: 'My Profile', icon: User },
    { type: 'link', to: '/patient/appointments', label: 'My Appointments', icon: CalendarCheck },
    { type: 'link', to: '/patient/doctors', label: 'Find a Doctor', icon: Stethoscope },
    { type: 'link', to: '/patient/medical-records', label: 'Medical Records', icon: FileText },
    { type: 'link', to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
    { type: 'link', to: '/patient/lab-reports', label: 'Lab Reports', icon: FlaskConical, badge: hasNewReports },
  ];

  return <TopNavbar portalLabel="Patient Portal" theme="patient" navItems={navItems} onLogout={handleLogout} />;
}