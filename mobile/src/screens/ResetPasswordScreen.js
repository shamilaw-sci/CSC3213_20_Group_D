/**
 * @file    ResetPasswordScreen.js
 * @module  Auth
 * @desc    Mobile screen for setting a new password using a reset token.
 *          Token is entered manually (copied from the reset email/console
 *          log) since mobile has no URL bar to carry it automatically.
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
import { resetPassword } from '../services/auth.service';

export default function ResetPasswordScreen({ onBackToLogin }) {
  const [token, setToken]                 = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  // Validate inputs
  const validate = () => {
    if (!token) { setError('Reset token is required'); return false; }
    if (!newPassword) { setError('New password is required'); return false; }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const data = await resetPassword(token, newPassword);
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(message);
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
          <Text style={styles.title}>Set a new password</Text>

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Your password has been reset successfully.
              </Text>
              <TouchableOpacity onPress={onBackToLogin}>
                <Text style={styles.successLink}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>RESET TOKEN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste the token from your email"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={(text) => { setToken(text); setError(''); }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={(text) => { setNewPassword(text); setError(''); }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.buttonText}>Reset Password</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {!success && (
            <TouchableOpacity onPress={onBackToLogin}>
              <Text style={styles.backText}>
                Remember your password? <Text style={styles.backLink}>Back to Login</Text>
              </Text>
            </TouchableOpacity>
          )}

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
  successLink: {
    fontSize: 13,
    color: '#1E3A5F',
    fontWeight: '600',
    marginTop: 8,
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