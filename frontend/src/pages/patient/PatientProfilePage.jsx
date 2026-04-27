/**
 * @file      PatientProfilePage.jsx
 * @component PatientProfilePage
 * @desc      Displays and allows editing of the patient's profile.
 *            Fetches from GET /api/patients/:id via React Query.
 *            Submits updates via PUT /api/patients/:id using React Hook Form.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Droplets, Phone, Calendar, Edit2, X, Save } from 'lucide-react';

import { getPatientProfile, updatePatientProfile } from '../../services/patient.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

// ─── TEMPORARY: hardcoded test patient UUID until auth is integrated ──────────
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// ─── Small helper: format date from DB (2000-01-15T00:00:00Z → 15 Jan 2000) ──
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ─── Small helper: capitalise first letter ────────────────────────────────────
const capitalise = (str) => {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ─── Profile Field — used in view mode ───────────────────────────────────────
const ProfileField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-2 bg-slate-100 rounded-lg">
      <Icon size={16} className="text-[#1E3A5F]" />
    </div>
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

// ─── Main Page Component ──────────────────────────────────────────────────────
const PatientProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // ── Fetch patient profile ──────────────────────────────────────────────────
  const {
    data: patient,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['patient', TEST_PATIENT_ID],
    queryFn: () => getPatientProfile(TEST_PATIENT_ID),
  });

  // ── React Hook Form setup ──────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // ── Update mutation ────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) => updatePatientProfile(TEST_PATIENT_ID, data),
    onSuccess: (updatedPatient) => {
      // Refresh the cached profile with the updated data
      queryClient.setQueryData(['patient', TEST_PATIENT_ID], updatedPatient);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.');
    },
  });

  // ── Enter edit mode — pre-fill form with current values ───────────────────
  const handleEditClick = () => {
    reset({
      full_name:                      patient?.full_name || '',
      blood_group:                    patient?.blood_group || '',
      emergency_contact_name:         patient?.emergency_contact_name || '',
      emergency_contact_phone:        patient?.emergency_contact_phone || '',
      emergency_contact_relationship: patient?.emergency_contact_relationship || '',
    });
    setIsEditing(true);
  };

  // ── Cancel edit — discard changes ─────────────────────────────────────────
  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  // ── Submit form ────────────────────────────────────────────────────────────
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert
            type="error"
            message={error?.message || 'Failed to load patient profile.'}
          />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page Header ── */}
      <div className="bg-[#1E3A5F] text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-blue-200 text-sm mt-1">
                View and manage your personal health information
              </p>
            </div>
            {/* UHI / QR Badge */}
            <div className="hidden sm:block bg-white/10 rounded-xl px-4 py-2 text-right">
              <p className="text-xs text-blue-200 uppercase tracking-wide">Patient ID</p>
              <p className="text-sm font-mono font-semibold">
                {patient?.qr_code_id || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Personal Information Card */}
              <Card title="Personal Information">
                <div className="space-y-4">
                  <ProfileField
                    icon={User}
                    label="Full Name"
                    value={patient?.full_name}
                  />
                  <ProfileField
                    icon={Droplets}
                    label="Blood Group"
                    value={patient?.blood_group}
                  />
                  <ProfileField
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(patient?.date_of_birth)}
                  />
                  <ProfileField
                    icon={User}
                    label="Gender"
                    value={capitalise(patient?.gender)}
                  />
                  <ProfileField
                    icon={User}
                    label="NIC"
                    value={patient?.nic}
                  />
                </div>
              </Card>

              {/* Emergency Contact Card */}
              <Card title="Emergency Contact">
                <div className="space-y-4">
                  <ProfileField
                    icon={User}
                    label="Contact Name"
                    value={patient?.emergency_contact_name}
                  />
                  <ProfileField
                    icon={Phone}
                    label="Contact Phone"
                    value={patient?.emergency_contact_phone}
                  />
                  <ProfileField
                    icon={User}
                    label="Relationship"
                    value={capitalise(patient?.emergency_contact_relationship)}
                  />
                </div>
              </Card>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleEditClick}
              >
                <Edit2 size={16} />
                Edit Profile
              </Button>
            </div>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Edit Personal Information */}
              <Card title="Personal Information">
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    name="full_name"
                    placeholder="Enter full name"
                    required
                    error={errors.full_name?.message}
                    {...register('full_name', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                      {...register('blood_group', { required: 'Blood group is required' })}
                    >
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                    {errors.blood_group && (
                      <p className="text-xs text-red-600">{errors.blood_group.message}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Edit Emergency Contact */}
              <Card title="Emergency Contact">
                <div className="space-y-4">
                  <Input
                    label="Contact Name"
                    name="emergency_contact_name"
                    placeholder="Enter contact name"
                    error={errors.emergency_contact_name?.message}
                    {...register('emergency_contact_name')}
                  />
                  <Input
                    label="Contact Phone"
                    name="emergency_contact_phone"
                    placeholder="Enter contact phone"
                    error={errors.emergency_contact_phone?.message}
                    {...register('emergency_contact_phone', {
                      pattern: {
                        value: /^[0-9+\s\-()]{7,15}$/,
                        message: 'Enter a valid phone number',
                      },
                    })}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Relationship
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                      {...register('emergency_contact_relationship')}
                    >
                      <option value="">Select relationship</option>
                      {['parent', 'sibling', 'spouse', 'child', 'friend', 'other'].map((r) => (
                        <option key={r} value={r}>{capitalise(r)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                <X size={16} />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
              >
                <Save size={16} />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;