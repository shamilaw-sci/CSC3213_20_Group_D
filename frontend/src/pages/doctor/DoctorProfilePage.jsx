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
  CalendarClock,
  Camera,
  Clock3,
  Save,
  Stethoscope,
  UserRound
} from 'lucide-react';

import toast from 'react-hot-toast';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
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
  )}&background=2563EB&color=fff&size=120&bold=true&rounded=true`;
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

      if (
        !docRes.ok ||
        !docData.success
      ) {
        throw new Error(
          docData.message ||
          'Failed to load doctor profile.'
        );
      }

      if (
        !availRes.ok ||
        !availData.success
      ) {
        throw new Error(
          availData.message ||
          'Failed to load doctor availability.'
        );
      }

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

      setAlert({
        type: 'error',
        message:
          error.message ||
          'Unable to load doctor profile information.'
      });

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
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner size="lg" />

        <p className="text-sm text-muted-foreground">
          Loading doctor profile...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Doctor Portal"
        icon={Stethoscope}
        title="Doctor Profile"
        description="Manage your professional information, profile photo, and weekly consultation availability."
        actions={
          <button
            type="button"
            onClick={() =>
              navigate('/doctor/dashboard')
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              w-full
              sm:w-auto
              px-4
              py-2.5
              rounded-xl
              bg-white/10
              border
              border-white/20
              text-white
              text-sm
              font-semibold
              backdrop-blur-sm
              hover:bg-white/15
              hover:border-white/30
              transition-all
              focus:outline-none
              focus:ring-2
              focus:ring-white/30
            "
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
        }
        meta={
          <div className="flex items-center gap-4">

            <div className="relative w-16 h-16 shrink-0">

              <img
                src={getAvatarSrc(doctor)}
                alt="Doctor Profile"
                className="w-16 h-16 rounded-full border-2 border-border shadow-sm object-cover bg-card"
              />

              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}

              <button
                type="button"
                onClick={handlePhotoButtonClick}
                disabled={uploadingPhoto}
                title="Change profile photo"
                className="
                  absolute
                  -bottom-1
                  -right-1
                  w-7
                  h-7
                  rounded-full
                  bg-primary
                  text-primary-foreground
                  shadow-md
                  flex
                  items-center
                  justify-center
                  hover:opacity-90
                  transition-opacity
                  disabled:opacity-50
                "
              >
                <Camera size={13} />
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoFileChange}
              />

            </div>

            <div className="min-w-0">

              <p className="text-base font-bold text-foreground truncate">
                {doctor?.full_name || 'Doctor'}
              </p>

              <p className="text-xs text-primary font-semibold mt-0.5">
                {doctor?.specialization || 'Specialization not set'}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                SLMC: {doctor?.slmc_reg_number || '—'}
              </p>

            </div>

          </div>
        }
      />

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
        />
      )}

      {/* Profile Form */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <UserRound
              size={18}
              className="text-primary"
            />
            Professional Information
          </span>
        }
      >

        <div className="mb-5 rounded-xl bg-module-soft/60 px-4 py-3">

          <p className="text-sm font-semibold text-foreground">
            Keep your professional details current
          </p>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            These details are used across the doctor portal and may be shown to patients when they search for doctors.
          </p>

        </div>

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
            min="0"
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

        <div className="mt-6 flex justify-end border-t border-border pt-5">

          <Button
            onClick={handleProfileSave}
            loading={savingProfile}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Save
              size={16}
              className="mr-2"
            />
            Save Profile
          </Button>

        </div>

      </Card>

      {/* Availability */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <CalendarClock
              size={18}
              className="text-primary"
            />
            Availability Schedule
          </span>
        }
      >

        <div className="mb-5 rounded-xl bg-secondary/45 px-4 py-3 flex items-start gap-3">

          <div className="w-9 h-9 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

            <Clock3 size={17} />

          </div>

          <div>

            <p className="text-sm font-semibold text-foreground">
              Weekly consultation hours
            </p>

            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Enable the days you are available, then set the start time, end time, and appointment slot duration.
            </p>

          </div>

        </div>

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
                className={`rounded-xl border p-4 transition-colors duration-150 ${
                  slot
                    ? 'bg-module-soft/45 border-primary/20'
                    : 'bg-secondary/25 border-border'
                }`}
              >

                <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                  <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">

                    <input
                      type="checkbox"
                      checked={!!slot}
                      onChange={() =>
                        toggleDay(day)
                      }
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary accent-primary"
                    />

                    <div>

                      <span className="text-sm font-bold text-foreground capitalize">
                        {day}
                      </span>

                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {slot
                          ? 'Available'
                          : 'Unavailable'}
                      </p>

                    </div>

                  </label>

                  {slot ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <div>

                        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5">
                          Start Time
                        </p>

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
                          className="w-full"
                        />

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5">
                          End Time
                        </p>

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
                          className="w-full"
                        />

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5">
                          Slot Duration
                        </p>

                        <div className="flex items-center gap-2">

                          <Input
                            label=""
                            type="number"
                            min="1"
                            value={
                              slot.slot_duration_minutes ||
                              30
                            }
                            onChange={(e) =>
                              updateSlot(
                                day,
                                'slot_duration_minutes',
                                parseInt(
                                  e.target.value,
                                  10
                                )
                              )
                            }
                            className="w-full"
                          />

                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            min
                          </span>

                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="flex-1">

                      <p className="text-sm text-muted-foreground">
                        Enable this day to configure consultation hours.
                      </p>

                    </div>

                  )}

                </div>

              </div>
            );
          })}

        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-5">

          <Button
            onClick={
              handleAvailabilitySave
            }
            loading={
              savingAvailability
            }
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Save
              size={16}
              className="mr-2"
            />
            Save Availability
          </Button>

        </div>

      </Card>

    </div>
  );
};

export default DoctorProfilePage;
