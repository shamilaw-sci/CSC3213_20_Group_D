/**
 * @file    ForgotPasswordScreen.js
 * @module  Auth
 * @desc    Mobile screen for requesting a Care4U password reset.
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
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';

import {
  forgotPassword,
  authErrorMessage,
} from '../services/auth.service';

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  navy: '#12344D',
  teal: '#0B6F69',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',
  text: '#102331',
  muted: '#526575',
  subtle: '#526575',
  border: '#E3E9ED',
  danger: '#AD3030',
  dangerSoft: '#FFF1F1',
  green: '#2F855A',
  greenSoft: '#EDF9F2',
};

/**
 * FEATURE: Forgot password screen.
 * LOGIC: Ask for an email address and request password recovery.
 * Show a neutral confirmation after the backend accepts the request,
 * without revealing whether the email belongs to an account.
 */
export default function ForgotPasswordScreen({
  onBackToLogin,
  onResetPassword,
}) {
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  /**
   * FEATURE: Check recovery email.
   * LOGIC: Do not send a request if the email field is empty.
   * The backend handles account lookup and further checks.
   */
  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    return true;
  };

  /**
   * FEATURE: Request a password reset link.
   * LOGIC: Prevent repeated taps → Check the email field → Ask the backend.
   * Success: show the same confirmation for any email address.
   * Failure: show an error. Always stop loading when finished.
   */
  const handleSubmit = async () => {
    if (inFlight.current) return;
    if (!validate()) {
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError('');

    try {
      await forgotPassword(
        email.trim()
      );

      setSubmitted(true);

    } catch (requestError) {
      setError(authErrorMessage(requestError, 'Could not request a reset link. Please try again.'));

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

          <Text style={styles.heroText}>
            Secure account recovery
          </Text>

        </View>

        <View style={styles.card}>

          <View style={styles.iconTile}>
            <LockKeyhole
              size={23}
              color={COLORS.teal}
            />
          </View>

          <Text style={styles.eyebrow}>
            ACCOUNT RECOVERY
          </Text>

          {/* Forgot your password? heading — change the page title here */}
          <Text style={styles.title}>
            Forgot your password?
          </Text>

          <Text style={styles.subtitle}>
            Enter the email address linked to your Care4U account to request a password reset.
          </Text>

          {/* Recovery result — show the confirmation after a successful request */}
          {submitted ? (
            <>

              <View style={styles.successBox} accessibilityLiveRegion="polite">

                <CheckCircle2
                  size={20}
                  color={COLORS.green}
                />

                <View style={styles.messageContent}>

                  <Text style={styles.successTitle}>
                    Request processed
                  </Text>

                  <Text style={styles.successText}>
                    If an account exists for this email, the reset request has been processed. Check your inbox and spam folder for a link.
                  </Text>

                </View>

              </View>

              {/* Use a reset link button — opens the screen for entering a reset link */}
              <TouchableOpacity accessibilityRole="button" disabled={loading} accessibilityState={{ disabled: Boolean(loading) }}
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={onResetPassword}
              >

                <Text style={styles.primaryButtonText}>
                  Use a reset link
                </Text>

                <ArrowRight
                  size={17}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </>
          ) : (
            <>

              {/* Request error message — shown if the request fails */}
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

                  {/* Email Address field — edit the email input here */}
                  <TextInput
                accessibilityLabel="Email address"
                editable={!loading}
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.subtle}
                    keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
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

              {/* Request reset link button — checks the email and sends the request */}
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
                style={[
                  styles.primaryButton,
                  loading && styles.buttonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={loading}
              >

                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Request reset link
                    </Text>

                    <ArrowRight
                      size={17}
                      color="#FFFFFF"
                    />
                  </>
                )}

              </TouchableOpacity>

            </>
          )}

          {/* Back to sign in button — returns to the login screen */}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={onBackToLogin}
            disabled={loading}
          >

            <ArrowLeft
              size={15}
              color={COLORS.teal}
            />

            <Text style={styles.backText}>
              Back to sign in
            </Text>

          </TouchableOpacity>

        </View>

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={14}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Care4U account recovery
          </Text>

        </View>

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
    paddingBottom: 30,
  },

  hero: {
    height: 230,
    backgroundColor: COLORS.navy,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 48,
    position: 'relative',
  },

  heroCircleOne: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -75,
    top: -85,
    backgroundColor: 'rgba(15,139,131,0.38)',
  },

  logoTile: {
    width: 63,
    height: 63,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: 50,
    height: 50,
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },

  heroText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 4,
  },

  card: {
    marginHorizontal: 18,
    marginTop: -38,
    padding: 21,
    borderRadius: 25,
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

  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.tealSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  eyebrow: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 19,
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
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
    color: COLORS.text,
    fontSize: 14,
  },

  errorBox: {
    flexDirection: 'row',
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
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDE9D7',
    backgroundColor: COLORS.greenSoft,
    marginBottom: 17,
  },

  messageContent: {
    flex: 1,
  },

  successTitle: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '800',
  },

  successText: {
    color: COLORS.green,
    fontSize: 12,
    lineHeight: 14,
    marginTop: 3,
  },

  // Request reset link / Use a reset link button styles.
  primaryButton: {
    minHeight: 51,
    borderRadius: 15,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // Back to sign in button styles.
  backButton: {
    minHeight: 44,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
  },

  backText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '800',
  },

  securityFooter: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  securityFooterText: {
    color: COLORS.subtle,
    fontSize: 12,
  },
});
