/**
 * @file    EmergencySOS.js
 * @module  Emergency
 * @desc    Floating action button and 10-second countdown modal for SOS alerts.
 *          Integrates native phone dialer and background GPS capture.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import api from '../services/api';

const EMERGENCY_NUMBER = '1990';

const EmergencySOS = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Handle the countdown timer
  useEffect(() => {
    let timer;
    if (isModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isModalVisible && countdown === 0) {
      // Time is up! Trigger the emergency
      triggerEmergency();
    }

    return () => clearInterval(timer);
  }, [isModalVisible, countdown]);

  const handleOpenSOS = () => {
    setCountdown(10);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const triggerEmergency = async () => {
    setIsModalVisible(false); // Hide the modal immediately

    // Open the phone dialer; the user must place the call there.
    const telUrl = `tel:${EMERGENCY_NUMBER}`;
    try {
      await Linking.openURL(telUrl);
    } catch (error) {
      console.error('Error opening dialer:', error);
      Alert.alert('Error', 'Could not open the phone dialer.');
    }

    // Save an alert for the hospital dashboard, with location if available.
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // If they deny location, we still send the SOS to the backend, just without GPS
        await api.post('/api/emergencies/sos', { latitude: null, longitude: null });
        return;
      }

      // Grab the current location (using balanced accuracy for speed)
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Send the SOS payload to our new endpoint!
      await api.post('/api/emergencies/sos', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

    } catch (error) {
      // A location failure may be retried without GPS; an API failure must
      // never be presented as a delivered alert.
      try {
        await api.post('/api/emergencies/sos', { latitude: null, longitude: null });
      } catch {
        Alert.alert('Hospital alert not saved', 'Please place the 1990 call in your phone dialer. The hospital dashboard alert could not be confirmed.');
      }
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenSOS} activeOpacity={0.8}>
        <Text style={styles.fabText}>SOS</Text>
      </TouchableOpacity>

      {/* 10-Second Countdown Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.warningText}>EMERGENCY ALERT</Text>
          <Text style={styles.subText}>Opening your phone dialer for 1990 and attempting to save a hospital dashboard alert in...</Text>
          
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callNowButton} onPress={triggerEmergency}>
            <Text style={styles.callNowButtonText}>OPEN DIALER NOW</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#991B1B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    color: '#FECACA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  countdownCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 8,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#991B1B',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  callNowButton: {
    paddingVertical: 15,
  },
  callNowButtonText: {
    color: '#FECACA',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default EmergencySOS;
