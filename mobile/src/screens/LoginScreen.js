/**
 * @file    LoginScreen.js
 * @module  Auth
 * @desc    Mobile sign-in; the parent provides patient/doctor views and web guidance for other roles.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, { useRef, useState } from 'react';

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

import { login, authErrorMessage } from '../services/auth.service';

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  navy: '#12344D',
  teal: '#0B6F69',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',
  text: '#102331',
  textSoft: '#334155',
  muted: '#526575',
  subtle: '#526575',
  border: '#E3E9ED',
  danger: '#AD3030',
  dangerSoft: '#FFF1F1',
};

/** Login screen: checks the details, then opens the signed-in user’s page after backend approval. */
export default function LoginScreen({
  onLoginSuccess,
  onForgotPassword,
  onRegister,
}) {
  const passwordInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');

    /** Check that an email and password were entered before sending a request. */
  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }

    return true;
  };

    /** Sign in once, show any error, and pass the verified user to the app. */
  const handleLogin = async () => {
    if (inFlight.current) return;
    if (!validate()) {
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError('');

    try {
      const data = await login(email.trim(), password);
      if (!data.data?.id || !data.data?.role) throw new Error('Invalid identity response');

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
        authErrorMessage(err, 'Sign-in failed. Please try again.')
      );

    } finally {
      inFlight.current = false;
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
              Connected care. One place.
            </Text>

          </View>

        </View>

        <View style={styles.card}>

          <View style={styles.cardHeader}>

            <Text style={styles.eyebrow}>
              ACCOUNT ACCESS
            </Text>

            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue to your Care4U account.
            </Text>

          </View>

          {error !== '' && (
            <View style={styles.errorBox} accessibilityRole="alert" accessibilityLiveRegion="polite">

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
                accessibilityLabel="Email address"
                editable={!loading}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.subtle}
                keyboardType="email-address"
                autoComplete="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
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

              {/* Forgot Password link — opens password recovery */}
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
                activeOpacity={0.7}
                onPress={onForgotPassword}
                disabled={loading}
                style={styles.textButton}
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
                accessibilityLabel="Password"
                editable={!loading}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={!showPassword}
                ref={passwordInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityState={{ expanded: showPassword, disabled: loading }}
                disabled={loading}
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

          {/* Sign In button — checks the form and requests login */}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
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
                  Sign in
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

          {/* Create Account button — opens registration */}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={onRegister}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>
              Create an account
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={14}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Sign in to access your Care4U account.
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  labelRowLabel: {
    marginBottom: 0,
  },

  textButton: { minHeight: 44, justifyContent: 'center' },

  forgotInline: {
    color: COLORS.teal,
    fontSize: 12,
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
    fontSize: 14,
    paddingVertical: 0,
  },

  eyeButton: {
    width: 44,
    height: 44,
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 12,
  },

  footer: {
    textAlign: 'center',
    color: COLORS.subtle,
    fontSize: 12,
    marginTop: 8,
  },
});