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
  LogOut,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import useAuthStore from '../../store/authStore';

const API_URL = 'http://localhost:5000';

const PRIORITY_MAPPING = {
  stat: 'severe',     // Maps to severe severity in Badge
  urgent: 'moderate', // Maps to moderate severity in Badge
  routine: 'mild',    // Maps to mild severity in Badge
  normal: 'mild',     // Maps to mild severity in Badge
};

const DoctorDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);

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

  /**
   * Logs the doctor out by destroying the backend session,
   * clearing the frontend auth state, and returning to login.
   */
  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Logout failed');
      }

      clearUser();
      navigate('/login');

    } catch (err) {
      console.error('Logout error:', err);
      setError(true);
    }
  };

  const handleMarkReviewed = async (reportId) => {
    const remark = (remarks[reportId] || '').trim();

    if (!remark) {
      setReviewError(
        'Please add a short remark before marking as reviewed.'
      );
      return;
    }

    setReviewingId(reportId);
    setReviewError('');

    try {
      const res = await fetch(
        `${API_URL}/api/doctors/lab-reports/${reportId}/review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ remark }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.message ||
          'Failed to mark report as reviewed'
        );
      }

      setUnreviewedReports(
        (prev) =>
          prev.filter(
            (r) => r.id !== reportId
          )
      );

    } catch (err) {
      console.error(
        'Review lab report error:',
        err
      );

      setReviewError(
        'Failed to save. Please try again.'
      );

    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-destructive font-semibold">
          Failed to load dashboard. Please try again later.
        </p>
      </div>
    );
  }

  const unreviewedCount =
    unreviewedReports.length;

  const STAT_CARDS = [
    {
      key: 'total',
      label: "Today's Total",
      value: stats?.total ?? 0,
      icon: Users,
      color: 'text-foreground',
      iconBg: 'bg-secondary',
      iconColor: 'text-muted-foreground'
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'text-urgent-foreground',
      iconBg: 'bg-urgent/10',
      iconColor: 'text-urgent-foreground'
    },
    {
      key: 'inProgress',
      label: 'In Progress',
      value: stats?.inProgress ?? 0,
      icon: Activity,
      color: 'text-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    {
      key: 'completed',
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-success',
      iconBg: 'bg-success/10',
      iconColor: 'text-success'
    },
  ];

  const QUICK_LINKS = [
    {
      label: 'Appointment Queue',
      desc: "View today's patients",
      icon: CalendarClock,
      path: '/doctor/queue'
    },
    {
      label: 'My Profile',
      desc: 'Update your details',
      icon: UserRound,
      path: '/doctor/profile'
    },
    {
      label: 'Issue Prescription',
      desc: 'Create digital prescription',
      icon: ClipboardList,
      path: '/doctor/issue-prescription'
    },
  ];

  const initials = (
    doctor?.full_name || 'Dr'
  )
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 p-6">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between bg-brand-deep rounded-xl shadow-md p-6">

        <div className="flex items-center gap-4">

          {doctor?.photo_url ? (
            <img
              src={doctor.photo_url}
              alt="Doctor profile"
              className="hidden sm:block h-14 w-14 shrink-0 rounded-full object-cover border border-white/20 shadow-sm"
            />
          ) : (
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/20 text-brand-deep-foreground font-bold text-lg">
              {initials}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-brand-deep-foreground">
              Welcome, {doctor?.full_name || 'Doctor'}
            </h1>

            <div className="flex items-center gap-2 mt-1.5">

              <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-brand-deep-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                <Stethoscope size={12} />
                {doctor?.specialization || 'Doctor'}
              </span>

              <span className="text-sm font-medium text-brand-deep-foreground opacity-80">
                {doctor?.hospital_name}
              </span>

            </div>
          </div>

        </div>

        {/* Header actions */}
        <div className="flex items-center gap-3">

          {/* Lab report notification badge */}
          <button
            onClick={() =>
              setShowLabModal(true)
            }
            className="group relative flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 hover:bg-white/20 transition-all duration-150 cursor-pointer"
          >
            <FileText
              size={16}
              className="text-brand-deep-foreground opacity-90 group-hover:opacity-100 transition-opacity"
            />

            <span className="text-sm font-semibold text-brand-deep-foreground opacity-90 group-hover:opacity-100 transition-opacity">
              Lab Reports
            </span>

            {unreviewedCount > 0 && (
              <span className="flex items-center justify-center min-w-5.5 h-5.5 px-1 rounded-full bg-urgent text-urgent-foreground text-xs font-bold shadow-sm">
                {unreviewedCount}
              </span>
            )}

          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 hover:bg-white/20 transition-all duration-150 cursor-pointer"
          >
            <LogOut
              size={16}
              className="text-brand-deep-foreground opacity-90 group-hover:opacity-100 transition-opacity"
            />

            <span className="text-sm font-semibold text-brand-deep-foreground opacity-90 group-hover:opacity-100 transition-opacity">
              Logout
            </span>
          </button>

        </div>

      </div>

      {/* Stats Cards */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Today's Overview
      </p>

      <div className="grid grid-cols-2 gap-6 mb-8 sm:grid-cols-4">

        {STAT_CARDS.map(
          ({
            key,
            label,
            value,
            icon,
            color,
            iconBg,
            iconColor
          }) => (

            <div
              key={key}
              className="group bg-card relative overflow-hidden rounded-xl shadow-sm border border-border p-6 flex items-start justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
            >

              {/* Premium UI Polish */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary/30" />

              <div className="relative z-10">
                <p className="text-sm font-semibold text-muted-foreground">
                  {label}
                </p>

                <p className={`text-3xl font-bold mt-1 ${color}`}>
                  {value}
                </p>
              </div>

              <div
                className={`${iconBg} ${iconColor} rounded-lg p-2.5 transition-transform duration-150 group-hover:scale-110 relative z-10`}
              >
                {createElement(
                  icon,
                  { size: 20 }
                )}
              </div>

            </div>
          )
        )}

      </div>

      {/* Next Patient + AI Insights */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">

        {/* Next Patient Card */}
        <div className="bg-card relative overflow-hidden rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow duration-150">

          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary/30" />

          <div className="flex items-center gap-2 mb-4 relative z-10">

            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <CalendarClock size={16} />
            </span>

            <h2 className="text-lg font-bold text-foreground">
              Next Patient
            </h2>

          </div>

          <div className="relative z-10">

            {stats?.nextPatient ? (

              <div>
                <p className="text-xl font-bold text-foreground">
                  {stats.nextPatient.patient_name}
                </p>

                <p className="text-sm font-medium text-muted-foreground mt-1 bg-secondary inline-block px-2 py-1 rounded-md">
                  {new Date(
                    stats.nextPatient.scheduled_at
                  ).toLocaleTimeString()}
                  {' — '}
                  {stats.nextPatient.type?.toUpperCase()}
                </p>
              </div>

            ) : (

              <p className="text-muted-foreground font-medium">
                No upcoming patients scheduled for today.
              </p>

            )}

          </div>

        </div>

        {/* AI Insights Card */}
        <div className="bg-card relative overflow-hidden rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow duration-150">

          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary/30" />

          <div className="flex items-center gap-2 mb-4 relative z-10">

            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <Sparkles size={16} />
            </span>

            <h2 className="text-lg font-bold text-foreground">
              AI Insights
            </h2>

          </div>

          <div className="relative z-10">

            {insights?.insights &&
            insights.insights.length > 0 ? (

              <ul className="space-y-2">

                {insights.insights.map(
                  (item, idx) => (

                    <li
                      key={idx}
                      className="text-sm font-medium text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-primary mt-1">
                        •
                      </span>

                      {item}
                    </li>

                  )
                )}

              </ul>

            ) : (

              <p className="text-muted-foreground font-medium">
                {insights?.note ||
                  'No insights available yet.'}
              </p>

            )}

          </div>

        </div>

      </div>

      {/* Quick Links */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Quick Actions
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {QUICK_LINKS.map(
          ({
            label,
            desc,
            icon,
            path
          }) => (

            <button
              key={label}
              onClick={() =>
                navigate(path)
              }
              className="group bg-card rounded-xl shadow-sm border border-border p-6 text-left hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50 transition-all duration-150 flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >

              <div className="bg-primary/10 text-primary rounded-lg p-3 shrink-0 transition-colors duration-150 group-hover:bg-primary group-hover:text-primary-foreground">

                {createElement(
                  icon,
                  { size: 22 }
                )}

              </div>

              <div className="flex-1">
                <p className="text-base font-bold text-foreground">
                  {label}
                </p>

                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                  {desc}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="text-muted-foreground transition-all duration-150 group-hover:text-primary group-hover:translate-x-1"
              />

            </button>

          )
        )}

      </div>

      {/* Lab Report Review Modal (Using the unified Modal component) */}
      <Modal
        isOpen={showLabModal}
        onClose={() =>
          setShowLabModal(false)
        }
        title={`Unreviewed Lab Reports ${
          unreviewedCount > 0
            ? `(${unreviewedCount})`
            : ''
        }`}
        size="lg"
      >

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">

          {reviewError && (
            <Alert
              type="error"
              message={reviewError}
            />
          )}

          {unreviewedReports.length === 0 ? (

            <div className="text-center py-10 flex flex-col items-center">

              <CheckCircle2
                className="text-success mb-3"
                size={36}
              />

              <p className="text-muted-foreground font-medium">
                All caught up — no unreviewed lab reports.
              </p>

            </div>

          ) : (

            unreviewedReports.map(
              (report) => (

                <div
                  key={report.id}
                  className="border border-border bg-secondary/30 rounded-lg p-4"
                >

                  <div className="flex items-start justify-between mb-3">

                    <div>
                      <p className="font-bold text-foreground">
                        {report.patient_name}
                      </p>

                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {report.test_type}
                      </p>
                    </div>

                    <Badge
                      severity={
                        PRIORITY_MAPPING[
                          report.priority
                        ] || 'mild'
                      }
                      label={report.priority}
                    />

                  </div>

                  <div className="bg-card border border-border rounded-lg p-3 mb-4">

                    <p className="text-sm font-medium text-foreground">
                      {report.findings}
                    </p>

                  </div>

                  {report.report_url && (

                    <a
                      href={report.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline mb-4 inline-block"
                    >
                      View full report
                    </a>

                  )}

                  <div className="flex items-end gap-3 mt-2">

                    <div className="flex-1">

                      <Input
                        label=""
                        value={
                          remarks[
                            report.id
                          ] || ''
                        }
                        onChange={(e) =>
                          setRemarks(
                            (prev) => ({
                              ...prev,
                              [report.id]:
                                e.target.value
                            })
                          )
                        }
                        placeholder="Add a remark before marking reviewed..."
                      />

                    </div>

                    <Button
                      onClick={() =>
                        handleMarkReviewed(
                          report.id
                        )
                      }
                      loading={
                        reviewingId ===
                        report.id
                      }
                      variant="primary"
                      className="whitespace-nowrap"
                    >
                      Mark Reviewed
                    </Button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </Modal>

    </div>
  );
};

export default DoctorDashboard;