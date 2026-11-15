/**
 * @file    AppointmentQueuePage.jsx
 * @module  Doctor
 * @desc    Today's appointment queue for the doctor.
 *          Shows all patients scheduled for today with
 *          streamlined consultation workflow actions.
 *
 *          Scheduled and checked-in waiting appointments
 *          can be started, in-progress consultations can
 *          be resumed, and completed consultations can be
 *          reviewed through the central Consultation Workspace.
 *
 *          Auto-refreshes in the background so the doctor
 *          never has to manually reload to see queue changes.
 *
 * @author  Tharindu (S/21/166)
 */

import { API_BASE_URL } from '../../services/api';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import toast from 'react-hot-toast';

import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  History,
  LayoutDashboard,
  Play,
  RefreshCw,
  UserRound,
  XCircle,
} from 'lucide-react';

import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';

import useAuthStore from '../../store/authStore';

const API_URL = API_BASE_URL;

/**
 * Queue polling interval.
 *
 * Updates today's appointments quietly in the
 * background without flashing the loading screen.
 */
const AUTO_REFRESH_INTERVAL_MS =
  20000;

/**
 * Converts a patient's full name into initials
 * for the fallback avatar.
 *
 * Example:
 * "Nimasha Perera" -> "NP"
 */
const getInitials = (
  name
) => {

  if (!name) {
    return '?';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
          .toUpperCase()
    )
    .join('');
};

/**
 * Formats an appointment time for quick
 * scanning inside the queue.
 */
const formatAppointmentTime = (
  value
) => {

  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleTimeString(
    [],
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  );
};

/**
 * Main doctor appointment queue.
 */
const AppointmentQueuePage = () => {

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  // Use the signed-in doctor profile as the queue scope; backend permission checks remain authoritative.
  const DOCTOR_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const navigate =
    useNavigate();

  /* =========================================================
     QUEUE STATE
  ========================================================= */

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    queueError,
    setQueueError,
  ] = useState('');

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    appointmentToCancel,
    setAppointmentToCancel,
  ] = useState(null);

  /**
   * Loads today's doctor appointments.
   *
   * silent=true is used during background polling
   * so the queue does not flash a loading screen.
   */
  const fetchAppointments =
    useCallback(
      async ({
        silent = false,
      } = {}) => {

        if (!DOCTOR_ID) {
          return;
        }

        try {

          if (!silent) {
            setLoading(
              true
            );
          } else {
            setRefreshing(
              true
            );
          }

          setQueueError(
            ''
          );

          const response =
            await fetch(
              `${API_URL}/api/doctors/${DOCTOR_ID}/appointments/today`,
              {
                credentials:
                  'include',
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
              'Failed to load appointment queue.'
            );
          }

          setAppointments(
            result.data ||
            []
          );

        } catch (error) {

          console.error(
            'Queue fetch error:',
            error
          );

          /**
           * Background polling failures should not
           * replace already visible queue information.
           */
          if (!silent) {
            setQueueError(
              error.message ||
              'Unable to load today\'s appointment queue.'
            );
          }

        } finally {

          if (!silent) {
            setLoading(
              false
            );
          } else {
            setRefreshing(
              false
            );
          }
        }
      },
      [DOCTOR_ID]
    );

  /**
   * Initial queue load and automatic background refresh.
   */
  useEffect(() => {

    fetchAppointments();

    // Refresh the doctor queue automatically and clear the timer when the page unmounts.
    const intervalId =
      setInterval(
        () => {

          fetchAppointments({
            silent: true,
          });

        },
        AUTO_REFRESH_INTERVAL_MS
      );

    return () =>
      clearInterval(
        intervalId
      );

  }, [fetchAppointments]);

  /* =========================================================
     APPOINTMENT STATUS MANAGEMENT
  ========================================================= */

  /**
   * Updates an appointment status and refreshes
   * the queue afterward.
   *
   * Used primarily for cancellation from the queue.
   */
  const updateStatus =
    async (
      appointmentId,
      newStatus
    ) => {

      if (
        !appointmentId ||
        !newStatus
      ) {
        return;
      }

      try {

        setUpdatingId(
          appointmentId
        );

        const response =
          await fetch(
            `${API_URL}/api/appointments/${appointmentId}/status`,
            {
              method:
                'PUT',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  status:
                    newStatus,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            'Failed to update appointment status.'
          );
        }

        await fetchAppointments({
          silent: true,
        });

        if (
          newStatus ===
          'cancelled'
        ) {
          toast.success(
            'Appointment cancelled successfully.'
          );
        }

      } catch (error) {

        console.error(
          'Status update error:',
          error
        );

        setQueueError(
          error.message ||
          'Unable to update appointment status.'
        );

      } finally {

        setUpdatingId(
          null
        );
      }
    };

  /**
   * Opens the central Consultation Workspace.
   *
   * The workspace reloads all required context from
   * the appointment ID, allowing both resume and
   * completed-consultation review flows.
   */
  const openConsultation =
    (
      appointmentId
    ) => {

      if (!appointmentId) {
        return;
      }

      navigate(
        `/doctor/consultation/${appointmentId}`
      );
    };

  /**
   * Starts a scheduled or waiting appointment.
   *
   * The appointment is first moved to in_progress
   * and then opened directly in the Consultation
   * Workspace.
   */
  const startConsultation =
    async (
      appointmentId
    ) => {

      if (!appointmentId) {
        return;
      }

      try {

        setUpdatingId(
          appointmentId
        );

        setQueueError(
          ''
        );

        const response =
          await fetch(
            `${API_URL}/api/appointments/${appointmentId}/status`,
            {
              method:
                'PUT',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  status:
                    'in_progress',
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            'Failed to start consultation.'
          );
        }

        navigate(
          `/doctor/consultation/${appointmentId}`
        );

      } catch (error) {

        console.error(
          'Start consultation error:',
          error
        );

        setQueueError(
          error.message ||
          'Unable to start consultation.'
        );

      } finally {

        setUpdatingId(
          null
        );
      }
    };

  /* =========================================================
     DERIVED QUEUE SUMMARY
  ========================================================= */

  // Count each queue status from the current appointment list for the summary badges.
  const scheduledCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        'scheduled'
    ).length;

  const waitingCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        'confirmed'
    ).length;

  // Count active consultations separately from scheduled and completed visits.
  const inProgressCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        'in_progress'
    ).length;

  const completedCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        'completed'
    ).length;

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#F6F8FA]">

        <Spinner
          size="lg"
        />

        <div className="text-center">

          <p className="text-sm font-bold text-foreground">
            Loading today&apos;s patient queue
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Preparing the latest appointment and consultation status.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA]">

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-10">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <PageHeader
          eyebrow="Doctor Portal"
          icon={ClipboardList}
          title="Today's Appointment Queue"
          description="Move each patient smoothly from waiting to consultation, completion, or clinical review."
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

              <button
                type="button"
                onClick={() =>
                  fetchAppointments({
                    silent: true,
                  })
                }
                disabled={
                  refreshing
                }
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh Queue'}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/doctor/dashboard'
                  )
                }
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <LayoutDashboard
                  size={16}
                />

                Dashboard
              </button>

            </div>
          }
          meta={
            <div className="flex items-center gap-5">

              <div>

                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-primary">
                  Today&apos;s Queue
                </p>

                <p className="text-2xl font-extrabold text-foreground mt-0.5 leading-none">
                  {appointments.length}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  total appointments
                </p>

              </div>

              <div className="w-px h-11 bg-border" />

              <div>

                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
                  Live Updates
                </p>

                <p className="text-sm font-bold text-foreground mt-1">
                  Every 20 sec
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatic refresh
                </p>

              </div>

            </div>
          }
        />

        {/* =====================================================
            QUEUE SUMMARY
        ====================================================== */}
        <section className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.045)] overflow-hidden">

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-200/80">

            <div className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                Scheduled
              </p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-2xl font-extrabold text-slate-900">
                  {scheduledCount}
                </p>
                <span className="mb-1.5 w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Upcoming visits
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                Waiting
              </p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-2xl font-extrabold text-slate-900">
                  {waitingCount}
                </p>
                <span className="mb-1.5 w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ready to be seen
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                In Progress
              </p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-2xl font-extrabold text-primary">
                  {inProgressCount}
                </p>
                <span className="mb-1.5 w-2 h-2 rounded-full bg-primary" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active consultations
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400">
                Completed
              </p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-2xl font-extrabold text-emerald-600">
                  {completedCount}
                </p>
                <span className="mb-1.5 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Finished today
              </p>
            </div>

          </div>

        </section>

        {/* =====================================================
            QUEUE ERROR
        ====================================================== */}
        {queueError && (

          <Alert
            type="error"
            message={
              queueError
            }
          />

        )}

        {/* =====================================================
            QUEUE LIST
        ====================================================== */}
        <section>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-primary">
                Patient Flow
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Today&apos;s Visits
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Patient identity, visit time, current status, and the next available action in one place.
              </p>
            </div>

            {refreshing && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <RefreshCw size={13} className="animate-spin" />
                Updating queue
              </div>
            )}

          </div>

          {appointments.length ===
          0 ? (

            <Card className="border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">

              <div className="flex flex-col items-center justify-center text-center py-14 px-4">

                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 size={29} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  You&apos;re all caught up
                </h2>

                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                  There are no patients in today&apos;s appointment queue right now.
                </p>

                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5"
                  onClick={() =>
                    navigate(
                      '/doctor/dashboard'
                    )
                  }
                >
                  Return to Dashboard
                </Button>

              </div>

            </Card>

          ) : (

            <div className="space-y-3">

              {appointments.map(
                (appt) => {

                  const isUpdating =
                    updatingId ===
                    appt.id;

                  const isScheduled =
                    appt.status ===
                    'scheduled';

                  const isWaiting =
                    appt.status ===
                    'confirmed';

                  const canStartConsultation =
                    isScheduled ||
                    isWaiting;

                  const isInProgress =
                    appt.status ===
                    'in_progress';

                  const isCompleted =
                    appt.status ===
                    'completed';

                  const isCancelled =
                    appt.status ===
                    'cancelled';

                  const accentClass =
                    isInProgress
                      ? 'bg-primary'
                      : isCompleted
                        ? 'bg-emerald-500'
                        : isCancelled
                          ? 'bg-rose-400'
                          : isWaiting
                            ? 'bg-amber-400'
                            : 'bg-blue-400';

                  const workflowText =
                    isInProgress
                      ? 'Consultation is currently in progress. Resume the workspace to continue clinical documentation.'
                      : isCompleted
                        ? 'Consultation completed. The visit remains available for clinical review.'
                        : isCancelled
                          ? 'Appointment cancelled. It remains visible for today’s clinical context.'
                          : isWaiting
                            ? 'Patient is checked in and ready to move into the consultation workflow.'
                            : 'Patient is scheduled and ready to begin when appropriate.';

                  return (
                    <article
                      key={appt.id}
                      className={`relative overflow-hidden rounded-2xl border bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-all hover:shadow-[0_12px_34px_rgba(15,23,42,0.07)] ${
                        isInProgress
                          ? 'border-primary/30 ring-1 ring-primary/5'
                          : 'border-slate-200/80'
                      }`}
                    >

                      <div className={`absolute inset-y-0 left-0 w-1 ${accentClass}`} />

                      <div className="p-4 sm:p-5 lg:p-6 pl-5 sm:pl-6 lg:pl-7">

                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">

                            <div className="w-[74px] shrink-0 text-center">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5">
                                <Clock size={13} className="text-primary mx-auto" />
                                <p className="text-sm font-extrabold text-slate-900 mt-1">
                                  {formatAppointmentTime(
                                    appt.scheduled_at
                                  )}
                                </p>
                              </div>
                            </div>

                            {appt.patient_photo_url ? (
                              <img
                                src={appt.patient_photo_url}
                                alt={appt.patient_name || 'Patient'}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-slate-200 shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ring-4 ring-white shadow-sm ${
                                  isInProgress
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-blue-50 text-primary'
                                }`}
                              >
                                {getInitials(
                                  appt.patient_name
                                )}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                                  {appt.patient_name}
                                </h3>
                                <Badge status={appt.status} />
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                                  <UserRound size={11} />
                                  {appt.type?.toUpperCase() || 'VISIT'}
                                </span>

                                {isInProgress && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/8 border border-primary/15 rounded-full px-2.5 py-1">
                                    <ClipboardCheck size={11} />
                                    Active consultation
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start gap-2 mt-3 max-w-2xl">
                                {isCompleted ? (
                                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                ) : isCancelled ? (
                                  <XCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                ) : isInProgress ? (
                                  <ClipboardCheck size={14} className="text-primary shrink-0 mt-0.5" />
                                ) : (
                                  <Clock size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                )}

                                <p className={`text-xs leading-relaxed ${
                                  isCompleted
                                    ? 'text-emerald-700'
                                    : isInProgress
                                      ? 'text-primary'
                                      : 'text-slate-500'
                                }`}>
                                  {workflowText}
                                </p>
                              </div>

                            </div>

                          </div>

                          <div className="flex flex-col sm:flex-row xl:justify-end gap-2 w-full xl:w-auto shrink-0">

                            {canStartConsultation && (
                              <Button
                                type="button"
                                variant="primary"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  startConsultation(
                                    appt.id
                                  )
                                }
                                disabled={isUpdating}
                                loading={isUpdating}
                              >
                                <Play size={15} className="mr-2" />
                                {isUpdating
                                  ? 'Starting...'
                                  : 'Start Consultation'}
                              </Button>
                            )}

                            {isInProgress && (
                              <Button
                                type="button"
                                variant="primary"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  openConsultation(
                                    appt.id
                                  )
                                }
                                disabled={isUpdating}
                              >
                                <ClipboardCheck size={15} className="mr-2" />
                                Resume Consultation
                              </Button>
                            )}

                            {isCompleted && (
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  openConsultation(
                                    appt.id
                                  )
                                }
                                disabled={isUpdating}
                              >
                                <History size={15} className="mr-2" />
                                View Consultation
                              </Button>
                            )}

                            {(isScheduled ||
                              isWaiting ||
                              isInProgress) && (
                              <Button
                                type="button"
                                variant="danger"
                                className="w-full sm:w-auto"
                                onClick={() =>
                                  setAppointmentToCancel(
                                    appt
                                  )
                                }
                                disabled={isUpdating}
                              >
                                <XCircle size={15} className="mr-2" />
                                {isUpdating
                                  ? 'Updating...'
                                  : 'Cancel'}
                              </Button>
                            )}

                          </div>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            CANCELLATION CONFIRMATION
        ====================================================== */}
        <Modal
          isOpen={
            !!appointmentToCancel
          }
          onClose={() =>
            setAppointmentToCancel(
              null
            )
          }
          title="Cancel Appointment"
          size="sm"
        >

          <div className="space-y-5">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-foreground">
                  Cancel this appointment?
                </p>

                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {appointmentToCancel?.patient_name
                    ? `${appointmentToCancel.patient_name}'s appointment will be marked as cancelled and remain visible in today's queue for context.`
                    : 'This appointment will be marked as cancelled and remain visible in today’s queue for context.'}
                </p>
              </div>

            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">

              <Button
                type="button"
                variant="secondary"
                disabled={
                  updatingId ===
                    appointmentToCancel?.id
                }
                onClick={() =>
                  setAppointmentToCancel(
                    null
                  )
                }
              >
                Keep Appointment
              </Button>

              <Button
                type="button"
                variant="danger"
                loading={
                  updatingId ===
                    appointmentToCancel?.id
                }
                onClick={
                  async () => {

                    const appointmentId =
                      appointmentToCancel?.id;

                    if (!appointmentId) {
                      return;
                    }

                    await updateStatus(
                      appointmentId,
                      'cancelled'
                    );

                    setAppointmentToCancel(
                      null
                    );
                  }
                }
              >
                <XCircle
                  size={15}
                  className="mr-2"
                />

                Cancel Appointment
              </Button>

            </div>

          </div>

        </Modal>

      </main>

    </div>
  );
};

export default AppointmentQueuePage;
