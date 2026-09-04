/**
 * @file    MyAppointmentsPage.jsx
 * @module  Patient
 * @desc    Dashboard view for a patient to manage their appointments.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, XCircle, FileText, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatientAppointments, updateAppointmentStatus } from '../../services/appointment.service';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

export default function MyAppointmentsPage() {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey: ['patientAppointments', TEST_PATIENT_ID],
    queryFn: () => getPatientAppointments(TEST_PATIENT_ID),
    enabled: !!TEST_PATIENT_ID,
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentId) => updateAppointmentStatus(appointmentId, 'cancelled'),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    },
  });

  const handleCancel = (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelMutation.mutate(appointmentId);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge status="active" label="Scheduled" />;
      case 'completed':
        return <Badge status="completed" label="Completed" />;
      case 'cancelled':
        return <Badge status="cancelled" label="Cancelled" />;
      case 'in_progress':
        return <Badge status="pending" label="In Progress" />;
      default:
        return <Badge status="normal" label={status} />;
    }
  };

  const sortedAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];
    
    return [...appointments].sort((a, b) => {
      const statusPriority = { 'in_progress': 1, 'scheduled': 2, 'completed': 3, 'cancelled': 4 };
      const priorityA = statusPriority[a.status] || 5;
      const priorityB = statusPriority[b.status] || 5;
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    });
  }, [appointments]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <p className="text-muted-foreground mt-1">View and manage your upcoming and past medical visits.</p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your appointments...</p>
        </div>
      )}

      {isError && (
        <Alert type="error" message={`Failed to load appointments: ${error?.message}. Please try again later.`} />
      )}

      {!isLoading && !isError && sortedAppointments.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No appointments found</h3>
          <p className="text-muted-foreground mt-1 mb-6">You don't have any appointments booked yet.</p>
          <Button variant="primary" onClick={() => navigate('/patient/doctors')}>
            Find a Doctor
          </Button>
        </div>
      )}

      {!isLoading && !isError && sortedAppointments.length > 0 && (
        <div className="space-y-4">
          {sortedAppointments.map((apt) => (
            <div key={apt.id} className={`bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${apt.status === 'cancelled' ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${apt.status === 'cancelled' ? 'text-muted-foreground' : 'text-foreground'}`}>Dr. {apt.doctor_name}</h3>
                    <p className="text-sm text-muted-foreground">{apt.doctor_specialization}</p>
                  </div>
                  <div className="ml-auto md:ml-4">
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(apt.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{apt.type} {apt.notes && `- ${apt.notes}`}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 md:border-l md:border-border md:pl-6 w-full md:w-auto mt-4 md:mt-0">
                {apt.status === 'scheduled' && (
                  <>
                    <Button
                      variant="secondary"
                      icon={<CalendarClock className="h-4 w-4" />}
                      className="w-full md:w-auto"
                      onClick={() => {
                        // SAFE FALLBACK: Grab the ID whether it's snake_case or camelCase
                        const targetId = apt.doctor_id || apt.doctorId;
                        
                        if (!targetId || String(targetId) === 'undefined') {
                          toast.error("Database error: Doctor ID missing. Please book a new appointment.");
                          return; 
                        }

                        navigate(`/patient/book-appointment/${targetId}?reschedule=${apt.id}`);
                      }}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="danger"
                      icon={<XCircle className="h-4 w-4" />}
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancelMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}