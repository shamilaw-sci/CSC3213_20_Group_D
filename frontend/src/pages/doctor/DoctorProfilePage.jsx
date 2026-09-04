/**
 * @file    DoctorProfilePage.jsx
 * @module  Doctor
 * @desc    Doctor profile and availability management page.
 * @author  Tharindu (S/21/166)
 */

import {
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  UserRound,
  CalendarClock,
  Camera
} from 'lucide-react';

import toast from 'react-hot-toast';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import useAuthStore from '../../store/authStore';

import {
  uploadDoctorPhoto
} from '../../services/doctor.service';

const API_URL = 'http://localhost:5000';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// ─── Photo upload constraints (mirrors backend middleware/upload.js) ──────────
const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_PHOTO_SIZE_BYTES =
  2 * 1024 * 1024; // 2MB

const getAvatarSrc = (doctor) => {
  if (doctor?.photo_url) {
    return doctor.photo_url;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    doctor?.full_name || 'Doctor'
  )}&background=0D9488&color=fff&size=120&bold=true&rounded=true`;
};

const DoctorProfilePage = () => {
  const user =
    useAuthStore((state) => state.user);

  const DOCTOR_ID =
    user?.profile_id || user?.id || '';

  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [
    savingAvailability,
    setSavingAvailability
  ] = useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto
  ] = useState(false);

  const [alert, setAlert] =
    useState(null);

  // ── Photo Upload State ──
  const photoInputRef = useRef(null);
  
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    qualifications: '',
    years_experience: '',
    hospital_name: '',
  });

  const [availability, setAvailability] =
    useState([]);

  const fetchData = useCallback(async () => {
    if (!DOCTOR_ID) return;

    try {
      const [docRes, availRes] =
        await Promise.all([
          fetch(
            `${API_URL}/api/doctors/${DOCTOR_ID}`,
            {
              credentials: 'include'
            }
          ),

          fetch(
            `${API_URL}/api/doctors/${DOCTOR_ID}/availability`,
            {
              credentials: 'include'
            }
          ),
        ]);

      const docData =
        await docRes.json();

      const availData =
        await availRes.json();

      setDoctor(docData.data);

      setProfileForm({
        specialization:
          docData.data?.specialization || '',

        qualifications:
          docData.data?.qualifications || '',

        years_experience:
          docData.data?.years_experience || '',

        hospital_name:
          docData.data?.hospital_name || '',
      });

      setAvailability(
        availData.data || []
      );

    } catch (error) {
      console.error(
        'Profile fetch error:',
        error
      );

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
      const res = await fetch(
        `${API_URL}/api/doctors/${DOCTOR_ID}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          credentials: 'include',

          body: JSON.stringify(profileForm),
        }
      );

      const data = await res.json();

      if (data.success) {
        setDoctor((previousDoctor) => ({
          ...previousDoctor,
          ...data.data
        }));

        setAlert({
          type: 'success',
          message:
            'Profile updated successfully!'
        });

      } else {
        setAlert({
          type: 'error',
          message:
            'Failed to update profile.'
        });
      }

    } catch {
      setAlert({
        type: 'error',
        message:
          'Something went wrong.'
      });

    } finally {
      setSavingProfile(false);
    }
  };

  // ── Doctor Profile Photo Handlers ──
  const handlePhotoButtonClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast.error(
        'Please select a JPEG, PNG, or WEBP image.'
      );

      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      toast.error(
        'Image must be 2MB or smaller.'
      );

      return;
    }

    setUploadingPhoto(true);

    try {
      const updatedDoctor =
        await uploadDoctorPhoto(
          DOCTOR_ID,
          file
        );

      setDoctor((previousDoctor) => ({
        ...previousDoctor,
        ...updatedDoctor
      }));

      toast.success(
        'Profile photo updated'
      );

    } catch (error) {
      console.error(
        'Doctor photo upload error:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to upload photo.'
      );

    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setSavingAvailability(true);
    setAlert(null);

    try {
      const res = await fetch(
        `${API_URL}/api/doctors/${DOCTOR_ID}/availability`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          credentials: 'include',

          body: JSON.stringify({
            slots: availability
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setAlert({
          type: 'success',
          message:
            'Availability updated successfully!'
        });

      } else {
        setAlert({
          type: 'error',
          message:
            'Failed to update availability.'
        });
      }

    } catch {
      setAlert({
        type: 'error',
        message:
          'Something went wrong.'
      });

    } finally {
      setSavingAvailability(false);
    }
  };

  const toggleDay = (day) => {
    const exists =
      availability.find(
        (s) => s.day_of_week === day
      );

    if (exists) {
      setAvailability(
        availability.filter(
          (s) => s.day_of_week !== day
        )
      );

    } else {
      setAvailability([
        ...availability,

        {
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration_minutes: 30,
          is_active: true
        },
      ]);
    }
  };

  const updateSlot = (
    day,
    field,
    value
  ) => {
    setAvailability(
      availability.map((s) =>
        s.day_of_week === day
          ? {
              ...s,
              [field]: value
            }
          : s
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

        <div className="flex items-center gap-5">

          {/* Doctor Profile Photo */}
          <div className="relative w-24 h-24 shrink-0">

            <img
              src={getAvatarSrc(doctor)}
              alt="Doctor Profile"
              className="w-24 h-24 rounded-full border-2 border-white/30 shadow-md object-cover"
            />

            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Spinner
                  size="sm"
                  color="text-white"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handlePhotoButtonClick}
              disabled={uploadingPhoto}
              title="Change profile photo"
              className="absolute -bottom-0.5 -right-0.5 p-2 bg-white rounded-full shadow-sm border border-border hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <Camera
                size={15}
                className="text-primary"
              />
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoFileChange}
            />

          </div>

          <div>
            <h1 className="text-2xl font-bold text-brand-deep-foreground">
              Doctor Profile
            </h1>

            {doctor?.full_name && (
              <p className="text-base font-semibold text-brand-deep-foreground mt-1">
                {doctor.full_name}
              </p>
            )}

            <p className="text-sm font-medium text-brand-deep-foreground opacity-80 mt-1">
              SLMC: {doctor?.slmc_reg_number} — {doctor?.email}
            </p>
          </div>

        </div>

        <button
          onClick={() =>
            navigate('/doctor/dashboard')
          }
          className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold text-brand-deep-foreground hover:bg-white/20 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

      </div>

      {/* Alert */}
      {alert && (
        <div className="mb-6">
          <Alert
            type={alert.type}
            message={alert.message}
          />
        </div>
      )}

      {/* Profile Form */}
      <Card
        title="Profile Information"
        icon={<UserRound size={20} />}
        className="mb-6"
      >

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Input
            label="Specialization"
            name="specialization"
            value={
              profileForm.specialization
            }
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                specialization:
                  e.target.value
              })
            }
          />

          <Input
            label="Qualifications"
            name="qualifications"
            value={
              profileForm.qualifications
            }
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                qualifications:
                  e.target.value
              })
            }
          />

          <Input
            label="Years of Experience"
            name="years_experience"
            type="number"
            value={
              profileForm.years_experience
            }
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                years_experience:
                  e.target.value
              })
            }
          />

          <Input
            label="Hospital Name"
            name="hospital_name"
            value={
              profileForm.hospital_name
            }
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                hospital_name:
                  e.target.value
              })
            }
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
      <Card
        title="Availability Schedule"
        icon={<CalendarClock size={20} />}
      >

        <div className="space-y-3">

          {DAYS.map((day) => {
            const slot =
              availability.find(
                (s) =>
                  s.day_of_week === day
              );

            return (
              <div
                key={day}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 border transition-colors duration-150 ${
                  slot
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-transparent border-transparent hover:bg-secondary/50'
                }`}
              >

                <div className="flex items-center gap-3 w-32">

                  <input
                    type="checkbox"
                    checked={!!slot}
                    onChange={() =>
                      toggleDay(day)
                    }
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
                        value={
                          slot.start_time?.slice(
                            0,
                            5
                          ) || '09:00'
                        }
                        onChange={(e) =>
                          updateSlot(
                            day,
                            'start_time',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />

                      <span className="text-sm font-semibold text-muted-foreground px-1">
                        to
                      </span>

                      <Input
                        label=""
                        type="time"
                        value={
                          slot.end_time?.slice(
                            0,
                            5
                          ) || '17:00'
                        }
                        onChange={(e) =>
                          updateSlot(
                            day,
                            'end_time',
                            e.target.value
                          )
                        }
                        className="w-32"
                      />

                    </div>

                    <div className="flex items-center gap-2 ml-auto">

                      <Input
                        label=""
                        type="number"
                        value={
                          slot.slot_duration_minutes ||
                          30
                        }
                        onChange={(e) =>
                          updateSlot(
                            day,
                            'slot_duration_minutes',
                            parseInt(
                              e.target.value
                            )
                          )
                        }
                        className="w-24"
                      />

                      <span className="text-sm font-medium text-muted-foreground">
                        min/slot
                      </span>

                    </div>

                  </div>

                ) : (

                  <span className="text-sm font-medium text-muted-foreground">
                    Unavailable
                  </span>

                )}

              </div>
            );
          })}

        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-4">

          <Button
            onClick={
              handleAvailabilitySave
            }
            loading={
              savingAvailability
            }
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