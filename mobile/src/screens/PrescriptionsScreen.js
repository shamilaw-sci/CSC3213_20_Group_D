/**
 * @file    PrescriptionsScreen.js
 * @module  Patient
 * @desc    Displays all prescriptions for a patient with full medicine details.
 *          Each prescription shows medicine items with dosage, special notes,
 *          and dispensing quantities. Active prescriptions show a QR code button.
 * @author  S/21/001 — status fix + medicine details by S/21/081
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getPatientPrescriptions } from '../services/prescription.service';

// TEMPORARY — replace with session user when auth is ready
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

/**
 * Checks if a prescription is expired based on expires_at date.
 * @param {string} expiresAt - ISO date string
 * @returns {boolean} true if expired
 */
const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

/**
 * Resolves the display status — checks expiry first, overrides DB status if expired.
 * @param {string} status    - DB status value
 * @param {string} expiresAt - ISO date string
 * @returns {string} resolved status for display
 */
const resolveBadgeStatus = (status, expiresAt) => {
  if (isExpired(expiresAt)) return 'expired';
  return status || 'active';
};

/**
 * Returns a colour based on resolved prescription status.
 * @param {string} status - active | expired | completed | partially_filled
 * @returns {string} hex colour
 */
const statusColor = (status) => {
  if (status === 'active')           return '#1F7A1F';
  if (status === 'expired')          return '#C00000';
  if (status === 'completed')        return '#64748B';
  if (status === 'partially_filled') return '#E67E22';
  return '#64748B';
};

/**
 * Formats a date string to readable format.
 * @param {string} dateStr - ISO date string
 * @returns {string} formatted date
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const PrescriptionsScreen = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [selectedQR,    setSelectedQR]    = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const data = await getPatientPrescriptions(TEST_PATIENT_ID);
        setPrescriptions(data || []);
      } catch (err) {
        setError('Failed to load prescriptions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading prescriptions...</Text>
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

      {/* ── QR Code Full Screen Modal ── */}
      <Modal
        visible={!!selectedQR}
        animationType="slide"
        onRequestClose={() => setSelectedQR(null)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Show to Pharmacist</Text>
          <Text style={styles.modalSubtitle}>
            Ask the pharmacist to scan this QR code
          </Text>

          {selectedQR && (
            <View style={styles.qrContainer}>
              <QRCode
                value={selectedQR}
                size={250}
                color="#1E3A5F"
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrValue}>{selectedQR}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedQR(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <Text style={styles.headerSubtitle}>
          Tap "Show QR Code" to present at the pharmacy
        </Text>
      </View>

      {/* ── Prescription List ── */}
      <ScrollView contentContainerStyle={styles.scroll}>

        {prescriptions.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No prescriptions found. Prescriptions issued by your doctor will appear here.
            </Text>
          </View>
        )}

        {prescriptions.map((prescription) => {
          const badgeStatus = resolveBadgeStatus(prescription.status, prescription.expires_at);
          const validItems  = (prescription.items || []).filter(i => i && i.medicine_name);

          return (
            <View key={prescription.id} style={styles.card}>

              {/* ── Card Header — dates + status badge ── */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardDate}>
                    Issued: {formatDate(prescription.created_at)}
                  </Text>
                  <Text style={styles.cardExpiry}>
                    Expires: {formatDate(prescription.expires_at)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(badgeStatus) },
                ]}>
                  <Text style={styles.statusText}>
                    {badgeStatus.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* ── Doctor's Notes ── */}
              {prescription.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>DOCTOR'S NOTES</Text>
                  <Text style={styles.notesText}>{prescription.notes}</Text>
                </View>
              )}

              {/* ── Medicines ── */}
              {validItems.length > 0 && (
                <View style={styles.medicinesContainer}>
                  <Text style={styles.medicinesLabel}>MEDICINES</Text>
                  {validItems.map((item, idx) => (
                    <View key={item.id || idx} style={styles.medicineRow}>

                      {/* Medicine name + dosage line */}
                      <Text style={styles.medicineName}>{item.medicine_name}</Text>
                      <Text style={styles.medicineDetails}>
                        {item.dosage} · {item.frequency} · {item.duration_days} days
                      </Text>

                      {/* Special notes — italic blue, same as web */}
                      {item.special_notes ? (
                        <Text style={styles.medicineNotes}>{item.special_notes}</Text>
                      ) : null}

                      {/* Qty prescribed + dispensed */}
                      <View style={styles.qtyRow}>
                        <Text style={styles.qtyLabel}>
                          Qty prescribed:{' '}
                          <Text style={styles.qtyValue}>{item.quantity_prescribed}</Text>
                        </Text>
                        {item.quantity_dispensed > 0 && (
                          <Text style={styles.qtyDispensed}>
                            {item.quantity_dispensed} dispensed
                          </Text>
                        )}
                      </View>

                    </View>
                  ))}
                </View>
              )}

              {/* ── QR Button — only for active or partially_filled, not expired ── */}
              {(badgeStatus === 'active' || badgeStatus === 'partially_filled') &&
                prescription.qr_code_value && (
                <TouchableOpacity
                  style={styles.qrButton}
                onPress={() => setSelectedQR(`http://localhost:5173/pharmacy/${prescription.qr_code_value}`)}
                >
                  <Text style={styles.qrButtonText}>📱 Show QR Code at Pharmacy</Text>
                </TouchableOpacity>
              )}

            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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

  // Scroll
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },

  // Empty state
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  cardExpiry: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Doctor's notes
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Medicines
  medicinesContainer: {
    marginBottom: 12,
  },
  medicinesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  medicineRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  medicineDetails: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  medicineNotes: {
    fontSize: 12,
    color: '#2E75B6',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  qtyLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  qtyValue: {
    fontWeight: '600',
    color: '#1E293B',
  },
  qtyDispensed: {
    fontSize: 12,
    color: '#1F7A1F',
    fontWeight: '500',
  },

  // QR Button
  qrButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // QR Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 32,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrValue: {
    marginTop: 12,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 32,
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionsScreen;