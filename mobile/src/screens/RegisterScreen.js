/**
 * @file    RegisterScreen.js
 * @module  Auth
 * @desc    Mobile registration screen for Care4U patients and doctors.
 *          On success, navigates to OtpVerificationScreen (account is
 *          not created until OTP is verified).
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useState } from 'react';
import { register } from '../services/auth.service';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function RegisterScreen({ onRegisterSuccess, onBackToLogin }) {
  const [role, setRole]                 = useState('patient');
  const [email, setEmail]               = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName]         = useState('');
  const [nic, setNic]                   = useState('');
  const [slmcRegNumber, setSlmcRegNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Validate inputs
  const validate = () => {
    if (!email)    { setError('Email is required');    return false; }
    if (!phone)    { setError('Phone number is required'); return false; }
    if (!password) { setError('Password is required'); return false; }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!fullName) { setError('Full name is required'); return false; }

    if (role === 'patient' && !nic) {
      setError('NIC is required'); return false;
    }
    if (role === 'doctor' && (!slmcRegNumber || !specialization)) {
      setError('SLMC registration number and specialization are required');
      return false;
    }
    return true;
  };

  // Handle registration - sends form to backend, which issues an OTP
  // instead of creating the account immediately
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    const profileData = role === 'patient'
      ? { fullName, nic }
      : { fullName, slmcRegNumber, specialization };

    try {
      const data = await register(email, phone, password, role, profileData);

      if (data.success) {
        onRegisterSuccess({ email: data.data.email });
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }

    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Cannot connect to server. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Care4U</Text>
          <Text style={styles.tagline}>Centralized Healthcare Ecosystem</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>

          {/* Error message */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Role selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I AM A</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                onPress={() => { setRole('patient'); setError(''); }}
              >
                <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
                onPress={() => { setRole('doctor'); setError(''); }}
              >
                <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Full name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#94A3B8"
              value={fullName}
              onChangeText={(text) => { setFullName(text); setError(''); }}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="07XXXXXXXX"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => { setPhone(text); setError(''); }}
            />
          </View>

          {/* Role-specific fields */}
          {role === 'patient' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIC NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="200012345678"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={nic}
                onChangeText={(text) => { setNic(text); setError(''); }}
              />
            </View>
          )}

          {role === 'doctor' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SLMC REGISTRATION NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SLMC12345"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={slmcRegNumber}
                  onChangeText={(text) => { setSlmcRegNumber(text); setError(''); }}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SPECIALIZATION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Cardiology"
                  placeholderTextColor="#94A3B8"
                  value={specialization}
                  onChangeText={(text) => { setSpecialization(text); setError(''); }}
                />
              </View>
            </>
          )}

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
            />
          </View>

          {/* Confirm password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
            />
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          {/* Back to login link */}
          <Text style={styles.registerText}>
            Already have an account?{' '}
            <Text style={styles.registerLink} onPress={onBackToLogin}>Sign in here</Text>
          </Text>

        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 Care4U — Group D | CSC3213</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  registerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginTop: 20,
  },
  registerLink: {
    color: '#1E3A5F',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 24,
  },
});
