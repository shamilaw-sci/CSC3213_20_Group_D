/**
 * @file    BookAppointmentPage.jsx
 * @module  Patient
 * @desc    Select a doctor appointment slot, book a visit, or reschedule an existing visit.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseMedical,
  Building2,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import toast from 'react-hot-toast';

import {
  getDoctorProfile,
  getAvailableSlots,
} from '../../services/doctor.service';

import {
  bookAppointment,
  updateAppointmentStatus,
} from '../../services/appointment.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';



/**
 * Returns doctor initials.
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
 * Returns a grouping key for appointment dates.
 */
const getDateKey = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toDateString();
};

/**
 * Formats date information used in the date cards.
 */
const formatDateCard = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      weekday: '—',
      day: '—',
      month: '—',
      year: '—',
    };
  }

  return {
    weekday:
      date.toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
        }
      ),

    day:
      date.toLocaleDateString(
        'en-US',
        {
          day: 'numeric',
        }
      ),

    month:
      date.toLocaleDateString(
        'en-US',
        {
          month: 'short',
        }
      ),

    year:
      date.toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
        }
      ),
  };
};

/**
 * Formats the appointment time.
 */
const formatTime = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

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
 * Formats the complete selected appointment.
 */
const formatFullSlot = (
  isoString
) => {
  if (!isoString) {
    return 'No appointment selected';
  }

  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Invalid appointment time';
  }

  return date.toLocaleString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Formats doctor experience.
 */
const formatExperience = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'Experience not listed';
  }

  const years =
    Number(value);

  return `${value} ${
    years === 1
      ? 'year'
      : 'years'
  } experience`;
};



const DoctorPhoto = ({
  doctor,
}) => {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const hasPhoto =
    Boolean(
      doctor?.photo_url
    ) &&
    !imageFailed;

  return (
    <div
      className="
        relative
        w-40 h-40
        xl:w-44 xl:h-44
        rounded-full
        bg-card
        p-1.5
        shadow-[0_16px_38px_rgba(15,23,42,0.2)]
      "
    >

      <div
        className="
          w-full
          h-full
          rounded-full
          overflow-hidden
          bg-[#12344D]
        "
      >

        {hasPhoto ? (

          <img
            src={
              doctor.photo_url
            }
            alt={`Dr. ${
              doctor.full_name ||
              'Care4U doctor'
            }`}
            className="
              w-full
              h-full
              object-cover
              object-top
            "
            onError={() =>
              setImageFailed(
                true
              )
            }
          />

        ) : (

          <div
            className="
              w-full
              h-full
              flex
              flex-col
              items-center
              justify-center
              bg-gradient-to-br
              from-[#12344D]
              to-primary
              text-white
            "
          >

            <UserRound
              size={40}
              strokeWidth={1.5}
              className="text-white/70"
            />

            <span
              className="
                text-xl
                font-black
                mt-2
              "
            >
              {getInitials(
                doctor?.full_name
              )}
            </span>

          </div>

        )}

      </div>

    </div>
  );
};



const StepHeader = ({
  step,
  title,
  description,
}) => {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        mb-5
      "
    >

      <div
        className="
          w-8 h-8
          rounded-xl
          bg-primary
          text-primary-foreground
          flex
          items-center
          justify-center
          shrink-0
          text-xs
          font-black
        "
      >
        {step}
      </div>

      <div>

        <h3
          className="
            text-base
            font-bold
            text-foreground
          "
        >
          {title}
        </h3>

        <p
          className="
            text-xs
            text-muted-foreground
            mt-1
            leading-relaxed
          "
        >
          {description}
        </p>

      </div>

    </div>
  );
};



/**
 * FEATURE: Book or reschedule appointment
 * LOGIC: Load the chosen doctor and available slots, then let the patient select a date and time.
 */
export default function BookAppointmentPage() {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const {
    doctorId,
  } = useParams();

  const navigate =
    useNavigate();

  const queryClient =
    useQueryClient();

  const [
    searchParams,
  ] = useSearchParams();

  const rescheduleId =
    searchParams.get(
      'reschedule'
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(
    null
  );

  const [
    reason,
    setReason,
  ] = useState(
    ''
  );

  const isInvalidId =
    !doctorId ||
    doctorId ===
      'undefined';



  const {
    data:
      doctor,
    isLoading:
      isLoadingDoctor,
    isError:
      isDoctorError,
  } = useQuery({
    queryKey: [
      'doctor',
      doctorId,
    ],

    queryFn: () =>
      getDoctorProfile(
        doctorId
      ),

    enabled:
      !isInvalidId,
  });



  const {
    data:
      slots = [],
    isLoading:
      isLoadingSlots,
    isError:
      isSlotsError,
  } = useQuery({
    queryKey: [
      'slots',
      doctorId,
    ],

    queryFn: () =>
      getAvailableSlots(
        doctorId
      ),

    enabled:
      !isInvalidId,
  });



  const slotGroups =
    useMemo(
      () => {
        const groups =
          {};

        slots.forEach(
          slot => {
            const key =
              getDateKey(
                slot
              );

            if (!key) {
              return;
            }

            if (
              !groups[key]
            ) {
              groups[key] =
                [];
            }

            groups[
              key
            ].push(
              slot
            );
          }
        );

        return groups;
      },
      [
        slots,
      ]
    );

  const availableDates =
    useMemo(
      () =>
        Object.keys(
          slotGroups
        ),
      [
        slotGroups,
      ]
    );

  const activeDate =
    selectedDate ||
    availableDates[0] ||
    '';

  const visibleSlots =
    activeDate
      ? (
          slotGroups[
            activeDate
          ] ||
          []
        )
      : [];



  /**
   * FEATURE: Save appointment
   * LOGIC: Create the replacement first, then request cancellation of the old booking.
   * If cancellation fails, keep the new booking, show a warning and return to appointments; both can remain active.
   * A failed new booking leaves the old appointment unchanged.
   */
  const bookMutation =
    useMutation({
      mutationFn:
        appointmentData =>
          bookAppointment(
            appointmentData
          ),

      onSuccess:
        async () => {

          if (
            rescheduleId
          ) {
            try {

              await updateAppointmentStatus(
                rescheduleId,
                'cancelled'
              );

              toast.success(
                'Appointment rescheduled successfully!'
              );

            } catch (
              error
            ) {

              console.error(
                'Cancellation error:',
                error
              );

              toast.error(
                'Booked new time, but failed to cancel old appointment.'
              );
            }

          } else {

            toast.success(
              'Appointment booked successfully!'
            );
          }

          await queryClient
            .invalidateQueries({
              queryKey: [
                'patientAppointments',
              ],
            });

          navigate(
            '/patient/appointments'
          );
        },

      onError:
        error => {
          toast.error(
            error.response
              ?.data
              ?.message ||
            'Failed to book appointment'
          );
        },
    });



  /**
   * FEATURE: Confirm booking
   * LOGIC: Require a patient and selected slot, then send doctor, time and optional reason as an OPD booking.
   * Displayed slots are not reservations: the backend locks the doctor row, rechecks availability
   * and conflicts in one transaction, and rejects an occupied slot. API errors appear in a toast.
   */
  const handleSubmit =
    event => {
      event.preventDefault();

      if (
        !patientId
      ) {
        toast.error(
          'Patient account information is unavailable.'
        );

        return;
      }

      if (
        !selectedSlot
      ) {
        toast.error(
          'Please select an appointment slot'
        );

        return;
      }

      bookMutation.mutate({
        doctorId,
        patientId,
        scheduledAt:
          selectedSlot,
        type:
          'opd',
        notes:
          reason.trim() ||
          'Regular checkup',
      });
    };



  if (
    isInvalidId
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

        <div className="w-full max-w-lg">

          <Card>

            <div className="text-center py-5">

              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-destructive/10
                  text-destructive
                  flex
                  items-center
                  justify-center
                  mx-auto
                  mb-5
                "
              >

                <AlertCircle
                  className="w-8 h-8"
                  strokeWidth={1.8}
                />

              </div>

              <h1
                className="
                  text-2xl
                  font-bold
                  text-foreground
                "
              >
                Invalid Doctor Link
              </h1>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-2
                  leading-relaxed
                "
              >
                We couldn&apos;t identify the doctor for this booking.
                Please return to the doctor search and choose a doctor again.
              </p>

              <div
                className="
                  mt-6
                  flex
                  justify-center
                "
              >

                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      '/patient/doctors'
                    )
                  }
                >
                  <ArrowLeft
                    size={16}
                  />
                  Return to Doctor Search
                </Button>

              </div>

            </div>

          </Card>

        </div>

      </div>
    );
  }



  if (
    isLoadingDoctor ||
    isLoadingSlots
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

          <Calendar
            size={24}
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
          Preparing your appointment
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Checking the doctor's available consultation times
        </p>

      </div>
    );
  }



  if (
    isDoctorError ||
    !doctor
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
            message="Doctor details could not be loaded."
          />

        </div>

      </div>
    );
  }



  return (
    <div className="space-y-7">



      {/* Book Appointment Heading */}
      <PageHeader
        eyebrow={
          rescheduleId
            ? 'Appointment Rescheduling'
            : 'Appointment Booking'
        }
        icon={
          Calendar
        }
        title={
          rescheduleId
            ? 'Reschedule Appointment'
            : 'Book Appointment'
        }
        description={
          rescheduleId
            ? 'Choose a new available consultation date and time with your doctor.'
            : 'Choose a suitable consultation date and time and confirm your appointment.'
        }
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

              <Stethoscope
                size={18}
              />

            </div>

            <div className="min-w-0">

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-primary
                "
              >
                Selected Doctor
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                  truncate
                "
              >
                Dr. {
                  doctor.full_name
                }
              </p>

              <p
                className="
                  text-xs
                  text-muted-foreground
                  mt-0.5
                  truncate
                "
              >
                {doctor.specialization ||
                  'General Practice'}
              </p>

            </div>

          </div>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(
                rescheduleId
                  ? '/patient/appointments'
                  : '/patient/doctors'
              )
            }
          >
            <ArrowLeft
              size={15}
            />

            {rescheduleId
              ? 'My Appointments'
              : 'Doctor Search'}
          </Button>
        }
      />



      {rescheduleId && (

        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            bg-module-soft
            border
            border-primary/10
            p-4
          "
        >

          <div
            className="
              w-10 h-10
              rounded-xl
              bg-card
              text-primary
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <RotateCcw
              size={18}
            />

          </div>

          <div>

            <p
              className="
                text-sm
                font-bold
                text-primary
              "
            >
              Rescheduling appointment
            </p>

            <p
              className="
                text-xs
                text-primary/75
                leading-relaxed
                mt-1
              "
            >
              Select a new available time. Your previous appointment will only be cancelled after the replacement booking succeeds.
            </p>

          </div>

        </div>

      )}



      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-[380px_minmax(0,1fr)]
          gap-6
          items-start
        "
      >



        <aside
          className="
            xl:sticky
            xl:top-6
          "
        >

          <div
            className="
              relative
              overflow-hidden
              rounded-[2rem]
              bg-card
              border
              border-border/70
              shadow-[0_12px_34px_rgba(15,23,42,0.07)]
            "
          >

            <div
              className="
                relative
                h-36
                bg-gradient-to-br
                from-[#12344D]
                via-primary
                to-primary/55
                overflow-hidden
              "
            >

              <div
                className="
                  absolute
                  -right-10
                  -top-16
                  w-40 h-40
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                "
              />

              <div
                className="
                  absolute
                  left-8
                  top-5
                  w-12 h-12
                  rounded-full
                  bg-white/5
                  border
                  border-white/10
                "
              />

            </div>

            <div
              className="
                relative
                px-6
                pb-6
                pt-24
              "
            >

              <div
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-[5.5rem]
                "
              >

                <DoctorPhoto
                  doctor={
                    doctor
                  }
                />

              </div>

              <div className="text-center">

                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.18em]
                    font-bold
                    text-primary
                  "
                >
                  Care4U Medical Network
                </p>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-foreground
                    mt-1.5
                  "
                >
                  Dr. {
                    doctor.full_name
                  }
                </h2>

                <div
                  className="
                    flex
                    justify-center
                    mt-3
                  "
                >

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-module-soft
                      text-primary
                      px-3.5
                      py-1.5
                    "
                  >

                    <Stethoscope
                      size={13}
                    />

                    <span
                      className="
                        text-[10px]
                        uppercase
                        tracking-wide
                        font-bold
                      "
                    >
                      {doctor.specialization ||
                        'General Practice'}
                    </span>

                  </div>

                </div>

              </div>



              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  xl:grid-cols-1
                  gap-3
                  mt-6
                "
              >

                <div
                  className="
                    rounded-2xl
                    bg-secondary/45
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-card
                        text-primary
                        flex
                        items-center
                        justify-center
                        border
                        border-border/60
                        shrink-0
                      "
                    >

                      <Building2
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
                        Hospital
                      </p>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-foreground
                          mt-1
                          leading-relaxed
                        "
                      >
                        {doctor.hospital_name ||
                          'Care4U Network'}
                      </p>

                    </div>

                  </div>

                </div>

                <div
                  className="
                    rounded-2xl
                    bg-secondary/45
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-card
                        text-primary
                        flex
                        items-center
                        justify-center
                        border
                        border-border/60
                        shrink-0
                      "
                    >

                      <BriefcaseMedical
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
                        Experience
                      </p>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-foreground
                          mt-1
                        "
                      >
                        {formatExperience(
                          doctor.years_experience
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              <div
                className="
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  bg-module-soft/60
                  p-4
                  mt-4
                "
              >

                <CalendarDays
                  size={18}
                  className="
                    text-primary
                    shrink-0
                    mt-0.5
                  "
                />

                <div>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-foreground
                    "
                  >
                    OPD Consultation
                  </p>

                  <p
                    className="
                      text-xs
                      text-muted-foreground
                      leading-relaxed
                      mt-1
                    "
                  >
                    Select one of the doctor's currently available consultation times.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </aside>



        {/* Appointment Booking Form */}
        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >



          <Card>

            <StepHeader
              step="1"
              title={
                rescheduleId
                  ? 'Choose a new date'
                  : 'Choose your date'
              }
              description="Select one of the doctor's available appointment days."
            />

            {isSlotsError ? (

              <Alert
                type="error"
                message="Available appointment times could not be loaded."
              />

            ) : availableDates.length ===
            0 ? (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  rounded-2xl
                  bg-secondary/35
                  py-10
                  px-5
                "
              >

                <div
                  className="
                    w-14 h-14
                    rounded-2xl
                    bg-amber-50
                    text-amber-700
                    flex
                    items-center
                    justify-center
                    mb-4
                  "
                >

                  <CalendarDays
                    size={24}
                  />

                </div>

                <h4
                  className="
                    text-base
                    font-bold
                    text-foreground
                  "
                >
                  No appointment times available
                </h4>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                    leading-relaxed
                    mt-2
                    max-w-md
                  "
                >
                  This doctor does not currently have any open slots. Return to Doctor Search to choose another doctor.
                </p>

                <Button
                  type="button"
                  variant="secondary"
                  className="mt-5"
                  onClick={() =>
                    navigate(
                      '/patient/doctors'
                    )
                  }
                >
                  Find Another Doctor
                </Button>

              </div>

            ) : (

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  md:grid-cols-4
                  xl:grid-cols-5
                  gap-3
                "
              >

                {availableDates.map(
                  dateKey => {
                    const firstSlot =
                      slotGroups[
                        dateKey
                      ][0];

                    const date =
                      formatDateCard(
                        firstSlot
                      );

                    const isSelected =
                      activeDate ===
                      dateKey;

                    return (
                      /* Available Date Button */
                      <button
                        key={
                          dateKey
                        }
                        type="button"
                        onClick={() => {
                          setSelectedDate(
                            dateKey
                          );

                          setSelectedSlot(
                            null
                          );
                        }}
                        className={`
                          relative
                          min-h-32
                          rounded-2xl
                          border
                          px-3
                          py-4
                          text-center
                          transition-all
                          ${
                            isSelected
                              ? 'bg-[#12344D] border-[#12344D] text-white shadow-[0_10px_22px_rgba(18,52,77,0.18)]'
                              : 'bg-card border-border hover:border-primary/30 hover:bg-module-soft/30'
                          }
                        `}
                      >

                        <p
                          className={`
                            text-[10px]
                            uppercase
                            tracking-[0.12em]
                            font-bold
                            ${
                              isSelected
                                ? 'text-white/70'
                                : 'text-muted-foreground'
                            }
                          `}
                        >
                          {date.weekday}
                        </p>

                        <p
                          className="
                            text-3xl
                            font-black
                            mt-1
                          "
                        >
                          {date.day}
                        </p>

                        <p
                          className={`
                            text-xs
                            font-semibold
                            mt-0.5
                            ${
                              isSelected
                                ? 'text-white/80'
                                : 'text-muted-foreground'
                            }
                          `}
                        >
                          {date.month}{' '}
                          {date.year}
                        </p>

                        <div
                          className={`
                            inline-flex
                            rounded-full
                            px-2
                            py-1
                            text-[9px]
                            font-bold
                            mt-3
                            ${
                              isSelected
                                ? 'bg-white/10 text-[#D9F5F2]'
                                : 'bg-module-soft text-primary'
                            }
                          `}
                        >
                          {
                            slotGroups[
                              dateKey
                            ].length
                          }{' '}
                          {slotGroups[
                            dateKey
                          ].length ===
                          1
                            ? 'slot'
                            : 'slots'}
                        </div>

                      </button>
                    );
                  }
                )}

              </div>

            )}

          </Card>



          {availableDates.length >
            0 && (

            <Card>

              <StepHeader
                step="2"
                title="Choose a time"
                description="Available consultation times for your selected date."
              />

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  lg:grid-cols-4
                  gap-3
                "
              >

                {visibleSlots.map(
                  slot => {
                    const isSelected =
                      selectedSlot ===
                      slot;

                    return (
                      /* Available Time Slot Button */
                      <button
                        key={
                          slot
                        }
                        type="button"
                        onClick={() =>
                          setSelectedSlot(
                            slot
                          )
                        }
                        className={`
                          relative
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          min-h-14
                          px-4
                          border
                          transition-all
                          ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-[0_8px_18px_rgba(15,139,131,0.18)]'
                              : 'bg-card border-border text-foreground hover:border-primary/30 hover:bg-module-soft/35'
                          }
                        `}
                      >

                        <Clock3
                          size={16}
                        />

                        <span
                          className="
                            text-sm
                            font-bold
                          "
                        >
                          {formatTime(
                            slot
                          )}
                        </span>

                        {isSelected && (

                          <span
                            className="
                              absolute
                              right-2
                              top-2
                              w-5 h-5
                              rounded-full
                              bg-white
                              text-primary
                              flex
                              items-center
                              justify-center
                            "
                          >

                            <Check
                              size={11}
                              strokeWidth={3}
                            />

                          </span>

                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </Card>

          )}



          {availableDates.length >
            0 && (

            <Card>

              <StepHeader
                step="3"
                title="Reason for visit"
                description="Optional. This helps your doctor understand what you need before the consultation."
              />

              <div>

                <label
                  htmlFor="appointment-reason"
                  className="
                    block
                    text-xs
                    font-semibold
                    text-muted-foreground
                    uppercase
                    tracking-wide
                    mb-2
                  "
                >
                  Visit Notes
                </label>

                <div
                  className="
                    relative
                    rounded-2xl
                    border
                    border-input
                    bg-card
                    focus-within:ring-2
                    focus-within:ring-ring
                    focus-within:border-transparent
                    transition-all
                  "
                >

                  <FileText
                    size={18}
                    className="
                      absolute
                      left-4
                      top-4
                      text-muted-foreground
                    "
                  />

                  {/* Reason for Visit Notes Field */}
                  <textarea
                    id="appointment-reason"
                    name="reason"
                    rows={4}
                    maxLength={500}
                    placeholder="e.g. Regular checkup, fever, follow-up consultation..."
                    value={
                      reason
                    }
                    onChange={
                      event =>
                        setReason(
                          event.target.value
                        )
                    }
                    className="
                      w-full
                      resize-none
                      bg-transparent
                      pl-11
                      pr-4
                      py-3.5
                      text-sm
                      text-foreground
                      placeholder:text-muted-foreground
                      outline-none
                    "
                  />

                </div>

                <p
                  className="
                    text-[10px]
                    text-muted-foreground
                    text-right
                    mt-1.5
                  "
                >
                  {reason.length}/500
                </p>

              </div>

            </Card>

          )}



          {selectedSlot && (

            <div
              className="
                rounded-2xl
                bg-card
                border
                border-border/70
                p-5
                sm:p-6
                shadow-[0_8px_26px_rgba(15,23,42,0.045)]
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
                    "
                  >

                    <CalendarCheck2
                      size={20}
                    />

                  </div>

                  <div>

                    <p
                      className="
                        text-[9px]
                        uppercase
                        tracking-[0.14em]
                        font-bold
                        text-primary
                      "
                    >
                      Appointment Summary
                    </p>

                    <h3
                      className="
                        text-base
                        font-bold
                        text-foreground
                        mt-1
                      "
                    >
                      Ready to confirm
                    </h3>

                  </div>

                </div>

              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-3
                  gap-3
                  mt-5
                "
              >

                <div
                  className="
                    rounded-xl
                    bg-secondary/45
                    p-4
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
                    Doctor
                  </p>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-foreground
                      mt-1
                    "
                  >
                    Dr. {
                      doctor.full_name
                    }
                  </p>

                </div>

                <div
                  className="
                    rounded-xl
                    bg-secondary/45
                    p-4
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
                    Appointment
                  </p>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-foreground
                      mt-1
                      leading-relaxed
                    "
                  >
                    {formatFullSlot(
                      selectedSlot
                    )}
                  </p>

                </div>

                <div
                  className="
                    rounded-xl
                    bg-secondary/45
                    p-4
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
                    Visit Type
                  </p>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-foreground
                      mt-1
                    "
                  >
                    OPD Consultation
                  </p>

                </div>

              </div>

            </div>

          )}



          {availableDates.length >
            0 && (

            <div
              className="
                flex
                flex-col-reverse
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-3
                rounded-2xl
                bg-card
                border
                border-border/70
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-muted-foreground
                "
              >

                <ShieldCheck
                  size={15}
                  className="shrink-0"
                />

                <span>
                  Availability is checked against the doctor's Care4U schedule before booking.
                </span>

              </div>

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-2
                  shrink-0
                "
              >

                {/* Cancel Booking Button */}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      rescheduleId
                        ? '/patient/appointments'
                        : '/patient/doctors'
                    )
                  }
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                {/* Confirm Appointment or Confirm Reschedule Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    !selectedSlot ||
                    slots.length ===
                      0
                  }
                  loading={
                    bookMutation.isPending
                  }
                  className="
                    w-full
                    sm:w-auto
                    min-w-48
                  "
                >

                  {rescheduleId ? (
                    <RotateCcw
                      size={17}
                    />
                  ) : (
                    <Calendar
                      size={17}
                    />
                  )}

                  {rescheduleId
                    ? 'Confirm Reschedule'
                    : 'Confirm Appointment'}

                </Button>

              </div>

            </div>

          )}

        </form>

      </div>

    </div>
  );
}
