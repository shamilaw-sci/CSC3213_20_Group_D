/**
 * @file    App.js
 * @module  Root
 * @desc    Root component for Care4U mobile app.
 *          Bottom tab navigation between patient screens.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import api from './src/services/api';
import LoginScreen           from './src/screens/LoginScreen';
import RegisterScreen        from './src/screens/RegisterScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import ForgotPasswordScreen  from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen   from './src/screens/ResetPasswordScreen';
import DoctorProfileScreen   from './src/screens/DoctorProfileScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import PatientQRCardScreen  from './src/screens/PatientQRCardScreen';
import PrescriptionsScreen  from './src/screens/PrescriptionsScreen';
import MedicalRecordsScreen from './src/screens/MedicalRecordsScreen';
import EmergencySOS         from './src/components/EmergencySOS'; 
import LabReportsScreen from './src/screens/LabReportsScreen';

const TABS = [
  { key: 'profile',       label: 'My Profile'    },
  { key: 'records',       label: 'Records'       },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'qrcard',        label: 'QR Card'       },
  { key: 'labreports',    label: 'Lab Reports'   },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser]           = useState(null);
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register' | 'verify-otp' | 'forgot-password' | 'reset-password'
  const [pendingEmail, setPendingEmail] = useState('');  // email awaiting OTP verification

  const handleLogout = async () => {
    setUser(null);
    setAuthScreen('login');

    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onRegisterSuccess={({ email }) => {
            setPendingEmail(email);
            setAuthScreen('verify-otp');
          }}
          onBackToLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'verify-otp') {
      return (
        <OtpVerificationScreen
          email={pendingEmail}
          onVerifySuccess={({ user }) => setUser(user)}
          onBackToRegister={() => setAuthScreen('register')}
        />
      );
    }
    if (authScreen === 'forgot-password') {
      return <ForgotPasswordScreen onBackToLogin={() => setAuthScreen('login')}
      onResetPassword={() => setAuthScreen('reset-password')} />;
    }
    if (authScreen === 'reset-password') {
      return <ResetPasswordScreen onBackToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <LoginScreen
        onLoginSuccess={(userData) => setUser(userData)}
        onForgotPassword={() => setAuthScreen('forgot-password')}
        onRegister={() => setAuthScreen('register')}
      />
    );
  }

  // Full doctor dashboard is separate, larger work outside this scope -
  // this shows a minimal own-profile view instead of 404ing on the
  // patient-only screens.
  if (user.role === 'doctor') {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Care4U</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>🔓 Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.screen}>
          <DoctorProfileScreen doctorId={user.profile_id} />
        </View>
      </View>
    );
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
        {activeTab === 'profile'        && <PatientProfileScreen patientId={user.profile_id} />}
        {activeTab === 'records'        && <MedicalRecordsScreen />}
        {activeTab === 'prescriptions'  && <PrescriptionsScreen  />}
        {activeTab === 'qrcard'         && <PatientQRCardScreen  />}
        {activeTab === 'labreports'     && <LabReportsScreen     />}
        
        {/* Floating Emergency SOS Component */}
        <EmergencySOS /> 
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
    paddingTop: Platform.OS === 'ios'
  ? 70
  : (StatusBar.currentHeight || 24) + 8,
    paddingBottom:     0,
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