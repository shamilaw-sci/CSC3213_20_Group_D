/**
 * @file    PatientProfilePage.jsx
 * @component PatientProfilePage
 * @desc    Displays and allows editing of the patient's profile.
 * Includes smart autocomplete for adding allergies, secure deletion,
 * profile photo upload (CARE4U-65), and a warm, personal header banner
 * redesign sharing visual DNA with the doctor lookup banner (CARE4U-59/69).
 * Avatar sized up to 96px for reliable visual identification.
 * Chronic conditions management added in CARE4U-79.
 * Vaccination Records added in CARE4U-148.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Droplets, Phone, Calendar, Edit2, X, Save, AlertTriangle, Trash2, Plus, Camera, Syringe } from 'lucide-react';

import { 
  getPatientProfile, 
  updatePatientProfile, 
  uploadPatientPhoto,
  getAllergies, 
  addAllergy, 
  deleteAllergy,
  getConditions,
  addCondition,
  deleteCondition,
  getVaccinations,
  addVaccination,
  deleteVaccination
} from '../../services/patient.service';
import { searchAllergens } from '../../utils/allergenSearch';
import { searchVaccines } from '../../utils/vaccineSearch';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal'; 

// ─── TEMPORARY: hardcoded test patient UUID until auth is integrated ──────────
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// ─── Photo upload constraints (mirrors backend middleware/upload.js) ──────────
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const capitalise = (str) => {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getAvatarSrc = (patient) => {
  if (patient?.photo_url) return patient.photo_url;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=2E75B6&color=fff&size=120&bold=true&rounded=true`;
};

const getFirstName = (fullName) => {
  if (!fullName) return 'there';
  return fullName.trim().split(' ')[0];
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  severe:   { bg: 'bg-red-100',    text: 'text-red-700',   label: 'Severe'   },
  moderate: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Moderate' },
  mild:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Mild'     },
};

const SeverityBadge = ({ severity }) => {
  const style = SEVERITY_STYLES[severity?.toLowerCase()] || SEVERITY_STYLES.mild;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

// ─── Profile Field Component ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
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

// ─── Banner Load Animations (scoped to this page) ─────────────────────────────
const BannerAnimationStyles = () => (
  <style>{`
    @keyframes cuAvatarPop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes cuFadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cuGlowPulse {
      0%   { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55); }
      70%  { box-shadow: 0 0 0 18px rgba(56, 189, 248, 0); }
      100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
    }
    .cu-avatar-pop { animation: cuAvatarPop 450ms ease-out both; }
    .cu-fade-slide-up { animation: cuFadeSlideUp 450ms ease-out both; }
    .cu-glow-ring {
      animation: cuGlowPulse 1400ms ease-out 350ms 1;
      border-radius: 9999px;
    }
    @media (prefers-reduced-motion: reduce) {
      .cu-avatar-pop, .cu-fade-slide-up, .cu-glow-ring {
        animation: none !important; opacity: 1 !important; transform: none !important; box-shadow: none !important;
      }
    }
  `}</style>
);

// ─── Main Page Component ──────────────────────────────────────────────────────
const PatientProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // ── Photo Upload State ──
  const photoInputRef = useRef(null);

  // ── Allergy UI State ──
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState(null);

  // ── Condition UI State ──
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [isDeleteConditionModalOpen, setIsDeleteConditionModalOpen] = useState(false);
  const [conditionToDelete, setConditionToDelete] = useState(null);

  // ── Vaccination UI State ──
  const [isAddVaccinationModalOpen, setIsAddVaccinationModalOpen] = useState(false);
  const [isDeleteVaccinationModalOpen, setIsDeleteVaccinationModalOpen] = useState(false);
  const [vaccinationToDelete, setVaccinationToDelete] = useState(null);

  // ── Autocomplete State (Allergies) ──
  const [allergenInput, setAllergenInput] = useState('');
  const [allergySuggestions, setAllergySuggestions] = useState([]);
  const [showAllergySuggestions, setShowAllergySuggestions] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('mild');
  const [allergyNotes, setAllergyNotes] = useState('');
  const allergyDropdownRef = useRef(null);

  // ── Autocomplete State (Vaccinations) ──
  const [vaccineInput, setVaccineInput] = useState('');
  const [vaccineSuggestions, setVaccineSuggestions] = useState([]);
  const [showVaccineSuggestions, setShowVaccineSuggestions] = useState(false);
  const [vaccineDateInput, setVaccineDateInput] = useState('');
  const [vaccineDoseInput, setVaccineDoseInput] = useState('');
  const [vaccineNotes, setVaccineNotes] = useState('');
  const vaccineDropdownRef = useRef(null);

  // ── Add Condition Form State ──
  const [conditionInput, setConditionInput] = useState('');
  const [diagnosedAtInput, setDiagnosedAtInput] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [isPriorityInput, setIsPriorityInput] = useState(false);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (allergyDropdownRef.current && !allergyDropdownRef.current.contains(event.target)) {
        setShowAllergySuggestions(false);
      }
      if (vaccineDropdownRef.current && !vaccineDropdownRef.current.contains(event.target)) {
        setShowVaccineSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAllergenInputChange = (e) => {
    const value = e.target.value;
    setAllergenInput(value);
    setAllergySuggestions(searchAllergens(value));
    setShowAllergySuggestions(true);
  };

  const handleSelectAllergySuggestion = (suggestion) => {
    setAllergenInput(suggestion.name);
    setShowAllergySuggestions(false);
  };

  const handleVaccineInputChange = (e) => {
    const value = e.target.value;
    setVaccineInput(value);
    setVaccineSuggestions(searchVaccines(value));
    setShowVaccineSuggestions(true);
  };

  const handleSelectVaccineSuggestion = (suggestion) => {
    setVaccineInput(suggestion.name);
    setShowVaccineSuggestions(false);
  };

  // ── Queries ──
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ['patient', TEST_PATIENT_ID],
    queryFn: () => getPatientProfile(TEST_PATIENT_ID),
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery({
    queryKey: ['allergies', TEST_PATIENT_ID],
    queryFn: () => getAllergies(TEST_PATIENT_ID),
    enabled: !!patient,
  });

  const { data: conditions = [], isLoading: conditionsLoading } = useQuery({
    queryKey: ['conditions', TEST_PATIENT_ID],
    queryFn: () => getConditions(TEST_PATIENT_ID),
    enabled: !!patient,
  });

  const { data: vaccinations = [], isLoading: vaccinationsLoading } = useQuery({
    queryKey: ['vaccinations', TEST_PATIENT_ID],
    queryFn: () => getVaccinations(TEST_PATIENT_ID),
    enabled: !!patient,
  });

  // ── Form Setup ──
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // ── Mutations ──
  const updateMutation = useMutation({
    mutationFn: (data) => updatePatientProfile(TEST_PATIENT_ID, data),
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(['patient', TEST_PATIENT_ID], updatedPatient);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (file) => uploadPatientPhoto(TEST_PATIENT_ID, file),
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(['patient', TEST_PATIENT_ID], updatedPatient);
      toast.success('Profile photo updated');
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Failed to upload photo.';
      toast.error(message);
    },
  });

  const addAllergyMutation = useMutation({
    mutationFn: (data) => addAllergy(TEST_PATIENT_ID, data.allergen, data.severity, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', TEST_PATIENT_ID] });
      toast.success('Allergy added successfully');
      setIsAddAllergyModalOpen(false);
      setAllergenInput('');
      setSelectedSeverity('mild');
      setAllergyNotes('');
    },
    onError: () => toast.error('Failed to add allergy.'),
  });

  const deleteAllergyMutation = useMutation({
    mutationFn: (allergyId) => deleteAllergy(TEST_PATIENT_ID, allergyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', TEST_PATIENT_ID] });
      toast.success('Allergy removed successfully');
      setIsDeleteModalOpen(false);
      setAllergyToDelete(null);
    },
    onError: () => toast.error('Failed to remove allergy.'),
  });

  const addConditionMutation = useMutation({
    mutationFn: (data) => addCondition(TEST_PATIENT_ID, data.condition, data.diagnosedAt, data.notes, data.isPriority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions', TEST_PATIENT_ID] });
      toast.success('Condition added successfully');
      setIsAddConditionModalOpen(false);
      setConditionInput('');
      setDiagnosedAtInput('');
      setConditionNotes('');
      setIsPriorityInput(false);
    },
    onError: () => toast.error('Failed to add condition.'),
  });

  const deleteConditionMutation = useMutation({
    mutationFn: (conditionId) => deleteCondition(TEST_PATIENT_ID, conditionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions', TEST_PATIENT_ID] });
      toast.success('Condition removed successfully');
      setIsDeleteConditionModalOpen(false);
      setConditionToDelete(null);
    },
    onError: () => toast.error('Failed to remove condition.'),
  });

  const addVaccinationMutation = useMutation({
    mutationFn: (data) => addVaccination(TEST_PATIENT_ID, data.vaccineName, data.dateAdministered, data.doseNumber, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', TEST_PATIENT_ID] });
      toast.success('Vaccination added successfully');
      setIsAddVaccinationModalOpen(false);
      setVaccineInput('');
      setVaccineDateInput('');
      setVaccineDoseInput('');
      setVaccineNotes('');
    },
    onError: () => toast.error('Failed to add vaccination.'),
  });

  const deleteVaccinationMutation = useMutation({
    mutationFn: (vaccinationId) => deleteVaccination(TEST_PATIENT_ID, vaccinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', TEST_PATIENT_ID] });
      toast.success('Vaccination removed successfully');
      setIsDeleteVaccinationModalOpen(false);
      setVaccinationToDelete(null);
    },
    onError: () => toast.error('Failed to remove vaccination.'),
  });

  // ── Handlers ──
  const handleEditClick = () => {
    reset({
      full_name: patient?.full_name || '',
      blood_group: patient?.blood_group || '',
      emergency_contact_name: patient?.emergency_contact_name || '',
      emergency_contact_phone: patient?.emergency_contact_phone || '',
      emergency_contact_relationship: patient?.emergency_contact_relationship || '',
    });
    setIsEditing(true);
  };

  const handlePhotoButtonClick = () => photoInputRef.current?.click();

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return toast.error('Please select a JPEG, PNG, or WEBP image.');
    if (file.size > MAX_PHOTO_SIZE_BYTES) return toast.error('Image must be 2MB or smaller.');

    uploadPhotoMutation.mutate(file);
  };

  const submitAddAllergy = (e) => {
    e.preventDefault();
    if (!allergenInput.trim()) return toast.error('Please enter or select an allergen.');
    addAllergyMutation.mutate({ allergen: allergenInput.trim(), severity: selectedSeverity, notes: allergyNotes.trim() });
  };

  const submitAddCondition = (e) => {
    e.preventDefault();
    if (!conditionInput.trim()) return toast.error('Please enter a condition name.');
    addConditionMutation.mutate({ condition: conditionInput.trim(), diagnosedAt: diagnosedAtInput, notes: conditionNotes.trim(), isPriority: isPriorityInput });
  };

  const submitAddVaccination = (e) => {
    e.preventDefault();
    if (!vaccineInput.trim() || !vaccineDateInput) {
      return toast.error('Please enter the vaccine name and date.');
    }
    addVaccinationMutation.mutate({
      vaccineName: vaccineInput.trim(),
      dateAdministered: vaccineDateInput,
      doseNumber: vaccineDoseInput.trim(),
      notes: vaccineNotes.trim()
    });
  };

  const promptDeleteAllergy = (allergy) => {
    setAllergyToDelete(allergy);
    setIsDeleteModalOpen(true);
  };

  const promptDeleteCondition = (condition) => {
    setConditionToDelete(condition);
    setIsDeleteConditionModalOpen(true);
  };

  const promptDeleteVaccination = (vaccination) => {
    setVaccinationToDelete(vaccination);
    setIsDeleteVaccinationModalOpen(true);
  };

  // ── Filter allergies by severity ──
  const severeAllergies = allergies.filter((a) => a.severity?.toLowerCase() === 'severe');
  const otherAllergies = allergies.filter((a) => a.severity?.toLowerCase() !== 'severe');

  // ── Render States ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Alert type="error" message={error?.message || 'Failed to load profile.'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">

      <BannerAnimationStyles />

      {/* ── Page Header (CARE4U-59 / 69) ── */}
      <div className="relative overflow-hidden text-white px-6 py-8 shadow-sm bg-linear-to-br from-[#0F2942] to-[#1E3A5F]">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <div className="cu-glow-ring absolute inset-0" />
              <img
                src={getAvatarSrc(patient)}
                alt="Profile"
                className="cu-avatar-pop w-24 h-24 rounded-full border-4 border-white/30 shadow-md object-cover"
              />
              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Spinner size="sm" color="text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={handlePhotoButtonClick}
                disabled={uploadPhotoMutation.isPending}
                title="Change profile photo"
                className="absolute -bottom-0.5 -right-0.5 p-2 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Camera size={14} className="text-[#1E3A5F]" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoFileChange} />
            </div>
            <div>
              <p className="cu-fade-slide-up text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>
                My Profile
              </p>
              <h1 className="cu-fade-slide-up text-2xl font-bold" style={{ animationDelay: '80ms' }}>
                Welcome back, {getFirstName(patient?.full_name)}
              </h1>
              <p className="cu-fade-slide-up text-sm mt-1" style={{ color: '#CBD5E1', animationDelay: '150ms' }}>
                Manage your personal health information
              </p>
            </div>
          </div>
          <div className="cu-fade-slide-up hidden sm:block bg-white/10 rounded-xl px-4 py-2 text-right backdrop-blur-sm" style={{ animationDelay: '250ms' }}>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Patient ID</p>
            <p className="text-sm font-mono font-semibold">{patient?.qr_code_id || '—'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Personal Information">
                <div className="space-y-4">
                  <ProfileField icon={User} label="Full Name" value={patient?.full_name} />
                  <ProfileField icon={Droplets} label="Blood Group" value={patient?.blood_group} />
                  <ProfileField icon={Calendar} label="Date of Birth" value={formatDate(patient?.date_of_birth)} />
                  <ProfileField icon={User} label="Gender" value={capitalise(patient?.gender)} />
                  <ProfileField icon={User} label="NIC" value={patient?.nic} />
                </div>
              </Card>

              <Card title="Emergency Contact">
                <div className="space-y-4">
                  <ProfileField icon={User} label="Contact Name" value={patient?.emergency_contact_name} />
                  <ProfileField icon={Phone} label="Contact Phone" value={patient?.emergency_contact_phone} />
                  <ProfileField icon={User} label="Relationship" value={capitalise(patient?.emergency_contact_relationship)} />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Chronic Conditions ── */}
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    {`Chronic Conditions (${conditions.length})`}
                  </span>
                }
              >
                {conditionsLoading ? (
                   <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : conditions.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex p-3 rounded-full bg-slate-100 mb-2">
                      <AlertTriangle className="text-slate-400" size={24} />
                    </div>
                    <p className="text-sm text-slate-500">No conditions recorded.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1">
                    {conditions.map((condition) => (
                      <div
                        key={condition.id}
                        className={`group relative flex flex-col py-3 px-4 rounded-md border-b border-slate-100 last:border-0 gap-2 transition-colors hover:bg-slate-50/50 ${
                          condition.is_priority ? 'bg-red-50 border border-red-200' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start pr-8">
                          <div>
                            <div className="flex items-center gap-2">
                              {condition.is_priority && (
                                <AlertTriangle size={14} className="text-red-600 shrink-0" strokeWidth={2.5} />
                              )}
                              <p className={`text-sm font-semibold ${condition.is_priority ? 'text-red-900' : 'text-slate-800'}`}>
                                {condition.condition}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Diagnosed: {formatDate(condition.diagnosed_at)}
                            </p>
                            {condition.notes && (
                              <p className="text-xs text-slate-500 mt-0.5">{condition.notes}</p>
                            )}
                          </div>
                          {condition.is_priority && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-red-600 shrink-0">
                              Priority
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => promptDeleteCondition(condition)}
                          className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove condition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                  <Button variant="outline" onClick={() => setIsAddConditionModalOpen(true)} className="w-full text-[#1E3A5F] border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5">
                    <Plus size={16} className="mr-2" /> Add Condition
                  </Button>
                </div>
              </Card>

              {/* ── Known Allergies ── */}
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    {`Known Allergies (${allergies.length})`}
                    {!allergiesLoading && severeAllergies.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-white bg-red-700">
                        <AlertTriangle size={11} strokeWidth={2.5} /> {severeAllergies.length} Severe
                      </span>
                    )}
                  </span>
                }
              >
                {allergiesLoading ? (
                   <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : allergies.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex p-3 rounded-full bg-slate-100 mb-2">
                      <AlertTriangle className="text-slate-400" size={24} />
                    </div>
                    <p className="text-sm text-slate-500">No allergies recorded.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1">
                    {severeAllergies.length > 0 && (
                      <div className="flex flex-col gap-2 mb-1">
                        {severeAllergies.map((allergy) => (
                          <div key={allergy.id} className="group relative flex flex-col justify-between py-3 px-4 rounded-md bg-red-700">
                            <div className="flex items-start gap-2.5 pr-8">
                              <AlertTriangle size={18} className="text-white shrink-0 mt-0.5" strokeWidth={2.5} />
                              <div>
                                <p className="text-sm font-bold text-white">{allergy.allergen}</p>
                                {allergy.notes && <p className="text-xs text-red-100 mt-0.5">{allergy.notes}</p>}
                              </div>
                            </div>
                            <button 
                              onClick={() => promptDeleteAllergy(allergy)}
                              className="absolute right-2 top-2 p-1.5 text-white/50 hover:text-white hover:bg-red-800 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remove allergy"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="divide-y divide-slate-100">
                      {otherAllergies.map((allergy) => (
                        <div key={allergy.id} className="py-3 flex items-center justify-between group transition-colors hover:bg-slate-50/50 px-2 -mx-2 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{allergy.allergen}</p>
                            {allergy.notes && <p className="text-xs text-slate-500 mt-0.5">{allergy.notes}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <SeverityBadge severity={allergy.severity} />
                            <button 
                              onClick={() => promptDeleteAllergy(allergy)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remove allergy"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                  <Button variant="outline" onClick={() => { setAllergySuggestions(searchAllergens('')); setIsAddAllergyModalOpen(true); }} className="w-full text-[#1E3A5F] border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5">
                    <Plus size={16} className="mr-2" /> Add Allergy
                  </Button>
                </div>
              </Card>
            </div>

            {/* ── Vaccination Records (CARE4U-148) ── */}
            <div className="mb-6">
              <Card 
                title={
                  <span className="flex items-center gap-2">
                    <Syringe size={18} className="text-[#1E3A5F]" />
                    {`Vaccination Records (${vaccinations.length})`}
                  </span>
                }
              >
                {vaccinationsLoading ? (
                   <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : vaccinations.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="inline-flex p-3 rounded-full bg-slate-100 mb-2">
                      <Syringe className="text-slate-400" size={24} />
                    </div>
                    <p className="text-sm text-slate-500">No vaccination records found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {vaccinations.map((vaccine) => (
                      <div
                        key={vaccine.id}
                        className="group relative flex flex-col py-3 px-4 rounded-lg border border-slate-100 bg-white shadow-sm transition-colors hover:border-slate-300"
                      >
                        <div className="flex justify-between items-start pr-8">
                          <div>
                            <p className="text-sm font-bold text-[#1E3A5F]">{vaccine.vaccine_name}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                              Given: <span className="text-slate-800">{formatDate(vaccine.date_administered)}</span>
                            </p>
                            {vaccine.dose_number && (
                              <p className="text-xs text-slate-500 mt-0.5">Dose: {vaccine.dose_number}</p>
                            )}
                            {vaccine.notes && (
                              <p className="text-xs text-slate-500 mt-0.5 italic text-slate-400">"{vaccine.notes}"</p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => promptDeleteVaccination(vaccine)}
                          className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                  <Button variant="outline" onClick={() => { setVaccineSuggestions(searchVaccines('')); setIsAddVaccinationModalOpen(true); }} className="w-full sm:w-auto text-[#1E3A5F] border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5">
                    <Plus size={16} className="mr-2" /> Add Vaccination
                  </Button>
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleEditClick}>
                <Edit2 size={16} /> Edit Profile
              </Button>
            </div>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Personal Information">
                <div className="space-y-4">
                  <Input label="Full Name" placeholder="Enter full name" error={errors.full_name?.message} {...register('full_name', { required: 'Full name is required' })} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Blood Group <span className="text-red-500">*</span></label>
                    <select className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" {...register('blood_group', { required: 'Required' })}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="Emergency Contact">
                <div className="space-y-4">
                  <Input label="Contact Name" placeholder="Enter contact name" {...register('emergency_contact_name')} />
                  <Input label="Contact Phone" placeholder="Enter contact phone" error={errors.emergency_contact_phone?.message} {...register('emergency_contact_phone', { pattern: { value: /^[0-9+\s\-()]{7,15}$/, message: 'Invalid phone number' } })} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Relationship</label>
                    <select className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" {...register('emergency_contact_relationship')}>
                      <option value="">Select relationship</option>
                      {['parent', 'sibling', 'spouse', 'child', 'friend', 'other'].map((r) => <option key={r} value={r}>{capitalise(r)}</option>)}
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>Cancel</Button>
              <Button type="submit" variant="primary" loading={updateMutation.isPending}><Save size={16} /> Save Changes</Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Add Allergy Modal ── */}
      {isAddAllergyModalOpen && (
        <Modal isOpen={isAddAllergyModalOpen} onClose={() => setIsAddAllergyModalOpen(false)} title="Add New Allergy">
          <form onSubmit={submitAddAllergy} className="space-y-5 p-1">
            <div className="flex flex-col gap-1 relative" ref={allergyDropdownRef}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Allergen Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Start typing to search..." className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={allergenInput} onChange={handleAllergenInputChange} onFocus={() => { setAllergySuggestions(searchAllergens(allergenInput)); setShowAllergySuggestions(true); }} autoComplete="off" />
              {showAllergySuggestions && allergySuggestions.length > 0 && (
               <div className="absolute top-15 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {allergySuggestions.map((sugg, index) => (
                    <div key={index} onClick={() => handleSelectAllergySuggestion(sugg)} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0">
                      <span className="text-sm font-medium text-slate-700">{sugg.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{sugg.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Severity <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes (Optional)</label>
              <textarea placeholder="E.g. Triggers mild rhinitis" rows={2} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" value={allergyNotes} onChange={(e) => setAllergyNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsAddAllergyModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={addAllergyMutation.isPending}>Save Allergy</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Condition Modal ── */}
      {isAddConditionModalOpen && (
        <Modal isOpen={isAddConditionModalOpen} onClose={() => setIsAddConditionModalOpen(false)} title="Add Chronic Condition">
          <form onSubmit={submitAddCondition} className="space-y-5 p-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Condition Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="E.g. Type 2 Diabetes" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={conditionInput} onChange={(e) => setConditionInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diagnosed Date (Optional)</label>
              <input type="date" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={diagnosedAtInput} onChange={(e) => setDiagnosedAtInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes (Optional)</label>
              <textarea placeholder="E.g. Managed with Metformin" rows={2} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-50 border border-red-100 rounded-lg">
              <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500" checked={isPriorityInput} onChange={(e) => setIsPriorityInput(e.target.checked)} />
              <div>
                <span className="text-sm font-semibold text-red-900 block">Mark as Priority/Severe</span>
                <span className="text-xs text-red-700 block">Alerts doctors immediately when they scan your profile.</span>
              </div>
            </label>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsAddConditionModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={addConditionMutation.isPending}>Save Condition</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Vaccination Modal ── */}
      {isAddVaccinationModalOpen && (
        <Modal isOpen={isAddVaccinationModalOpen} onClose={() => setIsAddVaccinationModalOpen(false)} title="Add Vaccination Record">
          <form onSubmit={submitAddVaccination} className="space-y-5 p-1">
            
            {/* Smart Autocomplete Field */}
            <div className="flex flex-col gap-1 relative" ref={vaccineDropdownRef}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vaccine Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Start typing vaccine name..." className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={vaccineInput} onChange={handleVaccineInputChange} onFocus={() => { setVaccineSuggestions(searchVaccines(vaccineInput)); setShowVaccineSuggestions(true); }} autoComplete="off" />
              {showVaccineSuggestions && vaccineSuggestions.length > 0 && (
               <div className="absolute top-15 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {vaccineSuggestions.map((sugg, index) => (
                    <div key={index} onClick={() => handleSelectVaccineSuggestion(sugg)} className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0">
                      <span className="text-sm font-medium text-slate-700">{sugg.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{sugg.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date Administered <span className="text-red-500">*</span></label>
              <input type="date" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={vaccineDateInput} onChange={(e) => setVaccineDateInput(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dose Number (Optional)</label>
              <input type="text" placeholder="E.g. Dose 1, Booster" className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" value={vaccineDoseInput} onChange={(e) => setVaccineDoseInput(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes (Optional)</label>
              <textarea placeholder="E.g. Given at General Hospital" rows={2} className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" value={vaccineNotes} onChange={(e) => setVaccineNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsAddVaccinationModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={addVaccinationMutation.isPending}>Save Record</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modals ── */}
      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Allergy">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="p-2 bg-red-100 rounded-full"><AlertTriangle size={24} className="text-red-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-800">Are you sure?</h4>
                <p className="text-sm text-slate-600 mt-1">You are about to remove <strong>{allergyToDelete?.allergen}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-red-600! hover:bg-red-700! border-red-600! hover:border-red-700!" onClick={confirmDeleteAllergy} loading={deleteAllergyMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteConditionModalOpen && (
        <Modal isOpen={isDeleteConditionModalOpen} onClose={() => setIsDeleteConditionModalOpen(false)} title="Remove Condition">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="p-2 bg-red-100 rounded-full"><AlertTriangle size={24} className="text-red-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-800">Are you sure?</h4>
                <p className="text-sm text-slate-600 mt-1">You are about to remove <strong>{conditionToDelete?.condition}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteConditionModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-red-600! hover:bg-red-700! border-red-600! hover:border-red-700!" onClick={() => deleteConditionMutation.mutate(conditionToDelete.id)} loading={deleteConditionMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteVaccinationModalOpen && (
        <Modal isOpen={isDeleteVaccinationModalOpen} onClose={() => setIsDeleteVaccinationModalOpen(false)} title="Remove Vaccination">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="p-2 bg-red-100 rounded-full"><AlertTriangle size={24} className="text-red-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-800">Are you sure?</h4>
                <p className="text-sm text-slate-600 mt-1">You are about to remove the record for <strong>{vaccinationToDelete?.vaccine_name}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteVaccinationModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-red-600! hover:bg-red-700! border-red-600! hover:border-red-700!" onClick={() => deleteVaccinationMutation.mutate(vaccinationToDelete.id)} loading={deleteVaccinationMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PatientProfilePage;