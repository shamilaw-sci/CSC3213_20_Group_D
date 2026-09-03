/**
 * @file    DoctorProfilePage.jsx
 * @module  Doctor
 * @desc    Doctor profile and availability management page.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound, CalendarClock } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import useAuthStore from '../../store/authStore';

const API_URL = 'http://localhost:5000';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DoctorProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const DOCTOR_ID = user?.profile_id || user?.id || '';
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
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
    setSavingProfile(true);
    setAlert(null);
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
      setSavingProfile(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setSavingAvailability(true);
    setAlert(null);
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
      setSavingAvailability(false);
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-brand-deep rounded-xl shadow-md p-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">Doctor Profile</h1>
          <p className="text-sm font-medium text-brand-deep-foreground opacity-80 mt-1">
            SLMC: {doctor?.slmc_reg_number} — {doctor?.email}
          </p>
        </div>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold text-brand-deep-foreground hover:bg-white/20 transition-all duration-150 cursor-pointer"
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
      <Card title="Profile Information" icon={<UserRound size={20} />} className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Specialization"
              name="specialization"
              value={profileForm.specialization}
              onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
            />
            <Input
              label="Qualifications"
              name="qualifications"
              value={profileForm.qualifications}
              onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
            />
            <Input
              label="Years of Experience"
              name="years_experience"
              type="number"
              value={profileForm.years_experience}
              onChange={(e) => setProfileForm({ ...profileForm, years_experience: e.target.value })}
            />
            <Input
              label="Hospital Name"
              name="hospital_name"
              value={profileForm.hospital_name}
              onChange={(e) => setProfileForm({ ...profileForm, hospital_name: e.target.value })}
            />
        </div>
        <div className="mt-6 flex justify-end border-t border-border pt-4">
            <Button
              onClick={handleProfileSave}
              loading={savingProfile}
              variant="primary"
            >
              Save Profile
            </Button>
        </div>
      </Card>

      {/* Availability */}
      <Card title="Availability Schedule" icon={<CalendarClock size={20} />}>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const slot = availability.find((s) => s.day_of_week === day);
            return (
              <div
                key={day}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 border transition-colors duration-150 ${
                  slot ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-3 w-32">
                   <input
                    type="checkbox"
                    checked={!!slot}
                    onChange={() => toggleDay(day)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-bold text-foreground capitalize">
                    {day}
                  </span>
                </div>
               
                {slot ? (
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                     <div className="flex items-center gap-2">
                        <Input
                          label=""
                          type="time"
                          value={slot.start_time?.slice(0, 5) || '09:00'}
                          onChange={(e) => updateSlot(day, 'start_time', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm font-semibold text-muted-foreground px-1">to</span>
                        <Input
                          label=""
                          type="time"
                          value={slot.end_time?.slice(0, 5) || '17:00'}
                          onChange={(e) => updateSlot(day, 'end_time', e.target.value)}
                          className="w-32"
                        />
                     </div>
                     <div className="flex items-center gap-2 ml-auto">
                        <Input
                          label=""
                          type="number"
                          value={slot.slot_duration_minutes || 30}
                          onChange={(e) => updateSlot(day, 'slot_duration_minutes', parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm font-medium text-muted-foreground">min/slot</span>
                     </div>
                  </div>
                ) : (
                    <span className="text-sm font-medium text-muted-foreground">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end border-t border-border pt-4">
             <Button
              onClick={handleAvailabilitySave}
              loading={savingAvailability}
              variant="primary"
            >
              Save Availability
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default DoctorProfilePage;