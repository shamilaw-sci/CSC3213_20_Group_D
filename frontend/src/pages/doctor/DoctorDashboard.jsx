/**
 * @file    DoctorDashboard.jsx
 * @module  Doctor
 * @desc    Doctor dashboard page showing summary stats, next patient,
 *          AI insights, quick links, and unreviewed lab report alerts.
 * @author  Tharindu (S/21/166)
 */

import { createElement, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Users,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
  UserRound,
  ClipboardList,
  Sparkles,
  CalendarClock,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import useAuthStore from '../../store/authStore';

const API_URL = 'http://localhost:5000';

const PRIORITY_STYLES = {
  stat: 'bg-red-100 text-red-700',
  urgent: 'bg-amber-100 text-amber-700',
  routine: 'bg-slate-100 text-slate-600',
  normal: 'bg-slate-100 text-slate-600',
};

const DoctorDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const DOCTOR_ID = user?.profile_id || user?.id || '';
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lab report review
  const [unreviewedReports, setUnreviewedReports] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewError, setReviewError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!DOCTOR_ID) return;
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
  }, [DOCTOR_ID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const STAT_CARDS = [
    { key: 'total', label: "Today's Total", value: stats?.total ?? 0, icon: Users, color: 'text-slate-800', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', ringColor: 'hover:border-slate-300', topBorder: 'border-t-slate-400' },
    { key: 'pending', label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-600', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', ringColor: 'hover:border-amber-300', topBorder: 'border-t-amber-500' },
    { key: 'inProgress', label: 'In Progress', value: stats?.inProgress ?? 0, icon: Activity, color: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-700', ringColor: 'hover:border-blue-300', topBorder: 'border-t-blue-700' },
    { key: 'completed', label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-teal-600', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', ringColor: 'hover:border-teal-300', topBorder: 'border-t-teal-600' },
  ];

  const QUICK_LINKS = [
    { label: 'Appointment Queue', desc: "View today's patients", icon: CalendarClock, path: '/doctor/queue' },
    { label: 'My Profile', desc: 'Update your details', icon: UserRound, path: '/doctor/profile' },
    { label: 'Issue Prescription', desc: 'Create digital prescription', icon: ClipboardList, path: '/doctor/issue-prescription' },
  ];

  const initials = (doctor?.full_name || 'Dr')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between bg-linear-to-r from-slate-900 to-blue-950 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white font-semibold text-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {doctor?.full_name || 'Doctor'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-100 text-xs font-medium px-2.5 py-1 rounded-full">
                <Stethoscope size={12} />
                {doctor?.specialization || 'Doctor'}
              </span>
              <span className="text-sm text-blue-200">{doctor?.hospital_name}</span>
            </div>
          </div>
        </div>

        {/* Lab report notification badge */}
        <button
          onClick={() => setShowLabModal(true)}
          className="group relative flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 hover:bg-white/20 hover:border-white/30 transition-all duration-150"
        >
          <FileText size={16} className="text-blue-100 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors">Lab Reports</span>
          {unreviewedCount > 0 && (
            <span className="flex items-center justify-center min-w-5.5 h-5.5 px-1 rounded-full bg-red-600 text-white text-xs font-bold">
              {unreviewedCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Today's Overview</p>
      <div className="grid grid-cols-2 gap-6 mb-8 sm:grid-cols-4">
        {STAT_CARDS.map(({ key, label, value, icon, color, iconBg, iconColor, ringColor, topBorder }) => (
          <div
            key={key}
            className={`group bg-white rounded-xl shadow-sm border border-slate-100 border-t-4 ${topBorder} p-6 flex items-start justify-between hover:shadow-lg hover:-translate-y-0.5 ${ringColor} transition-all duration-150`}
          >
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
            <div className={`${iconBg} ${iconColor} rounded-lg p-2.5 transition-transform duration-150 group-hover:scale-110`}>
              {createElement(icon, { size: 20 })}
            </div>
          </div>
        ))}
      </div>

      {/* Next Patient + AI Insights */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Next Patient Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-800 p-6 hover:shadow-lg transition-shadow duration-150">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={18} className="text-blue-800" />
            <h2 className="text-lg font-semibold text-slate-800">Next Patient</h2>
          </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-teal-600 p-6 hover:shadow-lg transition-shadow duration-150">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-800">AI Insights</h2>
          </div>
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
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map(({ label, desc, icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="group bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-left hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200 transition-all duration-150 flex items-center gap-4"
          >
            <div className="bg-blue-50 text-blue-800 rounded-lg p-3 shrink-0 transition-colors duration-150 group-hover:bg-blue-800 group-hover:text-white">
              {createElement(icon, { size: 22 })}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-800">{label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 transition-all duration-150 group-hover:text-blue-800 group-hover:translate-x-1" />
          </button>
        ))}
      </div>

      {/* Lab Report Review Modal */}
      {showLabModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-slate-900 to-blue-950">
              <h2 className="text-lg font-semibold text-white">
                Unreviewed Lab Reports {unreviewedCount > 0 && `(${unreviewedCount})`}
              </h2>
              <button
                onClick={() => setShowLabModal(false)}
                className="text-blue-200 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {reviewError && (
                <p className="text-sm text-red-600 bg-red-50 rounded p-2">{reviewError}</p>
              )}

              {unreviewedReports.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="mx-auto text-green-500 mb-2" size={36} />
                  <p className="text-slate-500">All caught up — no unreviewed lab reports.</p>
                </div>
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