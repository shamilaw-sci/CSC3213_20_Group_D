/**
 * @file    BookAppointmentPage.jsx
 * @module  Patient
 * @desc    Patient UI for selecting an AI-suggested appointment slot, with reschedule support.
 * @author  Member 2 (S/21/081)
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDoctorProfile, getAvailableSlots } from '../../services/doctor.service';
import { bookAppointment, updateAppointmentStatus } from '../../services/appointment.service';
import useAuthStore from '../../store/authStore';

export default function BookAppointmentPage() {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchParams] = useSearchParams();
  const rescheduleId = searchParams.get('reschedule');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  // STRICT CHECK: Is the ID missing or literally the word "undefined"?
  const isInvalidId = !doctorId || doctorId === 'undefined';

  const { data: doctor, isLoading: isLoadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => getDoctorProfile(doctorId),
    enabled: !isInvalidId, // Don't run query if ID is broken
  });

  const { data: slots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['slots', doctorId],
    queryFn: () => getAvailableSlots(doctorId),
    enabled: !isInvalidId,
  });

  const bookMutation = useMutation({
    mutationFn: (appointmentData) => bookAppointment(appointmentData),
    onSuccess: async () => {
      if (rescheduleId) {
        try {
          await updateAppointmentStatus(rescheduleId, 'cancelled');
          toast.success('Appointment rescheduled successfully!');
        } catch (error) {
          console.error("Cancellation error:", error);
          toast.error('Booked new time, but failed to cancel old appointment.');
        }
      } else {
        toast.success('Appointment booked successfully!');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      navigate('/patient/appointments'); 
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return toast.error('Please select an appointment slot');
    
    bookMutation.mutate({
      doctorId,
      patientId: TEST_PATIENT_ID,
      scheduledAt: selectedSlot,
      type: 'opd',
      notes: reason || 'Regular checkup'
    });
  };

  const formatSlotTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  // IF INVALID URL: Show graceful fallback instead of crashing
  if (isInvalidId) {
    return (
      <div className="max-w-3xl mx-auto p-10 text-center space-y-4 mt-10 bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Invalid Doctor Link</h1>
        <p className="text-gray-500">We couldn't identify the doctor for this booking.</p>
        <button onClick={() => navigate('/patient/doctors')} className="mt-4 px-6 py-2 bg-[#2E75B6] text-white rounded-lg hover:bg-[#1E3A5F]">
          Return to Doctor Search
        </button>
      </div>
    );
  }

  if (isLoadingDoctor || isLoadingSlots) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E75B6] mb-4"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>Doctor not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">
          {rescheduleId ? 'Reschedule Appointment' : 'Book Appointment'}
        </h1>
        <p className="text-gray-500 mt-1">Select an available slot below to confirm your booking.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
          <div className="bg-[#EBF5FF] p-4 rounded-full text-[#2E75B6]">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E3A5F]">Dr. {doctor.full_name}</h2>
            <p className="text-[#2E75B6] font-medium text-sm">{doctor.specialization}</p>
            <p className="text-gray-500 text-sm mt-1">{doctor.hospital_name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#2E75B6]" />
              Suggested Available Slots
            </label>
            
            {slots.length === 0 ? (
              <div className="p-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <p>No available slots found for this doctor right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center p-4 border rounded-lg text-left transition-all ${
                      selectedSlot === slot 
                        ? 'border-[#2E75B6] bg-[#F0F7FF] ring-1 ring-[#2E75B6]' 
                        : 'border-gray-200 hover:border-[#2E75B6] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <Clock className={`h-4 w-4 ${selectedSlot === slot ? 'text-[#2E75B6]' : 'text-gray-400'}`} />
                        {formatSlotTime(slot)}
                      </div>
                    </div>
                    {selectedSlot === slot && <CheckCircle2 className="h-5 w-5 text-[#2E75B6]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Regular Checkup, Fever, Consultation"
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#2E75B6] focus:border-[#2E75B6] outline-none transition-colors"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={slots.length === 0}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={!selectedSlot || bookMutation.isPending || slots.length === 0}
              className="w-full py-3 bg-[#2E75B6] hover:bg-[#1E3A5F] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookMutation.isPending ? 'Booking...' : (rescheduleId ? 'Confirm Reschedule' : 'Confirm Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}