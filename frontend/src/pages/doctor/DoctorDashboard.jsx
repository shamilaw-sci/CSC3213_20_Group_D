/**
 * @file    DoctorDashboard.jsx
 * @module  Doctor
 * @desc    Doctor dashboard page showing summary stats, next patient,
 *          AI insights, and quick links.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, statsRes, insightsRes] = await Promise.all([
          fetch(`${API_URL}/api/doctors/${DOCTOR_ID}`),
          fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/dashboard-stats`),
          fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/ai-insights`),
        ]);
        const docData = await docRes.json();
        const statsData = await statsRes.json();
        const insightsData = await insightsRes.json();
        setDoctor(docData.data);
        setStats(statsData.data);
        setInsights(insightsData.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(true);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Failed to load dashboard. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome, {doctor?.full_name || 'Doctor'}
        </h1>
        <p className="text-sm text-slate-500">
          {doctor?.specialization} — {doctor?.hospital_name}
        </p>
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
    </div>
  );
};

export default DoctorDashboard;