/**
 * @file    DoctorProfileScreen.js
 * @module  Doctor
 * @desc    Minimal mobile screen showing the logged-in doctor's own
 *          profile. Full doctor dashboard/module is separate, larger
 *          work outside this scope - this exists so doctor accounts
 *          have somewhere to land after login/registration.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { getDoctorProfile } from '../services/doctor.service';

const ProfileField = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '—'}</Text>
  </View>
);

export default function DoctorProfileScreen({ doctorId }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getDoctorProfile(doctorId);
      setDoctor(data);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor?.full_name || 'Doctor')}&background=2E75B6&color=fff&size=120&bold=true&rounded=true` }}
                style={styles.profilePhoto}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerEyebrow}>MY PROFILE</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>Dr. {doctor?.full_name || 'Doctor'}</Text>
              <Text style={styles.demographicsText}>{doctor?.specialization || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Information</Text>
          <ProfileField label="Full Name" value={doctor?.full_name} />
          <ProfileField label="SLMC Reg. Number" value={doctor?.slmc_reg_number} />
          <ProfileField label="Specialization" value={doctor?.specialization} />
          <ProfileField label="Hospital" value={doctor?.hospital_name} />
          <ProfileField label="Years of Experience" value={doctor?.years_experience != null ? String(doctor.years_experience) : null} />
          <ProfileField label="Verification Status" value={doctor?.is_verified ? 'Verified' : 'Pending verification'} />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            The full doctor dashboard (appointments, patient lookup, consultation notes) is under development.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#F8FAFC' },
  container:   { flex: 1 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
  errorText:   { fontSize: 14, color: '#C00000', textAlign: 'center' },

  header: { backgroundColor: '#1E3A5F', padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  profilePhoto: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' },
  headerText: { flex: 1, justifyContent: 'center' },
  headerEyebrow: { fontSize: 10, fontWeight: 'bold', color: '#93C5FD', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  demographicsText: { fontSize: 13, color: '#CBD5E1', fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLabel: { fontSize: 13, color: '#64748B', flex: 1 },
  fieldValue: { fontSize: 13, color: '#1E293B', fontWeight: '500', flex: 2, textAlign: 'right' },

  noticeCard: { margin: 16, marginTop: 16, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, borderLeftWidth: 4, borderLeftColor: '#1E3A5F' },
  noticeText: { fontSize: 12, color: '#1E3A5F', lineHeight: 17 },
});
