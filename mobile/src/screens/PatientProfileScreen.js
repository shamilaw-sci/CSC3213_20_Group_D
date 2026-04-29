/**
 * @file    PatientProfileScreen.js
 * @module  Patient
 * @desc    Mobile screen showing patient profile information and known allergies.
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
} from 'react-native';
import { getPatientProfile, getPatientAllergies } from '../services/patient.service';

// TEMPORARY — hardcoded until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

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

export default function PatientProfileScreen() {
  const [patient,   setPatient]   = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Patient ID: {patient?.qr_code_id}</Text>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <ProfileField label="Full Name"     value={patient?.full_name} />
          <ProfileField label="Blood Group"   value={patient?.blood_group} />
          <ProfileField label="Date of Birth" value={patient?.date_of_birth?.slice(0, 10)} />
          <ProfileField label="Gender"        value={patient?.gender} />
          <ProfileField label="NIC"           value={patient?.nic} />
        </View>

        {/* Emergency Contact Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Contact</Text>
          <ProfileField label="Name"         value={patient?.emergency_contact_name} />
          <ProfileField label="Phone"        value={patient?.emergency_contact_phone} />
          <ProfileField label="Relationship" value={patient?.emergency_contact_relationship} />
        </View>

        {/* Known Allergies Card */}
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
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: severityColor(allergy.severity) },
                  ]}
                >
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

      </ScrollView>
    </SafeAreaView>
  );
}

const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: '#F8FAFC' },
  container:      { flex: 1 },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:    { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorText:      { fontSize: 14, color: '#C00000', textAlign: 'center' },

  header:         { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 48 },
  headerTitle:    { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  card:           { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0,
                    borderRadius: 12, padding: 16,
                    shadowColor: '#000', shadowOpacity: 0.06,
                    shadowRadius: 4, elevation: 2 },
  cardTitle:      { fontSize: 16, fontWeight: '600', color: '#1E293B',
                    marginBottom: 12, paddingBottom: 8,
                    borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },

  fieldRow:       { flexDirection: 'row', justifyContent: 'space-between',
                    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel:     { fontSize: 13, color: '#64748B', flex: 1 },
  fieldValue:     { fontSize: 13, color: '#1E293B', fontWeight: '500',
                    flex: 2, textAlign: 'right' },

  // Allergies
  noAllergies:    { fontSize: 13, color: '#64748B', marginTop: 4 },
  allergyRow:     { flexDirection: 'row', justifyContent: 'space-between',
                    alignItems: 'center', paddingVertical: 8,
                    borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  allergyLeft:    { flex: 1, marginRight: 8 },
  allergyName:    { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  allergyNotes:   { fontSize: 12, color: '#64748B', marginTop: 2 },
  severityBadge:  { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  severityText:   { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
});