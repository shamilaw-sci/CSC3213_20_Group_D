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
import { CheckCircle2, ArrowLeft, Clock } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConsultationNotesModal from '../../components/doctor/ConsultationNotesModal';
import PatientNotesModal from '../../components/doctor/PatientNotesModal';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';
const AUTO_REFRESH_INTERVAL_MS = 20000; // 20s — background refresh, no manual reload needed

// Left-border accent color per status — quick visual scan for a busy doctor
const STATUS_BORDER = {
  scheduled: 'border-l-slate-400',
  in_progress: 'border-l-blue-700',
  completed: 'border-l-teal-600',
  cancelled: 'border-l-red-400',
};

const AppointmentQueuePage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesModalAppointment, setNotesModalAppointment] = useState(null);
  const [historyModalAppointment, setHistoryModalAppointment] = useState(null);
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

  // Sends the doctor to the Issue Prescription page with the patient
  // already picked — no need to type/paste a patient UUID by hand.
  const goToIssuePrescription = (appt) => {
    navigate('/doctor/issue-prescription', {
      state: {
        patientId: appt.patient_id,
        patientName: appt.patient_name,
        appointmentId: appt.id,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-slate-900 to-blue-950 rounded-xl shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Today's Appointment Queue
          </h1>
          <p className="text-sm text-blue-200 mt-1">
            {appointments.length} appointment(s) scheduled for today
          </p>
        </div>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-blue-100 hover:bg-white/20 hover:text-white transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Appointment List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="text-green-500" size={40} />
          <p className="text-slate-600 font-medium">You're all caught up!</p>
          <p className="text-slate-400 text-sm">No patients in the queue right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isUpdating = updatingId === appt.id;
            const borderColor = STATUS_BORDER[appt.status] || STATUS_BORDER.scheduled;
            return (
              <div
                key={appt.id}
                className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${borderColor} p-6 hover:shadow-md transition-shadow duration-150`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {appt.patient_name}
                    </h3>
                    <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                      <Clock size={14} className="text-slate-400" />
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
                      className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {isUpdating ? 'Updating...' : 'Start Consultation'}
                    </button>
                  )}
                  {appt.status === 'in_progress' && (
                    <button
                      onClick={() => setNotesModalAppointment(appt)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {isUpdating ? 'Updating...' : 'Add Notes & Complete'}
                    </button>
                  )}
                  {(appt.status === 'in_progress' || appt.status === 'completed') && (
                    <button
                      onClick={() => goToIssuePrescription(appt)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      Issue Prescription
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryModalAppointment(appt)}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    View Notes
                  </button>
                  {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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

      <PatientNotesModal
        isOpen={!!historyModalAppointment}
        onClose={() => setHistoryModalAppointment(null)}
        patientId={historyModalAppointment?.patient_id}
        patientName={historyModalAppointment?.patient_name}
      />
    </div>
  );
};

export default AppointmentQueuePage;