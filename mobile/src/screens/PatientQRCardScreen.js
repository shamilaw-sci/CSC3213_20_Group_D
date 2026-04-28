/**
 * @file    PatientQRCardScreen.js
 * @module  Patient
 * @desc    Displays the patient's QR identity card with name, blood group,
 *          and allergy list. QR code encodes the patient's qr_code_id
 *          so doctors and pharmacists can scan to identify the patient.
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
import QRCode from 'react-native-qrcode-svg';
import { getPatientProfile, getPatientAllergies } from '../services/patient.service';

// TEMPORARY — replace with session user when auth is ready
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

const PatientQRCardScreen = () => {
  const [patient,   setPatient]   = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientData = await getPatientProfile(TEST_PATIENT_ID);
        const allergyData = await getPatientAllergies(TEST_PATIENT_ID);
        setPatient(patientData);
        setAllergies(allergyData);
      } catch (err) {
        setError('Failed to load patient data. Please try again.');
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
        <Text style={styles.loadingText}>Loading your QR card...</Text>
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
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Header Banner ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My QR Card</Text>
          <Text style={styles.headerSubtitle}>
            Show this to your doctor or pharmacist
          </Text>
        </View>

        {/* ── Patient Info Card ── */}
        <View style={styles.card}>
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={styles.bloodGroup}>{patient.blood_group || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {patient.gender
                  ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                  : '—'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>NIC</Text>
              <Text style={styles.infoValue}>{patient.nic || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── QR Code Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Identity QR</Text>
          <Text style={styles.cardSubtitle}>
            Scan to pull up this patient's records
          </Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={patient.qr_code_id}
              size={200}
              color="#1E3A5F"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={styles.qrValue}>{patient.qr_code_id}</Text>
        </View>

        {/* ── Allergies Card ── */}
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
                      ? allergy.severity.charAt(0).toUpperCase() +
                        allergy.severity.slice(1)
                      : '—'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Emergency Contact Card ── */}
        <View style={[styles.card, styles.emergencyCard]}>
          <Text style={styles.emergencyTitle}>⚠ Emergency Contact</Text>
          <Text style={styles.emergencyName}>
            {patient.emergency_contact_name || '—'}
          </Text>
          <Text style={styles.emergencyPhone}>
            {patient.emergency_contact_phone || '—'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  errorText: {
    color: '#C00000',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },

  // Header
  header: {
    backgroundColor: '#1E3A5F',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#93C5FD',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },

  // Patient info
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  bloodGroup: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C00000',
  },

  // QR code
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  qrValue: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 8,
  },

  // Allergies
  noAllergies: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  allergyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  allergyLeft: {
    flex: 1,
    marginRight: 8,
  },
  allergyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  allergyNotes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Emergency contact
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#C00000',
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C00000',
    marginBottom: 6,
  },
  emergencyName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  emergencyPhone: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default PatientQRCardScreen;