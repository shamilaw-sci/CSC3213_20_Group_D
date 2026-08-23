/**
 * @file    DoctorSearchScreen.js
 * @module  Patient
 * @desc    Mobile screen for searching doctors and initiating booking.
 * @author  Member 2 (S/21/081)
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from 'react-native';
import { searchDoctors } from '../services/doctor.service';

// FIXED: Accepting custom 'navigate' prop from App.js
export default function DoctorSearchScreen({ navigate }) {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await searchDoctors({ specialty, hospitalName: hospital });
      setDoctors(data || []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [specialty, hospital]);

  const renderDoctorCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigate('BookAppointment', { doctorId: item.id })} // FIXED
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>Dr. {item.full_name}</Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
          <Text style={styles.hospitalText} numberOfLines={1}>📍 {item.hospital_name}</Text>
        </View>
      </View>
      <View style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Check Availability</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Doctor</Text>
        <Text style={styles.subtitle}>Search and book your next appointment</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          placeholder="Search by specialty (e.g. Cardiologist)"
          value={specialty}
          onChangeText={setSpecialty}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Search by hospital name"
          value={hospital}
          onChangeText={setHospital}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2E75B6" />
          <Text style={styles.loadingText}>Searching doctors...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptyText}>Try adjusting your search filters.</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctorCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  searchSection: { padding: 16, gap: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827' },
  listContainer: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#2E75B6' },
  infoContainer: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#1E3A5F' },
  specialization: { fontSize: 14, color: '#2E75B6', fontWeight: '500', marginTop: 2 },
  hospitalText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  bookButton: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  bookButtonText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
});