/**
 * @file    OtpVerificationScreen.js
 * @module  Auth
 * @desc    Mobile OTP verification screen shown after registration.
 *          On success, the account is created and the session starts -
 *          navigates to Home.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useState } from 'react';
import { verifyOtp } from '../services/auth.service';
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

export default function OtpVerificationScreen({ email, onVerifySuccess, onBackToRegister }) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Validate input
  const validate = () => {
    if (!otpCode) { setError('OTP code is required'); return false; }
    if (otpCode.length !== 6) { setError('OTP must be 6 digits'); return false; }
    return true;
  };

  // Handle OTP verification - creates the account and starts the session
  const handleVerify = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const data = await verifyOtp(email, otpCode);

      if (data.success) {
        onVerifySuccess(data.data);
      } else {
        setError(data.message || 'Verification failed. Please try again.');
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
          <Text style={styles.title}>Verify your account</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* Error message */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* OTP input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>OTP CODE</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={(text) => { setOtpCode(text.replace(/[^0-9]/g, '')); setError(''); }}
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>Verify & Continue</Text>
            }
          </TouchableOpacity>

          {/* Back to register link */}
          <Text style={styles.registerText}>
            Wrong email?{' '}
            <Text style={styles.registerLink} onPress={onBackToRegister}>Go back</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  emailText: {
    fontWeight: '600',
    color: '#1E293B',
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
  otpInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
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
