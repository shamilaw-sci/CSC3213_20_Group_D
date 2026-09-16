/**
 * @file    OtpVerificationScreen.js
 * @module  Auth
 * @desc    Premium mobile OTP verification screen shown after registration.
 *          On successful verification, the account is created and the
 *          authenticated Care4U session begins.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';

import {
  verifyOtp,
  resendOtp,
} from '../services/auth.service';

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  navy: '#12344D',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  text: '#102331',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E3E9ED',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',

  green: '#2F855A',
  greenSoft: '#EDF9F2',
};

/* =========================================================
   SCREEN
========================================================= */

export default function OtpVerificationScreen({
  email,
  onVerifySuccess,
  onBackToRegister,
}) {
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [resending, setResending] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const [resendMessage, setResendMessage] = useState('');

  const otpInputRef = useRef(null);

  /* =======================================================
     FOCUS OTP INPUT
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  /* =======================================================
     RESEND COUNTDOWN
  ======================================================= */

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown(
        previous =>
          previous <= 1
            ? 0
            : previous - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = () => {
    if (!otpCode) {
      setError('OTP code is required');
      return false;
    }

    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits');
      return false;
    }

    return true;
  };

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  const handleVerify = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError('');
    setResendMessage('');

    try {
      const data = await verifyOtp(
        email,
        otpCode
      );

      if (data.success) {
        onVerifySuccess(
          data.data
        );

      } else {
        setError(
          data.message ||
          'Verification failed. Please try again.'
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

  /* =======================================================
     RESEND OTP
  ======================================================= */

  const handleResend = async () => {
    if (
      resendCooldown > 0 ||
      resending
    ) {
      return;
    }

    setResending(true);

    setError('');
    setResendMessage('');

    try {
      const data = await resendOtp(
        email
      );

      if (data.success) {
        setResendMessage(
          'A new verification code has been sent.'
        );

        setResendCooldown(
          30
        );

        setOtpCode('');

        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 150);

      } else {
        setError(
          data.message ||
          'Could not resend code. Please try again.'
        );
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Cannot connect to server. Please check your connection.'
      );

    } finally {
      setResending(false);
    }
  };

  /* =======================================================
     OTP INPUT
  ======================================================= */

  const handleOtpChange = (
    text
  ) => {
    const digits =
      text
        .replace(
          /[^0-9]/g,
          ''
        )
        .slice(
          0,
          6
        );

    setOtpCode(
      digits
    );

    setError('');
  };

  /* =======================================================
     PAGE
  ======================================================= */

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

        {/* =================================================
            BRAND HERO
        ================================================== */}

        <View style={styles.hero}>

          <View style={styles.heroCircleOne} />

          <View style={styles.heroCircleTwo} />

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
            One final step to secure your account
          </Text>

        </View>

        {/* =================================================
            VERIFICATION CARD
        ================================================== */}

        <View style={styles.card}>

          <View style={styles.verifyIcon}>

            <Mail
              size={24}
              color={COLORS.teal}
            />

          </View>

          <Text style={styles.eyebrow}>
            EMAIL VERIFICATION
          </Text>

          <Text style={styles.title}>
            Verify your account
          </Text>

          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to
          </Text>

          <View style={styles.emailBadge}>

            <Mail
              size={14}
              color={COLORS.tealDark}
            />

            <Text
              style={styles.emailText}
              numberOfLines={1}
            >
              {email}
            </Text>

          </View>

          {/* ===============================================
              ERROR
          ================================================ */}

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

          {/* ===============================================
              RESEND SUCCESS
          ================================================ */}

          {resendMessage !== '' && (
            <View style={styles.successBox}>

              <CheckCircle2
                size={17}
                color={COLORS.green}
              />

              <Text style={styles.successText}>
                {resendMessage}
              </Text>

            </View>
          )}

          {/* ===============================================
              OTP FIELD
          ================================================ */}

          <View style={styles.inputGroup}>

            <Text style={styles.label}>
              VERIFICATION CODE
            </Text>

            <TextInput
              ref={otpInputRef}
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#C4CDD3"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={handleOtpChange}
              editable={!loading}
              selectionColor={COLORS.teal}
            />

            <View style={styles.otpProgressRow}>

              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index
                ) => (
                  <View
                    key={index}
                    style={[
                      styles.otpProgressDot,

                      index <
                        otpCode.length &&
                        styles.otpProgressDotActive,
                    ]}
                  />
                )
              )}

            </View>

            <Text style={styles.helperText}>
              Enter the code exactly as shown in your verification message.
            </Text>

          </View>

          {/* ===============================================
              VERIFY
          ================================================ */}

          <TouchableOpacity
            style={[
              styles.primaryButton,

              (
                loading ||
                otpCode.length !== 6
              ) &&
                styles.buttonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleVerify}
            disabled={
              loading ||
              otpCode.length !== 6
            }
          >

            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>

                <Text style={styles.primaryButtonText}>
                  Verify & Continue
                </Text>

                <ArrowRight
                  size={17}
                  color="#FFFFFF"
                />

              </>
            )}

          </TouchableOpacity>

          {/* ===============================================
              RESEND
          ================================================ */}

          <View style={styles.resendSection}>

            <Text style={styles.resendQuestion}>
              Didn't receive the code?
            </Text>

            <TouchableOpacity
              style={[
                styles.resendButton,

                (
                  resending ||
                  resendCooldown > 0
                ) &&
                  styles.resendButtonDisabled,
              ]}
              activeOpacity={0.75}
              onPress={handleResend}
              disabled={
                resending ||
                resendCooldown > 0
              }
            >

              {resending ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.teal}
                />
              ) : (
                <RefreshCw
                  size={14}
                  color={
                    resendCooldown > 0
                      ? COLORS.subtle
                      : COLORS.teal
                  }
                />
              )}

              <Text
                style={[
                  styles.resendButtonText,

                  resendCooldown > 0 &&
                    styles.resendButtonTextDisabled,
                ]}
              >
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
              </Text>

            </TouchableOpacity>

          </View>

          {/* ===============================================
              BACK
          ================================================ */}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.75}
            onPress={onBackToRegister}
          >

            <ArrowLeft
              size={15}
              color={COLORS.teal}
            />

            <Text style={styles.backText}>
              Wrong email? Go back
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            SECURITY FOOTER
        ================================================== */}

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={14}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Your verification code helps protect your Care4U account
          </Text>

        </View>

        <Text style={styles.footer}>
          © 2026 Care4U · Group D · CSC3213
        </Text>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    scroll: {
      flexGrow: 1,

      paddingBottom: 30,
    },

    /* =====================================================
       HERO
    ====================================================== */

    hero: {
      height: 235,

      backgroundColor:
        COLORS.navy,

      position: 'relative',

      overflow: 'hidden',

      alignItems: 'center',

      paddingTop: 48,
    },

    heroCircleOne: {
      position: 'absolute',

      width: 220,
      height: 220,

      borderRadius: 110,

      right: -75,
      top: -85,

      backgroundColor:
        'rgba(15,139,131,0.38)',
    },

    heroCircleTwo: {
      position: 'absolute',

      width: 95,
      height: 95,

      borderRadius: 48,

      left: -25,
      bottom: -25,

      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    logoTile: {
      width: 64,

      height: 64,

      borderRadius: 20,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.12,

      shadowRadius: 10,

      elevation: 4,
    },

    logoImage: {
      width: 51,

      height: 51,
    },

    brandName: {
      color: '#FFFFFF',

      fontSize: 24,

      fontWeight: '800',

      letterSpacing: -0.4,

      marginTop: 10,
    },

    heroText: {
      color:
        'rgba(255,255,255,0.65)',

      fontSize: 10,

      marginTop: 4,
    },

    /* =====================================================
       CARD
    ====================================================== */

    card: {
      marginHorizontal: 18,

      marginTop: -39,

      borderRadius: 26,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      padding: 21,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 8,
      },

      shadowOpacity: 0.08,

      shadowRadius: 18,

      elevation: 4,
    },

    verifyIcon: {
      width: 48,

      height: 48,

      borderRadius: 16,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 14,
    },

    eyebrow: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 1,
    },

    title: {
      color:
        COLORS.text,

      fontSize: 22,

      fontWeight: '800',

      letterSpacing: -0.35,

      marginTop: 4,
    },

    subtitle: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      marginTop: 6,
    },

    emailBadge: {
      alignSelf:
        'flex-start',

      maxWidth: '100%',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      borderRadius: 12,

      backgroundColor:
        COLORS.tealSoft,

      paddingHorizontal: 10,

      paddingVertical: 8,

      marginTop: 9,

      marginBottom: 18,
    },

    emailText: {
      flexShrink: 1,

      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',
    },

    /* =====================================================
       ALERTS
    ====================================================== */

    errorBox: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 8,

      borderWidth: 1,

      borderColor:
        '#F1CCCC',

      borderRadius: 13,

      backgroundColor:
        COLORS.dangerSoft,

      padding: 11,

      marginBottom: 16,
    },

    errorText: {
      flex: 1,

      color:
        COLORS.danger,

      fontSize: 10,

      lineHeight: 15,

      fontWeight: '600',
    },

    successBox: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 8,

      borderWidth: 1,

      borderColor:
        '#CDE9D7',

      borderRadius: 13,

      backgroundColor:
        COLORS.greenSoft,

      padding: 11,

      marginBottom: 16,
    },

    successText: {
      flex: 1,

      color:
        COLORS.green,

      fontSize: 9,

      lineHeight: 14,

      fontWeight: '700',
    },

    /* =====================================================
       OTP
    ====================================================== */

    inputGroup: {
      marginBottom: 17,
    },

    label: {
      color:
        COLORS.muted,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 0.7,

      marginBottom: 8,
    },

    otpInput: {
      minHeight: 62,

      borderWidth: 1,

      borderColor:
        '#CFE0E3',

      borderRadius: 16,

      backgroundColor:
        '#FBFCFD',

      color:
        COLORS.navy,

      textAlign: 'center',

      fontSize: 25,

      fontWeight: '800',

      letterSpacing: 11,

      paddingHorizontal: 15,

      paddingVertical: 12,
    },

    otpProgressRow: {
      flexDirection: 'row',

      justifyContent: 'center',

      gap: 7,

      marginTop: 11,
    },

    otpProgressDot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        '#D8E0E4',
    },

    otpProgressDotActive: {
      backgroundColor:
        COLORS.teal,
    },

    helperText: {
      color:
        COLORS.subtle,

      fontSize: 8,

      lineHeight: 12,

      textAlign: 'center',

      marginTop: 9,
    },

    /* =====================================================
       VERIFY BUTTON
    ====================================================== */

    primaryButton: {
      minHeight: 52,

      borderRadius: 15,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.teal,
    },

    primaryButtonText: {
      color: '#FFFFFF',

      fontSize: 11,

      fontWeight: '800',
    },

    buttonDisabled: {
      opacity: 0.48,
    },

    /* =====================================================
       RESEND
    ====================================================== */

    resendSection: {
      alignItems: 'center',

      marginTop: 19,
    },

    resendQuestion: {
      color:
        COLORS.muted,

      fontSize: 9,
    },

    resendButton: {
      minHeight: 38,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 12,

      marginTop: 4,
    },

    resendButtonDisabled: {
      opacity: 0.7,
    },

    resendButtonText: {
      color:
        COLORS.teal,

      fontSize: 9,

      fontWeight: '800',
    },

    resendButtonTextDisabled: {
      color:
        COLORS.subtle,
    },

    divider: {
      height: 1,

      backgroundColor:
        COLORS.border,

      marginTop: 16,

      marginBottom: 15,
    },

    backButton: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,
    },

    backText: {
      color:
        COLORS.teal,

      fontSize: 9,

      fontWeight: '800',
    },

    /* =====================================================
       FOOTER
    ====================================================== */

    securityFooter: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 22,

      marginTop: 20,
    },

    securityFooterText: {
      color:
        COLORS.subtle,

      fontSize: 8,

      textAlign: 'center',
    },

    footer: {
      color:
        COLORS.subtle,

      fontSize: 8,

      textAlign: 'center',

      marginTop: 8,
    },
  });