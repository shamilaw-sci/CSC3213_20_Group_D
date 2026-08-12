/**
 * @file    LoginScreen.js
 * @module  Auth
 * @desc    Mobile login screen for Care4U patients and doctors.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useState } from 'react';
import api from '../services/api';
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

export default function LoginScreen({ onLoginSuccess, onForgotPassword, onRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Validate inputs
  const validate = () => {
    if (!email)    { setError('Email is required');    return false; }
    if (!password) { setError('Password is required'); return false; }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      const data = response.data;

      if (data.success) {
         onLoginSuccess(data.data);
      } else {
        setError(data.message || 'Login failed. Please try again.');
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
          <Text style={styles.title}>Sign in to your account</Text>

          {/* Error message */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email input */}
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

          {/* Password input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
            />
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={onForgotPassword}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Register link */}
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={styles.registerLink} onPress={onRegister}>Register here</Text>
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

  forgotText: {
  textAlign: 'center',
  fontSize: 13,
  color: '#1E3A5F',
  fontWeight: '600',
  marginTop: 14,
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