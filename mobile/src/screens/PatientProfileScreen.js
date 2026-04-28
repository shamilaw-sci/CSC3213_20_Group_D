/**
 * @file    PatientProfileScreen.js
 * @module  Patient
 * @desc    Mobile screen showing patient profile information.
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
import { getPatientProfile } from '../services/patient.service';

// TEMPORARY — hardcoded until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

export default function PatientProfileScreen() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getPatientProfile(TEST_PATIENT_ID);
        setPatient(data);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
      <ScrollView style={styles.container}>

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
  safeArea:      { flex: 1, backgroundColor: '#F8FAFC' },
  container:     { flex: 1 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:   { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorText:     { fontSize: 14, color: '#C00000', textAlign: 'center' },

  header:        { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 48 },
  headerTitle:   { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle:{ fontSize: 12, color: '#94A3B8', marginTop: 4 },

  card:          { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0,
                   borderRadius: 12, padding: 16,
                   shadowColor: '#000', shadowOpacity: 0.06,
                   shadowRadius: 4, elevation: 2 },
  cardTitle:     { fontSize: 16, fontWeight: '600', color: '#1E293B',
                   marginBottom: 12, paddingBottom: 8,
                   borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },

  fieldRow:      { flexDirection: 'row', justifyContent: 'space-between',
                   paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel:    { fontSize: 13, color: '#64748B', flex: 1 },
  fieldValue:    { fontSize: 13, color: '#1E293B', fontWeight: '500',
                   flex: 2, textAlign: 'right' },
});