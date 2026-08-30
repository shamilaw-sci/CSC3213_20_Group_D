/**
 * @file    AdminAnalyticsPage.jsx
 * @module  Admin
 * @desc    Anonymized aggregate analytics dashboard - counts only,
 *          no per-patient identifiable breakdowns.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const cards = summary ? [
    { label: 'Total Patients', value: summary.totalPatients, color: 'bg-blue-50 text-blue-700' },
    { label: 'Appointments This Month', value: summary.appointmentsThisMonth, color: 'bg-green-50 text-green-700' },
    { label: 'Prescriptions Issued', value: summary.prescriptionsIssued, color: 'bg-purple-50 text-purple-700' },
    { label: 'Emergency Overrides', value: summary.emergencyOverrides, color: 'bg-red-50 text-red-700' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
        <p className="text-sm text-slate-500">
          Aggregate counts only — no personally identifiable data is shown, per policy.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-lg shadow p-6 ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-4xl font-bold mt-2">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;