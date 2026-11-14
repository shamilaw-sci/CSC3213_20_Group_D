/**
 * @file    RegisterScreen.js
 * @module  Auth
 * @desc    Mobile registration screen for Care4U patients and doctors.
 *          Collects registration details and opens email verification.
 *          The backend completes registration only after code verification.
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
  BadgeCheck,
  CalendarDays,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';

import {
  register,
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
};

/**
 * FEATURE: Patient and Doctor registration screen.
 * LOGIC: Selecting an account type shows the details required for that role.
 * After submitting, the user continues to email verification.
 */
export default function RegisterScreen({
  onRegisterSuccess,
  onBackToLogin,
}) {
  const [role, setRole] = useState('patient');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState('');

  const [nic, setNic] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [slmcRegNumber, setSlmcRegNumber] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState('');

  /**
   * FEATURE: Validate registration details.
   * LOGIC: Check required fields and matching passwords (at least 8 characters).
   * Patients need a NIC and a real date of birth; doctors need an SLMC number
   * and specialization. Show an error and stop if any check fails.
   */
  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
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

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (
      role === 'patient' &&
      !nic.trim()
    ) {
      setError('NIC is required');
      return false;
    }

    if (
      role === 'patient' &&
      !dateOfBirth.trim()
    ) {
      setError('Date of birth is required');
      return false;
    }

    if (role === 'patient') {
      const value = dateOfBirth.trim();
      const date = new Date(`${value}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        setError('Enter date of birth as YYYY-MM-DD');
        return false;
      }
    }

    if (
      role === 'doctor' &&
      (
        !slmcRegNumber.trim() ||
        !specialization.trim()
      )
    ) {
      setError(
        'SLMC registration number and specialization are required'
      );

      return false;
    }

    return true;
  };

  /**
   * FEATURE: Request email verification for a new account.
   * LOGIC: Stop repeated taps → Check details → Send the selected role's data.
   * Success: open the code verification screen; failure: show an error.
   */
  const handleRegister = async () => {
    if (inFlight.current) return;
    if (!validate()) {
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError('');

    const profileData =
      role === 'patient'
        ? {
            fullName: fullName.trim(),
            nic: nic.trim(),
            dateOfBirth: dateOfBirth.trim(),
          }
        : {
            fullName: fullName.trim(),
            slmcRegNumber: slmcRegNumber.trim(),
            specialization: specialization.trim(),
          };

    try {
      const data = await register(
        email.trim(),
        phone.trim(),
        password,
        role,
        profileData
      );

      if (data.success) {
        onRegisterSuccess({
          email: data.data.email,
        });
      } else {
        setError(
          data.message ||
          'Registration failed. Please try again.'
        );
      }

    } catch (err) {
      setError(
        authErrorMessage(err, 'Registration failed. Please try again.')
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

          <View style={styles.brandRow}>

            <View style={styles.logoTile}>

              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />

            </View>

            <View>

              <Text style={styles.brandName}>
                Care4U
              </Text>

              <Text style={styles.heroText}>
                Create your Care4U account
              </Text>

            </View>

          </View>

        </View>

        <View style={styles.card}>

          <Text style={styles.eyebrow}>
            GET STARTED
          </Text>

          {/* Create your account heading — registration page title */}
          <Text style={styles.title}>
            Create your account
          </Text>

          <Text style={styles.subtitle}>
            Choose your account type and complete the information below.
          </Text>

          {/* Registration error message — appears when a field check or request fails */}
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

          <View style={styles.sectionBlock}>

            <Text style={styles.sectionLabel}>
              ACCOUNT TYPE
            </Text>

            {/* Account Type — choose Patient or Doctor to show the matching registration fields */}
            <View style={styles.roleRow}>

              {/* Patient account type button — shows NIC and date-of-birth fields */}
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'patient' &&
                    styles.roleButtonActive,
                ]}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === 'patient', disabled: loading }}
                disabled={loading}
                onPress={() => {
                  setRole('patient');
                  setError('');
                }}
              >

                <UserRound
                  size={18}
                  color={
                    role === 'patient'
                      ? '#FFFFFF'
                      : COLORS.teal
                  }
                />

                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'patient' &&
                      styles.roleButtonTextActive,
                  ]}
                >
                  Patient
                </Text>

              </TouchableOpacity>

              {/* Doctor account type button — shows SLMC number and specialization */}
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'doctor' &&
                    styles.roleButtonActive,
                ]}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ checked: role === 'doctor', disabled: loading }}
                disabled={loading}
                onPress={() => {
                  setRole('doctor');
                  setError('');
                }}
              >

                <Stethoscope
                  size={18}
                  color={
                    role === 'doctor'
                      ? '#FFFFFF'
                      : COLORS.teal
                  }
                />

                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'doctor' &&
                      styles.roleButtonTextActive,
                  ]}
                >
                  Doctor
                </Text>

              </TouchableOpacity>

            </View>

          </View>

          <View style={styles.sectionDivider}>

            <Text style={styles.sectionDividerText}>
              BASIC INFORMATION
            </Text>

          </View>

          <View style={styles.inputGroup}>

            {/* Full Name field — required for both Patient and Doctor registration */}
            <Text style={styles.label}>
              FULL NAME
            </Text>

            <View style={styles.inputWrapper}>

              <UserRound
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                accessibilityLabel="Full name"
                editable={!loading}
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.subtle}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setError('');
                }}
              />

            </View>

          </View>

          <View style={styles.inputGroup}>

            {/* Email Address field — used for account verification */}
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

            {/* Phone Number field — required account contact */}
            <Text style={styles.label}>
              PHONE NUMBER
            </Text>

            <View style={styles.inputWrapper}>

              <Phone
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                accessibilityLabel="Phone number"
                editable={!loading}
                style={styles.input}
                placeholder="07XXXXXXXX"
                placeholderTextColor={COLORS.subtle}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError('');
                }}
              />

            </View>

          </View>

          {role === 'patient' ? (
            <>

              <View style={styles.sectionDivider}>

                <Text style={styles.sectionDividerText}>
                  PATIENT DETAILS
                </Text>

              </View>

              <View style={styles.inputGroup}>

                {/* NIC Number field — required only for Patient registration */}
                <Text style={styles.label}>
                  NIC NUMBER
                </Text>

                <View style={styles.inputWrapper}>

                  <BadgeCheck
                    size={18}
                    color={COLORS.subtle}
                  />

                  <TextInput
                accessibilityLabel="NIC number"
                editable={!loading}
                    style={styles.input}
                    placeholder="200012345678"
                    placeholderTextColor={COLORS.subtle}
                    autoCapitalize="none"
                    value={nic}
                    onChangeText={(text) => {
                      setNic(text);
                      setError('');
                    }}
                  />

                </View>

              </View>

              <View style={styles.inputGroup}>

                {/* Date of Birth field — checks YYYY-MM-DD and a real calendar date */}
                <Text style={styles.label}>
                  DATE OF BIRTH
                </Text>

                <View style={styles.inputWrapper}>

                  <CalendarDays
                    size={18}
                    color={COLORS.subtle}
                  />

                  <TextInput
                accessibilityLabel="Date of birth, YYYY-MM-DD"
                editable={!loading}
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.subtle}
                    value={dateOfBirth}
                    onChangeText={(text) => {
                      setDateOfBirth(text);
                      setError('');
                    }}
                  />

                </View>

              </View>

            </>
          ) : (
            <>

              <View style={styles.sectionDivider}>

                <Text style={styles.sectionDividerText}>
                  PROFESSIONAL DETAILS
                </Text>

              </View>

              <View style={styles.inputGroup}>

                {/* SLMC Registration Number field — required for Doctor registration */}
                <Text style={styles.label}>
                  SLMC REGISTRATION NUMBER
                </Text>

                <View style={styles.inputWrapper}>

                  <BadgeCheck
                    size={18}
                    color={COLORS.subtle}
                  />

                  <TextInput
                accessibilityLabel="SLMC registration number"
                editable={!loading}
                    style={styles.input}
                    placeholder="SLMC12345"
                    placeholderTextColor={COLORS.subtle}
                    autoCapitalize="characters"
                    value={slmcRegNumber}
                    onChangeText={(text) => {
                      setSlmcRegNumber(text);
                      setError('');
                    }}
                  />

                </View>

              </View>

              <View style={styles.inputGroup}>

                {/* Specialization field — required for Doctor registration */}
                <Text style={styles.label}>
                  SPECIALIZATION
                </Text>

                <View style={styles.inputWrapper}>

                  <Stethoscope
                    size={18}
                    color={COLORS.subtle}
                  />

                  <TextInput
                accessibilityLabel="Specialization"
                editable={!loading}
                    style={styles.input}
                    placeholder="e.g. Cardiology"
                    placeholderTextColor={COLORS.subtle}
                    value={specialization}
                    onChangeText={(text) => {
                      setSpecialization(text);
                      setError('');
                    }}
                  />

                </View>

              </View>

            </>
          )}

          <View style={styles.sectionDivider}>

            <Text style={styles.sectionDividerText}>
              SECURITY
            </Text>

          </View>

          <View style={styles.inputGroup}>

            {/* Password field — at least 8 characters */}
            <Text style={styles.label}>
              PASSWORD
            </Text>

            <View style={styles.inputWrapper}>

              <LockKeyhole
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                accessibilityLabel="Password"
                editable={!loading}
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
              />

              {/* Show/Hide Password button — toggles the password text visibility */}
              <TouchableOpacity accessibilityState={{ disabled: Boolean(loading) }}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
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

          <View style={styles.inputGroup}>

            {/* Confirm Password field — must match Password */}
            <Text style={styles.label}>
              CONFIRM PASSWORD
            </Text>

            <View style={styles.inputWrapper}>

              <ShieldCheck
                size={18}
                color={COLORS.subtle}
              />

              <TextInput
                accessibilityLabel="Confirm password"
                editable={!loading}
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={COLORS.subtle}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError('');
                }}
              />

              {/* Show/Hide Confirm Password button — toggles the confirmation text visibility */}
              <TouchableOpacity accessibilityState={{ disabled: Boolean(loading) }}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                disabled={loading}
                onPress={() =>
                  setShowConfirmPassword(
                    previous => !previous
                  )
                }
              >
                {showConfirmPassword ? (
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

          {/* Request verification code button — checks registration details and requests an email code */}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: Boolean(loading) }}
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Request verification code
              </Text>
            )}

          </TouchableOpacity>

          {/* Sign in link — returns to the login screen */}
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text
              style={styles.signInLink}
              onPress={loading ? undefined : onBackToLogin}
              accessibilityRole="link"
            >
              Sign in
            </Text>
          </Text>

        </View>

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={14}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Email verification completes registration. Doctors also need admin approval.
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
    height: 175,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 22,
  },

  heroCircleOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -65,
    top: -75,
    backgroundColor: 'rgba(15,139,131,0.38)',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoTile: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: 47,
    height: 47,
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
  },

  heroText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 3,
  },

  card: {
    marginHorizontal: 18,
    marginTop: -22,
    padding: 20,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
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
    marginTop: 5,
    marginBottom: 19,
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

  sectionBlock: {
    marginBottom: 17,
  },

  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 9,
  },

  // Patient / Doctor account type button — shared size, border, and spacing.
  roleButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BCDCD8',
    backgroundColor: COLORS.tealSoft,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Selected account type button — highlighted background.
  roleButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },

  roleButtonText: {
    color: COLORS.tealDark,
    fontSize: 14,
    fontWeight: '800',
  },

  roleButtonTextActive: {
    color: '#FFFFFF',
  },

  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 7,
    marginBottom: 17,
  },

  sectionDividerText: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingRight: 8,
    marginBottom: -5,
    color: COLORS.subtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.75,
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 49,
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

  // Show/Hide Password buttons — touch area and alignment.
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Request verification code button — color, size, and layout.
  primaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  signInText: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 18,
  },

  // Sign in link — text color and emphasis.
  signInLink: {
    color: COLORS.teal,
    fontWeight: '800',
  },

  securityFooter: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 19,
    paddingHorizontal: 20,
  },

  securityFooterText: {
    color: COLORS.subtle,
    fontSize: 12,
  },
});
