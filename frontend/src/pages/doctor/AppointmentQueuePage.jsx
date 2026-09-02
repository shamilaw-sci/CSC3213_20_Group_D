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
import { CheckCircle2, ArrowLeft, Clock, Play, ClipboardCheck, Pill, History, XCircle, ClipboardList } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConsultationNotesModal from '../../components/doctor/ConsultationNotesModal';
import PatientNotesModal from '../../components/doctor/PatientNotesModal';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';
const AUTO_REFRESH_INTERVAL_MS = 20000; // 20s — background refresh, no manual reload needed

// Top-border accent color per status — same "border-t-4" card language as the
// Dashboard's stat cards, so the whole module feels like one consistent design.
const STATUS_BORDER = {
  scheduled: 'border-t-slate-400',
  in_progress: 'border-t-blue-700',
  completed: 'border-t-teal-600',
  cancelled: 'border-t-red-400',
};

// Shared pill style for every action button — same shape/size/icon layout,
// glassy frosted look (semi-transparent + blur), only the color changes per action.
const ACTION_BTN =
  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl backdrop-blur-sm border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.02]';

// Turns a full name into initials for the avatar circle, e.g. "Nimasha Perera" -> "NP"
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ClipboardList className="text-blue-200" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Today's Appointment Queue
            </h1>
            <p className="text-sm text-blue-200 mt-1">
              {appointments.length} appointment(s) scheduled for today
            </p>
          </div>
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
                className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-t-4 ${borderColor} p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 text-white flex items-center justify-center text-sm font-semibold shrink-0 ring-2 ring-white shadow-sm">
                      {getInitials(appt.patient_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {appt.patient_name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 w-fit">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(appt.scheduled_at).toLocaleTimeString()} — {appt.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Badge status={appt.status} />
                </div>

                {/* Action Buttons — same pill shape/size for every action, color-coded */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'in_progress')}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-blue-700/80 text-white border-white/20 hover:bg-blue-700/95`}
                    >
                      <Play size={15} />
                      {isUpdating ? 'Updating...' : 'Start Consultation'}
                    </button>
                  )}
                  {appt.status === 'in_progress' && (
                    <button
                      onClick={() => setNotesModalAppointment(appt)}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-teal-600/80 text-white border-white/20 hover:bg-teal-600/95`}
                    >
                      <ClipboardCheck size={15} />
                      {isUpdating ? 'Updating...' : 'Add Notes & Complete'}
                    </button>
                  )}
                  {(appt.status === 'in_progress' || appt.status === 'completed') && (
                    <button
                      onClick={() => goToIssuePrescription(appt)}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-blue-600/80 text-white border-white/20 hover:bg-blue-600/95`}
                    >
                      <Pill size={15} />
                      Issue Prescription
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryModalAppointment(appt)}
                    disabled={isUpdating}
                    className={`${ACTION_BTN} bg-slate-600/80 text-white border-white/20 hover:bg-slate-600/95`}
                  >
                    <History size={15} />
                    View Notes
                  </button>
                  {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-red-600/80 text-white border-white/20 hover:bg-red-600/95`}
                    >
                      <XCircle size={15} />
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