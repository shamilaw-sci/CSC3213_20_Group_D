/**
 * @file    HospitalOPDPage.jsx
 * @module  Hospital
 * @desc    Hospital-wide OPD queue for reception and hospital staff.
 *          Displays today's appointments across all doctors,
 *          supports patient check-in, hospital-assisted patient
 *          registration, and walk-in doctor assignment.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../services/api';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';

/** Show an OPD appointment time or a dash when the date is missing or invalid. */
const formatTime = (
  dateValue
) => {
  if (!dateValue) {
    return '—';
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date.toLocaleTimeString(
    'en-GB',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

/**
 * Converts a patient name into initials for a compact queue avatar.
 *
 * @param {string} name - Patient full name
 * @returns {string} Initials used when no patient image is available
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

/** Map saved appointment states to the labels reception sees in the OPD queue. */
const formatStatus = (
  status
) => {
  const labels = {
    scheduled:
      'Not Arrived',
    confirmed:
      'Waiting',
    in_progress:
      'In Consultation',
    completed:
      'Completed',
    cancelled:
      'Cancelled',
  };

  return (
    labels[status] ||
    status ||
    'Unknown'
  );
};

/** Choose the badge appearance for waiting, consultation, completed and cancelled states. */
const getStatusClasses = (
  status
) => {
  switch (status) {
    case 'confirmed':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/20';

    case 'in_progress':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';

    case 'completed':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';

    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/20';

    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
};

/** Restore blank fields when starting another assisted patient registration. */
const createEmptyRegistrationForm =
  () => ({
    fullName: '',
    nic: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

/** Use the local date for the registration/queue date input, not UTC midnight. */
const getTodayDateInputValue =
  () => {
    const now =
      new Date();

    const localDate =
      new Date(
        now.getTime() -
        now.getTimezoneOffset() *
        60000
      );

    return localDate
      .toISOString()
      .split('T')[0];
  };

/**
 * FEATURE: Hospital reception and OPD queue
 * LOGIC: Show today's appointments and support assisted registration, patient check-in and doctor
 * assignment.
 */
const HospitalOPDPage = () => {

  const [
    appointments,
    setAppointments
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    checkInId,
    setCheckInId
  ] = useState(null);

  const [
    showRegistrationModal,
    setShowRegistrationModal
  ] = useState(false);

  const [
    registrationForm,
    setRegistrationForm
  ] = useState(
    createEmptyRegistrationForm
  );

  const [
    registering,
    setRegistering
  ] = useState(false);

  const [
    registeredPatient,
    setRegisteredPatient
  ] = useState(null);

  const [
    hospitalDoctors,
    setHospitalDoctors
  ] = useState([]);

  const [
    doctorsLoading,
    setDoctorsLoading
  ] = useState(false);

  const [
    selectedDoctorId,
    setSelectedDoctorId
  ] = useState('');

  const [
    walkInNotes,
    setWalkInNotes
  ] = useState('');

  const [
    assigningWalkIn,
    setAssigningWalkIn
  ] = useState(false);

  const [
    assignedAppointment,
    setAssignedAppointment
  ] = useState(null);

  /**
   * FEATURE: Load today's OPD appointments
   * LOGIC: Request the hospital queue; use a smaller refreshing state during background reloads and show API
   * errors.
   */
  const loadAppointments =
    async (
      background = false
    ) => {
      try {

        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await api.get(
            '/api/hospitals/opd/today'
          );

        if (
          response.data.success
        ) {
          setAppointments(
            response.data.data ||
            []
          );
        }

      } catch (error) {

        console.error(
          'Hospital OPD load error:',
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
          'Failed to load today\'s OPD queue.'
        );

      } finally {

        setLoading(false);
        setRefreshing(false);
      }
    };

  /**
   * FEATURE: Load available hospital doctors
   * LOGIC: Request doctors linked to the authenticated hospital and clear the list if loading fails.
   */
  const loadHospitalDoctors =
    async () => {
      try {

        setDoctorsLoading(
          true
        );

        const response =
          await api.get(
            '/api/hospitals/opd/doctors'
          );

        if (
          response.data.success
        ) {
          setHospitalDoctors(
            response.data.data ||
            []
          );
        }

      } catch (error) {

        console.error(
          'Hospital doctor load error:',
          error
        );

        setHospitalDoctors(
          []
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
          'Unable to load hospital doctors.'
        );

      } finally {

        setDoctorsLoading(
          false
        );
      }
    };

  // Refresh the OPD queue every 15 seconds; remove the interval when the page unmounts.
  useEffect(() => {

    loadAppointments();

    const intervalId =
      setInterval(
        () => {
          loadAppointments(true);
        },
        15000
      );

    return () =>
      clearInterval(
        intervalId
      );

  }, []);

  /**
   * FEATURE: Check In button
   * LOGIC: Send the selected appointment ID; after server success change that row to Waiting and clear the
   * loading state.
   */
  const handleCheckIn =
    async (
      appointmentId
    ) => {
      try {

        setCheckInId(
          appointmentId
        );

        const response =
          await api.patch(
            `/api/hospitals/opd/${appointmentId}/check-in`
          );

        if (
          response.data.success
        ) {
          toast.success(
            'Patient checked in successfully.'
          );

          setAppointments(
            (
              previous
            ) =>
              previous.map(
                (
                  appointment
                ) =>
                  appointment.id ===
                  appointmentId
                    ? {
                        ...appointment,
                        status:
                          'confirmed',
                      }
                    : appointment
              )
          );
        }

      } catch (error) {

        console.error(
          'Hospital OPD check-in error:',
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
          'Unable to check in patient.'
        );

      } finally {

        setCheckInId(
          null
        );
      }
    };

  /** Update the matching assisted-registration field without resetting other form values. */
  const handleRegistrationChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      setRegistrationForm(
        (
          previous
        ) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  /** Clear doctor selection, notes and the previous assignment result. */
  const resetWalkInAssignment =
    () => {
      setSelectedDoctorId(
        ''
      );

      setWalkInNotes(
        ''
      );

      setAssignedAppointment(
        null
      );
    };

  /**
   * FEATURE: Open assisted registration
   * LOGIC: Start with empty patient details, reset any old assignment and load the hospital doctor list.
   */
  const openRegistrationModal =
    () => {
      setRegistrationForm(
        createEmptyRegistrationForm()
      );

      setRegisteredPatient(
        null
      );

      resetWalkInAssignment();

      setShowRegistrationModal(
        true
      );

      loadHospitalDoctors();
    };

  /**
   * FEATURE: Close assisted registration
   * LOGIC: Prevent closing during a save or assignment request; otherwise clear all draft state.
   */
  const closeRegistrationModal =
    () => {
      // Keep the modal open while registration or assignment is being submitted.
      if (
        registering ||
        assigningWalkIn
      ) {
        return;
      }

      setShowRegistrationModal(
        false
      );

      setRegistrationForm(
        createEmptyRegistrationForm()
      );

      setRegisteredPatient(
        null
      );

      resetWalkInAssignment();
    };

  /**
   * FEATURE: Register patient without smartphone
   * LOGIC: Require name and birth date, submit the assisted profile, then keep the returned patient for doctor
   * assignment.
   */
  const handleRegisterPatient =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !registrationForm
          .fullName
          .trim()
      ) {
        toast.error(
          'Patient full name is required.'
        );

        return;
      }

      if (
        !registrationForm
          .dateOfBirth
      ) {
        toast.error(
          'Patient date of birth is required.'
        );

        return;
      }

      try {

        setRegistering(
          true
        );

        const response =
          await api.post(
            '/api/hospitals/patients/register-assisted',
            {
              fullName:
                registrationForm
                  .fullName
                  .trim(),

              nic:
                registrationForm
                  .nic
                  .trim(),

              dateOfBirth:
                registrationForm
                  .dateOfBirth,

              gender:
                registrationForm
                  .gender,

              bloodGroup:
                registrationForm
                  .bloodGroup,

              emergencyContactName:
                registrationForm
                  .emergencyContactName
                  .trim(),

              emergencyContactPhone:
                registrationForm
                  .emergencyContactPhone
                  .trim(),

              emergencyContactRelationship:
                registrationForm
                  .emergencyContactRelationship
                  .trim(),
            }
          );

        if (
          response.data.success
        ) {
          setRegisteredPatient(
            response.data.data
          );

          resetWalkInAssignment();

          toast.success(
            'Patient registered successfully.'
          );
        }

      } catch (error) {

        console.error(
          'Hospital-assisted patient registration error:',
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
          'Unable to register patient.'
        );

      } finally {

        setRegistering(
          false
        );
      }
    };

  /**
   * FEATURE: Assign patient to an OPD doctor
   * LOGIC: Require a registered patient and selected doctor; the backend checks hospital membership and
   * duplicate active visits.
   */
  const handleAssignWalkIn =
    async () => {
      if (
        !registeredPatient?.id
      ) {
        toast.error(
          'Patient profile is unavailable.'
        );

        return;
      }

      if (!selectedDoctorId) {
        toast.error(
          'Please select a doctor.'
        );

        return;
      }

      try {

        setAssigningWalkIn(
          true
        );

        const response =
          await api.post(
            '/api/hospitals/opd/walk-in',
            {
              patientId:
                registeredPatient.id,

              doctorId:
                selectedDoctorId,

              notes:
                walkInNotes.trim(),
            }
          );

        if (
          response.data.success
        ) {
          setAssignedAppointment(
            response.data.data
          );

          toast.success(
            'Patient added to the OPD waiting queue.'
          );

          await loadAppointments(
            true
          );
        }

      } catch (error) {

        console.error(
          'Hospital walk-in assignment error:',
          error
        );

        toast.error(
          error.response
            ?.data
            ?.message ||
          'Unable to add patient to the OPD queue.'
        );

      } finally {

        setAssigningWalkIn(
          false
        );
      }
    };

  /** Prepare a fresh registration form after finishing the previous patient. */
  const handleRegisterAnother =
    () => {
      setRegistrationForm(
        createEmptyRegistrationForm()
      );

      setRegisteredPatient(
        null
      );

      resetWalkInAssignment();
    };

  /**
   * Count queue states from the loaded appointments; the displayed totals change when queue data
   * refreshes.
   */
  const stats =
    useMemo(
      () => ({
        total:
          appointments.length,

        waiting:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              'confirmed'
          ).length,

        inProgress:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              'in_progress'
          ).length,

        completed:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              'completed'
          ).length,
      }),
      [appointments]
    );

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[#F6F8FA] flex items-center justify-center px-4">

        <div className="flex flex-col items-center text-center">

          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center shadow-sm mb-4">
            <Stethoscope
              size={27}
            />
          </div>

          <Spinner
            size="lg"
          />

          <p className="text-sm font-bold text-foreground mt-4">
            Preparing today&apos;s OPD workspace
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            Loading hospital appointments and reception activity
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F6F8FA]">

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 sm:pt-8">

        <PageHeader
          eyebrow="Hospital Operations"
          title="Today&apos;s OPD"
          description="Coordinate arrivals, hospital-assisted registration, walk-in assignment, and today&apos;s outpatient queue from one reception workspace."
          icon={Stethoscope}
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

              <button
                type="button"
                onClick={
                  openRegistrationModal
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
                <UserPlus
                  size={16}
                />

                Register Walk-in
              </button>

              <button
                type="button"
                onClick={() =>
                  loadAppointments(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            </div>
          }
          meta={
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Users
                  size={18}
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-cyan-700">
                  Reception Queue
                </p>

                <p className="text-sm font-bold text-foreground mt-0.5">
                  {stats.total} {stats.total === 1 ? 'patient' : 'patients'} today
                </p>

                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Auto-updates every 15 sec
                </p>
              </div>

            </div>
          }
        />

      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-7">

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">

        <Card className="relative overflow-hidden border-cyan-100 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">

              <Users
                size={20}
                className="text-primary"
              />

            </div>

            <div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Total Today
              </p>

              <p className="text-2xl font-bold text-foreground">
                {
                  stats.total
                }
              </p>

            </div>

          </div>

        </Card>

        <Card className="relative overflow-hidden border-amber-100 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">

              <Clock
                size={20}
                className="text-amber-600"
              />

            </div>

            <div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Waiting
              </p>

              <p className="text-2xl font-bold text-foreground">
                {
                  stats.waiting
                }
              </p>

            </div>

          </div>

        </Card>

        <Card className="relative overflow-hidden border-blue-100 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">

              <Stethoscope
                size={20}
                className="text-blue-600"
              />

            </div>

            <div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                In Consultation
              </p>

              <p className="text-2xl font-bold text-foreground">
                {
                  stats.inProgress
                }
              </p>

            </div>

          </div>

        </Card>

        <Card className="relative overflow-hidden border-emerald-100 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">

              <CheckCircle2
                size={20}
                className="text-emerald-600"
              />

            </div>

            <div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Completed
              </p>

              <p className="text-2xl font-bold text-foreground">
                {
                  stats.completed
                }
              </p>

            </div>

          </div>

        </Card>

      </section>

      <Card
        className="overflow-hidden border-border/70 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
        title={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <CalendarDays
                size={18}
              />
            </div>

            <div>
              <p className="text-base font-bold text-foreground">
                Patient Queue
              </p>

              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Reception view of today&apos;s appointments across all doctors
              </p>
            </div>

          </div>
        }
      >

        {appointments.length ===
          0 ? (

          <div className="py-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">

              <CalendarDays
                size={28}
                className="text-cyan-700"
              />

            </div>

            <p className="text-base font-semibold text-foreground">
              No OPD appointments today
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Today&apos;s hospital appointments will appear here.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto -mx-1">

            <table className="w-full min-w-[850px]">

              <thead className="bg-slate-50/80">

                <tr className="border-y border-border/70 text-left">

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                    Time
                  </th>

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                    Patient
                  </th>

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                    Doctor
                  </th>

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                    Type
                  </th>

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                    Status
                  </th>

                  <th className="px-3 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {appointments.map(
                  (
                    appointment
                  ) => (

                    <tr
                      key={
                        appointment.id
                      }
                      className="border-b border-border/70 last:border-0 hover:bg-cyan-50/35 transition-colors"
                    >

                      <td className="px-3 py-4">

                        <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50/80 border border-cyan-100 px-2.5 py-1.5 text-sm font-bold text-cyan-900">

                          <Clock
                            size={15}
                            className="text-cyan-700"
                          />

                          {formatTime(
                            appointment
                              .scheduled_at
                          )}

                        </div>

                      </td>

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 font-black text-xs">
                            {getInitials(
                              appointment
                                .patient_name
                            )}
                          </div>

                          <div>

                            <p className="text-sm font-bold text-foreground">
                              {
                                appointment
                                  .patient_name ||
                                'Unknown Patient'
                              }
                            </p>

                            <p className="text-xs text-muted-foreground mt-0.5">
                              NIC:{' '}
                              {
                                appointment
                                  .patient_nic ||
                                'Not recorded'
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      <td className="px-3 py-4">

                        <p className="text-sm font-semibold text-foreground">
                          {appointment.doctor_name
                            ? `Dr. ${appointment.doctor_name}`
                            : '—'}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {
                            appointment
                              .specialization ||
                            'General'
                          }
                        </p>

                      </td>

                      <td className="px-3 py-4">

                        <span className="text-sm font-medium text-foreground uppercase">
                          {
                            appointment
                              .type ||
                            'OPD'
                          }
                        </span>

                      </td>

                      <td className="px-3 py-4">

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusClasses(
                            appointment.status
                          )}`}
                        >
                          {formatStatus(
                            appointment.status
                          )}
                        </span>

                      </td>

                      <td className="px-3 py-4 text-right">

                        {appointment.status ===
                        'scheduled' ? (

                          <Button
                            variant="primary"
                            loading={
                              checkInId ===
                              appointment.id
                            }
                            onClick={() =>
                              handleCheckIn(
                                appointment.id
                              )
                            }
                          >
                            <CheckCircle2
                              size={15}
                              className="mr-2"
                            />

                            Check In
                          </Button>

                        ) : (

                          <span className="text-xs text-muted-foreground">
                            No reception action
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground px-4">
        <ShieldCheck
          size={14}
          className="text-cyan-700"
        />

        <span>
          Hospital staff manage patient arrival and queue placement only. Clinical consultation actions remain with the assigned doctor.
        </span>
      </div>

      </main>

      {showRegistrationModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close registration modal"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={
              closeRegistrationModal
            }
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assisted-registration-title"
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-[24px] shadow-[0_28px_80px_rgba(15,23,42,0.25)]"
          >

            <div className="sticky top-0 z-10 bg-[#12344D] border-b border-white/10 px-5 sm:px-6 py-5 flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2 text-cyan-300 mb-1">

                  <UserPlus
                    size={18}
                  />

                  <span className="text-xs uppercase tracking-wider font-bold">
                    Hospital-assisted registration
                  </span>

                </div>

                <h2
                  id="assisted-registration-title"
                  className="text-xl font-bold text-white"
                >
                  Register Walk-in Patient
                </h2>

                <p className="text-sm text-slate-300 mt-1">
                  Create a Care4U patient profile and place the patient into today&apos;s OPD queue.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeRegistrationModal
                }
                disabled={
                  registering ||
                  assigningWalkIn
                }
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            {registeredPatient ? (

              <div className="p-5 sm:p-6">

                <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">

                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">

                    <ShieldCheck
                      size={28}
                      className="text-emerald-600"
                    />

                  </div>

                  <h3 className="text-xl font-bold text-foreground">
                    Patient Registered Successfully
                  </h3>

                  <p className="text-sm text-muted-foreground mt-2">
                    A Care4U patient profile has been created without requiring a patient login account.
                  </p>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4">

                    <div className="rounded-xl border border-border bg-background p-4">

                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        Patient
                      </p>

                      <p className="text-base font-bold text-foreground mt-1">
                        {
                          registeredPatient
                            .full_name ||
                          '—'
                        }
                      </p>

                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">

                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        NIC
                      </p>

                      <p className="text-base font-bold text-foreground mt-1">
                        {
                          registeredPatient
                            .nic ||
                          'Not recorded'
                        }
                      </p>

                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">

                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        Patient ID
                      </p>

                      <p className="text-sm font-semibold text-foreground mt-1 break-all">
                        {
                          registeredPatient
                            .id
                        }
                      </p>

                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">

                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        QR Reference
                      </p>

                      <p className="text-sm font-semibold text-foreground mt-1 break-all">
                        {
                          registeredPatient
                            .qr_code_id ||
                          '—'
                        }
                      </p>

                    </div>

                  </div>

                </div>

                {assignedAppointment ? (

                  <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-6 shadow-sm">

                    <div className="flex items-start gap-4">

                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">

                        <CheckCircle2
                          size={24}
                          className="text-primary"
                        />

                      </div>

                      <div>

                        <h3 className="text-lg font-bold text-foreground">
                          Added to OPD Waiting Queue
                        </h3>

                        <p className="text-sm text-muted-foreground mt-1">
                          The patient has been assigned to{' '}
                          <span className="font-semibold text-foreground">
                            Dr. {
                              assignedAppointment
                                .doctor_name ||
                              'Assigned Doctor'
                            }
                          </span>
                          {assignedAppointment.specialization
                            ? ` (${assignedAppointment.specialization})`
                            : ''}
                          .
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">

                          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
                            Waiting
                          </span>

                          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                            OPD
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                      <Button
                        variant="secondary"
                        onClick={
                          closeRegistrationModal
                        }
                      >
                        Close
                      </Button>

                      <Button
                        variant="primary"
                        onClick={
                          handleRegisterAnother
                        }
                      >
                        <UserPlus
                          size={16}
                          className="mr-2"
                        />

                        Register Another Patient
                      </Button>

                    </div>

                  </div>

                ) : (

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <div className="flex items-start gap-3 mb-5">

                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

                        <Stethoscope
                          size={19}
                          className="text-primary"
                        />

                      </div>

                      <div>

                        <h3 className="text-base font-bold text-foreground">
                          Add Patient to Today&apos;s OPD Queue
                        </h3>

                        <p className="text-xs text-muted-foreground mt-1">
                          Assign the walk-in patient to a doctor working at this hospital.
                        </p>

                      </div>

                    </div>

                    <div className="grid gap-5">

                      <div>

                        <label
                          htmlFor="walkInDoctor"
                          className="block text-sm font-semibold text-foreground mb-2"
                        >
                          Doctor
                          <span className="text-destructive ml-1">
                            *
                          </span>
                        </label>

                        {doctorsLoading ? (

                          <div className="h-11 rounded-lg border border-border bg-secondary/30 px-3 flex items-center gap-2">

                            <Spinner
                              size="sm"
                            />

                            <span className="text-sm text-muted-foreground">
                              Loading hospital doctors...
                            </span>

                          </div>

                        ) : (

                          <select
                            id="walkInDoctor"
                            value={
                              selectedDoctorId
                            }
                            onChange={
                              (
                                event
                              ) =>
                                setSelectedDoctorId(
                                  event.target.value
                                )
                            }
                            disabled={
                              assigningWalkIn
                            }
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                          >
                            <option value="">
                              Select a doctor
                            </option>

                            {hospitalDoctors.map(
                              (
                                doctor
                              ) => (

                                <option
                                  key={
                                    doctor.id
                                  }
                                  value={
                                    doctor.id
                                  }
                                >
                                  Dr. {doctor.full_name}
                                  {
                                    doctor.specialization
                                      ? ` — ${doctor.specialization}`
                                      : ''
                                  }
                                </option>

                              )
                            )}

                          </select>

                        )}

                        {!doctorsLoading &&
                        hospitalDoctors.length === 0 && (

                          <p className="text-xs text-destructive mt-2">
                            No doctors are currently linked to this hospital.
                          </p>

                        )}

                      </div>

                      <div>

                        <label
                          htmlFor="walkInNotes"
                          className="block text-sm font-semibold text-foreground mb-2"
                        >
                          Reception Note
                        </label>

                        <textarea
                          id="walkInNotes"
                          value={
                            walkInNotes
                          }
                          onChange={
                            (
                              event
                            ) =>
                              setWalkInNotes(
                                event.target.value
                              )
                          }
                          disabled={
                            assigningWalkIn
                          }
                          rows={3}
                          placeholder="Optional note for the OPD visit"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none resize-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />

                      </div>

                    </div>

                    <div className="mt-6 rounded-xl bg-secondary/50 border border-border p-4">

                      <p className="text-sm font-semibold text-foreground">
                        Walk-in patient
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Because the patient is already at the hospital, assigning them to a doctor places them directly into the Waiting queue.
                      </p>

                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                      <Button
                        variant="secondary"
                        onClick={
                          closeRegistrationModal
                        }
                        disabled={
                          assigningWalkIn
                        }
                      >
                        Finish Without Queue
                      </Button>

                      <Button
                        variant="primary"
                        onClick={
                          handleAssignWalkIn
                        }
                        loading={
                          assigningWalkIn
                        }
                        disabled={
                          doctorsLoading ||
                          hospitalDoctors.length === 0
                        }
                      >
                        <Stethoscope
                          size={16}
                          className="mr-2"
                        />

                        Assign & Add to Queue
                      </Button>

                    </div>

                  </div>

                )}

              </div>

            ) : (

              <form
                onSubmit={
                  handleRegisterPatient
                }
                className="p-5 sm:p-6 bg-slate-50/45"
              >

                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 mb-6">

                  <div className="flex items-start gap-3">

                    <ShieldCheck
                      size={19}
                      className="text-primary mt-0.5 shrink-0"
                    />

                    <div>

                      <p className="text-sm font-semibold text-foreground">
                        Assisted patient profile
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        This option is intended for walk-in patients or patients who cannot use the Care4U application. Email, password, and account OTP are not required.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid sm:grid-cols-2 gap-5">

                  <div className="sm:col-span-2">

                    <label
                      htmlFor="fullName"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Full Name
                      <span className="text-destructive ml-1">
                        *
                      </span>
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={
                        registrationForm
                          .fullName
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      required
                      placeholder="Enter patient full name"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="nic"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      NIC
                    </label>

                    <input
                      id="nic"
                      name="nic"
                      type="text"
                      value={
                        registrationForm
                          .nic
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      placeholder="Optional"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                    <p className="text-xs text-muted-foreground mt-1.5">
                      Existing NIC numbers cannot be registered twice.
                    </p>

                  </div>

                  <div>

                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Date of Birth
                      <span className="text-destructive ml-1">
                        *
                      </span>
                    </label>

                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      max={
                        getTodayDateInputValue()
                      }
                      value={
                        registrationForm
                          .dateOfBirth
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      required
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="gender"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Gender
                    </label>

                    <select
                      id="gender"
                      name="gender"
                      value={
                        registrationForm
                          .gender
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    >
                      <option value="">
                        Not specified
                      </option>

                      <option value="male">
                        Male
                      </option>

                      <option value="female">
                        Female
                      </option>

                      <option value="other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div>

                    <label
                      htmlFor="bloodGroup"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Blood Group
                    </label>

                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={
                        registrationForm
                          .bloodGroup
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    >
                      <option value="">
                        Not recorded
                      </option>

                      <option value="A+">
                        A+
                      </option>

                      <option value="A-">
                        A-
                      </option>

                      <option value="B+">
                        B+
                      </option>

                      <option value="B-">
                        B-
                      </option>

                      <option value="AB+">
                        AB+
                      </option>

                      <option value="AB-">
                        AB-
                      </option>

                      <option value="O+">
                        O+
                      </option>

                      <option value="O-">
                        O-
                      </option>

                    </select>

                  </div>

                </div>

                <div className="border-t border-border my-6" />

                <div className="mb-4">

                  <h3 className="text-base font-bold text-foreground">
                    Emergency Contact
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1">
                    Optional contact information that can be used during care or emergencies.
                  </p>

                </div>

                <div className="grid sm:grid-cols-2 gap-5">

                  <div>

                    <label
                      htmlFor="emergencyContactName"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Contact Name
                    </label>

                    <input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      type="text"
                      value={
                        registrationForm
                          .emergencyContactName
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      placeholder="Optional"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="emergencyContactPhone"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Contact Phone
                    </label>

                    <input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={
                        registrationForm
                          .emergencyContactPhone
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      placeholder="Optional"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                  </div>

                  <div className="sm:col-span-2">

                    <label
                      htmlFor="emergencyContactRelationship"
                      className="block text-sm font-semibold text-foreground mb-2"
                    >
                      Relationship
                    </label>

                    <input
                      id="emergencyContactRelationship"
                      name="emergencyContactRelationship"
                      type="text"
                      value={
                        registrationForm
                          .emergencyContactRelationship
                      }
                      onChange={
                        handleRegistrationChange
                      }
                      disabled={
                        registering
                      }
                      placeholder="e.g. Daughter, Son, Spouse"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                  </div>

                </div>

                <div className="mt-7 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={
                      closeRegistrationModal
                    }
                    disabled={
                      registering
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={
                      registering
                    }
                  >
                    <UserPlus
                      size={16}
                      className="mr-2"
                    />

                    Register Patient
                  </Button>

                </div>

              </form>

            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default HospitalOPDPage;