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
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm font-medium text-muted-foreground">
          Loading today&apos;s queue...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <PageHeader
        eyebrow="Doctor Portal"
        icon={ClipboardList}
        title="Today's Appointment Queue"
        description="Review today’s patient flow and move each visit through the consultation workflow."
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
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                w-full
                sm:w-auto
                px-4
                py-2.5
                rounded-xl
                bg-white/10
                border
                border-white/20
                text-white
                text-sm
                font-semibold
                backdrop-blur-sm
                hover:bg-white/15
                hover:border-white/30
                transition-all
                focus:outline-none
                focus:ring-2
                focus:ring-white/30
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
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
                : 'Refresh'}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/doctor/dashboard'
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                w-full
                sm:w-auto
                px-4
                py-2.5
                rounded-xl
                bg-white/10
                border
                border-white/20
                text-white
                text-sm
                font-semibold
                backdrop-blur-sm
                hover:bg-white/15
                hover:border-white/30
                transition-all
                focus:outline-none
                focus:ring-2
                focus:ring-white/30
              "
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

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Today
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  appointments.length
                }
              </p>

              <p className="text-xs text-muted-foreground mt-0.5">
                appointment
                {
                  appointments.length ===
                  1
                    ? ''
                    : 's'
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Auto Refresh
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                Every 20 sec
              </p>

            </div>

          </div>
        }
      />

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
          APPOINTMENT LIST
      ====================================================== */}
      {appointments.length ===
      0 ? (

        <Card>

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-4">

              <CheckCircle2
                size={28}
              />

            </div>

            <h2 className="text-lg font-bold text-foreground">
              You&apos;re all caught up
            </h2>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              No patients are in today&apos;s queue right now.
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
                <Card
                  key={
                    appt.id
                  }
                  className={`relative overflow-hidden ${
                    isInProgress
                      ? 'border-primary/30 shadow-md'
                      : ''
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
                              ? 'bg-urgent'
                              : 'bg-primary/45'
                    }`}
                  />

                  <div className="pt-2">

                    {/* Patient summary */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div className="flex items-center gap-4 min-w-0">

                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isInProgress
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-module-soft text-primary'
                          }`}
                        >
                          <span className="text-sm font-bold">
                            {getInitials(
                              appt.patient_name
                            )}
                          </span>
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                              {appt.patient_name}
                            </h3>

                            <Badge
                              status={
                                appt.status
                              }
                            />

                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">

                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary/60 rounded-full px-2.5 py-1">

                              <Clock
                                size={12}
                              />

                              {formatAppointmentTime(
                                appt.scheduled_at
                              )}

                            </span>

                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/60 rounded-full px-2.5 py-1">

                              <UserRound
                                size={12}
                              />

                              {appt.type
                                ?.toUpperCase() ||
                                'VISIT'}

                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="flex flex-col sm:flex-row lg:justify-end gap-2 w-full lg:w-auto">

                        {/* Scheduled / Waiting -> Start */}
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
                            disabled={
                              isUpdating
                            }
                            loading={
                              isUpdating
                            }
                          >
                            <Play
                              size={15}
                              className="mr-2"
                            />

                            {isUpdating
                              ? 'Starting...'
                              : 'Start Consultation'}

                          </Button>

                        )}

                        {/* In Progress -> Resume */}
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
                            disabled={
                              isUpdating
                            }
                          >
                            <ClipboardCheck
                              size={15}
                              className="mr-2"
                            />

                            Resume Consultation

                          </Button>

                        )}

                        {/* Completed -> Review */}
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
                            disabled={
                              isUpdating
                            }
                          >
                            <History
                              size={15}
                              className="mr-2"
                            />

                            View Consultation

                          </Button>

                        )}

                        {/* Cancel */}
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
                            disabled={
                              isUpdating
                            }
                          >
                            <XCircle
                              size={15}
                              className="mr-2"
                            />

                            {isUpdating
                              ? 'Updating...'
                              : 'Cancel'}

                          </Button>

                        )}

                      </div>

                    </div>

                    {/* Workflow summary */}
                    <div className="mt-5 pt-4 border-t border-border">

                      {isInProgress && (

                        <div className="flex items-start gap-2 text-xs text-primary">

                          <ClipboardCheck
                            size={14}
                            className="shrink-0 mt-0.5"
                          />

                          <p className="font-medium">
                            Consultation is currently in progress. Resume the workspace to continue documentation or prescribing.
                          </p>

                        </div>

                      )}

                      {isCompleted && (

                        <div className="flex items-start gap-2 text-xs text-success">

                          <CheckCircle2
                            size={14}
                            className="shrink-0 mt-0.5"
                          />

                          <p className="font-medium">
                            Consultation completed. The visit remains available for clinical review.
                          </p>

                        </div>

                      )}

                      {isCancelled && (

                        <div className="flex items-start gap-2 text-xs text-muted-foreground">

                          <XCircle
                            size={14}
                            className="shrink-0 mt-0.5"
                          />

                          <p className="font-medium">
                            Appointment cancelled. It remains visible here for context.
                          </p>

                        </div>

                      )}

                      {(isScheduled ||
                        isWaiting) && (

                        <div className="flex items-start gap-2 text-xs text-muted-foreground">

                          <Clock
                            size={14}
                            className="shrink-0 mt-0.5"
                          />

                          <p className="font-medium">
                            Patient is ready to move into the consultation workflow.
                          </p>

                        </div>

                      )}

                    </div>

                  </div>

                </Card>
              );
            }
          )}

        </div>

      )}

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

          <div>

            <p className="text-sm font-semibold text-foreground">
              Are you sure you want to cancel this appointment?
            </p>

            <p className="text-sm text-muted-foreground mt-2">
              {appointmentToCancel?.patient_name
                ? `${appointmentToCancel.patient_name}'s appointment will be marked as cancelled.`
                : 'This appointment will be marked as cancelled.'}
            </p>

          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

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

    </div>
  );
};

export default AppointmentQueuePage;
