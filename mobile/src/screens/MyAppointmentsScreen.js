/**
 * @file    MyAppointmentsScreen.js
 * @module  Patient
 * @desc    Mobile dashboard for managing appointments (cancel/reschedule).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { getPatientAppointments, updateAppointmentStatus } from '../services/appointment.service';
import useAuthStore from '../store/authStore';

export default function MyAppointmentsScreen({ navigate }) {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!TEST_PATIENT_ID) return;
    setIsLoading(true);
    try {
      const data = await getPatientAppointments(TEST_PATIENT_ID);
      setAppointments(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [TEST_PATIENT_ID]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = (appointmentId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No, keep it', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAppointmentStatus(appointmentId, 'cancelled');
              Alert.alert('Success', 'Appointment cancelled.');
              fetchAppointments(); 
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel appointment.');
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return { bg: '#DBEAFE', text: '#1E40AF' }; 
      case 'completed': return { bg: '#D1FAE5', text: '#065F46' }; 
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B' }; 
      case 'in_progress': return { bg: '#FEF3C7', text: '#92400E' }; 
      default: return { bg: '#F3F4F6', text: '#374151' }; 
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const priority = { 'in_progress': 1, 'scheduled': 2, 'completed': 3, 'cancelled': 4 };
    const pA = priority[a.status] || 5;
    const pB = priority[b.status] || 5;
    if (pA !== pB) return pA - pB;
    return new Date(a.scheduled_at) - new Date(b.scheduled_at);
  });

  const renderAppointmentCard = ({ item }) => {
    const isCancelled = item.status === 'cancelled';
    const statusColors = getStatusColor(item.status);

    return (
      <View style={[styles.card, isCancelled && styles.cardCancelled]}>
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <Text style={[styles.doctorName, isCancelled && styles.textCancelled]}>
              Dr. {item.doctor_name}
            </Text>
            <Text style={styles.specialization}>{item.doctor_specialization}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.badgeText, { color: statusColors.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>🗓 {formatDateTime(item.scheduled_at)}</Text>
          <Text style={styles.detailsText}>📋 {item.type.toUpperCase()}</Text>
        </View>

        {item.status === 'scheduled' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => {
                const targetId = item.doctor_id || item.doctorId || item.doctor?.id;
                if (!targetId) {
                  Alert.alert('Error', 'Missing doctor ID.');
                  return;
                }
                // FIXED: Now we pass rescheduleId exactly like the web platform!
                navigate('BookAppointment', { doctorId: targetId, rescheduleId: item.id });
              }}
            >
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>Manage your upcoming visits</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2E75B6" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : sortedAppointments.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No appointments found</Text>
          <TouchableOpacity 
            style={styles.findDoctorButton} 
            onPress={() => navigate('search')} 
          >
            <Text style={styles.findDoctorButtonText}>Find a Doctor</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchAppointments}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardCancelled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  doctorInfo: { flex: 1, marginRight: 12 },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 2 },
  textCancelled: { color: '#6B7280' },
  specialization: { fontSize: 14, color: '#2E75B6', fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  detailsRow: { gap: 6, marginBottom: 16 },
  detailsText: { fontSize: 14, color: '#4B5563' },
  actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  rescheduleButton: { backgroundColor: '#EBF5FF', borderColor: '#BFDBFE' },
  rescheduleText: { color: '#1E40AF', fontWeight: '600', fontSize: 14 },
  cancelButton: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cancelText: { color: '#991B1B', fontWeight: '600', fontSize: 14 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 16 },
  findDoctorButton: { backgroundColor: '#2E75B6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  findDoctorButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});