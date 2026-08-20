/**
 * @file    MyAppointmentsPage.jsx
 * @module  Patient
 * @desc    Dashboard view for a patient to manage their appointments.
 * @author  Member 2 (S/21/081)
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, XCircle, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatientAppointments, updateAppointmentStatus } from '../../services/appointment.service';

// TEMPORARY: hardcoded test patient UUID until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

export default function MyAppointmentsPage() {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey: ['patientAppointments', TEST_PATIENT_ID],
    queryFn: () => getPatientAppointments(TEST_PATIENT_ID),
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentId) => updateAppointmentStatus(appointmentId, 'cancelled'),
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries(['patientAppointments', TEST_PATIENT_ID]);
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
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Scheduled</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Cancelled</span>;
      case 'in_progress':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">In Progress</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">My Appointments</h1>
        <p className="text-gray-500 mt-1">View and manage your upcoming and past medical visits.</p>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E75B6] mb-4"></div>
          <p>Loading your appointments...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load appointments: {error?.message}. Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-[#2E75B6]" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
          <p className="text-gray-500 mt-1 mb-6">You don't have any appointments booked yet.</p>
          <a href="/patient/doctors" className="inline-block px-6 py-2 bg-[#2E75B6] text-white font-medium rounded-lg hover:bg-[#1E3A5F] transition-colors">
            Find a Doctor
          </a>
        </div>
      )}

      {/* Appointments List */}
      {!isLoading && !isError && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EBF5FF] p-2 rounded-lg text-[#2E75B6]">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E3A5F]">Dr. {apt.doctor_name}</h3>
                    <p className="text-sm text-gray-500">{apt.doctor_specialization}</p>
                  </div>
                  <div className="ml-auto md:ml-4">
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDateTime(apt.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="capitalize">{apt.type} {apt.notes && `- ${apt.notes}`}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 md:border-l md:border-gray-100 md:pl-6">
                {apt.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancel(apt.id)}
                    disabled={cancelMutation.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors w-full md:w-auto disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}