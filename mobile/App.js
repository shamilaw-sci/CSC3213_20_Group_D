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

// SCREENS
import LoginScreen           from './src/screens/LoginScreen';
import RegisterScreen        from './src/screens/RegisterScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import ForgotPasswordScreen  from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen   from './src/screens/ResetPasswordScreen';
import DoctorProfileScreen   from './src/screens/DoctorProfileScreen';
import PatientProfileScreen  from './src/screens/PatientProfileScreen';
import PatientQRCardScreen   from './src/screens/PatientQRCardScreen';
import PrescriptionsScreen   from './src/screens/PrescriptionsScreen';
import MedicalRecordsScreen  from './src/screens/MedicalRecordsScreen';
import LabReportsScreen      from './src/screens/LabReportsScreen';
import EmergencySOS          from './src/components/EmergencySOS'; 

// NEW SCREENS
import PatientHomeScreen     from './src/screens/PatientHomeScreen';
import DoctorSearchScreen    from './src/screens/DoctorSearchScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import MyAppointmentsScreen  from './src/screens/MyAppointmentsScreen';

// SLEEK 4-TAB SYSTEM
const TABS = [
  { key: 'home',          label: 'Home',         icon: '🏠' },
  { key: 'search',        label: 'Find Doctor',  icon: '🔍' },
  { key: 'appointments',  label: 'Visits',       icon: '🗓️' },
  { key: 'profile',       label: 'Profile',      icon: '👤' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // Default to Home
  const [user, setUser]           = useState(null);
  const [authScreen, setAuthScreen] = useState('login'); 
  const [pendingEmail, setPendingEmail] = useState('');  
  
  // Used to overlay screens that don't belong to the bottom tabs
  const [overlayScreen, setOverlayScreen] = useState(null); 
  const [bookingDoctorId, setBookingDoctorId] = useState(null);

  const handleLogout = async () => {
    setUser(null);
    setAuthScreen('login');
    try { await api.post('/api/auth/logout'); } catch (e) {}
  };

  // Master navigation controller
  const manualNavigate = (screenName, params = {}) => {
    // If navigating to a main bottom tab, clear overlays
    if (TABS.some(t => t.key === screenName)) {
      setOverlayScreen(null);
      setBookingDoctorId(null);
      setActiveTab(screenName);
      return;
    }

    // Handle specific overlays
    if (screenName === 'BookAppointment') {
      setBookingDoctorId(params.doctorId);
      setOverlayScreen('BookAppointment');
    } else {
      // For records, prescriptions, etc. (launched from Home screen)
      setOverlayScreen(screenName);
    }
  };

  if (!user) {
    if (authScreen === 'register') return <RegisterScreen onRegisterSuccess={({ email }) => { setPendingEmail(email); setAuthScreen('verify-otp'); }} onBackToLogin={() => setAuthScreen('login')} />;
    if (authScreen === 'verify-otp') return <OtpVerificationScreen email={pendingEmail} onVerifySuccess={({ user }) => setUser(user)} onBackToRegister={() => setAuthScreen('register')} />;
    if (authScreen === 'forgot-password') return <ForgotPasswordScreen onBackToLogin={() => setAuthScreen('login')} onResetPassword={() => setAuthScreen('reset-password')} />;
    if (authScreen === 'reset-password') return <ResetPasswordScreen onBackToLogin={() => setAuthScreen('login')} />;
    return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} onForgotPassword={() => setAuthScreen('forgot-password')} onRegister={() => setAuthScreen('register')} />;
  }

  if (user.role === 'doctor') {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>Care4U</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>🔓 Logout</Text></TouchableOpacity>
        </View>
        <View style={styles.screen}><DoctorProfileScreen doctorId={user.profile_id} /></View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        {overlayScreen && (
          <TouchableOpacity onPress={() => setOverlayScreen(null)} style={{ paddingRight: 10 }}>
             <Text style={{ color: '#93C5FD', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.topBarTitle, { flex: 1 }]}>Care4U</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>🔓 Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.screen}>
        {/* OVERLAYS (Hide bottom tabs) */}
        {overlayScreen === 'BookAppointment' && <BookAppointmentScreen doctorId={bookingDoctorId} navigate={manualNavigate} />}
        {overlayScreen === 'records' && <MedicalRecordsScreen />}
        {overlayScreen === 'prescriptions' && <PrescriptionsScreen />}
        {overlayScreen === 'labreports' && <LabReportsScreen />}
        {overlayScreen === 'qrcard' && <PatientQRCardScreen />}

        {/* MAIN TABS */}
        {!overlayScreen && (
          <>
            {activeTab === 'home'         && <PatientHomeScreen navigate={manualNavigate} />}
            {activeTab === 'search'       && <DoctorSearchScreen navigate={manualNavigate} />}
            {activeTab === 'appointments' && <MyAppointmentsScreen navigate={manualNavigate} />}
            {activeTab === 'profile'      && <PatientProfileScreen patientId={user.profile_id} />}
            <EmergencySOS /> 
          </>
        )}
      </View>

      {/* SLEEK 4-ITEM TAB BAR (Hidden when an overlay is active) */}
      {!overlayScreen && (
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => manualNavigate(tab.key)}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                {isActive && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 24) + 8, paddingBottom: 12, paddingHorizontal: 20 },
  topBarTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  logoutText: { color: '#93C5FD', fontSize: 13, fontWeight: '600' },
  screen: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingBottom: Platform.OS === 'ios' ? 24 : 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 20, marginBottom: 4, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
  tabLabelActive: { color: '#2E75B6', fontWeight: '700' },
  tabIndicator: { position: 'absolute', top: -12, width: 32, height: 3, backgroundColor: '#2E75B6', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});