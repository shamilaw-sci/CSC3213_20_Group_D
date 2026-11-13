/**
 * @file ResetPasswordScreen.js
 * @module Auth
 * @desc Resets a password with the token from the emailed web link.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useRef, useState } from 'react';
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
import { resetPassword, authErrorMessage } from '../services/auth.service';

const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

/** @param {string} value Pasted token or HTTP(S) link. @returns {string} Exact lowercase 64-hex token, or empty on invalid input. */
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

/** @component ResetPasswordScreen
 * @param {Object} props Parent navigation/success callbacks; no credentials persist in props.
 * @returns {JSX.Element} Scrollable keyboard-aware auth UI. Input callbacks update local state and clear errors; visibility callbacks only toggle masking.
 */
export default function ResetPasswordScreen({ onBackToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /** @returns {Promise<void>} Validate and submit once; release busy state on every outcome. */
  const handleReset = async () => {
    if (inFlight.current) return;
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

    inFlight.current = true;
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setResetLink('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(authErrorMessage(requestError, 'Could not reset your password. Request a new link if it has expired.'));
    } finally {
      inFlight.current = false;
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
              <Text style={styles.success} accessibilityLiveRegion="polite">Your password has been reset. You can sign in now.</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }} style={styles.button} onPress={onBackToLogin} disabled={loading}>
                <Text style={styles.buttonText}>Sign in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.help}>
                The email opens the Care4U web reset page. You can finish there, or copy the full link from the email and paste it here. The link expires after one hour.
              </Text>
              {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text> : null}
              <Text style={styles.label}>Reset link or token</Text>
              <TextInput
                editable={!loading}
                style={styles.input}
                value={resetLink}
                onChangeText={text => { setResetLink(text); setError(''); }}
                placeholder="Paste the link from your email"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Reset link or token"
              />
              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordRow}>
               <TextInput
                editable={!loading}
                style={[styles.input, styles.passwordInput]}
                value={newPassword}
                onChangeText={text => { setNewPassword(text); setError(''); }}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                accessibilityLabel="New password"
              />
               <TouchableOpacity accessibilityState={{ disabled: Boolean(loading) }} style={styles.visibilityButton} accessibilityRole="button" disabled={loading}
                 accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(previous => !previous)}>
                 <Text style={styles.backText}>{showPassword ? 'Hide' : 'Show'}</Text>
               </TouchableOpacity>
               </View>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordRow}>
               <TextInput
                editable={!loading}
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={text => { setConfirmPassword(text); setError(''); }}
                placeholder="Re-enter new password"
                secureTextEntry={!showConfirmation}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleReset}
                accessibilityLabel="Confirm password"
              />
               <TouchableOpacity accessibilityState={{ disabled: Boolean(loading) }} style={styles.visibilityButton} accessibilityRole="button" disabled={loading}
                 accessibilityLabel={showConfirmation ? 'Hide confirm password' : 'Show confirm password'} onPress={() => setShowConfirmation(previous => !previous)}>
                 <Text style={styles.backText}>{showConfirmation ? 'Hide' : 'Show'}</Text>
               </TouchableOpacity>
               </View>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }} style={[styles.button, loading && styles.disabled]} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Reset password</Text>}
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }} style={styles.back} onPress={onBackToLogin} disabled={loading}>
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
  button: { backgroundColor: '#0B6F69', borderRadius: 12, minHeight: 50, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  disabled: { opacity: 0.6 },
  back: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 18 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  passwordInput: { flex: 1, marginBottom: 0 },
  visibilityButton: { minHeight: 44, minWidth: 50, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#0F8B83', fontWeight: '700' },
});
