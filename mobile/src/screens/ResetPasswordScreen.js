/**
 * @file ResetPasswordScreen.js
 * @module Auth
 * @desc Resets a password with the token from the emailed web link.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { resetPassword } from '../services/auth.service';

const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

const extractToken = (value) => {
  const input = value.trim();
  if (RESET_TOKEN_PATTERN.test(input)) return input;

  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    const token = url.searchParams.get('token') || '';
    return RESET_TOKEN_PATTERN.test(token) ? token : '';
  } catch {
    return '';
  }
};

export default function ResetPasswordScreen({ onBackToLogin }) {
  const [resetLink, setResetLink] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    const token = extractToken(resetLink);
    if (!token) {
      setError('Enter a valid reset link or token.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setResetLink('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Care4U</Text>
        <View style={styles.card}>
          <Text style={styles.title}>Set a new password</Text>
          {success ? (
            <>
              <Text style={styles.success}>Your password has been reset. You can sign in now.</Text>
              <TouchableOpacity style={styles.button} onPress={onBackToLogin}>
                <Text style={styles.buttonText}>Sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.help}>
                The email opens the Care4U web reset page. You can finish there, or copy the full link from the email and paste it here. The link expires after one hour.
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.label}>Reset link or token</Text>
              <TextInput
                style={styles.input}
                value={resetLink}
                onChangeText={setResetLink}
                placeholder="Paste the link from your email"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Reset link or token"
              />
              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                accessibilityLabel="New password"
              />
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry
                accessibilityLabel="Confirm password"
              />
              <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Reset password</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.back} onPress={onBackToLogin}>
                <Text style={styles.backText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FA' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brand: { fontSize: 26, fontWeight: '800', color: '#12344D', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#E3E9ED' },
  title: { fontSize: 22, fontWeight: '800', color: '#102331', marginBottom: 12 },
  help: { color: '#526575', lineHeight: 21, marginBottom: 18 },
  label: { color: '#12344D', fontWeight: '700', marginBottom: 7 },
  input: { borderWidth: 1, borderColor: '#CBD5DE', borderRadius: 12, padding: 13, marginBottom: 16, color: '#102331' },
  error: { color: '#AD3030', backgroundColor: '#FFF1F1', padding: 12, borderRadius: 10, marginBottom: 14 },
  success: { color: '#2F855A', backgroundColor: '#EDF9F2', padding: 14, borderRadius: 10, marginBottom: 18 },
  button: { backgroundColor: '#0F8B83', borderRadius: 12, minHeight: 50, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  disabled: { opacity: 0.6 },
  back: { alignItems: 'center', marginTop: 18 },
  backText: { color: '#0F8B83', fontWeight: '700' },
});
