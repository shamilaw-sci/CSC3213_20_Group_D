/**
 * @file    DoctorProfilePage.jsx
 * @module  Doctor
 * @desc    Doctor profile and availability management page.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound, CalendarClock } from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import useAuthStore from '../../store/authStore';

const API_URL = 'http://localhost:5000';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DoctorProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const DOCTOR_ID = user?.profile_id || user?.id || '';
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    qualifications: '',
    years_experience: '',
    hospital_name: '',
  });
  const [availability, setAvailability] = useState([]);

  const fetchData = useCallback(async () => {
    if (!DOCTOR_ID) return;
    try {
      const [docRes, availRes] = await Promise.all([
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}`),
        fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/availability`),
      ]);
      const docData = await docRes.json();
      const availData = await availRes.json();
      setDoctor(docData.data);
      setProfileForm({
        specialization: docData.data?.specialization || '',
        qualifications: docData.data?.qualifications || '',
        years_experience: docData.data?.years_experience || '',
        hospital_name: docData.data?.hospital_name || '',
      });
      setAvailability(availData.data || []);
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [DOCTOR_ID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/doctors/${DOCTOR_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Profile updated successfully!' });
      } else {
        setAlert({ type: 'error', message: 'Failed to update profile.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: availability }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Availability updated successfully!' });
      } else {
        setAlert({ type: 'error', message: 'Failed to update availability.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    const exists = availability.find((s) => s.day_of_week === day);
    if (exists) {
      setAvailability(availability.filter((s) => s.day_of_week !== day));
    } else {
      setAvailability([
        ...availability,
        { day_of_week: day, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
      ]);
    }
  };

  const updateSlot = (day, field, value) => {
    setAvailability(
      availability.map((s) =>
        s.day_of_week === day ? { ...s, [field]: value } : s
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-linear-to-r from-slate-900 to-blue-950 rounded-xl shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctor Profile</h1>
          <p className="text-sm text-blue-200 mt-1">
            SLMC: {doctor?.slmc_reg_number} — {doctor?.email}
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

      {/* Alert */}
      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.message} />
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserRound size={18} className="text-blue-800" />
          <h2 className="text-xl font-semibold text-slate-700">
            Profile Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Specialization</label>
            <input
              type="text"
              value={profileForm.specialization}
              onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Qualifications</label>
            <input
              type="text"
              value={profileForm.qualifications}
              onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Years of Experience</label>
            <input
              type="number"
              value={profileForm.years_experience}
              onChange={(e) => setProfileForm({ ...profileForm, years_experience: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Hospital Name</label>
            <input
              type="text"
              value={profileForm.hospital_name}
              onChange={(e) => setProfileForm({ ...profileForm, hospital_name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>
        <button
          onClick={handleProfileSave}
          disabled={saving}
          className="mt-4 px-6 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors duration-150"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-teal-600 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={18} className="text-teal-600" />
          <h2 className="text-xl font-semibold text-slate-700">
            Availability Schedule
          </h2>
        </div>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const slot = availability.find((s) => s.day_of_week === day);
            return (
              <div
                key={day}
                className={`flex items-center gap-4 rounded-lg px-3 py-2 transition-colors duration-150 ${
                  slot ? 'bg-blue-50/60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!slot}
                  onChange={() => toggleDay(day)}
                  className="w-4 h-4 accent-blue-700"
                />
                <span className="text-sm font-medium text-slate-700 w-24 capitalize">
                  {day}
                </span>
                {slot && (
                  <>
                    <input
                      type="time"
                      value={slot.start_time?.slice(0, 5) || '09:00'}
                      onChange={(e) => updateSlot(day, 'start_time', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                    <span className="text-sm text-slate-500">to</span>
                    <input
                      type="time"
                      value={slot.end_time?.slice(0, 5) || '17:00'}
                      onChange={(e) => updateSlot(day, 'end_time', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      value={slot.slot_duration_minutes || 30}
                      onChange={(e) => updateSlot(day, 'slot_duration_minutes', parseInt(e.target.value))}
                      className="px-2 py-1 border border-slate-300 rounded text-sm w-16"
                    />
                    <span className="text-sm text-slate-500">min/slot</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={handleAvailabilitySave}
          disabled={saving}
          className="mt-6 px-6 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors duration-150"
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  );
};

export default DoctorProfilePage;