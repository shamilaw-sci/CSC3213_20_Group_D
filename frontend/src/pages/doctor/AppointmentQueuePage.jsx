/**
 * @file    AppointmentQueuePage.jsx
 * @module  Doctor
 * @desc    Today's appointment queue for the doctor.
 *          Shows all patients scheduled for today with status management.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

const DOCTOR_ID = '6ca0512b-568a-46df-9988-af31da406794';
const API_URL = 'http://localhost:5000';

const AppointmentQueuePage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/appointments/today`);
      const data = await res.json();
      setAppointments(data.data);
    } catch (error) {
      console.error('Queue fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAppointments();
    } catch (error) {
      console.error('Status update error:', error);
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
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
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
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Start Consultation
                  </button>
                )}
                {appt.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(appt.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
                {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                  <button
                    onClick={() => updateStatus(appt.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
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
};

export default AppointmentQueuePage;