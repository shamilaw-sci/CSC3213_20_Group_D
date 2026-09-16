/**
 * @file    LoginScreen.js
 * @module  Auth
 * @desc    Premium mobile login screen for Care4U patients and doctors.
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
  Image,
} from 'react-native';

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import api from '../services/api';

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  navy: '#12344D',
  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',
  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',
  border: '#E3E9ED',
  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

export default function LoginScreen({
  onLoginSuccess,
  onForgotPassword,
  onRegister,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      const data = response.data;

      if (data.success) {
        onLoginSuccess(data.data);
      } else {
        setError(
          data.message ||
          'Login failed. Please try again.'
        );
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Cannot connect to server. Please check your connection.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.hero}>

          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <View style={styles.brandArea}>

            <View style={styles.logoTile}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brandName}>
              Care4U
            </Text>

            <Text style={styles.brandTagline}>
              Connected care. One secure place.
            </Text>

          </View>

        </View>

        <View style={styles.card}>

          <View style={styles.cardHeader}>

            <Text style={styles.eyebrow}>
              SECURE ACCESS
            </Text>

            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue to your Care4U account.
            </Text>

          </View>

          {error !== '' && (
            <View style={styles.errorBox}>

              <AlertCircle
                size={17}
                color={COLORS.danger}
              />

              <Text style={styles.errorText}>
                {error}
              </Text>

            </View>
          )}

          <View style={styles.inputGroup}>

            <Text style={styles.label}>
              EMAIL ADDRESS
            </Text>

            <View style={styles.inputWrapper}>

              <Mail
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
              />

            </View>

          </View>

          <View style={styles.inputGroup}>

            <View style={styles.labelRow}>

              <Text style={styles.label}>
                PASSWORD
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onForgotPassword}
              >
                <Text style={styles.forgotInline}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

            </View>

            <View style={styles.inputWrapper}>

              <LockKeyhole
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                activeOpacity={0.7}
                onPress={() =>
                  setShowPassword(
                    previous => !previous
                  )
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    color={COLORS.muted}
                  />
                ) : (
                  <Eye
                    size={18}
                    color={COLORS.muted}
                  />
                )}
              </TouchableOpacity>

            </View>

          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  Sign In
                </Text>

                <ArrowRight
                  size={18}
                  color="#FFFFFF"
                />
              </>
            )}

          </TouchableOpacity>

          <View style={styles.dividerRow}>

            <View style={styles.divider} />

            <Text style={styles.dividerText}>
              NEW TO CARE4U?
            </Text>

            <View style={styles.divider} />

          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={onRegister}
          >
            <Text style={styles.secondaryButtonText}>
              Create an Account
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={14}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Secure healthcare access protected by Care4U
          </Text>

        </View>

        <Text style={styles.footer}>
          © 2026 Care4U · Group D · CSC3213
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  hero: {
    height: 265,
    backgroundColor: COLORS.navy,
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 56,
    alignItems: 'center',
  },

  heroCircleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -75,
    top: -80,
    backgroundColor: 'rgba(15,139,131,0.38)',
  },

  heroCircleTwo: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 53,
    left: -28,
    bottom: -30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  brandArea: {
    alignItems: 'center',
  },

  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  logoImage: {
    width: 57,
    height: 57,
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -0.5,
  },

  brandTagline: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11,
    marginTop: 4,
  },

  card: {
    marginHorizontal: 18,
    marginTop: -48,
    borderRadius: 26,
    padding: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },

  cardHeader: {
    marginBottom: 19,
  },

  eyebrow: {
    color: COLORS.teal,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F1CCCC',
    backgroundColor: COLORS.dangerSoft,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  inputGroup: {
    marginBottom: 15,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  label: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  labelRowLabel: {
    marginBottom: 0,
  },

  forgotInline: {
    color: COLORS.teal,
    fontSize: 9,
    fontWeight: '800',
  },

  inputWrapper: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFCFD',
  },

  input: {
    flex: 1,
    minHeight: 48,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 0,
  },

  eyeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    minHeight: 51,
    borderRadius: 15,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 19,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    color: COLORS.subtle,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.75,
  },

  secondaryButton: {
    minHeight: 49,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#B8DDD9',
    backgroundColor: COLORS.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: COLORS.tealDark,
    fontSize: 11,
    fontWeight: '800',
  },

  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 21,
    paddingHorizontal: 20,
  },

  securityFooterText: {
    color: COLORS.subtle,
    fontSize: 8,
  },

  footer: {
    textAlign: 'center',
    color: COLORS.subtle,
    fontSize: 8,
    marginTop: 8,
  },
});