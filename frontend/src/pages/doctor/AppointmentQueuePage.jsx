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

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  History,
  Play,
  XCircle,
} from 'lucide-react';

import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

import useAuthStore from '../../store/authStore';

const API_URL =
  'http://localhost:5000';

/**
 * Queue polling interval.
 *
 * Updates today's appointments quietly in the
 * background without flashing the loading screen.
 */
const AUTO_REFRESH_INTERVAL_MS =
  20000;

/**
 * Shared action button styling.
 *
 * Keeps all queue actions visually consistent while
 * allowing individual actions to apply their own colors.
 */
const ACTION_BTN =
  'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl backdrop-blur-sm border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2';

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
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">

        <div className="flex flex-col items-center gap-3">

          <Spinner
            size="lg"
          />

          <p className="text-sm font-medium text-muted-foreground">
            Loading today's queue...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7 bg-brand-deep rounded-2xl shadow-md p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">

              <ClipboardList
                className="text-brand-deep-foreground opacity-90"
                size={22}
              />

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-brand-deep-foreground/60">
                Doctor Workflow
              </p>

              <h1 className="text-xl sm:text-2xl font-bold text-brand-deep-foreground mt-0.5">
                Today's Appointment Queue
              </h1>

              <p className="text-sm font-medium text-brand-deep-foreground/75 mt-1">
                {appointments.length}{' '}
                appointment
                {appointments.length ===
                1
                  ? ''
                  : 's'}{' '}
                today
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/doctor/dashboard'
              )
            }
            className="flex items-center justify-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-deep-foreground hover:bg-white/20 transition-all duration-150"
          >

            <ArrowLeft
              size={16}
            />

            Back to Dashboard

          </button>

        </div>

        {/* =====================================================
            QUEUE ERROR
        ====================================================== */}
        {queueError && (

          <div className="mb-5 bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start justify-between gap-4">

            <div className="flex items-start gap-2">

              <XCircle
                size={17}
                className="text-destructive shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-semibold text-destructive">
                  Queue action failed
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  {queueError}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setQueueError(
                  ''
                )
              }
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>

          </div>

        )}

        {/* =====================================================
            APPOINTMENT LIST
        ====================================================== */}
        {appointments.length ===
        0 ? (

          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center flex flex-col items-center gap-3">

            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">

              <CheckCircle2
                className="text-success"
                size={28}
              />

            </div>

            <p className="text-foreground font-bold text-lg mt-1">
              You're all caught up!
            </p>

            <p className="text-muted-foreground text-sm font-medium">
              No patients are in today's queue right now.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/doctor/dashboard'
                )
              }
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Return to Dashboard
            </button>

          </div>

        ) : (

          <div className="space-y-4">

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

                return (
                  <div
                    key={
                      appt.id
                    }
                    className={`bg-card relative overflow-hidden rounded-2xl shadow-sm border p-5 sm:p-6 transition-all duration-150 ${
                      isInProgress
                        ? 'border-primary/30 shadow-md'
                        : 'border-border hover:shadow-md'
                    }`}
                  >

                    {/* Status accent */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1.5 ${
                        isInProgress
                          ? 'bg-primary'
                          : isCompleted
                            ? 'bg-success'
                            : isCancelled
                              ? 'bg-destructive/60'
                              : isWaiting
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-primary to-primary/30'
                      }`}
                    />

                    {/* Patient summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">

                      <div className="flex items-center gap-3 min-w-0">

                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isInProgress
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {getInitials(
                            appt.patient_name
                          )}
                        </div>

                        <div className="min-w-0">

                          <h3 className="text-lg font-bold text-foreground truncate">
                            {appt.patient_name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">

                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary rounded-full px-2.5 py-1">

                              <Clock
                                size={12}
                                className="text-muted-foreground"
                              />

                              {formatAppointmentTime(
                                appt.scheduled_at
                              )}

                            </span>

                            <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                              {appt.type
                                ?.toUpperCase() ||
                                'VISIT'}
                            </span>

                          </div>

                        </div>

                      </div>

                      <Badge
                        status={
                          appt.status
                        }
                      />

                    </div>

                    {/* =================================================
                        CONSULTATION WORKFLOW ACTIONS
                    ================================================== */}
                    <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border relative z-10">

                      {/* Scheduled / Waiting -> Start */}
                      {canStartConsultation && (

                        <button
                          type="button"
                          onClick={() =>
                            startConsultation(
                              appt.id
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className={`${ACTION_BTN} bg-primary text-primary-foreground border-primary hover:opacity-90 focus:ring-primary`}
                        >

                          <Play
                            size={15}
                          />

                          {isUpdating
                            ? 'Starting...'
                            : 'Start Consultation'}

                        </button>

                      )}

                      {/* In Progress -> Resume */}
                      {isInProgress && (

                        <button
                          type="button"
                          onClick={() =>
                            openConsultation(
                              appt.id
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className={`${ACTION_BTN} bg-primary text-primary-foreground border-primary hover:opacity-90 focus:ring-primary`}
                        >

                          <ClipboardCheck
                            size={15}
                          />

                          Resume Consultation

                        </button>

                      )}

                      {/* Completed -> Review */}
                      {isCompleted && (

                        <button
                          type="button"
                          onClick={() =>
                            openConsultation(
                              appt.id
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className={`${ACTION_BTN} bg-secondary text-primary border-primary/30 hover:bg-primary/10 focus:ring-primary`}
                        >

                          <History
                            size={15}
                          />

                          View Consultation

                        </button>

                      )}

                      {/* Cancel */}
                      {(isScheduled ||
                        isWaiting ||
                        isInProgress) && (

                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              appt.id,
                              'cancelled'
                            )
                          }
                          disabled={
                            isUpdating
                          }
                          className={`${ACTION_BTN} bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground focus:ring-destructive`}
                        >

                          <XCircle
                            size={15}
                          />

                          {isUpdating
                            ? 'Updating...'
                            : 'Cancel'}

                        </button>

                      )}

                      {/* Cancelled appointments are retained for context */}
                      {isCancelled && (

                        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-muted-foreground">
                          <XCircle
                            size={15}
                          />

                          Appointment Cancelled
                        </span>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </div>
  );
};

export default AppointmentQueuePage;