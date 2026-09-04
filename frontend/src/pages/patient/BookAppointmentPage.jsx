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
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

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
      <div className="max-w-3xl mx-auto p-10 text-center space-y-4 mt-10 bg-card rounded-xl shadow-sm border border-border">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-foreground">Invalid Doctor Link</h1>
        <p className="text-muted-foreground">We couldn't identify the doctor for this booking.</p>
        <Button variant="secondary" onClick={() => navigate('/patient/doctors')} className="mt-4">
          Return to Doctor Search
        </Button>
      </div>
    );
  }

  if (isLoadingDoctor || isLoadingSlots) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6">
        <Alert type="error" message="Doctor not found." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {rescheduleId ? 'Reschedule Appointment' : 'Book Appointment'}
        </h1>
        <p className="text-muted-foreground mt-1">Select an available slot below to confirm your booking.</p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 bg-secondary border-b border-border flex items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Dr. {doctor.full_name}</h2>
            <p className="text-primary font-medium text-sm">{doctor.specialization}</p>
            <p className="text-muted-foreground text-sm mt-1">{doctor.hospital_name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Suggested Available Slots
            </label>
            
            {slots.length === 0 ? (
              <Alert type="info" message="No available slots found for this doctor right now." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center p-4 border rounded-lg text-left transition-all ${
                      selectedSlot === slot 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                        : 'border-border hover:border-primary hover:bg-secondary'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <Clock className={`h-4 w-4 ${selectedSlot === slot ? 'text-primary' : 'text-muted-foreground'}`} />
                        {formatSlotTime(slot)}
                      </div>
                    </div>
                    {selectedSlot === slot && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Reason for Visit (Optional)"
            name="reason"
            type="text"
            placeholder="e.g. Regular Checkup, Fever, Consultation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={slots.length === 0}
          />

          <div className="pt-4 border-t border-border">
            <Button
              type="submit"
              size="lg"
              disabled={!selectedSlot || slots.length === 0}
              loading={bookMutation.isPending}
              className="w-full"
            >
              {rescheduleId ? 'Confirm Reschedule' : 'Confirm Appointment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}