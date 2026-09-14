/**
 * @file    BookAppointmentPage.jsx
 * @module  Patient
 * @desc    Patient UI for selecting an AI-suggested appointment slot,
 *          with reschedule support.
 * @author  Member 2 (S/21/081)
 */

import {
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
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  User,
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
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

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
                'patientAppointments'
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

  const handleSubmit =
    event => {
      event.preventDefault();

      if (
        !selectedSlot
      ) {
        return toast.error(
          'Please select an appointment slot'
        );
      }

      bookMutation.mutate({
        doctorId,
        patientId,
        scheduledAt:
          selectedSlot,
        type:
          'opd',
        notes:
          reason ||
          'Regular checkup',
      });
    };

  const formatSlotTime =
    isoString => {
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

  if (
    isInvalidId
  ) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-lg">

          <Card>

            <div className="text-center py-5">

              <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-5">
                <AlertCircle
                  className="w-8 h-8"
                  strokeWidth={
                    1.8
                  }
                />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                Invalid Doctor Link
              </h1>

              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                We couldn&apos;t identify the doctor for this booking.
                Please return to the doctor search and choose a doctor again.
              </p>

              <div className="mt-6 flex justify-center">

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
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading booking details...
        </p>

      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message="Doctor not found."
          />

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">

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
            ? 'Choose a new available consultation time with your doctor.'
            : 'Choose a suitable available consultation time and confirm your appointment.'
        }
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
              <User
                size={19}
              />
            </div>

            <div className="min-w-0">

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Selected Doctor
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                Dr. {
                  doctor.full_name
                }
              </p>

              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {
                  doctor.specialization ||
                  'General Practice'
                }
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
                '/patient/doctors'
              )
            }
          >
            <ArrowLeft
              size={15}
            />
            Doctor Search
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] gap-6">

        {/* Doctor summary */}
        <Card
          title="Doctor Details"
        >

          <div className="space-y-5">

            <div className="flex items-start gap-4">

              <div className="w-14 h-14 rounded-2xl bg-module-soft text-primary flex items-center justify-center shrink-0">

                <Stethoscope
                  size={26}
                  strokeWidth={
                    1.8
                  }
                />

              </div>

              <div className="min-w-0">

                <p className="text-lg font-bold text-foreground">
                  Dr. {
                    doctor.full_name
                  }
                </p>

                <p className="text-sm font-semibold text-primary mt-1">
                  {
                    doctor.specialization ||
                    'General Practice'
                  }
                </p>

              </div>

            </div>

            {doctor.hospital_name && (
              <div className="rounded-xl bg-secondary/55 p-4">

                <div className="flex items-start gap-3">

                  <MapPin
                    size={18}
                    className="text-primary mt-0.5 shrink-0"
                  />

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                      Hospital
                    </p>

                    <p className="text-sm font-semibold text-foreground mt-1">
                      {
                        doctor.hospital_name
                      }
                    </p>

                  </div>

                </div>

              </div>
            )}

            <div className="rounded-xl bg-module-soft/60 p-4">

              <div className="flex items-start gap-3">

                <Calendar
                  size={18}
                  className="text-primary mt-0.5 shrink-0"
                />

                <div>

                  <p className="text-sm font-bold text-foreground">
                    OPD Appointment
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Choose one of the available consultation times shown in the booking panel.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </Card>

        {/* Booking form */}
        <Card
          title={
            rescheduleId
              ? 'Choose a New Time'
              : 'Choose Appointment Time'
          }
        >

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-7"
          >

            <div>

              <div className="flex items-center justify-between gap-4 mb-4">

                <div>

                  <div className="flex items-center gap-2">

                    <Clock
                      className="w-4 h-4 text-primary"
                    />

                    <h3 className="text-sm font-bold text-foreground">
                      Available Slots
                    </h3>

                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Select the consultation time that works best for you.
                  </p>

                </div>

                {selectedSlot && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-bold">

                    <CheckCircle2
                      size={14}
                    />

                    Selected

                  </div>
                )}

              </div>

              {slots.length ===
              0 ? (

                <Alert
                  type="info"
                  message="No available slots found for this doctor right now."
                />

              ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {slots.map(
                    slot => {

                      const isSelected =
                        selectedSlot ===
                        slot;

                      return (
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
                            group
                            flex items-center gap-3
                            p-4
                            rounded-xl
                            text-left
                            transition-all
                            ${
                              isSelected
                                ? 'bg-module-soft ring-2 ring-primary'
                                : 'bg-secondary/45 hover:bg-module-soft/65'
                            }
                          `}
                        >

                          <div
                            className={`
                              w-10 h-10
                              rounded-xl
                              flex items-center justify-center
                              shrink-0
                              transition-colors
                              ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card text-muted-foreground group-hover:text-primary'
                              }
                            `}
                          >
                            <Clock
                              size={18}
                            />
                          </div>

                          <div className="flex-1 min-w-0">

                            <p
                              className={`
                                text-sm
                                font-semibold
                                leading-snug
                                ${
                                  isSelected
                                    ? 'text-primary'
                                    : 'text-foreground'
                                }
                              `}
                            >
                              {
                                formatSlotTime(
                                  slot
                                )
                              }
                            </p>

                          </div>

                          {isSelected && (
                            <CheckCircle2
                              className="w-5 h-5 text-primary shrink-0"
                            />
                          )}

                        </button>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            <div className="pt-1">

              <Input
                label="Reason for Visit (Optional)"
                name="reason"
                type="text"
                placeholder="e.g. Regular checkup, fever, consultation"
                value={
                  reason
                }
                onChange={
                  event =>
                    setReason(
                      event.target.value
                    )
                }
                disabled={
                  slots.length ===
                  0
                }
              />

            </div>

            {selectedSlot && (
              <div className="rounded-xl bg-success/5 p-4">

                <div className="flex items-start gap-3">

                  <CheckCircle2
                    className="w-5 h-5 text-success shrink-0 mt-0.5"
                  />

                  <div>

                    <p className="text-sm font-bold text-foreground">
                      Appointment time selected
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      {
                        formatSlotTime(
                          selectedSlot
                        )
                      }
                    </p>

                  </div>

                </div>

              </div>
            )}

            <div className="pt-5 border-t border-border/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate(
                    '/patient/doctors'
                  )
                }
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

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
                className="w-full sm:w-auto"
              >
                <Calendar
                  size={17}
                />

                {rescheduleId
                  ? 'Confirm Reschedule'
                  : 'Confirm Appointment'}
              </Button>

            </div>

          </form>

        </Card>

      </div>

    </div>
  );
}