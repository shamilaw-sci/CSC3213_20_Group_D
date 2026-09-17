/**
 * @file    AdminAnalyticsPage.jsx
 * @module  Admin
 * @desc    Anonymized aggregate analytics dashboard - counts only,
 *          no per-patient identifiable breakdowns.
 */

import { API_BASE_URL } from '../../services/api';

import { useEffect, useState } from 'react';

import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Users,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;

const AdminAnalyticsPage = () => {
  const [
    summary,
    setSummary
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/admin/analytics`,
          {
            credentials: 'include',
          }
        );

        const data =
          await res.json();

        if (!data.success) {
          setError(
            data.message ||
            'Failed to load analytics'
          );

          return;
        }

        setSummary(
          data.data
        );
      } catch (err) {
        console.error(
          'Fetch analytics error:',
          err
        );

        setError(
          'Could not connect to the server.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading system analytics...
        </p>

      </div>
    );
  }

  // Mapped specifically to standard design tokens and semantic icons
  const cards = summary
    ? [
        {
          label: 'Total Patients',
          value:
            summary.totalPatients,
          icon: Users,
          iconClass:
            'bg-module-soft text-primary',
          description:
            'Registered patient profiles',
        },
        {
          label:
            'Appointments This Month',
          value:
            summary.appointmentsThisMonth,
          icon: CalendarCheck,
          iconClass:
            'bg-module-soft text-primary',
          description:
            'Appointments recorded this month',
        },
        {
          label:
            'Prescriptions Issued',
          value:
            summary.prescriptionsIssued,
          icon: FileText,
          iconClass:
            'bg-success/10 text-success',
          description:
            'Prescription records issued',
        },
        {
          label:
            'Emergency Overrides',
          value:
            summary.emergencyOverrides,
          icon: AlertTriangle,
          iconClass:
            'bg-urgent/10 text-urgent-foreground',
          description:
            'Audited Break-the-Glass events',
        },
      ]
    : [];

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={BarChart3}
        title="Analytics Dashboard"
        description="Review high-level Care4U activity using anonymized aggregate counts without exposing patient-level identifiable information."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              <ShieldCheck
                size={18}
              />

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Privacy Mode
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                Aggregate Only
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

      {summary && (
        <>
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

                    <div className="h-full flex flex-col justify-between gap-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            {
                              card.label
                            }
                          </p>

                          <p className="text-3xl sm:text-4xl font-extrabold text-foreground mt-3 tracking-[-0.03em]">
                            {Number(
                              card.value ||
                              0
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

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {
                          card.description
                        }
                      </p>

                    </div>

                  </Card>
                );
              }
            )}

          </div>

          <Card
            title={
              <span className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-primary"
                />
                Analytics Privacy Safeguard
              </span>
            }
          >

            <div className="rounded-xl bg-secondary/45 p-4">

              <p className="text-sm font-semibold text-foreground">
                Aggregate counts only
              </p>

              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-3xl">
                This admin analytics view intentionally avoids per-patient identifiable breakdowns. It presents only system-level counts required for operational oversight.
              </p>

            </div>

          </Card>
        </>
      )}

    </div>
  );
};

export default AdminAnalyticsPage;