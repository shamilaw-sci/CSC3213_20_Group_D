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
  useRef,
  useMemo
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Save,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

import toast from 'react-hot-toast';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
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

const getInitials = (name) => {
  if (!name) {
    return 'DR';
  }

  const parts = name
    .trim()
    .split(' ')
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
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

  const activeDays = useMemo(
    () => availability.length,
    [availability]
  );

  const averageSlotDuration = useMemo(() => {
    if (availability.length === 0) {
      return null;
    }

    const total = availability.reduce(
      (sum, slot) =>
        sum + Number(slot.slot_duration_minutes || 0),
      0
    );

    return Math.round(total / availability.length);
  }, [availability]);

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
        <p className="text-sm font-medium text-muted-foreground">
          Loading doctor profile...
        </p>
      </div>
    );
  }

  const verified = !!doctor?.is_verified;

  return (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6 pb-10">

      {/* =====================================================
          PREMIUM DOCTOR IDENTITY HERO
      ====================================================== */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-brand-deep shadow-[0_18px_48px_rgba(15,23,42,0.16)]">

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/25" />
          <div className="absolute left-[46%] -bottom-28 h-56 w-56 rounded-full border border-white/10 bg-white/5" />
          <div className="absolute -left-12 top-10 h-36 w-36 rounded-full border border-white/10 bg-white/[0.04]" />
        </div>

        <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">

          <div className="flex items-center justify-between gap-4 mb-6">

            <button
              type="button"
              onClick={() => navigate('/doctor/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
                verified
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                  : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              }`}
            >
              {verified ? (
                <CheckCircle2 size={14} />
              ) : (
                <Clock3 size={14} />
              )}

              {verified
                ? 'Verified Doctor'
                : 'Verification Pending'}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-7 lg:gap-10 lg:items-center">

            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7 min-w-0">

              <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 self-center sm:self-auto">

                <div className="absolute inset-0 rounded-full bg-primary/35 blur-xl scale-110" />

                <div className="relative w-full h-full rounded-full bg-white p-1.5 shadow-[0_18px_42px_rgba(2,44,40,0.25)]">
                  {doctor?.photo_url ? (
                    <img
                      src={doctor.photo_url}
                      alt="Doctor Profile"
                      className="w-full h-full rounded-full object-cover bg-primary/10"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl sm:text-4xl font-extrabold tracking-wide">
                      {getInitials(
                        doctor?.full_name
                      )}
                    </div>
                  )}
                </div>

                {uploadingPhoto && (
                  <div className="absolute inset-1.5 rounded-full bg-black/45 flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePhotoButtonClick}
                  disabled={uploadingPhoto}
                  title="Change profile photo"
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full border-[3px] border-white bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Camera size={17} />
                </button>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

              </div>

              <div className="min-w-0 text-center sm:text-left">

                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <Stethoscope
                    size={13}
                    className="text-blue-200"
                  />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/85">
                    Care4U Doctor
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black tracking-tight text-white mt-3">
                  Dr. {doctor?.full_name || 'Doctor'}
                </h1>

                <p className="text-sm sm:text-base font-semibold text-blue-200 mt-1.5">
                  {doctor?.specialization || 'Specialization not set'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 text-xs text-white/70">

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    <BadgeCheck size={12} />
                    SLMC {doctor?.slmc_reg_number || '—'}
                  </span>

                  {doctor?.hospital_name && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      <Building2 size={12} />
                      {doctor.hospital_name}
                    </span>
                  )}

                </div>

                <p className="text-xs sm:text-sm text-white/65 mt-4 max-w-2xl leading-relaxed mx-auto sm:mx-0">
                  Manage the professional information patients see in Care4U and keep your weekly consultation availability accurate.
                </p>

              </div>

            </div>

            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:w-[210px]">

              <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-blue-200">
                  <BriefcaseMedical size={14} />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]">
                    Experience
                  </span>
                </div>
                <p className="text-lg font-black text-white mt-1.5">
                  {doctor?.years_experience != null && doctor?.years_experience !== ''
                    ? `${doctor.years_experience} yrs`
                    : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-blue-200">
                  <CalendarDays size={14} />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]">
                    Active Days
                  </span>
                </div>
                <p className="text-lg font-black text-white mt-1.5">
                  {activeDays}/7
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-blue-200">
                  <Clock3 size={14} />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]">
                    Avg. Slot
                  </span>
                </div>
                <p className="text-lg font-black text-white mt-1.5">
                  {averageSlotDuration
                    ? `${averageSlotDuration} min`
                    : '—'}
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
        />
      )}

      {/* =====================================================
          PROFESSIONAL INFORMATION
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_28px_rgba(15,23,42,0.045)]">

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-5 sm:px-6 py-5 border-b border-border bg-card">

          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#12344D]">
              Professional Information
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
              These details are used across the doctor portal and may appear when patients search for doctors.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-module-soft px-3 py-2 text-xs font-semibold text-primary self-start">
            <ShieldCheck size={14} />
            Professional profile
          </div>

        </div>

        <div className="bg-secondary/15 px-5 sm:px-6 py-5 sm:py-6">

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Clinical Role
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    Specialization
                  </p>
                </div>
              </div>

              <Input
                label=""
                name="specialization"
                value={profileForm.specialization}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    specialization:
                      e.target.value
                  })
                }
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Credentials
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    Qualifications
                  </p>
                </div>
              </div>

              <Input
                label=""
                name="qualifications"
                value={profileForm.qualifications}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    qualifications:
                      e.target.value
                  })
                }
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                  <BriefcaseMedical size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Practice
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    Years of Experience
                  </p>
                </div>
              </div>

              <Input
                label=""
                name="years_experience"
                type="number"
                min="0"
                value={profileForm.years_experience}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    years_experience:
                      e.target.value
                  })
                }
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Workplace
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    Hospital Name
                  </p>
                </div>
              </div>

              <Input
                label=""
                name="hospital_name"
                value={profileForm.hospital_name}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    hospital_name:
                      e.target.value
                  })
                }
              />
            </div>

          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-5">

            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Your name and SLMC registration are account identity details. Update the editable professional information above when your clinical profile changes.
            </p>

            <Button
              onClick={handleProfileSave}
              loading={savingProfile}
              variant="primary"
              className="w-full sm:w-auto shrink-0"
            >
              <Save
                size={16}
                className="mr-2"
              />
              Save Profile
            </Button>

          </div>

        </div>

      </section>

      {/* =====================================================
          AVAILABILITY SCHEDULE
      ====================================================== */}
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_28px_rgba(15,23,42,0.045)]">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 px-5 sm:px-6 py-5 border-b border-border bg-card">

          <div>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#12344D]">
              Availability Schedule
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
              Set the days and consultation hours patients can use when booking appointments with you.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-module-soft text-primary px-3 py-1.5 text-xs font-bold">
              <CalendarDays size={13} />
              {activeDays} active day{activeDays === 1 ? '' : 's'}
            </span>

            {averageSlotDuration && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-muted-foreground px-3 py-1.5 text-xs font-bold">
                <Clock3 size={13} />
                {averageSlotDuration} min average slot
              </span>
            )}
          </div>

        </div>

        <div className="bg-secondary/15 px-5 sm:px-6 py-5 sm:py-6">

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
                  className={`overflow-hidden rounded-2xl border transition-all ${
                    slot
                      ? 'border-primary/20 bg-card shadow-[0_4px_16px_rgba(15,23,42,0.035)]'
                      : 'border-border/70 bg-card/70'
                  }`}
                >

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5">

                    <label className="flex items-center gap-3 min-w-[180px] cursor-pointer select-none">

                      <span className="relative inline-flex h-6 w-11 shrink-0">
                        <input
                          type="checkbox"
                          checked={!!slot}
                          onChange={() => toggleDay(day)}
                          className="peer sr-only"
                        />
                        <span className="absolute inset-0 rounded-full bg-slate-200 peer-checked:bg-primary transition-colors" />
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                      </span>

                      <div>
                        <span className="text-sm font-extrabold text-foreground capitalize">
                          {day}
                        </span>
                        <p className={`text-[11px] mt-0.5 font-medium ${
                          slot
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}>
                          {slot
                            ? 'Available for booking'
                            : 'Not available'}
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

                            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              min
                            </span>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl bg-secondary/50 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          Enable this day to configure consultation hours and slot duration.
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-5">

            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Patients will only be offered appointment times that fall inside your active availability windows.
            </p>

            <Button
              onClick={handleAvailabilitySave}
              loading={savingAvailability}
              variant="primary"
              className="w-full sm:w-auto shrink-0"
            >
              <Save
                size={16}
                className="mr-2"
              />
              Save Availability
            </Button>

          </div>

        </div>

      </section>

    </div>
  );
};

export default DoctorProfilePage;
