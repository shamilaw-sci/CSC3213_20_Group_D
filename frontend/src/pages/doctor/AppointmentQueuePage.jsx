/**
 * @file    AppointmentQueuePage.jsx
 * @module  Doctor
 * @desc    Today's appointment queue for the doctor.
 *          Shows all patients scheduled for today with status management.
 *          Auto-refreshes in the background so the doctor never has to
 *          manually reload to see queue changes.
 * @author  Tharindu (S/21/166)
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Clock, Play, ClipboardCheck, Pill, History, XCircle, ClipboardList } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConsultationNotesModal from '../../components/doctor/ConsultationNotesModal';
import PatientNotesModal from '../../components/doctor/PatientNotesModal';
import useAuthStore from '../../store/authStore';

const API_URL = 'http://localhost:5000';
const AUTO_REFRESH_INTERVAL_MS = 20000; // 20s — background refresh, no manual reload needed

// Shared pill style for every action button — same shape/size/icon layout,
// glassy frosted look (semi-transparent + blur), only the color changes per action.
const ACTION_BTN =
  'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl backdrop-blur-sm border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2';

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
  const user = useAuthStore((state) => state.user);
  const DOCTOR_ID = user?.profile_id || user?.id || '';
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesModalAppointment, setNotesModalAppointment] = useState(null);
  const [historyModalAppointment, setHistoryModalAppointment] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // silent = true for background polling (no spinner, no layout flash)
  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (!DOCTOR_ID) return;
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
  }, [DOCTOR_ID]);

  useEffect(() => {
    fetchAppointments();

    const intervalId = setInterval(() => {
      fetchAppointments({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchAppointments]);

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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-brand-deep rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ClipboardList className="text-brand-deep-foreground opacity-90" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-deep-foreground">
              Today's Appointment Queue
            </h1>
            <p className="text-sm font-medium text-brand-deep-foreground opacity-80 mt-1">
              {appointments.length} appointment(s) scheduled for today
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold text-brand-deep-foreground hover:bg-white/20 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Appointment List */}
      {appointments.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center flex flex-col items-center gap-3">
          <CheckCircle2 className="text-success" size={40} />
          <p className="text-foreground font-bold">You're all caught up!</p>
          <p className="text-muted-foreground text-sm font-medium">No patients in the queue right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isUpdating = updatingId === appt.id;
            return (
              <div
                key={appt.id}
                className="bg-card relative overflow-hidden rounded-xl shadow-sm border border-border p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
              >
                {/* Premium UI Polish: Tiny teal gradient at the top of the card (matching the new Card component style) */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary/30" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {getInitials(appt.patient_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {appt.patient_name}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1 bg-secondary rounded-full px-2.5 py-0.5 w-fit">
                        <Clock size={12} className="text-muted-foreground" />
                        {new Date(appt.scheduled_at).toLocaleTimeString()} — {appt.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Badge status={appt.status} />
                </div>

                {/* Action Buttons — same pill shape/size for every action, color-coded */}
                <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border relative z-10">
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'in_progress')}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground focus:ring-primary`}
                    >
                      <Play size={15} />
                      {isUpdating ? 'Updating...' : 'Start Consultation'}
                    </button>
                  )}
                  {appt.status === 'in_progress' && (
                    <button
                      onClick={() => setNotesModalAppointment(appt)}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-primary text-primary-foreground border-primary hover:opacity-90 focus:ring-primary`}
                    >
                      <ClipboardCheck size={15} />
                      {isUpdating ? 'Updating...' : 'Add Notes & Complete'}
                    </button>
                  )}
                  {(appt.status === 'in_progress' || appt.status === 'completed') && (
                    <button
                      onClick={() => goToIssuePrescription(appt)}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-secondary text-primary border-primary hover:bg-primary/10 focus:ring-primary`}
                    >
                      <Pill size={15} />
                      Issue Prescription
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryModalAppointment(appt)}
                    disabled={isUpdating}
                    className={`${ACTION_BTN} bg-white text-foreground border-border hover:bg-secondary focus:ring-ring`}
                  >
                    <History size={15} />
                    View Notes
                  </button>
                  {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      disabled={isUpdating}
                      className={`${ACTION_BTN} bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground focus:ring-destructive`}
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