/**
 * @file    ForgotPasswordScreen.js
 * @module  Auth
 * @desc    Mobile screen for requesting a password reset link.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useState } from 'react';
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
import { forgotPassword } from '../services/auth.service';

export default function ForgotPasswordScreen({ onBackToLogin, onResetPassword }) {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Validate input
  const validate = () => {
    if (!email) { setError('Email is required'); return false; }
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      // Always show the same generic message, whether or not the
      // email exists, to preserve the backend's enumeration protection.
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address to request a password reset.
          </Text>

          {submitted ? (
            <>
                <View style={styles.successBox}>
                    <Text style={styles.successText}>
                         If an account exists for this email, the password reset request has been processed.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={onResetPassword}
                >
                <Text style={styles.buttonText}>Continue to Reset Password</Text>
            </TouchableOpacity>
    </>
) : (
            <>
              {error !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

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

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.buttonText}>Request Password Reset</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Back to login link */}
          <TouchableOpacity onPress={onBackToLogin}>
            <Text style={styles.backText}>
              Remember your password? <Text style={styles.backLink}>Back to Login</Text>
            </Text>
          </TouchableOpacity>

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
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
  },
  successText: {
    fontSize: 13,
    color: '#15803D',
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
  backText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginTop: 20,
  },
  backLink: {
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