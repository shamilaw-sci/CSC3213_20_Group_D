/**
 * @file    DoctorDashboard.jsx
 * @module  Doctor
 * @desc    Doctor dashboard page showing summary stats, next patient,
 *          AI insights, quick links, and unreviewed lab report alerts.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';

const PRIORITY_STYLES = {
  stat: 'bg-red-100 text-red-700',
  urgent: 'bg-amber-100 text-amber-700',
  routine: 'bg-slate-100 text-slate-600',
  normal: 'bg-slate-100 text-slate-600',
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lab report review — busy-doctor UX: badge + inline modal, no page navigation
  const [unreviewedReports, setUnreviewedReports] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewError, setReviewError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [docRes, statsRes, insightsRes, labRes] = await Promise.all([
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}`),
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/dashboard-stats`),
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/ai-insights`),
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/unreviewed-lab-reports`),
      ]);
      const docData = await docRes.json();
      const statsData = await statsRes.json();
      const insightsData = await insightsRes.json();
      const labData = await labRes.json();

      setDoctor(docData.data);
      setStats(statsData.data);
      setInsights(insightsData.data);

      const reports = labData.data || [];
      setUnreviewedReports(reports);
      // Pre-fill a sensible default remark so most reports can be cleared in one click
      const defaults = {};
      reports.forEach((r) => {
        defaults[r.id] = 'Reviewed — no further action needed.';
      });
      setRemarks(defaults);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkReviewed = async (reportId) => {
    const remark = (remarks[reportId] || '').trim();
    if (!remark) {
      setReviewError('Please add a short remark before marking as reviewed.');
      return;
    }
    setReviewingId(reportId);
    setReviewError('');
    try {
      const res = await fetch(`${API_URL}/api/doctors/lab-reports/${reportId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to mark report as reviewed');
      }
      setUnreviewedReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Review lab report error:', err);
      setReviewError('Failed to save. Please try again.');
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Failed to load dashboard. Please try again later.</p>
      </div>
    );
  }

  const unreviewedCount = unreviewedReports.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome, {doctor?.full_name || 'Doctor'}
          </h1>
          <p className="text-sm text-slate-500">
            {doctor?.specialization} — {doctor?.hospital_name}
          </p>
        </div>

        {/* Lab report notification badge */}
        <button
          onClick={() => setShowLabModal(true)}
          className="relative flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2 hover:shadow-md transition-shadow"
        >
          <span className="text-sm font-medium text-slate-700">Lab Reports</span>
          {unreviewedCount > 0 && (
            <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full bg-red-600 text-white text-xs font-bold">
              {unreviewedCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6 mb-8 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Today's Total</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.inProgress ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats?.completed ?? 0}</p>
        </div>
      </div>

      {/* Next Patient + AI Insights */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Next Patient Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Next Patient</h2>
          {stats?.nextPatient ? (
            <div>
              <p className="text-xl font-semibold text-slate-800">
                {stats.nextPatient.patient_name}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(stats.nextPatient.scheduled_at).toLocaleTimeString()} — {stats.nextPatient.type?.toUpperCase()}
              </p>
            </div>
          ) : (
            <p className="text-slate-500">No upcoming patients scheduled for today.</p>
          )}
        </div>

        {/* AI Insights Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">AI Insights</h2>
          {insights?.insights && insights.insights.length > 0 ? (
            <ul className="space-y-2">
              {insights.insights.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-700">{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">{insights?.note || 'No insights available yet.'}</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate('/doctor/queue')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">Appointment Queue</p>
          <p className="text-sm text-slate-500 mt-1">View today's patients</p>
        </button>
        <button
          onClick={() => navigate('/doctor/profile')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">My Profile</p>
          <p className="text-sm text-slate-500 mt-1">Update your details</p>
        </button>
        <button
          onClick={() => navigate('/doctor/issue-prescription')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">Issue Prescription</p>
          <p className="text-sm text-slate-500 mt-1">Create digital prescription</p>
        </button>
      </div>

      {/* Lab Report Review Modal */}
      {showLabModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                Unreviewed Lab Reports {unreviewedCount > 0 && `(${unreviewedCount})`}
              </h2>
              <button
                onClick={() => setShowLabModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {reviewError && (
                <p className="text-sm text-red-600 bg-red-50 rounded p-2">{reviewError}</p>
              )}

              {unreviewedReports.length === 0 ? (
                <p className="text-slate-500 text-center py-8">All caught up — no unreviewed lab reports.</p>
              ) : (
                unreviewedReports.map((report) => (
                  <div key={report.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{report.patient_name}</p>
                        <p className="text-sm text-slate-500">{report.test_type}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.routine
                        }`}
                      >
                        {report.priority}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 rounded p-2 mb-3">
                      {report.findings}
                    </p>

                    {report.report_url && (
                      <a
                        href={report.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View full report
                      </a>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={remarks[report.id] || ''}
                        onChange={(e) =>
                          setRemarks((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                        placeholder="Remark (required)"
                      />
                      <button
                        onClick={() => handleMarkReviewed(report.id)}
                        disabled={reviewingId === report.id}
                        className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {reviewingId === report.id ? 'Saving...' : 'Mark Reviewed'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;