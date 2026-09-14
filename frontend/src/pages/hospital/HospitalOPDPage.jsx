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
  UserRound,
  Users,
  X,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../services/api';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';

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

  const closeRegistrationModal =
    () => {
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
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Spinner
            size="lg"
          />

          <p className="text-sm font-medium text-muted-foreground">
            Loading today&apos;s OPD queue...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        <PageHeader
          eyebrow="Hospital Operations"
          title="Today&apos;s OPD"
          description="Hospital-wide view of today&apos;s patients across all doctors, with reception check-in and walk-in registration support."
          icon={Stethoscope}
          meta={
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users size={18} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                  Queue Today
                </p>

                <p className="text-sm font-bold text-foreground">
                  {stats.total} {stats.total === 1 ? 'Patient' : 'Patients'}
                </p>
              </div>

            </div>
          }
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-4">

          <Button
            variant="primary"
            onClick={
              openRegistrationModal
            }
          >
            <UserPlus
              size={16}
              className="mr-2"
            />

            Register Walk-in Patient
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              loadAppointments(
                true
              )
            }
            disabled={
              refreshing
            }
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </Button>

        </div>

      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <Card>

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

        <Card>

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

        <Card>

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

        <Card>

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

      </div>

      <Card
        title={
          <span className="flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-primary"
            />

            Patient Queue
          </span>
        }
      >

        {appointments.length ===
          0 ? (

          <div className="py-12 text-center">

            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">

              <CalendarDays
                size={28}
                className="text-muted-foreground"
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

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>

                <tr className="border-b border-border text-left">

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
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">

                          <Clock
                            size={15}
                            className="text-primary"
                          />

                          {formatTime(
                            appointment
                              .scheduled_at
                          )}

                        </div>

                      </td>

                      <td className="px-3 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">

                            <UserRound
                              size={16}
                              className="text-primary"
                            />

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

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Hospital staff manage patient arrival only. Consultation actions remain with the assigned doctor.
      </p>

      </main>

      {showRegistrationModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close registration modal"
            className="absolute inset-0 bg-black/50"
            onClick={
              closeRegistrationModal
            }
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assisted-registration-title"
            className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl shadow-2xl"
          >

            <div className="sticky top-0 z-10 bg-background border-b border-border px-5 sm:px-6 py-4 flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2 text-primary mb-1">

                  <UserPlus
                    size={18}
                  />

                  <span className="text-xs uppercase tracking-wider font-bold">
                    Hospital-assisted registration
                  </span>

                </div>

                <h2
                  id="assisted-registration-title"
                  className="text-xl font-bold text-foreground"
                >
                  Register Walk-in Patient
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
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
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            {registeredPatient ? (

              <div className="p-5 sm:p-6">

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">

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

                  <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">

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

                  <div className="mt-6 rounded-2xl border border-border bg-background p-6">

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
                            className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none resize-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                className="p-5 sm:p-6"
              >

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">

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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                      className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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