/**
 * @file    AdminOverviewPage.jsx
 * @module  Admin
 * @desc    Admin panel home — stat cards, a users-by-role bar chart, and
 *          quick-access links to all admin sections.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const QUICK_LINKS = [
  { to: '/admin/approvals',           label: 'Pending Approvals',   icon: '✓' },
  { to: '/admin/accounts',            label: 'Account Management',  icon: '👤' },
  { to: '/admin/rbac',                label: 'RBAC Visibility',     icon: '🔒' },
  { to: '/admin/audit-log',           label: 'Audit Log',           icon: '📋' },
  { to: '/admin/health-content',      label: 'Health Content',      icon: '📰' },
  { to: '/admin/emergency-oversight', label: 'Emergency Oversight', icon: '🚨' },
  { to: '/admin/analytics',           label: 'Analytics',           icon: '📊' },
  { to: '/admin/qr-reissue',          label: 'QR Reissue',          icon: '⬜' },
  { to: '/admin/settings',            label: 'System Settings',     icon: '⚙️' },
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Admin overview</h1>
        <p className="text-sm text-slate-500">A snapshot of the system and quick access to every admin tool.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="text-3xl font-semibold text-[#1E3A5F] mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Users by role</h2>
        <div className="flex flex-col gap-3">
          {roleCounts.map((r) => (
            <div key={r.role} className="flex items-center gap-3">
              <span className="w-32 text-xs text-slate-600 shrink-0">{ROLE_LABELS[r.role] || r.role}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full bg-[#2E75B6] rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((r.count / maxCount) * 100, 8)}%` }}
                >
                  <span className="text-white text-xs font-medium">{r.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium text-slate-700">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;