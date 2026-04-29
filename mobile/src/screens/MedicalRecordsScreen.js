/**
 * @file    MedicalRecordsScreen.js
 * @module  Patient
 * @desc    Mobile screen showing a patient's medical records list.
 *          Tap any record to see full details in a modal.
 * @author  Wasana Karunanayaka (S/21/081)
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
import { getMedicalRecords } from '../services/patient.service';

// TEMPORARY — replace with session user when auth is ready
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

/**
 * Returns a label and colour for each record type.
 * @param {string} type - consultation | lab_result | imaging | prescription | other
 */
const recordTypeMeta = (type) => {
  switch (type) {
    case 'consultation': return { label: 'Consultation',  color: '#2E75B6' };
    case 'lab_result':   return { label: 'Lab Result',    color: '#006B6B' };
    case 'imaging':      return { label: 'Imaging',       color: '#7C3AED' };
    case 'prescription': return { label: 'Prescription',  color: '#1F7A1F' };
    default:             return { label: 'Record',        color: '#64748B' };
  }
};

/**
 * Formats an ISO date string to a readable short date.
 * @param {string} dateStr
 * @returns {string}
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MedicalRecordsScreen = () => {
  const [records,        setRecords]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await getMedicalRecords(TEST_PATIENT_ID);
        setRecords(data || []);
      } catch (err) {
        setError('Failed to load medical records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading records...</Text>
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

      {/* ── Record Detail Modal ── */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        onRequestClose={() => setSelectedRecord(null)}
      >
        {selectedRecord && (
          <SafeAreaView style={styles.modalSafeArea}>
            <ScrollView contentContainerStyle={styles.modalScroll}>

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={[
                  styles.modalTypeBadge,
                  { backgroundColor: recordTypeMeta(selectedRecord.record_type).color },
                ]}>
                  <Text style={styles.modalTypeBadgeText}>
                    {recordTypeMeta(selectedRecord.record_type).label}
                  </Text>
                </View>
                <Text style={styles.modalTitle}>{selectedRecord.title}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedRecord.created_at)}</Text>

                {/* Doctor info */}
                {selectedRecord.doctor_name && (
                  <Text style={styles.modalDoctor}>
                    Dr. {selectedRecord.doctor_name}
                    {selectedRecord.doctor_specialization
                      ? ` · ${selectedRecord.doctor_specialization}`
                      : ''}
                  </Text>
                )}

                {/* Confidential warning */}
                {selectedRecord.is_confidential && (
                  <View style={styles.confidentialBanner}>
                    <Text style={styles.confidentialText}>
                      ⚠ This record is marked confidential
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.modalBody}>
                <Text style={styles.modalDescLabel}>DETAILS</Text>
                <Text style={styles.modalDesc}>
                  {selectedRecord.description || 'No additional details recorded.'}
                </Text>
              </View>

            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedRecord(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Page Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSubtitle}>
          {records.length} {records.length === 1 ? 'record' : 'records'} found
        </Text>
      </View>

      {/* ── Records List ── */}
      <ScrollView contentContainerStyle={styles.scroll}>

        {records.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No records found. Your medical records will appear here after consultations.
            </Text>
          </View>
        )}

        {records.map((record) => {
          const meta = recordTypeMeta(record.record_type);
          return (
            <TouchableOpacity
              key={record.id}
              style={styles.card}
              onPress={() => setSelectedRecord(record)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                {/* Type badge */}
                <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.typeBadgeText}>{meta.label}</Text>
                </View>
                {/* Title */}
                <Text style={styles.cardTitle}>{record.title}</Text>
                {/* Date + Doctor */}
                <Text style={styles.cardMeta}>
                  {formatDate(record.created_at)}
                  {record.doctor_name ? `  ·  Dr. ${record.doctor_name}` : ''}
                </Text>
                {/* Confidential indicator */}
                {record.is_confidential && (
                  <Text style={styles.confidentialTag}>Confidential</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
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

  // List
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Record card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  confidentialTag: {
    fontSize: 11,
    color: '#E67E22',
    fontWeight: '500',
    marginTop: 4,
  },
  chevron: {
    fontSize: 22,
    color: '#CBD5E1',
    marginLeft: 8,
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalHeader: {
    backgroundColor: '#1E3A5F',
    padding: 24,
    paddingTop: 48,
  },
  modalTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalTypeBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  modalDate: {
    fontSize: 13,
    color: '#93C5FD',
    marginBottom: 4,
  },
  modalDoctor: {
    fontSize: 13,
    color: '#93C5FD',
    marginBottom: 8,
  },
  confidentialBanner: {
    backgroundColor: '#E67E22',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  confidentialText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalDescLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
  },
  closeButton: {
    margin: 16,
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicalRecordsScreen;