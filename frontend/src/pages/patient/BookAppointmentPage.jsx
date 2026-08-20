/**
 * @file    BookAppointmentPage.jsx
 * @module  Patient
 * @desc    Patient UI for selecting an AI-suggested appointment slot.
 * @author  Member 2 (S/21/081)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDoctorProfile, getAvailableSlots } from '../../services/doctor.service';
import { bookAppointment } from '../../services/appointment.service';

// TEMPORARY: hardcoded test patient UUID until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  // Fetch Doctor details
  const { data: doctor, isLoading: isLoadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => getDoctorProfile(doctorId),
  });

  // Fetch Next 3 Available Slots
  const { data: slots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['slots', doctorId],
    queryFn: () => getAvailableSlots(doctorId),
  });

  // Booking Mutation
  const bookMutation = useMutation({
    mutationFn: (appointmentData) => bookAppointment(appointmentData),
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      // We will navigate to "My Appointments" in the next ticket. 
      // For now, go back to the search page.
      navigate('/patient/doctors'); 
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select an appointment slot');
      return;
    }
    
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Book Appointment</h1>
        <p className="text-gray-500 mt-1">Select an available slot below to confirm your booking.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Doctor Info Card */}
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

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Smart Slot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
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

          {/* Reason Input */}
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

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={!selectedSlot || bookMutation.isPending || slots.length === 0}
              className="w-full py-3 bg-[#2E75B6] hover:bg-[#1E3A5F] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookMutation.isPending ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}