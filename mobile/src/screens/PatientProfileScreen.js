/**
 * @file    PatientProfileScreen.js
 * @module  Patient
 * @desc    Mobile screen showing patient profile information, known allergies,
 * chronic conditions, and an inline edit form for updatable fields.
 * Now includes AI Camera Scanning for bulk vaccination records.
 * Privacy & Consent Controls added in CARE4U-284 (Epic 8.12).
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  getPatientProfile,
  getPatientAllergies,
  updatePatientProfile,
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
} from '../services/patient.service';
import { searchAllergens } from '../utils/allergenSearch';
import { searchVaccines } from '../utils/vaccineSearch';

// Fallback used only if no patientId prop is passed (e.g. during standalone testing)
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';
const BLOOD_GROUP_OPTIONS   = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELATIONSHIP_OPTIONS  = ['spouse', 'parent', 'sibling', 'child', 'friend', 'other'];
const SEVERITY_OPTIONS      = ['mild', 'moderate', 'severe'];
const SENSITIVE_CATEGORIES  = ['Mental Health', 'Reproductive Health', 'Substance Abuse', 'STD/STI Records'];

const severityColor = (severity) => {
  if (severity === 'severe')   return '#C00000';
  if (severity === 'moderate') return '#E67E22';
  return '#1F7A1F';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatAge = (dob) => {
  if (!dob) return '—';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} yrs`;
};

const OptionSelector = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.editFieldWrapper}>
      <Text style={styles.editLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectorButton, open && styles.selectorButtonOpen]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.selectorValue : styles.selectorPlaceholder}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : `Select ${label}`}
        </Text>
        <Text style={styles.selectorChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.optionsList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionItem, value === opt && styles.optionItemSelected]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.optionText, value === opt && styles.optionTextSelected]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

export default function PatientProfileScreen({ patientId }) {
  const activePatientId = patientId || TEST_PATIENT_ID;
  const [patient, setPatient] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [lockedCategories, setLockedCategories] = useState([]); // Privacy Settings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add Allergy State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allergenInput, setAllergenInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState('mild');
  const [allergyNotes, setAllergyNotes] = useState('');
  const [addingAllergy, setAddingAllergy] = useState(false);

  // Add Condition State
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [conditionInput, setConditionInput] = useState('');
  const [diagnosedAtInput, setDiagnosedAtInput] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [isPriorityInput, setIsPriorityInput] = useState(false);
  const [addingCondition, setAddingCondition] = useState(false);

  // Dynamic Bulk Vaccination State
  const [isAddVaccinationModalOpen, setIsAddVaccinationModalOpen] = useState(false);
  const [bulkVaccines, setBulkVaccines] = useState([{ id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]);
  const [activeVaccineRowId, setActiveVaccineRowId] = useState(null);
  const [vaccineSuggestions, setVaccineSuggestions] = useState([]);
  const [addingVaccination, setAddingVaccination] = useState(false);
  const [scanningCard, setScanningCard] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileData = await getPatientProfile(activePatientId);
      const allergyData = await getPatientAllergies(activePatientId);
      const conditionData = await getConditions(activePatientId);
      const vaccinationData = await getVaccinations(activePatientId);
      const consentData = await getConsentSettings(activePatientId);
      
      setPatient(profileData);
      setAllergies(allergyData);
      setConditions(conditionData);
      setVaccinations(vaccinationData);
      setLockedCategories(consentData);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPress = () => {
    setFormData({
      full_name: patient?.full_name || '',
      blood_group: patient?.blood_group || '',
      emergency_contact_name: patient?.emergency_contact_name || '',
      emergency_contact_phone: patient?.emergency_contact_phone || '',
      emergency_contact_relationship: patient?.emergency_contact_relationship || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.full_name?.trim()) { setSaveError('Full name is required.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePatientProfile(activePatientId, formData);
      setPatient(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  // --- Privacy & Consent Toggle Logic ---
  const handleToggleConsent = async (category) => {
    const isLocked = lockedCategories.includes(category);
    let newCategories;
    
    if (isLocked) {
      newCategories = lockedCategories.filter(c => c !== category);
    } else {
      newCategories = [...lockedCategories, category];
    }
    
    // Optimistic UI Update
    setLockedCategories(newCategories);
    
    try {
      await updateConsentSettings(activePatientId, newCategories);
    } catch (error) {
      // Revert if failed
      setLockedCategories(lockedCategories);
      Alert.alert('Error', 'Failed to update privacy settings.');
    }
  };

  // --- Allergy Logic ---
  const handleSearchAllergens = (text) => {
    setAllergenInput(text);
    setSuggestions(searchAllergens(text));
  };

  const handleAddAllergy = async () => {
    if (!allergenInput.trim()) {
      Alert.alert('Validation Error', 'Please enter an allergen name.');
      return;
    }
    setAddingAllergy(true);
    try {
      await addAllergy(activePatientId, allergenInput.trim(), selectedSeverity, allergyNotes.trim());
      const updatedAllergies = await getPatientAllergies(activePatientId);
      setAllergies(updatedAllergies);
      setIsAddModalOpen(false);
      setAllergenInput('');
      setAllergyNotes('');
      setSelectedSeverity('mild');
    } catch (err) {
      Alert.alert('Error', 'Failed to add allergy.');
    } finally {
      setAddingAllergy(false);
    }
  };

  const promptDeleteAllergy = (allergy) => {
    Alert.alert(
      "Remove Allergy",
      `Are you sure you want to remove ${allergy.allergen}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteAllergy(activePatientId, allergy.id);
              const updatedAllergies = await getPatientAllergies(activePatientId);
              setAllergies(updatedAllergies);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove allergy.');
            }
          } 
        }
      ]
    );
  };

  // --- Condition Logic ---
  const handleAddCondition = async () => {
    if (!conditionInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a condition name.');
      return;
    }
    setAddingCondition(true);
    try {
      await addCondition(activePatientId, conditionInput.trim(), diagnosedAtInput.trim(), conditionNotes.trim(), isPriorityInput);
      const updatedConditions = await getConditions(activePatientId);
      setConditions(updatedConditions);
      setIsAddConditionModalOpen(false);
      setConditionInput('');
      setDiagnosedAtInput('');
      setConditionNotes('');
      setIsPriorityInput(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add condition.');
    } finally {
      setAddingCondition(false);
    }
  };

  const promptDeleteCondition = (condition) => {
    Alert.alert(
      "Remove Condition",
      `Are you sure you want to remove ${condition.condition}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteCondition(activePatientId, condition.id);
              const updatedConditions = await getConditions(activePatientId);
              setConditions(updatedConditions);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove condition.');
            }
          } 
        }
      ]
    );
  };

  // --- Bulk Vaccination Logic ---
  const addVaccineRow = () => {
    setBulkVaccines([...bulkVaccines, { id: Date.now().toString(), vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]);
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

  const submitBulkVaccination = async () => {
    const validVaccines = bulkVaccines.filter(v => v.vaccineName.trim() !== '' || v.dateAdministered.trim() !== '');
    
    if (validVaccines.length === 0) {
      return Alert.alert('Validation Error', 'Please complete at least one vaccination record.');
    }

    const hasMissingFields = validVaccines.some(v => v.vaccineName.trim() === '' || v.dateAdministered.trim() === '');
    
    if (hasMissingFields) {
      return Alert.alert('Validation Error', 'Please ensure both Vaccine Name and Date are filled for all active rows.');
    }

    setAddingVaccination(true);
    try {
      await addBulkVaccinations(activePatientId, validVaccines);
      const updatedVaccinations = await getVaccinations(activePatientId);
      setVaccinations(updatedVaccinations);
      setIsAddVaccinationModalOpen(false);
      setBulkVaccines([{ id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]);
      Alert.alert('Success', 'Vaccinations saved successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add vaccinations.');
    } finally {
      setAddingVaccination(false);
    }
  };

  const promptDeleteVaccination = (vaccination) => {
    Alert.alert(
      "Remove Record",
      `Are you sure you want to remove ${vaccination.vaccine_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteVaccination(activePatientId, vaccination.id);
              const updatedVaccinations = await getVaccinations(activePatientId);
              setVaccinations(updatedVaccinations);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove record.');
            }
          } 
        }
      ]
    );
  };

  // --- AI Camera Scanner ---
  const handleTakeVaccinePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      return Alert.alert("Permission Required", "You need to allow camera access to scan a card.");
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) processVaccineImage(result.assets[0].uri, result.assets[0].mimeType);
  };

  const handleChooseVaccinePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      return Alert.alert("Permission Required", "You need to allow gallery access to upload a card.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) processVaccineImage(result.assets[0].uri, result.assets[0].mimeType);
  };

  const processVaccineImage = async (uri, mimeType) => {
    setScanningCard(true);
    try {
      const data = await scanVaccinationCard(activePatientId, uri, mimeType);
      
      const extractedArray = Array.isArray(data) ? data : [data];
      const newBulkRows = extractedArray.map((item, index) => ({
        id: Date.now().toString() + index,
        vaccineName: item.vaccineName || '',
        dateAdministered: item.dateAdministered || '',
        doseNumber: item.doseNumber || '',
        notes: ''
      }));

      if (newBulkRows.length > 0) {
        setBulkVaccines(newBulkRows);
        Alert.alert('Success', 'Card scanned! Please review the extracted data below before saving.');
      }
    } catch (err) {
      Alert.alert('Scan Failed', 'Failed to extract data from the image. Please try again or enter manually.');
    } finally {
      setScanningCard(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: patient?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=2E75B6&color=fff&size=120&bold=true&rounded=true` }}
                  style={styles.profilePhoto}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerEyebrow}>MY PROFILE</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>{patient?.full_name || 'Patient'}</Text>

                {/* Clinical Badges Row */}
                <View style={styles.badgesRow}>
                  <Text style={styles.demographicsText}>
                    {formatAge(patient?.date_of_birth)} · {patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—'}
                  </Text>
                  {patient?.blood_group ? (
                    <View style={styles.bloodGroupBadge}>
                      <Text style={styles.bloodGroupText}>{patient.blood_group}</Text>
                    </View>
                  ) : null}
                  {conditions.some(c => c.is_priority) && (
                    <View style={styles.priorityConditionBadge}>
                      <Text style={styles.priorityConditionText}>⚠ Priority</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeLabel}>PATIENT ID</Text>
              <Text style={styles.qrCodeValue}>{patient?.qr_code_id || '—'}</Text>
            </View>
          </View>

          {saveSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓  Profile updated successfully</Text>
            </View>
          )}

          {/* VIEW MODE */}
          {!isEditing && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <ProfileField label="Full Name" value={patient?.full_name} />
                <ProfileField label="Blood Group" value={patient?.blood_group} />
                <ProfileField label="Date of Birth" value={formatDate(patient?.date_of_birth)} />
                <ProfileField label="Gender" value={patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—'} />
                <ProfileField label="NIC" value={patient?.nic} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Emergency Contact</Text>
                <ProfileField label="Name" value={patient?.emergency_contact_name} />
                <ProfileField label="Phone" value={patient?.emergency_contact_phone} />
                <ProfileField label="Relationship" value={patient?.emergency_contact_relationship ? patient.emergency_contact_relationship.charAt(0).toUpperCase() + patient.emergency_contact_relationship.slice(1) : '—'} />
              </View>

              {/* Chronic Conditions Section */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitleHalf}>Chronic Conditions</Text>
                  <TouchableOpacity onPress={() => setIsAddConditionModalOpen(true)} style={styles.addMiniButton}>
                    <Text style={styles.addMiniButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {conditions.length === 0 ? (
                  <Text style={styles.noAllergies}>No conditions recorded</Text>
                ) : (
                  conditions.map((condition) => (
                    <View key={condition.id} style={[styles.allergyRow, condition.is_priority && styles.priorityRow]}>
                      <View style={styles.allergyLeft}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.allergyName, condition.is_priority && styles.priorityText]}>
                            {condition.condition}
                          </Text>
                        </View>
                        {condition.diagnosed_at && <Text style={styles.allergyNotes}>Diagnosed: {formatDate(condition.diagnosed_at)}</Text>}
                        {condition.notes ? <Text style={styles.allergyNotes}>{condition.notes}</Text> : null}
                      </View>
                      <View style={styles.allergyRight}>
                        {condition.is_priority && (
                          <View style={styles.priorityBadge}>
                            <Text style={styles.priorityBadgeText}>PRIORITY</Text>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => promptDeleteCondition(condition)} style={styles.deleteIconBtn}>
                          <Text style={styles.deleteIconText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Known Allergies Section */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitleHalf}>Known Allergies</Text>
                  <TouchableOpacity onPress={() => { handleSearchAllergens(''); setIsAddModalOpen(true); }} style={styles.addMiniButton}>
                    <Text style={styles.addMiniButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {allergies.length === 0 ? (
                  <Text style={styles.noAllergies}>No allergies recorded</Text>
                ) : (
                  allergies.map((allergy) => (
                    <View key={allergy.id} style={styles.allergyRow}>
                      <View style={styles.allergyLeft}>
                        <Text style={styles.allergyName}>{allergy.allergen}</Text>
                        {allergy.notes ? <Text style={styles.allergyNotes}>{allergy.notes}</Text> : null}
                      </View>
                      <View style={styles.allergyRight}>
                        <View style={[styles.severityBadge, { backgroundColor: severityColor(allergy.severity) }]}>
                          <Text style={styles.severityText}>{allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => promptDeleteAllergy(allergy)} style={styles.deleteIconBtn}>
                          <Text style={styles.deleteIconText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Vaccination Records Section */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitleHalf}>Vaccination Records</Text>
                  <TouchableOpacity onPress={() => { setBulkVaccines([{ id: 'initial-row', vaccineName: '', dateAdministered: '', doseNumber: '', notes: '' }]); setIsAddVaccinationModalOpen(true); }} style={styles.addMiniButton}>
                    <Text style={styles.addMiniButtonText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {vaccinations.length === 0 ? (
                  <Text style={styles.noAllergies}>No vaccination records found</Text>
                ) : (
                  vaccinations.map((vaccine) => (
                    <View key={vaccine.id} style={styles.allergyRow}>
                      <View style={styles.allergyLeft}>
                        <Text style={styles.allergyName}>{vaccine.vaccine_name}</Text>
                        <Text style={styles.allergyNotes}>Given: {formatDate(vaccine.date_administered)}</Text>
                        {vaccine.dose_number ? <Text style={styles.allergyNotes}>Dose: {vaccine.dose_number}</Text> : null}
                        {vaccine.notes ? <Text style={[styles.allergyNotes, { fontStyle: 'italic' }]}>"{vaccine.notes}"</Text> : null}
                      </View>
                      <View style={styles.allergyRight}>
                        <TouchableOpacity onPress={() => promptDeleteVaccination(vaccine)} style={styles.deleteIconBtn}>
                          <Text style={styles.deleteIconText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* ── NEW: Privacy & Consent Controls (Epic 8.12) ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Privacy & Consent Controls</Text>
                <Text style={styles.consentSubTitle}>
                  Lock specific medical record categories. Doctors will require your explicit permission to view locked records.
                </Text>
                
                <View style={styles.consentGrid}>
                  {SENSITIVE_CATEGORIES.map(category => {
                    const isLocked = lockedCategories.includes(category);
                    return (
                      <View key={category} style={[styles.consentItem, isLocked && styles.consentItemLocked]}>
                        <View style={styles.consentHeader}>
                          <View style={[styles.consentIcon, isLocked ? styles.consentIconLocked : styles.consentIconUnlocked]}>
                            <Text style={styles.consentIconText}>{isLocked ? '🔒' : '🔓'}</Text>
                          </View>
                          <Switch
                            value={isLocked}
                            onValueChange={() => handleToggleConsent(category)}
                            trackColor={{ false: '#E2E8F0', true: '#FCA5A5' }}
                            thumbColor={isLocked ? '#DC2626' : '#FFFFFF'}
                            ios_backgroundColor="#E2E8F0"
                          />
                        </View>
                        <Text style={styles.consentCategoryName}>{category}</Text>
                        <Text style={[styles.consentStatusText, isLocked ? styles.consentStatusTextLocked : styles.consentStatusTextUnlocked]}>
                          {isLocked ? 'Locked (Requires Approval)' : 'Unlocked (Default Access)'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.editButton} onPress={handleEditPress} activeOpacity={0.85}>
                <Text style={styles.editButtonText}>✎  Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}

          {/* EDIT MODE */}
          {isEditing && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Edit Personal Information</Text>
                <View style={styles.editFieldWrapper}>
                  <Text style={styles.editLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.full_name}
                    onChangeText={(v) => updateField('full_name', v)}
                    placeholder="Enter full name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <OptionSelector label="Blood Group" value={formData.blood_group} options={BLOOD_GROUP_OPTIONS} onSelect={(v) => updateField('blood_group', v)} />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Edit Emergency Contact</Text>
                <View style={styles.editFieldWrapper}>
                  <Text style={styles.editLabel}>Contact Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.emergency_contact_name}
                    onChangeText={(v) => updateField('emergency_contact_name', v)}
                    placeholder="Enter contact name"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={styles.editFieldWrapper}>
                  <Text style={styles.editLabel}>Contact Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.emergency_contact_phone}
                    onChangeText={(v) => updateField('emergency_contact_phone', v)}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                </View>
                <OptionSelector label="Relationship" value={formData.emergency_contact_relationship} options={RELATIONSHIP_OPTIONS} onSelect={(v) => updateField('emergency_contact_relationship', v)} />
              </View>

              {saveError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{saveError}</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)} disabled={saving}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Allergy Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Allergy</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}><Text style={styles.modalCloseText}>✕</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.editFieldWrapper}>
                <Text style={styles.editLabel}>Allergen Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={allergenInput}
                  onChangeText={handleSearchAllergens}
                  placeholder="Start typing to search..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />

                {suggestions.length > 0 && allergenInput.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((sugg, i) => (
                      <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => { setAllergenInput(sugg.name); setSuggestions([]); }}>
                        <Text style={styles.suggestionName}>{sugg.name}</Text>
                        <Text style={styles.suggestionCat}>{sugg.category}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <OptionSelector label="Severity *" value={selectedSeverity} options={SEVERITY_OPTIONS} onSelect={setSelectedSeverity} />

              <View style={styles.editFieldWrapper}>
                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={allergyNotes}
                  onChangeText={setAllergyNotes}
                  placeholder="E.g. Triggers mild rhinitis"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddAllergy} disabled={addingAllergy}>
                {addingAllergy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Allergy</Text>}
              </TouchableOpacity>
            </ScrollView>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Condition Modal */}
      <Modal visible={isAddConditionModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Chronic Condition</Text>
              <TouchableOpacity onPress={() => setIsAddConditionModalOpen(false)}><Text style={styles.modalCloseText}>✕</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.editFieldWrapper}>
                <Text style={styles.editLabel}>Condition Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={conditionInput}
                  onChangeText={setConditionInput}
                  placeholder="E.g. Type 2 Diabetes"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.editFieldWrapper}>
                <Text style={styles.editLabel}>Diagnosed Date (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={diagnosedAtInput}
                  onChangeText={setDiagnosedAtInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.editFieldWrapper}>
                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={conditionNotes}
                  onChangeText={setConditionNotes}
                  placeholder="E.g. Managed with Metformin"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Mark as Priority/Severe</Text>
                  <Switch
                    value={isPriorityInput}
                    onValueChange={setIsPriorityInput}
                    trackColor={{ false: '#E2E8F0', true: '#FCA5A5' }}
                    thumbColor={isPriorityInput ? '#C00000' : '#F8FAFC'}
                  />
                </View>
                <Text style={styles.switchHelpText}>Alerts doctors immediately when they scan your profile.</Text>
              </View>

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddCondition} disabled={addingCondition}>
                {addingCondition ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Condition</Text>}
              </TouchableOpacity>
            </ScrollView>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Dynamic Bulk Add Vaccination Modal */}
      <Modal visible={isAddVaccinationModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalContent, { maxHeight: '90%' }]}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vaccination(s)</Text>
              <TouchableOpacity onPress={() => setIsAddVaccinationModalOpen(false)}><Text style={styles.modalCloseText}>✕</Text></TouchableOpacity>
            </View>

            {/* Smart AI Scan Banner inside Mobile */}
            <View style={styles.aiBanner}>
              <Text style={styles.aiBannerTitle}>📸 Smart AI Scan</Text>
              <Text style={styles.aiBannerText}>Save time! Snap a photo of your vaccination card to automatically extract multiple entries at once.</Text>
              <View style={styles.aiBannerButtons}>
                <TouchableOpacity style={styles.aiButton} onPress={handleTakeVaccinePhoto} disabled={scanningCard}>
                  {scanningCard ? <ActivityIndicator size="small" color="#1E3A5F" /> : <Text style={styles.aiButtonText}>Take Photo</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiButton} onPress={handleChooseVaccinePhoto} disabled={scanningCard}>
                  {scanningCard ? <ActivityIndicator size="small" color="#1E3A5F" /> : <Text style={styles.aiButtonText}>Gallery</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ marginTop: 10 }} keyboardShouldPersistTaps="handled">
              
              {bulkVaccines.map((row, index) => (
                <View key={row.id} style={styles.bulkRowContainer}>
                  
                  {bulkVaccines.length > 1 && (
                    <TouchableOpacity style={styles.removeRowBtn} onPress={() => removeVaccineRow(row.id)}>
                      <Text style={styles.removeRowBtnText}>✕ Remove Row</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.editFieldWrapper}>
                    <Text style={styles.editLabel}>Vaccine Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={row.vaccineName}
                      onChangeText={(val) => updateVaccineRow(row.id, 'vaccineName', val)}
                      onFocus={() => { setVaccineSuggestions(searchVaccines(row.vaccineName)); setActiveVaccineRowId(row.id); }}
                      placeholder="E.g. BCG"
                      placeholderTextColor="#94A3B8"
                    />

                    {activeVaccineRowId === row.id && vaccineSuggestions.length > 0 && row.vaccineName.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        {vaccineSuggestions.map((sugg, i) => (
                          <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => { updateVaccineRow(row.id, 'vaccineName', sugg.name); setActiveVaccineRowId(null); }}>
                            <Text style={styles.suggestionName}>{sugg.name}</Text>
                            <Text style={styles.suggestionCat}>{sugg.category}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.editFieldWrapper}>
                    <Text style={styles.editLabel}>Date Administered *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={row.dateAdministered}
                      onChangeText={(val) => updateVaccineRow(row.id, 'dateAdministered', val)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.editFieldWrapper, { flex: 1 }]}>
                      <Text style={styles.editLabel}>Dose (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={row.doseNumber}
                        onChangeText={(val) => updateVaccineRow(row.id, 'doseNumber', val)}
                        placeholder="E.g. Booster"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={[styles.editFieldWrapper, { flex: 1 }]}>
                      <Text style={styles.editLabel}>Notes (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={row.notes}
                        onChangeText={(val) => updateVaccineRow(row.id, 'notes', val)}
                        placeholder="E.g. Given at GH"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addRowButton} onPress={addVaccineRow}>
                <Text style={styles.addRowButtonText}>+ Add Another Row</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveButton} onPress={submitBulkVaccination} disabled={addingVaccination}>
                {addingVaccination ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save All Records</Text>}
              </TouchableOpacity>
            </ScrollView>

          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#F8FAFC' },
  container:   { flex: 1 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorText:   { fontSize: 14, color: '#C00000', textAlign: 'center' },

  header: { backgroundColor: '#1E3A5F', padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, zIndex: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  profilePhoto: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' },
  headerText: { flex: 1, justifyContent: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: 'bold', color: '#93C5FD', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  demographicsText: { fontSize: 13, color: '#CBD5E1', fontWeight: '500' },
  bloodGroupBadge: { backgroundColor: '#C00000', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  bloodGroupText: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  priorityConditionBadge: { backgroundColor: '#D97706', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  priorityConditionText: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  qrCodeContainer: { marginTop: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  qrCodeLabel: { fontSize: 10, color: '#93C5FD', fontWeight: 'bold', letterSpacing: 0.5 },
  qrCodeValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 2 },

  successBanner: { backgroundColor: '#DCFCE7', marginHorizontal: 16, marginTop: 12, borderRadius: 8, padding: 12, borderLeftWidth: 4, borderLeftColor: '#1F7A1F' },
  successText: { fontSize: 13, color: '#1F7A1F', fontWeight: '500' },
  errorBanner: { backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 8, borderRadius: 8, padding: 12, borderLeftWidth: 4, borderLeftColor: '#C00000' },
  errorBannerText: { fontSize: 13, color: '#C00000', fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cardTitleHalf: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  addMiniButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addMiniButtonText: { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },

  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 13, color: '#64748B', flex: 1 },
  fieldValue: { fontSize: 13, color: '#1E293B', fontWeight: '500', flex: 2, textAlign: 'right' },

  noAllergies: { fontSize: 13, color: '#64748B', marginTop: 4 },
  allergyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  allergyLeft:   { flex: 1, marginRight: 8 },
  allergyName:   { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  allergyNotes:  { fontSize: 12, color: '#64748B', marginTop: 3 },
  allergyRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  severityText:  { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },
  deleteIconBtn: { padding: 6, backgroundColor: '#FEE2E2', borderRadius: 20 },
  deleteIconText: { color: '#C00000', fontSize: 12, fontWeight: 'bold' },

  priorityRow: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, borderRadius: 8, marginHorizontal: -8 },
  priorityText: { color: '#7F1D1D' },
  priorityBadge: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 },

  // --- NEW PRIVACY & CONSENT STYLES ---
  consentSubTitle: { fontSize: 12, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  consentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  consentItem: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, marginBottom: 4 },
  consentItemLocked: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  consentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  consentIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  consentIconUnlocked: { backgroundColor: '#F0FDFA' },
  consentIconLocked: { backgroundColor: '#FEE2E2' },
  consentIconText: { fontSize: 14 },
  consentCategoryName: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  consentStatusText: { fontSize: 10, fontWeight: '600' },
  consentStatusTextUnlocked: { color: '#0D9488' },
  consentStatusTextLocked: { color: '#DC2626' },

  editButton: { backgroundColor: '#1E3A5F', marginHorizontal: 16, marginTop: 16, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  editButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  editFieldWrapper: { marginBottom: 14, position: 'relative' },
  editLabel: { fontSize: 11, color: '#64748B', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1E293B', backgroundColor: '#FFFFFF' },

  selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  selectorButtonOpen: { borderColor: '#1E3A5F', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectorValue:       { fontSize: 14, color: '#1E293B' },
  selectorPlaceholder: { fontSize: 14, color: '#94A3B8' },
  selectorChevron:     { fontSize: 11, color: '#64748B' },
  optionsList: { borderWidth: 1, borderTopWidth: 0, borderColor: '#1E3A5F', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  optionItem:         { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  optionItemSelected: { backgroundColor: '#EFF6FF' },
  optionText:         { fontSize: 14, color: '#1E293B' },
  optionTextSelected: { color: '#1E3A5F', fontWeight: '600' },

  switchContainer: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FEE2E2' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#7F1D1D' },
  switchHelpText: { fontSize: 11, color: '#B91C1C' },

  buttonRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FFFFFF' },
  cancelButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  saveButton: { flex: 2, backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#94A3B8' },
  saveButtonText:     { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  modalCloseText: { fontSize: 20, color: '#64748B', padding: 4 },
  modalSaveButton: { backgroundColor: '#1E3A5F', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },

  suggestionsContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, maxHeight: 150, zIndex: 50 },
  suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionName: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
  suggestionCat: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' },

  aiBanner: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#DBEAFE' },
  aiBannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  aiBannerText: { fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 18 },
  aiBannerButtons: { flexDirection: 'row', gap: 10 },
  aiButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFDBFE', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  aiButtonText: { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },

  bulkRowContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, marginBottom: 16 },
  removeRowBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  removeRowBtnText: { fontSize: 10, color: '#C00000', fontWeight: 'bold' },
  addRowButton: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  addRowButtonText: { color: '#475569', fontSize: 14, fontWeight: '600' }
});