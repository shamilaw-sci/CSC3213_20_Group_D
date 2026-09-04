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
  Settings,
  Calendar,
  Activity
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const maxCount = roleCounts.length > 0 ? Math.max(...roleCounts.map((r) => r.count)) : 1;

  // Added context-aware icons to the summary data for better visual scanning
  const cards = summary ? [
    { label: 'Total Patients', value: summary.totalPatients, icon: Users },
    { label: 'Appointments This Month', value: summary.appointmentsThisMonth, icon: Calendar },
    { label: 'Prescriptions Issued', value: summary.prescriptionsIssued, icon: FileText },
    { label: 'Emergency Overrides', value: summary.emergencyOverrides, icon: Activity },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm sm:text-base font-medium text-muted-foreground mt-1.5">
          A snapshot of the system and quick access to every admin tool.
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="h-full">
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bar chart */}
      <Card title="Users by Role">
        {roleCounts.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-muted-foreground">
            No user role data available.
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-2">
            {roleCounts.map((r) => (
              <div key={r.role} className="flex items-center gap-3 sm:gap-4">
                <span className="w-28 sm:w-36 text-sm font-semibold text-foreground shrink-0 truncate" title={ROLE_LABELS[r.role] || r.role}>
                  {ROLE_LABELS[r.role] || r.role}
                </span>
                <div className="flex-1 bg-secondary rounded-full h-8 sm:h-9 overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary rounded-full flex items-center justify-end pr-4 transition-all duration-700 ease-out min-w-[2.5rem]"
                    style={{ width: `${Math.max((r.count / maxCount) * 100, 8)}%` }}
                  >
                    <span className="text-primary-foreground text-xs sm:text-sm font-bold">
                      {r.count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-5">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className="bg-card border border-border rounded-xl shadow-sm p-4 flex items-center gap-4 text-left group hover:shadow-md hover:border-primary/40 hover:bg-secondary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AdminOverviewPage;