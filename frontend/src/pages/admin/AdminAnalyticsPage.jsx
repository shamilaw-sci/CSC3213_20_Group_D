/**
 * @file    AdminAnalyticsPage.jsx
 * @module  Admin
 * @desc    Anonymized aggregate analytics dashboard - counts only,
 *          no per-patient identifiable breakdowns.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import { Users, CalendarCheck, FileText, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const AdminAnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/admin/analytics`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Failed to load analytics');
          return;
        }

        setSummary(data.data);
      } catch (err) {
        console.error('Fetch analytics error:', err);
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Mapped specifically to standard design tokens and semantic icons
  const cards = summary ? [
    { 
      label: 'Total Patients', 
      value: summary.totalPatients, 
      icon: Users,
      colorClass: 'text-primary bg-primary/10 border-primary/20' 
    },
    { 
      label: 'Appointments This Month', 
      value: summary.appointmentsThisMonth, 
      icon: CalendarCheck,
      colorClass: 'text-brand-deep bg-brand-deep/10 border-brand-deep/20' 
    },
    { 
      label: 'Prescriptions Issued', 
      value: summary.prescriptionsIssued, 
      icon: FileText,
      colorClass: 'text-success bg-success/10 border-success/20' 
    },
    { 
      label: 'Emergency Overrides', 
      value: summary.emergencyOverrides, 
      icon: AlertTriangle,
      colorClass: 'text-urgent-foreground bg-urgent/10 border-urgent/20' 
    },
  ] : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Aggregate counts only — no personally identifiable data is shown, per policy.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl border ${card.colorClass}`}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {card.label}
                    </p>
                    <p className="text-4xl font-bold text-foreground mt-1">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;