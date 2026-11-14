/**
 * @file    MyAppointmentsPage.jsx
 * @module  Patient
 * @desc    Patient workspace for viewing, rescheduling,
 * and cancelling medical appointments.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useMemo,
  useState,
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
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  RotateCcw,
  Search,
  Stethoscope,
  UserRound,
  XCircle,
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  getPatientAppointments,
  updateAppointmentStatus,
} from '../../services/appointment.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

/* STATUS CONFIGURATION */

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    textClass:
      'text-blue-700',
    backgroundClass:
      'bg-blue-50',
    borderClass:
      'border-blue-100',
    icon:
      CalendarDays,
  },

  confirmed: {
    label: 'Confirmed',
    textClass:
      'text-primary',
    backgroundClass:
      'bg-module-soft',
    borderClass:
      'border-primary/10',
    icon:
      CheckCircle2,
  },

  in_progress: {
    label: 'In Progress',
    textClass:
      'text-amber-700',
    backgroundClass:
      'bg-amber-50',
    borderClass:
      'border-amber-100',
    icon:
      Clock3,
  },

  completed: {
    label: 'Completed',
    textClass:
      'text-emerald-700',
    backgroundClass:
      'bg-emerald-50',
    borderClass:
      'border-emerald-100',
    icon:
      CheckCircle2,
  },

  cancelled: {
    label: 'Cancelled',
    textClass:
      'text-red-700',
    backgroundClass:
      'bg-red-50',
    borderClass:
      'border-red-100',
    icon:
      XCircle,
  },
};

/* HELPERS */

/**
 * Returns readable status configuration.
 */
const getStatusConfig = (
  status
) => {
  return (
    STATUS_CONFIG[
      status
    ] || {
      label:
        status ||
        'Unknown',

      textClass:
        'text-muted-foreground',

      backgroundClass:
        'bg-secondary',

      borderClass:
        'border-border',

      icon:
        Clock3,
    }
  );
};

/**
 * Formats appointment date.
 */
const formatDate = (
  value
) => {
  if (!value) {
    return 'Date unavailable';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

/**
 * Formats appointment time.
 */
const formatTime = (
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
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Formats appointment type.
 */
const formatType = (
  value
) => {
  if (!value) {
    return 'Consultation';
  }

  return value
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      character =>
        character
          .toUpperCase()
    );
};

/**
 * Returns initials from doctor name.
 */
const getInitials = (
  name
) => {
  if (!name) {
    return 'DR';
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      part =>
        part[0]
          .toUpperCase()
    )
    .join('');
};

/**
 * Determines whether appointment belongs to upcoming care.
 */
const isUpcomingAppointment = (
  appointment
) => {
  return [
    'scheduled',
    'confirmed',
    'in_progress',
  ].includes(
    appointment
      ?.status
  );
};

/* SUMMARY CARD */

/**
 * @component SummaryCard
 * @desc      Dashboard-style appointment metric.
 */
const SummaryCard = ({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  iconBackground,
}) => {
  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        shadow-[0_8px_24px_rgba(15,23,42,0.045)]
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-muted-foreground
            "
          >
            {label}
          </p>

          <p
            className="
              text-3xl
              font-black
              tracking-tight
              text-foreground
              mt-2
            "
          >
            {value}
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
              mt-1
            "
          >
            {description}
          </p>

        </div>

        <div
          className={`
            w-11 h-11
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            ${iconBackground}
            ${iconClass}
          `}
        >
          <Icon
            size={20}
            strokeWidth={
              2
            }
          />
        </div>

      </div>

    </div>
  );
};

/* STATUS BADGE */

/**
 * @component StatusBadge
 * @desc      Accessible appointment status chip.
 */
const StatusBadge = ({
  status,
}) => {
  const config =
    getStatusConfig(
      status
    );

  const Icon =
    config.icon;

  return (
    <div
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1.5
        ${config.textClass}
        ${config.backgroundClass}
        ${config.borderClass}
      `}
    >

      <Icon
        size={12}
        strokeWidth={
          2.2
        }
      />

      <span
        className="
          text-[10px]
          font-bold
          whitespace-nowrap
        "
      >
        {config.label}
      </span>

    </div>
  );
};

/* APPOINTMENT CARD */

/**
 * @component AppointmentCard
 * @desc      web appointment card matching mobile structure.
 */
const AppointmentCard = ({
  appointment,
  onCancel,
  onReschedule,
  cancelling,
}) => {
  const doctorName =
    appointment
      .doctor_name ||
    'Care4U Doctor';

  const isScheduled =
    appointment
      .status ===
    'scheduled';

  const isConfirmed =
    appointment
      .status ===
    'confirmed';

  const isInProgress =
    appointment
      .status ===
    'in_progress';

  const isCancelled =
    appointment
      .status ===
    'cancelled';

  return (
    <article
      className={`
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        sm:p-6
        shadow-[0_8px_28px_rgba(15,23,42,0.045)]
        transition-all
        duration-200
        ${
          isCancelled
            ? 'opacity-65'
            : 'hover:shadow-[0_14px_36px_rgba(15,23,42,0.075)]'
        }
      `}
    >

      {/* DOCTOR IDENTITY + STATUS */}

      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            min-w-0
          "
        >

          <div
            className="
              w-12 h-12
              rounded-2xl
              bg-brand-deep
              text-white
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <span
              className="
                text-xs
                font-black
                tracking-wide
              "
            >
              {getInitials(
                doctorName
              )}
            </span>

          </div>

          <div className="min-w-0">

            <h3
              className="
                text-base
                sm:text-lg
                font-bold
                text-foreground
                leading-tight
              "
            >
              Dr. {
                doctorName
              }
            </h3>

            <div
              className="
                flex
                items-center
                gap-1.5
                mt-1.5
              "
            >

              <Stethoscope
                size={14}
                className="
                  text-primary
                  shrink-0
                "
              />

              <p
                className="
                  text-xs
                  sm:text-sm
                  text-muted-foreground
                  truncate
                "
              >
                {appointment
                  .doctor_specialization ||
                  'General Consultation'}
              </p>

            </div>

          </div>

        </div>

        <StatusBadge
          status={
            appointment.status
          }
        />

      </div>

      {/* VISIT DETAILS */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-3
          mt-5
        "
      >

        {/* Date */}
        <div
          className="
            rounded-xl
            bg-secondary/45
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-9 h-9
                rounded-xl
                bg-card
                border
                border-border/60
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <CalendarDays
                size={16}
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Date
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-1
                "
              >
                {formatDate(
                  appointment
                    .scheduled_at
                )}
              </p>

            </div>

          </div>

        </div>

        {/* Time */}
        <div
          className="
            rounded-xl
            bg-secondary/45
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-9 h-9
                rounded-xl
                bg-card
                border
                border-border/60
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Clock3
                size={16}
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Time
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-1
                "
              >
                {formatTime(
                  appointment
                    .scheduled_at
                )}
              </p>

            </div>

          </div>

        </div>

        {/* Visit */}
        <div
          className="
            rounded-xl
            bg-secondary/45
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-9 h-9
                rounded-xl
                bg-card
                border
                border-border/60
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <FileText
                size={16}
              />

            </div>

            <div className="min-w-0">

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Visit
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-1
                "
              >
                {formatType(
                  appointment
                    .type
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* NOTES */}

      {appointment.notes && (

        <div
          className="
            mt-4
            rounded-xl
            border
            border-border/60
            bg-card
            px-4
            py-3
          "
        >

          <p
            className="
              text-[9px]
              uppercase
              tracking-[0.12em]
              font-bold
              text-muted-foreground
            "
          >
            Notes
          </p>

          <p
            className="
              text-sm
              text-foreground
              mt-1.5
              leading-relaxed
            "
          >
            {
              appointment.notes
            }
          </p>

        </div>

      )}

      {/* STATUS MESSAGES */}

      {isConfirmed && (

        <div
          className="
            flex
            items-start
            gap-2.5
            rounded-xl
            bg-module-soft
            border
            border-primary/10
            px-4
            py-3
            mt-4
          "
        >

          <CheckCircle2
            size={16}
            className="
              text-primary
              shrink-0
              mt-0.5
            "
          />

          <p
            className="
              text-xs
              text-primary
              font-medium
              leading-relaxed
            "
          >
            Your appointment has been confirmed by the care team.
          </p>

        </div>

      )}

      {isInProgress && (

        <div
          className="
            flex
            items-start
            gap-2.5
            rounded-xl
            bg-amber-50
            border
            border-amber-100
            px-4
            py-3
            mt-4
          "
        >

          <Clock3
            size={16}
            className="
              text-amber-700
              shrink-0
              mt-0.5
            "
          />

          <p
            className="
              text-xs
              text-amber-800
              font-medium
              leading-relaxed
            "
          >
            Your consultation is currently in progress.
          </p>

        </div>

      )}

      {/* ACTIONS */}

      {isScheduled && (

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:justify-end
            gap-2
            pt-5
            mt-5
            border-t
            border-border
          "
        >

          {/* Reschedule Appointment Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={
              <RotateCcw
                size={15}
              />
            }
            onClick={() =>
              onReschedule(
                appointment
              )
            }
            disabled={
              cancelling
            }
            className="
              w-full
              sm:w-auto
            "
          >
            Reschedule
          </Button>

          {/* Cancel Appointment Button */}
          <Button
            variant="danger"
            size="sm"
            icon={
              <XCircle
                size={15}
              />
            }
            onClick={() =>
              onCancel(
                appointment.id
              )
            }
            disabled={
              cancelling
            }
            className="
              w-full
              sm:w-auto
            "
          >
            {cancelling
              ? 'Cancelling...'
              : 'Cancel Appointment'}
          </Button>

        </div>

      )}

    </article>
  );
};

/* MAIN PAGE */

/**
 * FEATURE: Appointment history and upcoming care
 * LOGIC: Group scheduled, confirmed and in-progress visits as upcoming by status, earliest first.
 * Show other statuses in History, latest first; this grouping does not compare dates with today.
 */
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

  const [
    selectedView,
    setSelectedView,
  ] = useState(
    'upcoming'
  );

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

  /* CANCEL APPOINTMENT */

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
            'patientAppointments',
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

  /**
   * FEATURE: Cancel an appointment
   * LOGIC: Ask for browser confirmation before requesting cancelled status.
   * Success refreshes appointments; a failed request shows the server error.
   * Cards offer cancellation and rescheduling only while status is scheduled.
   */
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

  /* RESCHEDULE */

  /**
   * FEATURE: Choose a replacement appointment
   * LOGIC: Require a doctor ID and open the slot picker with the old appointment ID.
   * Booking the replacement and cancelling the original happen in BookAppointmentPage.
   */
  const handleReschedule =
    appointment => {
      const targetId =
        appointment
          .doctor_id ||
        appointment
          .doctorId;

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

  /* DERIVED DATA */

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            isUpcomingAppointment
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                first
                  .scheduled_at
              ) -
              new Date(
                second
                  .scheduled_at
              )
          ),
      [
        appointments,
      ]
    );

  const historyAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            appointment =>
              !isUpcomingAppointment(
                appointment
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second
                  .scheduled_at
              ) -
              new Date(
                first
                  .scheduled_at
              )
          ),
      [
        appointments,
      ]
    );

  const completedCount =
    useMemo(
      () =>
        appointments.filter(
          appointment =>
            appointment
              .status ===
            'completed'
        ).length,
      [
        appointments,
      ]
    );

  const displayedAppointments =
    selectedView ===
    'upcoming'
      ? upcomingAppointments
      : historyAppointments;

  /* LOADING */

  if (
    isLoading
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          flex-col
          items-center
          justify-center
          gap-3
        "
      >

        <div
          className="
            w-14 h-14
            rounded-2xl
            bg-module-soft
            text-primary
            flex
            items-center
            justify-center
            mb-1
          "
        >

          <CalendarDays
            size={25}
          />

        </div>

        <Spinner
          size="lg"
        />

        <p
          className="
            text-sm
            font-semibold
            text-foreground
            mt-1
          "
        >
          Loading your visits
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Fetching your latest appointment information
        </p>

      </div>
    );
  }

  /* ERROR */

  if (
    isError
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          items-center
          justify-center
          px-4
        "
      >

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

  /* PAGE */

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      {/* My Appointments Heading */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Calendar
        }
        title="My Appointments"
        description="Review upcoming care, reschedule when needed, or look back at previous visits."
        meta={
          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <CalendarClock
                size={19}
              />

            </div>

            <div>

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-primary
                "
              >
                Upcoming
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
                {upcomingAppointments.length ===
                0
                  ? 'No active appointments'
                  : `${upcomingAppointments.length} active appointment${
                      upcomingAppointments.length ===
                      1
                        ? ''
                        : 's'
                    }`}
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

      {/* SUMMARY CARDS */}

      <section
        className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
        "
      >

        <SummaryCard
          icon={
            CalendarDays
          }
          label="Upcoming"
          value={
            upcomingAppointments
              .length
          }
          description="Scheduled care"
          iconClass="text-primary"
          iconBackground="bg-module-soft"
        />

        <SummaryCard
          icon={
            CheckCircle2
          }
          label="Completed"
          value={
            completedCount
          }
          description="Finished visits"
          iconClass="text-emerald-700"
          iconBackground="bg-emerald-50"
        />

        <SummaryCard
          icon={
            History
          }
          label="History"
          value={
            historyAppointments
              .length
          }
          description="Past records"
          iconClass="text-blue-700"
          iconBackground="bg-blue-50"
        />

      </section>

      {/* APPOINTMENT WORKSPACE */}

      <section
        className="
          rounded-2xl
          bg-card
          border
          border-border/70
          shadow-[0_8px_26px_rgba(15,23,42,0.04)]
          overflow-hidden
        "
      >

        {/* TOOLBAR */}

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
            px-5
            sm:px-6
            py-5
            border-b
            border-border
          "
        >

          <div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.15em]
                font-bold
                text-primary
              "
            >
              Your Care Schedule
            </p>

            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                text-foreground
                mt-1
              "
            >
              Visits
            </h2>

            <p
              className="
                text-xs
                sm:text-sm
                text-muted-foreground
                mt-1
              "
            >
              {selectedView ===
              'upcoming'
                ? 'Appointments that are scheduled, confirmed, or currently in progress.'
                : 'Completed and cancelled appointment records.'}
            </p>

          </div>

          {/* UPCOMING / HISTORY TOGGLE */}

          <div
            className="
              inline-flex
              w-full
              sm:w-auto
              bg-secondary/70
              rounded-xl
              p-1
            "
          >

            {/* Upcoming Appointments Tab */}
            <button
              type="button"
              onClick={() =>
                setSelectedView(
                  'upcoming'
                )
              }
              className={`
                flex-1
                sm:flex-none
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                px-4
                py-2.5
                text-xs
                font-bold
                transition-all
                ${
                  selectedView ===
                  'upcoming'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >

              <CalendarDays
                size={15}
              />

              Upcoming

              <span
                className={`
                  min-w-5
                  h-5
                  px-1.5
                  rounded-full
                  inline-flex
                  items-center
                  justify-center
                  text-[9px]
                  font-black
                  ${
                    selectedView ===
                    'upcoming'
                      ? 'bg-module-soft text-primary'
                      : 'bg-card text-muted-foreground'
                  }
                `}
              >
                {
                  upcomingAppointments
                    .length
                }
              </span>

            </button>

            {/* Appointment History Tab */}
            <button
              type="button"
              onClick={() =>
                setSelectedView(
                  'history'
                )
              }
              className={`
                flex-1
                sm:flex-none
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                px-4
                py-2.5
                text-xs
                font-bold
                transition-all
                ${
                  selectedView ===
                  'history'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >

              <History
                size={15}
              />

              History

              <span
                className={`
                  min-w-5
                  h-5
                  px-1.5
                  rounded-full
                  inline-flex
                  items-center
                  justify-center
                  text-[9px]
                  font-black
                  ${
                    selectedView ===
                    'history'
                      ? 'bg-module-soft text-primary'
                      : 'bg-card text-muted-foreground'
                  }
                `}
              >
                {
                  historyAppointments
                    .length
                }
              </span>

            </button>

          </div>

        </div>

        {/* CONTENT */}

        <div
          className="
            p-5
            sm:p-6
            bg-secondary/10
          "
        >

          {displayedAppointments.length ===
          0 ? (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                text-center
                py-14
                px-4
              "
            >

              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >

                {selectedView ===
                'upcoming' ? (

                  <CalendarDays
                    size={28}
                    strokeWidth={
                      1.8
                    }
                  />

                ) : (

                  <History
                    size={28}
                    strokeWidth={
                      1.8
                    }
                  />

                )}

              </div>

              <h3
                className="
                  text-lg
                  font-bold
                  text-foreground
                "
              >
                {selectedView ===
                'upcoming'
                  ? 'No upcoming visits'
                  : 'No visit history yet'}
              </h3>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-2
                  max-w-md
                  leading-relaxed
                "
              >
                {selectedView ===
                'upcoming'
                  ? 'Your schedule is clear. Find a Care4U doctor whenever you need an appointment.'
                  : 'Completed and cancelled appointments will appear here.'}
              </p>

              {selectedView ===
                'upcoming' && (

                <Button
                  variant="primary"
                  icon={
                    <Search
                      size={16}
                    />
                  }
                  onClick={() =>
                    navigate(
                      '/patient/doctors'
                    )
                  }
                  className="mt-5"
                >
                  Find a Doctor
                </Button>

              )}

            </div>

          ) : (

            <div className="space-y-4">

              {displayedAppointments.map(
                appointment => (

                  /* Appointment Cards and Action Handlers */ <AppointmentCard
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    onCancel={
                      handleCancel
                    }
                    onReschedule={
                      handleReschedule
                    }
                    cancelling={
                      cancelMutation
                        .isPending &&
                      cancelMutation
                        .variables ===
                        appointment.id
                    }
                  />

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* BOOK ANOTHER APPOINTMENT */}

      {appointments.length >
        0 && (

        <button
          type="button"
          onClick={() =>
            navigate(
              '/patient/doctors'
            )
          }
          className="
            w-full
            group
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
            rounded-2xl
            bg-card
            border
            border-border/70
            p-5
            text-left
            shadow-[0_8px_24px_rgba(15,23,42,0.035)]
            hover:border-primary/25
            hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]
            transition-all
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-11 h-11
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <CalendarPlus
                size={20}
              />

            </div>

            <div>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                "
              >
                Need another appointment?
              </p>

              <p
                className="
                  text-xs
                  text-muted-foreground
                  mt-1
                "
              >
                Find a doctor and choose an available date and time.
              </p>

            </div>

          </div>

          <span
            className="
              text-xs
              font-bold
              text-primary
              group-hover:underline
            "
          >
            Find a Doctor →
          </span>

        </button>

      )}

    </div>
  );
}