/**
 * @file    PatientProfilePage.jsx
 * @component PatientProfilePage
 * @desc    Displays and allows editing of the patient's profile.
 * Includes smart autocomplete for adding allergies and secure deletion.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Droplets, Phone, Calendar, Edit2, X, Save, AlertTriangle, Trash2, Plus } from 'lucide-react';

import { 
  getPatientProfile, 
  updatePatientProfile, 
  getAllergies, 
  addAllergy, 
  deleteAllergy 
} from '../../services/patient.service';
import { searchAllergens } from '../../utils/allergenSearch';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal'; // Assuming this was created in Epic 2

// ─── TEMPORARY: hardcoded test patient UUID until auth is integrated ──────────
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const capitalise = (str) => {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  severe:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Severe'   },
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

// ─── Main Page Component ──────────────────────────────────────────────────────
const PatientProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // ── Allergy UI State ──
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState(null);

  // ── Autocomplete State ──
  const [allergenInput, setAllergenInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('mild');
  const [allergyNotes, setAllergyNotes] = useState('');
  const dropdownRef = useRef(null);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions whenever user types
  const handleAllergenInputChange = (e) => {
    const value = e.target.value;
    setAllergenInput(value);
    setSuggestions(searchAllergens(value));
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    setAllergenInput(suggestion.name);
    setShowSuggestions(false);
  };

  // ── Queries ──
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ['patient', TEST_PATIENT_ID],
    queryFn: () => getPatientProfile(TEST_PATIENT_ID),
  });

  const { data: allergies = [] } = useQuery({
    queryKey: ['allergies', TEST_PATIENT_ID],
    queryFn: () => getAllergies(TEST_PATIENT_ID),
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

  const addAllergyMutation = useMutation({
    mutationFn: (data) => addAllergy(TEST_PATIENT_ID, data.allergen, data.severity, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', TEST_PATIENT_ID] });
      toast.success('Allergy added successfully');
      setIsAddAllergyModalOpen(false);
      // Reset form state
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

  const submitAddAllergy = (e) => {
    e.preventDefault();
    if (!allergenInput.trim()) {
      toast.error('Please enter or select an allergen.');
      return;
    }
    addAllergyMutation.mutate({
      allergen: allergenInput.trim(),
      severity: selectedSeverity,
      notes: allergyNotes.trim()
    });
  };

  const promptDeleteAllergy = (allergy) => {
    setAllergyToDelete(allergy);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAllergy = () => {
    if (allergyToDelete) {
      deleteAllergyMutation.mutate(allergyToDelete.id);
    }
  };

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
      {/* ── Page Header ── */}
      <div className="bg-[#1E3A5F] text-white px-6 py-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=2E75B6&color=fff&size=80&bold=true&rounded=true`}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-white/30 shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold">{patient?.full_name || 'My Profile'}</h1>
              <p className="text-blue-200 text-sm mt-1">Manage your personal health information</p>
            </div>
          </div>
          <div className="hidden sm:block bg-white/10 rounded-xl px-4 py-2 text-right backdrop-blur-sm">
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

            {/* ── Known Allergies ── */}
            <Card title="Known Allergies">
              {allergies.length === 0 ? (
                <div className="text-center py-6">
                  <div className="inline-flex p-3 rounded-full bg-slate-100 mb-2">
                    <AlertTriangle className="text-slate-400" size={24} />
                  </div>
                  <p className="text-sm text-slate-500">No allergies recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="py-4 flex items-center justify-between group transition-colors hover:bg-slate-50/50 px-2 -mx-2 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle size={16} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{allergy.allergen}</p>
                          {allergy.notes && <p className="text-xs text-slate-500 mt-0.5">{allergy.notes}</p>}
                        </div>
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
              )}
              
              {/* Add Allergy Action Button */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                <Button variant="outline" onClick={() => {
                  setSuggestions(searchAllergens('')); // Load defaults
                  setIsAddAllergyModalOpen(true);
                }} className="w-full sm:w-auto text-[#1E3A5F] border-[#1E3A5F]/20 hover:bg-[#1E3A5F]/5">
                  <Plus size={16} className="mr-2" />
                  Add New Allergy
                </Button>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleEditClick}>
                <Edit2 size={16} />
                Edit Profile
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
                  <Input
                    label="Full Name"
                    placeholder="Enter full name"
                    error={errors.full_name?.message}
                    {...register('full_name', { required: 'Full name is required' })}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                      {...register('blood_group', { required: 'Required' })}
                    >
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="Emergency Contact">
                <div className="space-y-4">
                  <Input
                    label="Contact Name"
                    placeholder="Enter contact name"
                    {...register('emergency_contact_name')}
                  />
                  <Input
                    label="Contact Phone"
                    placeholder="Enter contact phone"
                    error={errors.emergency_contact_phone?.message}
                    {...register('emergency_contact_phone', {
                      pattern: { value: /^[0-9+\s\-()]{7,15}$/, message: 'Invalid phone number' },
                    })}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Relationship</label>
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

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={updateMutation.isPending}>
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Add Allergy Modal ── */}
      {isAddAllergyModalOpen && (
        <Modal 
          isOpen={isAddAllergyModalOpen} 
          onClose={() => setIsAddAllergyModalOpen(false)} 
          title="Add New Allergy"
        >
          <form onSubmit={submitAddAllergy} className="space-y-5 p-1">
            
            {/* Autocomplete Input Group */}
            <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Allergen Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Start typing to search..."
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                value={allergenInput}
                onChange={handleAllergenInputChange}
                onFocus={() => {
                  setSuggestions(searchAllergens(allergenInput));
                  setShowSuggestions(true);
                }}
                autoComplete="off"
              />
              
              {/* Dropdown Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
               <div className="absolute top-15 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {suggestions.map((sugg, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSelectSuggestion(sugg)}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                    >
                      <span className="text-sm font-medium text-slate-700">{sugg.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{sugg.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes (Optional)</label>
              <textarea
                placeholder="E.g. Triggers mild rhinitis"
                rows={2}
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"
                value={allergyNotes}
                onChange={(e) => setAllergyNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setIsAddAllergyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={addAllergyMutation.isPending}>
                Save Allergy
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <Modal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          title="Remove Allergy"
        >
          <div className="p-1 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Are you sure?</h4>
                <p className="text-sm text-slate-600 mt-1">
                  You are about to remove <strong>{allergyToDelete?.allergen}</strong> from your profile. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                className="bg-red-600! hover:bg-red-700! border-red-600! hover:border-red-700!" 
                onClick={confirmDeleteAllergy}
                loading={deleteAllergyMutation.isPending}
              >
                Yes, Remove It
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientProfilePage;