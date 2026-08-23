/**
 * @file    BookAppointmentScreen.js
 * @module  Patient
 * @desc    Mobile screen for selecting an available slot and booking an appointment.
 * @author  Member 2 (S/21/081)
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { getDoctorProfile, getAvailableSlots } from '../services/doctor.service';
import { bookAppointment } from '../services/appointment.service';

const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// FIXED: Accepting doctorId directly from App.js, and our custom navigate function
export default function BookAppointmentScreen({ doctorId, navigate }) {
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!doctorId) {
      Alert.alert('Error', 'Invalid Doctor ID.');
      navigate('DoctorSearch'); // Go back to search
      return;
    }
    
    const fetchBookingData = async () => {
      setIsLoading(true);
      try {
        const [docData, slotsData] = await Promise.all([
          getDoctorProfile(doctorId),
          getAvailableSlots(doctorId)
        ]);
        setDoctor(docData);
        setSlots(slotsData || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load booking details.');
        console.error('Fetch booking data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingData();
  }, [doctorId]);

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      Alert.alert('Selection Required', 'Please select a time slot.');
      return;
    }

    setIsBooking(true);
    try {
      await bookAppointment({
        doctorId,
        patientId: TEST_PATIENT_ID,
        scheduledAt: selectedSlot,
        type: 'opd',
        notes: reason || 'Regular checkup'
      });
      
      Alert.alert(
        'Success', 
        'Appointment booked successfully!',
        [{ text: 'OK', onPress: () => navigate('MyAppointments') }] 
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const formatSlotTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#2E75B6" />
        <Text style={styles.loadingText}>Loading available slots...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.emptyTitle}>Doctor not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('DoctorSearch')}>
          <Text style={styles.backButtonText}>Return to Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <View style={styles.headerRow}>
         <TouchableOpacity style={styles.backArrow} onPress={() => navigate('DoctorSearch')}>
            <Text style={styles.backArrowText}>← Back</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.doctorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{doctor.full_name?.charAt(0)}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>Dr. {doctor.full_name}</Text>
          <Text style={styles.specialization}>{doctor.specialization}</Text>
          <Text style={styles.hospitalText}>📍 {doctor.hospital_name}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested Available Slots</Text>
        
        {slots.length === 0 ? (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No available slots found right now.</Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotButton, isSelected && styles.slotButtonSelected]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                    {formatSlotTime(slot)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
         <Text style={styles.sectionTitle}>Reason for Visit (Optional)</Text>
         <TextInput
            style={styles.input}
            placeholder="e.g. Regular Checkup, Fever..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            editable={slots.length > 0}
         />
      </View>

      <TouchableOpacity 
        style={[styles.confirmButton, (!selectedSlot || slots.length === 0) && styles.confirmButtonDisabled]}
        onPress={handleBookAppointment}
        disabled={!selectedSlot || isBooking || slots.length === 0}
      >
        {isBooking ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { marginBottom: 12 },
  backArrow: { paddingVertical: 8 },
  backArrowText: { color: '#2E75B6', fontWeight: '600', fontSize: 16 },
  doctorCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#2E75B6' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  specialization: { fontSize: 14, color: '#2E75B6', fontWeight: '500', marginBottom: 4 },
  hospitalText: { fontSize: 12, color: '#6B7280' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  emptyState: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5', padding: 16, borderRadius: 8, alignItems: 'center' },
  emptyText: { color: '#C2410C', fontSize: 14 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  slotButton: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  slotButtonSelected: { borderColor: '#2E75B6', backgroundColor: '#F0F7FF' },
  slotText: { fontSize: 12, color: '#374151', textAlign: 'center' },
  slotTextSelected: { color: '#2E75B6', fontWeight: '600' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827' },
  confirmButton: { backgroundColor: '#2E75B6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  confirmButtonDisabled: { backgroundColor: '#9CA3AF' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  backButton: { marginTop: 16, padding: 12, backgroundColor: '#E5E7EB', borderRadius: 8 },
  backButtonText: { color: '#374151', fontWeight: '600' },
});