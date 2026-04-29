/**
 * @file    App.js
 * @module  Root
 * @desc    Root component for Care4U mobile app.
 *          Bottom tab navigation between patient screens.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import LoginScreen          from './src/screens/LoginScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import PatientQRCardScreen  from './src/screens/PatientQRCardScreen';
import PrescriptionsScreen  from './src/screens/PrescriptionsScreen';
import MedicalRecordsScreen from './src/screens/MedicalRecordsScreen';

const TABS = [
  { key: 'profile',       label: 'My Profile'    },
  { key: 'records',       label: 'Records'       },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'qrcard',        label: 'QR Card'       },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser]           = useState(null);

  const handleLogout = async () => {
    try {
      await fetch('http://10.235.201.10:5000/api/auth/logout', {
        method: 'POST',
      });
    } catch {
      // ignore error
    }
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <View style={styles.root}>

      {/* Top bar with logout */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Care4U</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>🔓 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Area */}
      <View style={styles.screen}>
        {activeTab === 'profile'        && <PatientProfileScreen />}
        {activeTab === 'records'        && <MedicalRecordsScreen />}
        {activeTab === 'prescriptions'  && <PrescriptionsScreen  />}
        {activeTab === 'qrcard'         && <PatientQRCardScreen  />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    backgroundColor:   '#1E3A5F',
    paddingTop:        (StatusBar.currentHeight || 24) + 8,
    paddingBottom:     10,
    paddingHorizontal: 20,
  },
  topBarTitle: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '700',
  },
  logoutText: {
    color:      '#93C5FD',
    fontSize:   13,
    fontWeight: '600',
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection:   'row',
    backgroundColor: '#1E3A5F',
    paddingBottom:   40,
    paddingTop:      12,
    borderTopWidth:  1,
    borderTopColor:  '#2E75B6',
  },
  tabItem: {
    flex:       1,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize:   12,
    color:      '#93C5FD',
    fontWeight: '400',
    textAlign:  'center',
  },
  tabLabelActive: {
    color:      '#FFFFFF',
    fontWeight: '600',
  },
  tabIndicator: {
    marginTop:       4,
    width:           32,
    height:          3,
    backgroundColor: '#FFFFFF',
    borderRadius:    2,
  },
});