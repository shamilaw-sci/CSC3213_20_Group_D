/**
 * @file    PatientProfilePage.jsx
 * @component PatientProfilePage
 * @desc    Displays and allows editing of the patient's profile.
 * Includes smart autocomplete for adding allergies, secure deletion,
 * profile photo upload (CARE4U-65), and a redesigned Ultra-Clean Light Mode header.
 * Avatar sized up to 96px for reliable visual identification.
 * Chronic conditions management added in CARE4U-79.
 * Vaccination Records added in CARE4U-148.
 * AI Vaccination Bulk Card Scanning added in CARE4U-154.
 * Smart Health Awareness Feed added in CARE4U-280 (Epic 8.13).
 * Privacy & Consent Controls added in CARE4U-284 (Epic 8.12).
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Droplets, Phone, Calendar, Edit2, X, Save, AlertTriangle, Trash2, Plus, Camera, Syringe, ScanLine, Shield, Lock, Unlock } from 'lucide-react';

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
  addBulkVaccinations,
  deleteVaccination,
  scanVaccinationCard,
  getConsentSettings,
  updateConsentSettings
} from '../../services/patient.service';
import { searchAllergens } from '../../utils/allergenSearch';
import { searchVaccines } from '../../utils/vaccineSearch';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal'; 
import HealthAwarenessFeed from '../../components/common/HealthAwarenessFeed';

/**
 * Fetches the currently logged-in patient's real ID from the session,
 * replacing what used to be a hardcoded TEST_PATIENT_ID.
 */
const usePatientId = () => {
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.data?.profile_id) {
          setPatientId(data.data.profile_id);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  return { patientId, loading };
};

// ─── Sensitive Categories for Consent ──────────
const SENSITIVE_CATEGORIES = ['Mental Health', 'Reproductive Health', 'Substance Abuse', 'STD/STI Records'];

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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=0D9488&color=fff&size=120&bold=true&rounded=true`;
};

const getFirstName = (fullName) => {
  if (!fullName) return 'there';
  return fullName.trim().split(' ')[0];
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  priority: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Priority' },
  severe:   { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Severe' },
  moderate: { bg: 'bg-orange-100',     text: 'text-orange-700',  label: 'Moderate' },
  mild:     { bg: 'bg-green-100',      text: 'text-green-700',   label: 'Mild' },
};

const SeverityBadge = ({ severity }) => {
  const style = SEVERITY_STYLES[severity?.toLowerCase()] || SEVERITY_STYLES.mild;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

// ─── Profile Field Component ──────────────────────────────────────────────────
const ProfileField = ({ icon: Icon, label, value }) => Icon ? (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-2 bg-secondary rounded-lg">
      <Icon size={16} className="text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || '—'}</p>
    </div>
  </div>
) : (
  <div className="flex items-start gap-3">
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

// ─── Banner Load Animations ─────────────────────────────
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
      0%   { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
      70%  { box-shadow: 0 0 0 18px rgba(20, 184, 166, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
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
  const { patientId: TEST_PATIENT_ID, loading: patientIdLoading } = usePatientId();
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
  const scanVaccineInputRef = useRef(null);

  // ── Autocomplete State (Allergies) ──
  const [allergenInput, setAllergenInput] = useState('');
  const [allergySuggestions, setAllergySuggestions] = useState([]);
  const [showAllergySuggestions, setShowAllergySuggestions] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('mild');
  const [allergyNotes, setAllergyNotes] = useState('');
  const allergyDropdownRef = useRef(null);

  // ── Dynamic Bulk Autocomplete State (Vaccinations) ──
  const [bulkVaccines, setBulkVaccines] = useState([
    { id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }
  ]);
  const [activeVaccineRowId, setActiveVaccineRowId] = useState(null);
  const [vaccineSuggestions, setVaccineSuggestions] = useState([]);

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
      if (!event.target.closest('.vaccine-autocomplete-container')) {
        setActiveVaccineRowId(null);
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

  const addVaccineRow = () => {
    setBulkVaccines([...bulkVaccines, { id: Date.now(), vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]);
  };

  const removeVaccineRow = (id) => {
    setBulkVaccines(bulkVaccines.filter(v => v.id !== id));
  };

  const updateVaccineRow = (id, field, value) => {
    setBulkVaccines(bulkVaccines.map(v => v.id === id ? { ...v, [field]: value } : v));
    if (field === 'vaccineName') {
      setVaccineSuggestions(searchVaccines(value));
      setActiveVaccineRowId(id);
    }
  };

  // ── Queries ──
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ['patient', TEST_PATIENT_ID],
    queryFn: () => getPatientProfile(TEST_PATIENT_ID),
    enabled: !!TEST_PATIENT_ID,
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

  const { data: lockedCategories = [], isLoading: consentLoading } = useQuery({ 
    queryKey: ['consent', TEST_PATIENT_ID], 
    queryFn: () => getConsentSettings(TEST_PATIENT_ID), 
    enabled: !!patient 
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
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to upload photo.'),
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

  const addBulkVaccinationMutation = useMutation({
    mutationFn: (data) => addBulkVaccinations(TEST_PATIENT_ID, data.vaccinations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', TEST_PATIENT_ID] });
      toast.success('Vaccinations saved successfully');
      setIsAddVaccinationModalOpen(false);
      setBulkVaccines([{ id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]);
    },
    onError: () => toast.error('Failed to add vaccinations.'),
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

  const scanVaccinationMutation = useMutation({
    mutationFn: (file) => scanVaccinationCard(TEST_PATIENT_ID, file),
    onSuccess: (data) => {
      toast.success('Card scanned successfully! Please verify details.');
      const extractedArray = Array.isArray(data) ? data : [data];
      const newBulkRows = extractedArray.map((item, index) => ({
        id: Date.now() + index,
        vaccineName: item.vaccineName || '',
        dateAdministered: item.dateAdministered || '',
        doseNumber: item.doseNumber || '',
        notes: ''
      }));
      if (newBulkRows.length > 0) setBulkVaccines(newBulkRows);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to scan card.')
  });

  const consentMutation = useMutation({
    mutationFn: (newCategories) => updateConsentSettings(TEST_PATIENT_ID, newCategories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent', TEST_PATIENT_ID] });
      toast.success('Privacy settings updated');
    },
    onError: () => toast.error('Failed to update privacy settings.'),
  });

  // ── Handlers ──
  const handleToggleConsent = (category) => {
    const isLocked = lockedCategories.includes(category);
    let newCategories;
    if (isLocked) {
      newCategories = lockedCategories.filter(c => c !== category);
    } else {
      newCategories = [...lockedCategories, category];
    }
    consentMutation.mutate(newCategories);
  };

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

  const handleScanVaccineClick = () => scanVaccineInputRef.current?.click();

  const handleScanVaccineChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return toast.error('Please select a valid image file (JPEG, PNG, WEBP).');
    scanVaccinationMutation.mutate(file);
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

  const submitBulkVaccination = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const validVaccines = bulkVaccines.filter(v => v.vaccineName.trim() !== '' || v.dateAdministered.trim() !== '');
    if (validVaccines.length === 0) return toast.error('Please complete at least one vaccination record.');
    const hasMissingFields = validVaccines.some(v => v.vaccineName.trim() === '' || v.dateAdministered.trim() === '');
    if (hasMissingFields) return toast.error('Please ensure both Vaccine Name and Date are filled for all active rows.');
    addBulkVaccinationMutation.mutate({ vaccinations: validVaccines });
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

  const confirmDeleteAllergy = () => {
    if (allergyToDelete) deleteAllergyMutation.mutate(allergyToDelete.id);
  };

  // Sort allergies so severe ones appear at the top
  const sortedAllergies = [...allergies].sort((a, b) => {
    if (a.severity?.toLowerCase() === 'severe' && b.severity?.toLowerCase() !== 'severe') return -1;
    if (a.severity?.toLowerCase() !== 'severe' && b.severity?.toLowerCase() === 'severe') return 1;
    return 0;
  });

  // ── Render States ──
  if (patientIdLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert type="error" message={error?.message || 'Failed to load profile.'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">

      <BannerAnimationStyles />

      {/* ── Ultra-Clean Page Header ── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <div className="cu-glow-ring absolute inset-0" />
              <img
                src={getAvatarSrc(patient)}
                alt="Profile"
                className="cu-avatar-pop w-24 h-24 rounded-full border border-border shadow-sm object-cover"
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
                className="absolute -bottom-0.5 -right-0.5 p-2 bg-card rounded-full shadow-sm border border-border hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Camera size={14} className="text-primary" />
              </button>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoFileChange} />
            </div>
            <div>
              <p className="cu-fade-slide-up text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                My Profile
              </p>
              <h1 className="cu-fade-slide-up text-2xl font-bold text-foreground" style={{ animationDelay: '80ms' }}>
                Welcome back, {getFirstName(patient?.full_name)}
              </h1>
              <p className="cu-fade-slide-up text-sm mt-1 text-muted-foreground" style={{ animationDelay: '150ms' }}>
                Manage your personal health information
              </p>
            </div>
          </div>
          <div className="cu-fade-slide-up hidden sm:block bg-secondary rounded-xl px-4 py-2 text-right" style={{ animationDelay: '250ms' }}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Patient ID</p>
            <p className="text-sm font-mono font-semibold text-foreground">{patient?.qr_code_id || '—'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            {/* ── Smart Health Feed Widget (CARE4U-280) ── */}
            <HealthAwarenessFeed patientAllergies={allergies} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Personal Information">
                <div className="pt-3 space-y-4">
                  <ProfileField icon={User} label="Full Name" value={patient?.full_name} />
                  <ProfileField icon={Droplets} label="Blood Group" value={patient?.blood_group} />
                  <ProfileField icon={Calendar} label="Date of Birth" value={formatDate(patient?.date_of_birth)} />
                  <ProfileField icon={User} label="Gender" value={capitalise(patient?.gender)} />
                  <ProfileField icon={User} label="NIC" value={patient?.nic} />
                </div>
              </Card>

              <Card title="Emergency Contact">
                <div className="pt-3 space-y-4">
                  <ProfileField icon={User} label="Contact Name" value={patient?.emergency_contact_name} />
                  <ProfileField icon={Phone} label="Contact Phone" value={patient?.emergency_contact_phone} />
                  <ProfileField icon={User} label="Relationship" value={capitalise(patient?.emergency_contact_relationship)} />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Chronic Conditions ── */}
              <Card title="Chronic Conditions">
                <div className="pt-3">
                  {conditionsLoading ? (
                     <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                  ) : conditions.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="inline-flex p-3 rounded-full bg-secondary mb-2">
                        <AlertTriangle className="text-muted-foreground" size={24} />
                      </div>
                      <p className="text-sm text-muted-foreground">No conditions recorded.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-1">
                      {conditions.map((condition) => (
                        <div
                          key={condition.id}
                          className="group flex items-start justify-between p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {condition.condition}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Diagnosed: {formatDate(condition.diagnosed_at)}
                            </p>
                            {condition.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5">{condition.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {condition.is_priority && <SeverityBadge severity="priority" />}
                            <button 
                              onClick={() => promptDeleteCondition(condition)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remove condition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-5 flex justify-center">
                    <Button variant="outline" onClick={() => setIsAddConditionModalOpen(true)} className="w-full text-primary border-primary/20 hover:bg-primary/5">
                      <Plus size={16} className="mr-2" /> Add Condition
                    </Button>
                  </div>
                </div>
              </Card>

              {/* ── Known Allergies ── */}
              <Card title="Known Allergies">
                <div className="pt-3">
                  {allergiesLoading ? (
                     <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                  ) : allergies.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="inline-flex p-3 rounded-full bg-secondary mb-2">
                        <AlertTriangle className="text-muted-foreground" size={24} />
                      </div>
                      <p className="text-sm text-muted-foreground">No allergies recorded.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-1">
                      {sortedAllergies.map((allergy) => (
                        <div 
                          key={allergy.id} 
                          className="group flex items-start justify-between p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{allergy.allergen}</p>
                            {allergy.notes && <p className="text-xs text-muted-foreground mt-1">{allergy.notes}</p>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <SeverityBadge severity={allergy.severity} />
                            <button 
                              onClick={() => promptDeleteAllergy(allergy)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Remove allergy"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-5 flex justify-center">
                    <Button variant="outline" onClick={() => { setAllergySuggestions(searchAllergens('')); setIsAddAllergyModalOpen(true); }} className="w-full text-primary border-primary/20 hover:bg-primary/5">
                      <Plus size={16} className="mr-2" /> Add Allergy
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Vaccination Records (CARE4U-148) ── */}
            <div className="mb-6">
              <Card title={<span className="flex items-center gap-2"><Syringe size={18} className="text-primary" /> Vaccination Records</span>}>
                <div className="pt-3">
                  {vaccinationsLoading ? (
                     <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                  ) : vaccinations.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="inline-flex p-3 rounded-full bg-secondary mb-2">
                        <Syringe className="text-muted-foreground" size={24} />
                      </div>
                      <p className="text-sm text-muted-foreground">No vaccination records found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {vaccinations.map((vaccine) => (
                        <div
                          key={vaccine.id}
                          className="group relative flex flex-col p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300"
                        >
                          <div className="flex justify-between items-start pr-8">
                            <div>
                              <p className="text-sm font-bold text-primary">{vaccine.vaccine_name}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-medium">
                                Given: <span className="text-foreground">{formatDate(vaccine.date_administered)}</span>
                              </p>
                              {vaccine.dose_number && (
                                <p className="text-xs text-muted-foreground mt-0.5">Dose: {vaccine.dose_number}</p>
                              )}
                              {vaccine.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 italic">"{vaccine.notes}"</p>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => promptDeleteVaccination(vaccine)}
                            className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-5 flex justify-center">
                    <Button variant="outline" onClick={() => { 
                      setBulkVaccines([{ id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]); 
                      setIsAddVaccinationModalOpen(true); 
                    }} className="w-full sm:w-auto text-primary border-primary/20 hover:bg-primary/5">
                      <Plus size={16} className="mr-2" /> Add Vaccination
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── NEW: Privacy & Consent Controls (Epic 8.12) ── */}
            <div className="mb-6">
              <Card title={<span className="flex items-center gap-2"><Shield size={18} className="text-primary" /> Privacy & Consent Controls</span>}>
                <div className="pt-3">
                  <p className="text-sm text-muted-foreground mb-4">
                    Lock specific medical record categories. Doctors will require your explicit permission to view locked records.
                  </p>
                  
                  {consentLoading ? (
                    <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {SENSITIVE_CATEGORIES.map(category => {
                        const isLocked = lockedCategories.includes(category);
                        return (
                          <div key={category} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300">
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-full ${isLocked ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                {isLocked ? <Lock size={18} strokeWidth={2.5} /> : <Unlock size={18} strokeWidth={2.5} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{category}</p>
                                <p className={`text-xs mt-0.5 font-medium ${isLocked ? 'text-destructive' : 'text-primary'}`}>
                                  {isLocked ? 'Locked (Requires Approval)' : 'Unlocked (Default Access)'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Animated Toggle Switch */}
                            <button 
                              type="button"
                              onClick={() => handleToggleConsent(category)}
                              disabled={consentMutation.isPending}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 ${isLocked ? 'bg-destructive' : 'bg-secondary'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${isLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                <div className="pt-3 space-y-4">
                  <Input label="Full Name" placeholder="Enter full name" error={errors.full_name?.message} {...register('full_name', { required: 'Full name is required' })} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Blood Group <span className="text-destructive">*</span></label>
                    <select className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" {...register('blood_group', { required: 'Required' })}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="Emergency Contact">
                <div className="pt-3 space-y-4">
                  <Input label="Contact Name" placeholder="Enter contact name" {...register('emergency_contact_name')} />
                  <Input label="Contact Phone" placeholder="Enter contact phone" error={errors.emergency_contact_phone?.message} {...register('emergency_contact_phone', { pattern: { value: /^[0-9+\s\-()]{7,15}$/, message: 'Invalid phone number' } })} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Relationship</label>
                    <select className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" {...register('emergency_contact_relationship')}>
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Allergen Name <span className="text-destructive">*</span></label>
              <input type="text" placeholder="Start typing to search..." className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={allergenInput} onChange={handleAllergenInputChange} onFocus={() => { setAllergySuggestions(searchAllergens(allergenInput)); setShowAllergySuggestions(true); }} autoComplete="off" />
              {showAllergySuggestions && allergySuggestions.length > 0 && (
               <div className="absolute top-15 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {allergySuggestions.map((sugg, index) => (
                    <div key={index} onClick={() => handleSelectAllergySuggestion(sugg)} className="px-4 py-2.5 hover:bg-secondary cursor-pointer flex justify-between items-center border-b border-border last:border-0">
                      <span className="text-sm font-medium text-foreground">{sugg.name}</span>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{sugg.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Severity <span className="text-destructive">*</span></label>
              <select className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (Optional)</label>
              <textarea placeholder="E.g. Triggers mild rhinitis" rows={2} className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" value={allergyNotes} onChange={(e) => setAllergyNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Condition Name <span className="text-destructive">*</span></label>
              <input type="text" placeholder="E.g. Type 2 Diabetes" className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={conditionInput} onChange={(e) => setConditionInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diagnosed Date (Optional)</label>
              <input type="date" className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={diagnosedAtInput} onChange={(e) => setDiagnosedAtInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (Optional)</label>
              <textarea placeholder="E.g. Managed with Metformin" rows={2} className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <input type="checkbox" className="w-4 h-4 text-destructive rounded border-border focus:ring-destructive" checked={isPriorityInput} onChange={(e) => setIsPriorityInput(e.target.checked)} />
              <div>
                <span className="text-sm font-semibold text-destructive block">Mark as Priority/Severe</span>
                <span className="text-xs text-destructive/80 block">Alerts doctors immediately when they scan your profile.</span>
              </div>
            </label>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsAddConditionModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={addConditionMutation.isPending}>Save Condition</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Bulk Vaccination Modal ── */}
      {isAddVaccinationModalOpen && (
        <Modal isOpen={isAddVaccinationModalOpen} onClose={() => setIsAddVaccinationModalOpen(false)} title="Add Vaccination Record(s)">
          <div className="flex flex-col h-full max-h-[80vh]">
            
            <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <ScanLine size={18} />
                <span>Smart AI Scan</span>
              </div>
              <p className="text-xs text-foreground">Save time! Upload a photo of the CHDR/vaccination card to automatically extract multiple entries at once.</p>
              <Button type="button" variant="outline" onClick={handleScanVaccineClick} disabled={scanVaccinationMutation.isPending} className="w-full mt-2 bg-card">
                {scanVaccinationMutation.isPending ? (
                  <><Spinner size="sm" className="mr-2" /> Scanning Card...</>
                ) : (
                  <><Camera size={16} className="mr-2" /> Select Photo</>
                )}
              </Button>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" ref={scanVaccineInputRef} onChange={handleScanVaccineChange} />
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 pb-4">
              {bulkVaccines.map((row) => (
                <div key={row.id} className="p-4 bg-secondary border border-border rounded-lg relative">
                  
                  {bulkVaccines.length > 1 && (
                    <button type="button" onClick={() => removeVaccineRow(row.id)} className="absolute -top-2 -right-2 p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-full shadow-sm z-10" title="Remove Row">
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 relative vaccine-autocomplete-container">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vaccine Name <span className="text-destructive">*</span></label>
                      <input 
                        type="text" 
                        placeholder="E.g. BCG" 
                        className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                        value={row.vaccineName} 
                        onChange={(e) => updateVaccineRow(row.id, 'vaccineName', e.target.value)} 
                        onFocus={() => { setVaccineSuggestions(searchVaccines(row.vaccineName)); setActiveVaccineRowId(row.id); }} 
                        autoComplete="off" 
                      />
                      {activeVaccineRowId === row.id && vaccineSuggestions.length > 0 && (
                       <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                          {vaccineSuggestions.map((sugg, i) => (
                            <div key={i} onClick={() => { updateVaccineRow(row.id, 'vaccineName', sugg.name); setActiveVaccineRowId(null); }} className="px-4 py-2.5 hover:bg-secondary cursor-pointer flex justify-between items-center border-b border-border last:border-0">
                              <span className="text-sm font-medium text-foreground">{sugg.name}</span>
                              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{sugg.category}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Administered <span className="text-destructive">*</span></label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                        value={row.dateAdministered} 
                        onChange={(e) => updateVaccineRow(row.id, 'dateAdministered', e.target.value)} 
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dose (Optional)</label>
                      <input type="text" placeholder="E.g. Birth, 6 Weeks" className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={row.doseNumber} onChange={(e) => updateVaccineRow(row.id, 'doseNumber', e.target.value)} />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (Optional)</label>
                      <input type="text" placeholder="E.g. Given at GH" className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={row.notes} onChange={(e) => updateVaccineRow(row.id, 'notes', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addVaccineRow} className="w-full text-muted-foreground border-border border-dashed hover:bg-secondary py-3">
                <Plus size={16} className="mr-2" /> Add Another Row
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0 mt-auto">
              <Button type="button" variant="secondary" onClick={() => setIsAddVaccinationModalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={submitBulkVaccination} variant="primary" loading={addBulkVaccinationMutation.isPending}>Save All Records</Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modals ── */}
      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Allergy">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="p-2 bg-destructive/20 rounded-full"><AlertTriangle size={24} className="text-destructive" /></div>
              <div>
                <h4 className="font-semibold text-foreground">Are you sure?</h4>
                <p className="text-sm text-foreground mt-1">You are about to remove <strong>{allergyToDelete?.allergen}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!" onClick={confirmDeleteAllergy} loading={deleteAllergyMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteConditionModalOpen && (
        <Modal isOpen={isDeleteConditionModalOpen} onClose={() => setIsDeleteConditionModalOpen(false)} title="Remove Condition">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="p-2 bg-destructive/20 rounded-full"><AlertTriangle size={24} className="text-destructive" /></div>
              <div>
                <h4 className="font-semibold text-foreground">Are you sure?</h4>
                <p className="text-sm text-foreground mt-1">You are about to remove <strong>{conditionToDelete?.condition}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteConditionModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!" onClick={() => deleteConditionMutation.mutate(conditionToDelete.id)} loading={deleteConditionMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

      {isDeleteVaccinationModalOpen && (
        <Modal isOpen={isDeleteVaccinationModalOpen} onClose={() => setIsDeleteVaccinationModalOpen(false)} title="Remove Vaccination">
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="p-2 bg-destructive/20 rounded-full"><AlertTriangle size={24} className="text-destructive" /></div>
              <div>
                <h4 className="font-semibold text-foreground">Are you sure?</h4>
                <p className="text-sm text-foreground mt-1">You are about to remove the record for <strong>{vaccinationToDelete?.vaccine_name}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteVaccinationModalOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!" onClick={() => deleteVaccinationMutation.mutate(vaccinationToDelete.id)} loading={deleteVaccinationMutation.isPending}>Yes, Remove It</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PatientProfilePage;