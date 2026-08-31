/**
 * @file    PatientHomeScreen.js
 * @module  Patient
 * @desc    Main landing dashboard with quick-access tiles to reduce tab clutter.
 * @author  Group D
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function PatientHomeScreen({ navigate }) {
  const QUICK_ACTIONS = [
    { id: 'records',       title: 'Medical Records', icon: '📁', color: '#DBEAFE', textColor: '#1E40AF' },
    { id: 'prescriptions', title: 'Prescriptions',   icon: '💊', color: '#D1FAE5', textColor: '#065F46' },
    { id: 'labreports',    title: 'Lab Reports',     icon: '🔬', color: '#FEF3C7', textColor: '#92400E' },
    { id: 'qrcard',        title: 'My QR Card',      icon: '📱', color: '#F3E8FF', textColor: '#6B21A8' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Welcome to Care4U</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.gridContainer}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={[styles.tile, { backgroundColor: action.color }]}
            onPress={() => navigate(action.id)}
          >
            <Text style={styles.tileIcon}>{action.icon}</Text>
            <Text style={[styles.tileTitle, { color: action.textColor }]}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Action for Booking */}
      <TouchableOpacity style={styles.bookBanner} onPress={() => navigate('search')}>
        <View>
          <Text style={styles.bookBannerTitle}>Need to see a doctor?</Text>
          <Text style={styles.bookBannerSub}>Find a specialist and book a slot</Text>
        </View>
        <Text style={styles.bookBannerArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  welcomeSection: { padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1E3A5F' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16, justifyContent: 'space-between' },
  tile: { width: '47%', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 16 },
  tileIcon: { fontSize: 32, marginBottom: 12 },
  tileTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  bookBanner: { margin: 16, backgroundColor: '#1E3A5F', borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookBannerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  bookBannerSub: { color: '#93C5FD', fontSize: 12, marginTop: 4 },
  bookBannerArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }
});