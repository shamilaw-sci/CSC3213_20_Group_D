/**
 * @file    PatientProfileScreen.js
 * @module  Patient
 * @desc    Mobile screen showing patient profile information, known allergies,
 *          and an inline edit form for updatable fields.
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
} from 'react-native';
import {
  getPatientProfile,
  getPatientAllergies,
  updatePatientProfile,
} from '../services/patient.service';

// TEMPORARY — hardcoded until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// Selector options
const BLOOD_GROUP_OPTIONS   = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELATIONSHIP_OPTIONS  = ['spouse', 'parent', 'sibling', 'child', 'friend', 'other'];

/**
 * Returns a colour based on allergy severity.
 * @param {string} severity - mild | moderate | severe
 * @returns {string} hex colour
 */
const severityColor = (severity) => {
  if (severity === 'severe')   return '#C00000';
  if (severity === 'moderate') return '#E67E22';
  return '#1F7A1F';
};

/**
 * Extracts up to 2 initials from a full name.
 * "Nimasha Perera" → "NP"
 * @param {string} name
 * @returns {string}
 */
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * @component OptionSelector
 * @desc      Tap-to-expand inline dropdown for fixed option sets.
 *            Used for blood group and relationship — zero extra packages required.
 * @param {string}   label    - Field label shown above the selector
 * @param {string}   value    - Currently selected value
 * @param {string[]} options  - List of options to show
 * @param {Function} onSelect - Called with the chosen option string
 */
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
          {value
            ? value.charAt(0).toUpperCase() + value.slice(1)
            : `Select ${label}`}
        </Text>
        <Text style={styles.selectorChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.optionsList}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionItem, value === opt && styles.optionItemSelected]}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={[
                styles.optionText,
                value === opt && styles.optionTextSelected,
              ]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * @component ProfileField
 * @desc      Single label + value row used in view mode.
 * @param {string} label
 * @param {string} value
 */
const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

// ─────────────────────────────────────────────
//  Main screen component
// ─────────────────────────────────────────────
export default function PatientProfileScreen() {
  const [patient,     setPatient]     = useState(null);
  const [allergies,   setAllergies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Edit mode state
  const [isEditing,   setIsEditing]   = useState(false);
  const [formData,    setFormData]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await getPatientProfile(TEST_PATIENT_ID);
        const allergyData = await getPatientAllergies(TEST_PATIENT_ID);
        setPatient(profileData);
        setAllergies(allergyData);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * Opens edit mode and pre-fills formData with current patient values.
   */
  const handleEditPress = () => {
    setFormData({
      full_name:                      patient?.full_name                      || '',
      blood_group:                    patient?.blood_group                    || '',
      emergency_contact_name:         patient?.emergency_contact_name         || '',
      emergency_contact_phone:        patient?.emergency_contact_phone        || '',
      emergency_contact_relationship: patient?.emergency_contact_relationship || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  /**
   * Cancels edit mode without saving.
   */
  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  /**
   * Validates form, calls PUT /api/patients/:id, updates local state on success.
   */
  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePatientProfile(TEST_PATIENT_ID, formData);
      setPatient(updated);          // update displayed data immediately
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // hide banner after 3 s
    } catch (err) {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Updates a single field in formData.
   * @param {string} field - key name
   * @param {string} value - new value
   */
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // ── Success state ──
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

        {/* ── Header ── */}
        <View style={styles.header}>
            <View style={styles.headerRow}>

                {/* Care4U logo — top left */}
                <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
                />

                <View style={styles.headerText}>
                <Text style={styles.headerTitle}>
                    {patient?.full_name || 'My Profile'}
                </Text>
                <Text style={styles.headerSubtitle}>
                    Patient ID: {patient?.qr_code_id}
                </Text>
                </View>

                {/* Initials avatar — right side */}
                <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {getInitials(patient?.full_name)}
                </Text>
                </View>

            </View>
        </View>

          {/* ── Success Banner ── */}
          {saveSuccess && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓  Profile updated successfully</Text>
            </View>
          )}

          {/* ════════════════════════════════════════
              VIEW MODE
          ════════════════════════════════════════ */}
          {!isEditing && (
            <>
              {/* Personal Information */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Personal Information</Text>
                <ProfileField label="Full Name"     value={patient?.full_name} />
                <ProfileField label="Blood Group"   value={patient?.blood_group} />
                <ProfileField label="Date of Birth" value={patient?.date_of_birth?.slice(0, 10)} />
                <ProfileField label="Gender"        value={patient?.gender} />
                <ProfileField label="NIC"           value={patient?.nic} />
              </View>

              {/* Emergency Contact */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Emergency Contact</Text>
                <ProfileField label="Name"         value={patient?.emergency_contact_name} />
                <ProfileField label="Phone"        value={patient?.emergency_contact_phone} />
                <ProfileField label="Relationship" value={patient?.emergency_contact_relationship} />
              </View>

              {/* Known Allergies */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Known Allergies ({allergies.length})
                </Text>
                {allergies.length === 0 ? (
                  <Text style={styles.noAllergies}>No allergies recorded</Text>
                ) : (
                  allergies.map((allergy) => (
                    <View key={allergy.id} style={styles.allergyRow}>
                      <View style={styles.allergyLeft}>
                        <Text style={styles.allergyName}>{allergy.allergen}</Text>
                        {allergy.notes ? (
                          <Text style={styles.allergyNotes}>{allergy.notes}</Text>
                        ) : null}
                      </View>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: severityColor(allergy.severity) },
                      ]}>
                        <Text style={styles.severityText}>
                          {allergy.severity
                            ? allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditPress}
                activeOpacity={0.85}
              >
                <Text style={styles.editButtonText}>✎  Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ════════════════════════════════════════
              EDIT MODE
          ════════════════════════════════════════ */}
          {isEditing && (
            <>
              {/* Edit — Personal Information */}
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
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <OptionSelector
                  label="Blood Group"
                  value={formData.blood_group}
                  options={BLOOD_GROUP_OPTIONS}
                  onSelect={(v) => updateField('blood_group', v)}
                />
              </View>

              {/* Edit — Emergency Contact */}
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
                    autoCapitalize="words"
                    returnKeyType="next"
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

                <OptionSelector
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  options={RELATIONSHIP_OPTIONS}
                  onSelect={(v) => updateField('emergency_contact_relationship', v)}
                />
              </View>

              {/* Save Error Banner */}
              {saveError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{saveError}</Text>
                </View>
              )}

              {/* Save / Cancel Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
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

  // ── Header ──
  header:         { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 48 },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText:     { flex: 1 },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  // ── Avatar ──
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2E75B6',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },

  // ── Header Logo ──
  headerLogo: {
  width: 36,
  height: 36,
  borderRadius: 8,
},

  // ── Banners ──
  successBanner: {
    backgroundColor: '#DCFCE7', marginHorizontal: 16, marginTop: 12,
    borderRadius: 8, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#1F7A1F',
  },
  successText: { fontSize: 13, color: '#1F7A1F', fontWeight: '500' },
  errorBanner: {
    backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 8,
    borderRadius: 8, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#C00000',
  },
  errorBannerText: { fontSize: 13, color: '#C00000', fontWeight: '500' },

  // ── Cards ──
  card: {
    backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: {
    fontSize: 16, fontWeight: '600', color: '#1E293B',
    marginBottom: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },

  // ── Profile fields — view mode ──
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  fieldLabel: { fontSize: 13, color: '#64748B', flex: 1 },
  fieldValue: {
    fontSize: 13, color: '#1E293B', fontWeight: '500',
    flex: 2, textAlign: 'right',
  },

  // ── Allergies — view mode ──
  noAllergies: { fontSize: 13, color: '#64748B', marginTop: 4 },
  allergyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  allergyLeft:   { flex: 1, marginRight: 8 },
  allergyName:   { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  allergyNotes:  { fontSize: 12, color: '#64748B', marginTop: 2 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  severityText:  { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },

  // ── Edit Profile button — view mode ──
  editButton: {
    backgroundColor: '#1E3A5F', marginHorizontal: 16, marginTop: 16,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  editButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // ── Edit form ──
  editFieldWrapper: { marginBottom: 14 },
  editLabel: {
    fontSize: 11, color: '#64748B', marginBottom: 6,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#1E293B', backgroundColor: '#FFFFFF',
  },

  // ── OptionSelector ──
  selectorButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
  },
  selectorButtonOpen: {
    borderColor: '#1E3A5F',
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  selectorValue:       { fontSize: 14, color: '#1E293B' },
  selectorPlaceholder: { fontSize: 14, color: '#94A3B8' },
  selectorChevron:     { fontSize: 11, color: '#64748B' },
  optionsList: {
    borderWidth: 1, borderTopWidth: 0, borderColor: '#1E3A5F',
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  optionItem:         { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  optionItemSelected: { backgroundColor: '#EFF6FF' },
  optionText:         { fontSize: 14, color: '#1E293B' },
  optionTextSelected: { color: '#1E3A5F', fontWeight: '600' },

  // ── Save / Cancel buttons ──
  buttonRow: {
    flexDirection: 'row', gap: 12,
    marginHorizontal: 16, marginTop: 16,
  },
  cancelButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  saveButton: {
    flex: 2, backgroundColor: '#1E3A5F',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#94A3B8' },
  saveButtonText:     { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
});