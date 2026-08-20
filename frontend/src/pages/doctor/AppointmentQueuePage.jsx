/**
 * @file    AppointmentQueuePage.jsx
 * @module  Doctor
 * @desc    Today's appointment queue for the doctor.
 *          Shows all patients scheduled for today with status management.
 *          Auto-refreshes in the background so the doctor never has to
 *          manually reload to see queue changes.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConsultationNotesModal from '../../components/doctor/ConsultationNotesModal';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';
const AUTO_REFRESH_INTERVAL_MS = 20000; // 20s — background refresh, no manual reload needed

const AppointmentQueuePage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesModalAppointment, setNotesModalAppointment] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // silent = true for background polling (no spinner, no layout flash)
  const fetchAppointments = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/appointments/today`);
      const data = await res.json();
      setAppointments(data.data);
    } catch (error) {
      console.error('Queue fetch error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const intervalId = setInterval(() => {
      fetchAppointments({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const updateStatus = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchAppointments({ silent: true });
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Today's Appointment Queue
          </h1>
          <p className="text-sm text-slate-500">
            {appointments.length} appointment(s) scheduled for today
          </p>
        </div>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Appointment List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="text-green-500" size={40} />
          <p className="text-slate-600 font-medium">You're all caught up!</p>
          <p className="text-slate-400 text-sm">No patients in the queue right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isUpdating = updatingId === appt.id;
            return (
              <div
                key={appt.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {appt.patient_name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(appt.scheduled_at).toLocaleTimeString()} — {appt.type.toUpperCase()}
                    </p>
                  </div>
                  <Badge status={appt.status} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'in_progress')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Updating...' : 'Start Consultation'}
                    </button>
                  )}
                  {appt.status === 'in_progress' && (
                    <button
                      onClick={() => setNotesModalAppointment(appt)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Updating...' : 'Add Notes & Complete'}
                    </button>
                  )}
                  {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Updating...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConsultationNotesModal
        isOpen={!!notesModalAppointment}
        onClose={() => setNotesModalAppointment(null)}
        appointmentId={notesModalAppointment?.id}
        patientId={notesModalAppointment?.patient_id}
        doctorId={DOCTOR_ID}
        onSaved={() => updateStatus(notesModalAppointment?.id, 'completed')}
      />
    </div>
  );
};

export default AppointmentQueuePage;