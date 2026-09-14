/**
 * @file    MyAppointmentsPage.jsx
 * @module  Patient
 * @desc    Patient workspace for viewing, rescheduling,
 *          and cancelling medical appointments.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useMemo,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useNavigate,
} from 'react-router-dom';

import {
  Calendar,
  CalendarClock,
  CalendarPlus,
  Clock,
  FileText,
  Stethoscope,
  User,
  XCircle,
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  getPatientAppointments,
  updateAppointmentStatus,
} from '../../services/appointment.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

export default function MyAppointmentsPage() {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const queryClient =
    useQueryClient();

  const navigate =
    useNavigate();

  const {
    data:
      appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'patientAppointments',
      patientId,
    ],

    queryFn: () =>
      getPatientAppointments(
        patientId
      ),

    enabled:
      !!patientId,
  });

  const cancelMutation =
    useMutation({
      mutationFn:
        appointmentId =>
          updateAppointmentStatus(
            appointmentId,
            'cancelled'
          ),

      onSuccess: () => {
        toast.success(
          'Appointment cancelled successfully'
        );

        queryClient.invalidateQueries({
          queryKey: [
            'patientAppointments'
          ],
        });
      },

      onError:
        err => {
          toast.error(
            err.response
              ?.data
              ?.message ||
            'Failed to cancel appointment'
          );
        },
    });

  const handleCancel =
    appointmentId => {
      if (
        window.confirm(
          'Are you sure you want to cancel this appointment?'
        )
      ) {
        cancelMutation.mutate(
          appointmentId
        );
      }
    };

  const handleReschedule =
    appointment => {
      const targetId =
        appointment.doctor_id ||
        appointment.doctorId;

      if (
        !targetId ||
        String(
          targetId
        ) ===
          'undefined'
      ) {
        toast.error(
          'Database error: Doctor ID missing. Please book a new appointment.'
        );

        return;
      }

      navigate(
        `/patient/book-appointment/${targetId}?reschedule=${appointment.id}`
      );
    };

  const formatDateTime =
    isoString => {
      if (!isoString) {
        return '—';
      }

      const date =
        new Date(
          isoString
        );

      return new Intl
        .DateTimeFormat(
          'en-US',
          {
            weekday:
              'short',
            month:
              'short',
            day:
              'numeric',
            year:
              'numeric',
            hour:
              'numeric',
            minute:
              '2-digit',
            hour12:
              true,
          }
        )
        .format(
          date
        );
    };

  const getStatusBadge =
    status => {
      switch (
        status
      ) {
        case 'scheduled':
          return (
            <Badge
              status="active"
              label="Scheduled"
            />
          );

        case 'confirmed':
          return (
            <Badge
              status="active"
              label="Confirmed"
            />
          );

        case 'in_progress':
          return (
            <Badge
              status="pending"
              label="In Progress"
            />
          );

        case 'completed':
          return (
            <Badge
              status="completed"
              label="Completed"
            />
          );

        case 'cancelled':
          return (
            <Badge
              status="cancelled"
              label="Cancelled"
            />
          );

        default:
          return (
            <Badge
              status="normal"
              label={
                status ||
                'Unknown'
              }
            />
          );
      }
    };

  const sortedAppointments =
    useMemo(
      () => {
        if (
          !appointments ||
          appointments.length ===
            0
        ) {
          return [];
        }

        const statusPriority = {
          in_progress: 1,
          confirmed: 2,
          scheduled: 3,
          completed: 4,
          cancelled: 5,
        };

        return [
          ...appointments
        ].sort(
          (
            appointmentA,
            appointmentB
          ) => {
            const priorityA =
              statusPriority[
                appointmentA
                  .status
              ] || 6;

            const priorityB =
              statusPriority[
                appointmentB
                  .status
              ] || 6;

            if (
              priorityA !==
              priorityB
            ) {
              return (
                priorityA -
                priorityB
              );
            }

            return (
              new Date(
                appointmentA
                  .scheduled_at
              ) -
              new Date(
                appointmentB
                  .scheduled_at
              )
            );
          }
        );
      },
      [
        appointments
      ]
    );

  const activeAppointments =
    useMemo(
      () =>
        appointments.filter(
          appointment =>
            [
              'scheduled',
              'confirmed',
              'in_progress',
            ].includes(
              appointment.status
            )
        ).length,
      [
        appointments
      ]
    );

  if (
    isLoading
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading your appointments...
        </p>

      </div>
    );
  }

  if (
    isError
  ) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message={`Failed to load appointments: ${
              error?.message ||
              'Unknown error'
            }. Please try again later.`}
          />

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* =========================================
          PAGE HERO
      ========================================= */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Calendar
        }
        title="My Appointments"
        description="View your upcoming and previous medical visits, reschedule available appointments, or cancel when necessary."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              <CalendarClock
                size={19}
              />

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Upcoming
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {activeAppointments ===
                0
                  ? 'No active appointments'
                  : `${activeAppointments} active appointment${
                      activeAppointments ===
                      1
                        ? ''
                        : 's'
                    }`}
              </p>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                {appointments.length}{' '}
                total record
                {appointments.length ===
                1
                  ? ''
                  : 's'}
              </p>

            </div>

          </div>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={
              <CalendarPlus
                size={15}
              />
            }
            onClick={() =>
              navigate(
                '/patient/doctors'
              )
            }
          >
            Find a Doctor
          </Button>
        }
      />

      {/* =========================================
          APPOINTMENT HISTORY
      ========================================= */}
      <Card
        title="Appointment History"
      >

        {sortedAppointments.length ===
        0 ? (

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <Calendar
                className="w-7 h-7"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No appointments yet
            </h3>

            <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-md leading-relaxed">
              Search for a doctor and book your first Care4U appointment.
            </p>

            <Button
              variant="primary"
              icon={
                <CalendarPlus
                  size={16}
                />
              }
              onClick={() =>
                navigate(
                  '/patient/doctors'
                )
              }
            >
              Find a Doctor
            </Button>

          </div>

        ) : (

          <div className="space-y-3">

            {sortedAppointments.map(
              appointment => {

                const isCancelled =
                  appointment.status ===
                  'cancelled';

                const canManage =
                  appointment.status ===
                  'scheduled';

                return (
                  <article
                    key={
                      appointment.id
                    }
                    className={`
                      rounded-xl
                      p-4 sm:p-5
                      transition-colors
                      ${
                        isCancelled
                          ? 'bg-secondary/30 opacity-65'
                          : appointment.status ===
                            'in_progress'
                            ? 'bg-module-soft/70'
                            : 'bg-secondary/45 hover:bg-secondary/65'
                      }
                    `}
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                      {/* Doctor identity */}
                      <div className="flex items-start gap-4 min-w-0 lg:w-[30%]">

                        <div
                          className={`
                            w-11 h-11
                            rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${
                              isCancelled
                                ? 'bg-card text-muted-foreground'
                                : 'bg-module-soft text-primary'
                            }
                          `}
                        >

                          <User
                            size={21}
                          />

                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3
                              className={`
                                text-base
                                font-bold
                                leading-snug
                                ${
                                  isCancelled
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                }
                              `}
                            >
                              Dr. {
                                appointment.doctor_name ||
                                'Unknown Doctor'
                              }
                            </h3>

                            <div className="lg:hidden">
                              {
                                getStatusBadge(
                                  appointment.status
                                )
                              }
                            </div>

                          </div>

                          <div className="flex items-center gap-1.5 mt-1">

                            <Stethoscope
                              size={14}
                              className="text-primary shrink-0"
                            />

                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {appointment.doctor_specialization ||
                                'General Practice'}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* Appointment information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">

                        <div className="rounded-xl bg-card/70 p-3.5">

                          <div className="flex items-start gap-3">

                            <Clock
                              size={16}
                              className="text-primary shrink-0 mt-0.5"
                            />

                            <div>

                              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Date & Time
                              </p>

                              <p className="text-sm font-semibold text-foreground mt-1 leading-snug">
                                {
                                  formatDateTime(
                                    appointment.scheduled_at
                                  )
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                        <div className="rounded-xl bg-card/70 p-3.5">

                          <div className="flex items-start gap-3">

                            <FileText
                              size={16}
                              className="text-primary shrink-0 mt-0.5"
                            />

                            <div className="min-w-0">

                              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Visit
                              </p>

                              <p className="text-sm font-semibold text-foreground capitalize mt-1 break-words">
                                {appointment.type ||
                                  'OPD'}
                              </p>

                              {appointment.notes && (
                                <p className="text-xs text-muted-foreground mt-1 break-words">
                                  {
                                    appointment.notes
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* Desktop status + actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-end xl:items-center gap-3 lg:min-w-[190px] lg:justify-end">

                        <div className="hidden lg:block">
                          {
                            getStatusBadge(
                              appointment.status
                            )
                          }
                        </div>

                        {canManage && (
                          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">

                            <Button
                              variant="secondary"
                              size="sm"
                              icon={
                                <CalendarClock className="h-4 w-4" />
                              }
                              onClick={() =>
                                handleReschedule(
                                  appointment
                                )
                              }
                              className="w-full sm:w-auto"
                            >
                              Reschedule
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              icon={
                                <XCircle className="h-4 w-4" />
                              }
                              onClick={() =>
                                handleCancel(
                                  appointment.id
                                )
                              }
                              disabled={
                                cancelMutation.isPending
                              }
                              className="w-full sm:w-auto"
                            >
                              Cancel
                            </Button>

                          </div>
                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </Card>

    </div>
  );
}