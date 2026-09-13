/**
 * @file    HospitalOPDPage.jsx
 * @module  Hospital
 * @desc    Hospital-wide OPD queue for reception and hospital staff.
 *          Displays today's appointments across all doctors and
 *          allows scheduled patients to be checked in.
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
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../services/api';

import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <div className="flex items-center gap-2 text-primary mb-1">

            <Stethoscope
              size={20}
            />

            <span className="text-xs uppercase tracking-wider font-bold">
              Hospital Operations
            </span>

          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Today&apos;s OPD
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Hospital-wide view of today&apos;s patients across all doctors.
          </p>

        </div>

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

    </div>
  );
};

export default HospitalOPDPage;