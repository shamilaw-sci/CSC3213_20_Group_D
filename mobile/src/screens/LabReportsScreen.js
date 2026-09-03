/**
 * @file      LabReportsScreen.js
 * @module    Patient
 * @desc      Mobile screen showing a patient's completed lab reports.
 *            Tap any record to view the PDF report and mark it as read.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert
} from 'react-native';
import { getLabReports, markLabReportAsRead } from '../services/patient.service';
import useAuthStore from '../store/authStore';

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
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LabReportsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!TEST_PATIENT_ID) return;
    
    const fetchReports = async () => {
      try {
        const data = await getLabReports(TEST_PATIENT_ID);
        setReports(data || []);
      } catch (err) {
        setError('Failed to load lab reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [TEST_PATIENT_ID]);

  const handleOpenReport = async (report) => {
    if (!report.report_url) {
      Alert.alert('Unavailable', 'No PDF document linked to this report.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(report.report_url);
      if (supported) {
        await Linking.openURL(report.report_url);

        // Mark as read in the background
        if (!report.is_read) {
          await markLabReportAsRead(TEST_PATIENT_ID, report.id);
          // Update the local state to clear the badge instantly
          setReports(prevReports => 
            prevReports.map(r => r.id === report.id ? { ...r, is_read: true } : r)
          );
        }
      } else {
        Alert.alert('Error', 'Cannot open this file type on your device.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open the report document.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading lab reports...</Text>
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

  const unreadCount = reports.filter(r => r.status === 'completed' && !r.is_read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laboratory Reports</Text>
        <Text style={styles.headerSubtitle}>
          View and download diagnostic results
        </Text>
      </View>

      {/* ── Reports List ── */}
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Summary Strip */}
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryText}>
            {reports.length === 0
              ? 'No completed reports'
              : `${reports.length} report${reports.length !== 1 ? 's' : ''} available`}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.readyBadge}>
              <View style={styles.readyDot} />
              <Text style={styles.readyBadgeText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        {reports.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No lab reports found. When a doctor orders a test and the lab completes it, the report will appear here.
            </Text>
          </View>
        )}

        {reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.card}
            onPress={() => handleOpenReport(report)}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              {/* Status badge */}
              <View style={[styles.statusBadge, report.is_read && { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.statusBadgeText, report.is_read && { color: '#64748B' }]}>
                  {!report.is_read ? 'NEW RESULT' : 'VIEWED'}
                </Text>
              </View>
              
              {/* Test Type */}
              <Text style={styles.cardTitle}>{report.test_type || 'Unknown Test'}</Text>
              
              {/* Lab & Doctor Details */}
              <View style={styles.metaRow}>
                <Text style={styles.cardMetaLabel}>Lab:</Text>
                <Text style={styles.cardMeta}>{report.lab_name}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.cardMetaLabel}>Dr:</Text>
                <Text style={styles.cardMeta}>{report.doctor_name || '—'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.cardMetaLabel}>Date:</Text>
                <Text style={styles.cardMeta}>{formatDate(report.created_at)}</Text>
              </View>
            </View>
            
            <View style={styles.cardRight}>
              <View style={styles.pdfButton}>
                <Text style={styles.pdfButtonText}>PDF</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

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
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginRight: 6,
  },
  readyBadgeText: {
    fontSize: 11,
    color: '#4338CA',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 10,
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
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardMetaLabel: {
    width: 40,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardMeta: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
  },
  cardRight: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pdfButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: 'bold',
  }
});

export default LabReportsScreen;