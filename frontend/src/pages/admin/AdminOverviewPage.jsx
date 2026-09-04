/**
 * @file    AdminOverviewPage.jsx
 * @module  Admin
 * @desc    Admin panel home — stat cards, a users-by-role bar chart, and
 *          quick-access links to all admin sections.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { 
  CheckCircle, 
  Users, 
  Shield, 
  ClipboardList, 
  FileText, 
  AlertTriangle, 
  BarChart2, 
  QrCode, 
  Settings 
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const QUICK_LINKS = [
  { to: '/admin/approvals',           label: 'Pending Approvals',   icon: CheckCircle },
  { to: '/admin/accounts',            label: 'Account Management',  icon: Users },
  { to: '/admin/rbac',                label: 'RBAC Visibility',     icon: Shield },
  { to: '/admin/audit-log',           label: 'Audit Log',           icon: ClipboardList },
  { to: '/admin/health-content',      label: 'Health Content',      icon: FileText },
  { to: '/admin/emergency-oversight', label: 'Emergency Oversight', icon: AlertTriangle },
  { to: '/admin/analytics',           label: 'Analytics',           icon: BarChart2 },
  { to: '/admin/qr-reissue',          label: 'QR Reissue',          icon: QrCode },
  { to: '/admin/settings',            label: 'System Settings',     icon: Settings },
];

const ROLE_LABELS = {
  patient: 'Patients',
  doctor: 'Doctors',
  pharmacist: 'Pharmacists',
  lab_technician: 'Lab Technicians',
  lab_staff: 'Lab Staff',
  hospital_staff: 'Hospital Staff',
  admin: 'Admins',
};

const AdminOverviewPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [roleCounts, setRoleCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, rolesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/analytics`, { credentials: 'include' }),
          fetch(`${API_URL}/api/admin/analytics/users-by-role`, { credentials: 'include' }),
        ]);

        const summaryData = await summaryRes.json();
        const rolesData = await rolesRes.json();

        if (!summaryData.success || !rolesData.success) {
          setError('Failed to load overview data');
          return;
        }

        setSummary(summaryData.data);
        setRoleCounts(rolesData.data);
      } catch (err) {
        console.error('Fetch overview error:', err);
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const maxCount = roleCounts.length > 0 ? Math.max(...roleCounts.map((r) => r.count)) : 1;

  const cards = summary ? [
    { label: 'Total Patients', value: summary.totalPatients },
    { label: 'Appointments This Month', value: summary.appointmentsThisMonth },
    { label: 'Prescriptions Issued', value: summary.prescriptionsIssued },
    { label: 'Emergency Overrides', value: summary.emergencyOverrides },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin overview</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">A snapshot of the system and quick access to every admin tool.</p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <Card key={card.label} className="p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{card.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card className="mb-6">
        <h2 className="text-sm font-bold text-foreground mb-5 uppercase tracking-wide">Users by role</h2>
        <div className="flex flex-col gap-4">
          {roleCounts.map((r) => (
            <div key={r.role} className="flex items-center gap-4">
              <span className="w-32 text-sm font-medium text-foreground shrink-0">{ROLE_LABELS[r.role] || r.role}</span>
              <div className="flex-1 bg-secondary rounded-full h-7 overflow-hidden border border-border">
                <div
                  className="h-full bg-primary rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max((r.count / maxCount) * 100, 8)}%` }}
                >
                  <span className="text-primary-foreground text-xs font-bold">{r.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Quick access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className="bg-card border border-border rounded-xl shadow-sm p-4 flex items-center gap-4 text-left hover:shadow-md hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <span className="text-sm font-bold text-foreground">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;