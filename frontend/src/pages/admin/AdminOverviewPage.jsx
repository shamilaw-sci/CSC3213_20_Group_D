/**
 * @file    AdminOverviewPage.jsx
 * @module  Admin
 * @desc    Admin panel home — stat cards, a users-by-role bar chart, and
 *          quick-access links to all admin sections.
 */

import { API_BASE_URL } from '../../services/api';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Activity,
  AlertTriangle,
  BarChart2,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  QrCode,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;

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

  const [
    summary,
    setSummary
  ] = useState(null);

  const [
    roleCounts,
    setRoleCounts
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          summaryRes,
          rolesRes
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/admin/analytics`,
            {
              credentials: 'include'
            }
          ),
          fetch(
            `${API_URL}/api/admin/analytics/users-by-role`,
            {
              credentials: 'include'
            }
          ),
        ]);

        const summaryData =
          await summaryRes.json();

        const rolesData =
          await rolesRes.json();

        if (
          !summaryData.success ||
          !rolesData.success
        ) {
          setError(
            'Failed to load overview data'
          );

          return;
        }

        setSummary(
          summaryData.data
        );

        setRoleCounts(
          rolesData.data
        );

      } catch (err) {
        console.error(
          'Fetch overview error:',
          err
        );

        setError(
          'Could not connect to the server.'
        );

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm font-medium text-muted-foreground">
          Loading admin overview...
        </p>

      </div>
    );
  }

  const maxCount =
    roleCounts.length > 0
      ? Math.max(
          ...roleCounts.map(
            (role) =>
              Number(
                role.count
              ) || 0
          ),
          1
        )
      : 1;

  const totalAccounts =
    roleCounts.reduce(
      (
        total,
        role
      ) =>
        total +
        (
          Number(
            role.count
          ) || 0
        ),
      0
    );

  // Added context-aware icons to the summary data for better visual scanning
  const cards = summary
    ? [
        {
          label: 'Total Patients',
          value:
            summary.totalPatients,
          icon: Users,
          iconClass:
            'bg-module-soft text-primary',
        },
        {
          label:
            'Appointments This Month',
          value:
            summary.appointmentsThisMonth,
          icon: Calendar,
          iconClass:
            'bg-module-soft text-primary',
        },
        {
          label:
            'Prescriptions Issued',
          value:
            summary.prescriptionsIssued,
          icon: FileText,
          iconClass:
            'bg-success/10 text-success',
        },
        {
          label:
            'Emergency Overrides',
          value:
            summary.emergencyOverrides,
          icon: Activity,
          iconClass:
            'bg-urgent/10 text-urgent-foreground',
        },
      ]
    : [];

  return (
    <div className="space-y-7 pb-10">

      {/* Page Header */}
      <PageHeader
        eyebrow="Administration"
        icon={Shield}
        title="Admin Overview"
        description="Monitor Care4U activity, review system-level indicators, and quickly access administrative tools."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                Accounts
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  totalAccounts.toLocaleString()
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Role Groups
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  roleCounts.length
                }
              </p>

            </div>

          </div>
        }
      />

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {cards.map(
          (
            card
          ) => {
            const Icon =
              card.icon;

            return (
              <Card
                key={
                  card.label
                }
                className="h-full"
              >

                <div className="h-full flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {
                        card.label
                      }
                    </p>

                    <p className="text-3xl sm:text-4xl font-extrabold text-foreground mt-3 tracking-[-0.03em]">
                      {Number(
                        card.value || 0
                      ).toLocaleString()}
                    </p>

                  </div>

                  <div
                    className={`
                      w-11 h-11
                      rounded-xl
                      flex items-center justify-center
                      shrink-0
                      ${card.iconClass}
                    `}
                  >
                    <Icon
                      size={20}
                      strokeWidth={2}
                    />
                  </div>

                </div>

              </Card>
            );
          }
        )}

      </div>

      {/* Bar chart */}
      <Card
        title="Users by Role"
      >

        {roleCounts.length ===
        0 ? (

          <div className="py-10 text-center">

            <Users
              className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3"
            />

            <p className="text-sm font-medium text-muted-foreground">
              No user role data available.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {roleCounts.map(
              (
                role
              ) => {
                const count =
                  Number(
                    role.count
                  ) || 0;

                const width =
                  Math.max(
                    (
                      count /
                      maxCount
                    ) *
                      100,
                    8
                  );

                return (
                  <div
                    key={
                      role.role
                    }
                    className="
                      rounded-xl
                      bg-secondary/45
                      p-4
                    "
                  >

                    <div className="flex items-center justify-between gap-3 mb-2.5">

                      <p
                        className="text-sm font-semibold text-foreground truncate"
                        title={
                          ROLE_LABELS[
                            role.role
                          ] ||
                          role.role
                        }
                      >
                        {ROLE_LABELS[
                          role.role
                        ] ||
                          role.role}
                      </p>

                      <span className="text-sm font-bold text-primary shrink-0">
                        {
                          count.toLocaleString()
                        }
                      </span>

                    </div>

                    <div className="h-2.5 rounded-full bg-card overflow-hidden">

                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                        style={{
                          width:
                            `${width}%`
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </Card>

      {/* Quick links */}
      <Card
        title="Quick Access"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">

          {QUICK_LINKS.map(
            (
              link
            ) => {
              const Icon =
                link.icon;

              const isEmergency =
                link.to ===
                '/admin/emergency-oversight';

              return (
                <button
                  key={
                    link.to
                  }
                  type="button"
                  onClick={() =>
                    navigate(
                      link.to
                    )
                  }
                  className="
                    group
                    w-full
                    flex items-center
                    gap-3
                    text-left
                    rounded-xl
                    bg-secondary/45
                    p-4
                    transition-colors
                    hover:bg-secondary/70
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary
                  "
                >

                  <div
                    className={`
                      w-10 h-10
                      rounded-xl
                      flex items-center justify-center
                      shrink-0
                      transition-colors
                      ${
                        isEmergency
                          ? 'bg-urgent/10 text-urgent-foreground'
                          : 'bg-module-soft text-primary'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {
                        link.label
                      }
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Open admin tool
                    </p>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </Card>

    </div>
  );
};

export default AdminOverviewPage;