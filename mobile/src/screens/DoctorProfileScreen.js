/**
 * @file    DoctorProfileScreen.js
 * @module  Doctor
 * @desc    Mobile professional profile for logged-in doctors.
 *          Care4U Mobile is patient-focused; doctors use the Care4U
 *          web clinical workspace for appointments, consultations,
 *          prescriptions, laboratory requests, and availability.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import {
  AlertCircle,
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  CheckCircle2,
  Clock3,
  Globe2,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';

import {
  getDoctorProfile,
} from '../services/doctor.service';

import useAuthStore from '../store/authStore';

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  navy: '#12344D',

  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueSoft: '#EFF6FF',

  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E4EAF0',

  green: '#2F855A',
  greenSoft: '#EDF9F2',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (
  name
) => {
  if (!name) {
    return 'DR';
  }

  const parts =
    name
      .trim()
      .split(' ')
      .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
};

const getDoctorPhoto = (
  doctor
) => {
  return (
    doctor?.photo_url ||
    doctor?.profile_photo_url ||
    doctor?.profile_picture ||
    null
  );
};

/* =========================================================
   PROFILE ROW
========================================================= */

const ProfileRow = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <View style={styles.profileRow}>

      <View style={styles.profileRowIcon}>

        <Icon
          size={17}
          color={COLORS.blue}
        />

      </View>

      <View style={styles.profileRowContent}>

        <Text style={styles.profileRowLabel}>
          {label}
        </Text>

        <Text style={styles.profileRowValue}>
          {value || '—'}
        </Text>

      </View>

    </View>
  );
};

/* =========================================================
   SCREEN
========================================================= */

export default function DoctorProfileScreen({
  doctorId,
}) {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const activeDoctorId =
    doctorId ||
    user?.profile_id ||
    user?.id ||
    '';

  const [
    doctor,
    setDoctor,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const fetchData =
    useCallback(
      async (
        background = false
      ) => {
        if (!activeDoctorId) {
          setLoading(false);

          setError(
            'Doctor account information is unavailable. Please sign in again.'
          );

          return;
        }

        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const data =
            await getDoctorProfile(
              activeDoctorId
            );

          setDoctor(data);

        } catch (err) {
          console.error(
            'Doctor profile load error:',
            err
          );

          setError(
            'Failed to load your profile. Please try again.'
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        activeDoctorId,
      ]
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.centered}>

        <View style={styles.loadingIcon}>

          <Stethoscope
            size={29}
            color={COLORS.blue}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.blue}
        />

        <Text style={styles.loadingTitle}>
          Loading your profile
        </Text>

        <Text style={styles.loadingText}>
          Preparing your Care4U professional information
        </Text>

      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    !doctor
  ) {
    return (
      <View style={styles.centered}>

        <View
          style={[
            styles.loadingIcon,
            styles.errorIcon,
          ]}
        >

          <AlertCircle
            size={29}
            color={COLORS.danger}
          />

        </View>

        <Text style={styles.loadingTitle}>
          Profile unavailable
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={() =>
            fetchData()
          }
        >

          <RefreshCw
            size={15}
            color="#FFFFFF"
          />

          <Text style={styles.retryButtonText}>
            Try Again
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  const photoUri =
    getDoctorPhoto(
      doctor
    );

  const verified =
    Boolean(
      doctor?.is_verified
    );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              fetchData(true)
            }
            tintColor={COLORS.blue}
          />
        }
      >

        {/* =================================================
            PROFILE HERO
        ================================================== */}

        <View style={styles.hero}>

          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />

          <View style={styles.heroTop}>

            <View>

              <Text style={styles.heroEyebrow}>
                CARE4U DOCTOR
              </Text>

              <Text style={styles.heroLabel}>
                Professional Profile
              </Text>

            </View>

            <View
              style={[
                styles.statusBadge,

                verified
                  ? styles.statusVerified
                  : styles.statusPending,
              ]}
            >

              {verified ? (
                <CheckCircle2
                  size={13}
                  color={COLORS.green}
                />
              ) : (
                <Clock3
                  size={13}
                  color={COLORS.amber}
                />
              )}

              <Text
                style={[
                  styles.statusText,

                  verified
                    ? styles.statusTextVerified
                    : styles.statusTextPending,
                ]}
              >
                {verified
                  ? 'Verified'
                  : 'Pending'}
              </Text>

            </View>

          </View>

          <View style={styles.heroSpacer} />

        </View>

        {/* =================================================
            IDENTITY
        ================================================== */}

        <View style={styles.identitySection}>

          <View style={styles.avatarOuter}>

            {photoUri ? (
              <Image
                source={{
                  uri: photoUri,
                }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.avatarFallback}>

                <Text style={styles.avatarInitials}>
                  {getInitials(
                    doctor?.full_name
                  )}
                </Text>

              </View>
            )}

          </View>

          <Text style={styles.doctorName}>
            Dr. {doctor?.full_name || 'Doctor'}
          </Text>

          <View style={styles.specializationRow}>

            <Stethoscope
              size={14}
              color={COLORS.blue}
            />

            <Text style={styles.specialization}>
              {doctor?.specialization ||
                'Specialization not provided'}
            </Text>

          </View>

          {doctor?.hospital_name ? (
            <View style={styles.hospitalRow}>

              <Building2
                size={13}
                color={COLORS.muted}
              />

              <Text style={styles.hospitalText}>
                {doctor.hospital_name}
              </Text>

            </View>
          ) : null}

        </View>

        {/* =================================================
            PROFESSIONAL SUMMARY
        ================================================== */}

        <View style={styles.summaryRow}>

          <View style={styles.summaryCard}>

            <BadgeCheck
              size={18}
              color={COLORS.blue}
            />

            <Text style={styles.summaryLabel}>
              SLMC
            </Text>

            <Text
              style={styles.summaryValue}
              numberOfLines={1}
            >
              {doctor?.slmc_reg_number ||
                '—'}
            </Text>

          </View>

          <View style={styles.summaryCard}>

            <BriefcaseMedical
              size={18}
              color={COLORS.blue}
            />

            <Text style={styles.summaryLabel}>
              EXPERIENCE
            </Text>

            <Text style={styles.summaryValue}>
              {doctor?.years_experience != null
                ? `${doctor.years_experience} yrs`
                : '—'}
            </Text>

          </View>

          <View style={styles.summaryCard}>

            <ShieldCheck
              size={18}
              color={
                verified
                  ? COLORS.green
                  : COLORS.amber
              }
            />

            <Text style={styles.summaryLabel}>
              STATUS
            </Text>

            <Text
              style={[
                styles.summaryValue,

                verified
                  ? styles.verifiedValue
                  : styles.pendingValue,
              ]}
            >
              {verified
                ? 'Verified'
                : 'Pending'}
            </Text>

          </View>

        </View>

        {/* =================================================
            PROFESSIONAL INFORMATION
        ================================================== */}

        <View style={styles.sectionCard}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Professional Information
            </Text>

            <Text style={styles.sectionDescription}>
              Your verified professional details registered with Care4U.
            </Text>

          </View>

          <View style={styles.sectionBody}>

            <ProfileRow
              icon={UserRound}
              label="Full Name"
              value={
                doctor?.full_name
              }
            />

            <ProfileRow
              icon={BadgeCheck}
              label="SLMC Registration"
              value={
                doctor?.slmc_reg_number
              }
            />

            <ProfileRow
              icon={Stethoscope}
              label="Specialization"
              value={
                doctor?.specialization
              }
            />

            <ProfileRow
              icon={Building2}
              label="Hospital"
              value={
                doctor?.hospital_name
              }
            />

            <ProfileRow
              icon={BriefcaseMedical}
              label="Years of Experience"
              value={
                doctor?.years_experience != null
                  ? `${doctor.years_experience} years`
                  : null
              }
            />

            {doctor?.qualifications ? (
              <ProfileRow
                icon={GraduationCap}
                label="Qualifications"
                value={
                  Array.isArray(
                    doctor.qualifications
                  )
                    ? doctor.qualifications.join(', ')
                    : doctor.qualifications
                }
              />
            ) : null}

          </View>

        </View>

        {/* =================================================
            WEB CLINICAL WORKSPACE
        ================================================== */}

        <View style={styles.workspaceCard}>

          <View style={styles.workspaceIcon}>

            <Globe2
              size={20}
              color={COLORS.blue}
            />

          </View>

          <View style={styles.workspaceContent}>

            <Text style={styles.workspaceEyebrow}>
              CLINICAL WORKSPACE
            </Text>

            <Text style={styles.workspaceTitle}>
              Doctor tools are available on Care4U Web
            </Text>

            <Text style={styles.workspaceText}>
              Use the Care4U web portal to manage appointments, patient consultations, prescriptions, laboratory requests, consultation notes, and availability.
            </Text>

          </View>

        </View>

        {/* =================================================
            MOBILE SCOPE NOTE
        ================================================== */}

        <View style={styles.mobileNote}>

          <ShieldCheck
            size={15}
            color={COLORS.subtle}
          />

          <Text style={styles.mobileNoteText}>
            Care4U Mobile is optimized for patient healthcare access. Doctors use the responsive web clinical workspace for clinical workflows.
          </Text>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 32,
    },

    /* =====================================================
       HERO
    ====================================================== */

    hero: {
      height: 185,
      backgroundColor: COLORS.navy,
      position: 'relative',
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingTop: 23,
    },

    heroCircleOne: {
      position: 'absolute',
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: 'rgba(37,99,235,0.42)',
      right: -75,
      top: -95,
    },

    heroCircleTwo: {
      position: 'absolute',
      width: 95,
      height: 95,
      borderRadius: 48,
      backgroundColor: 'rgba(255,255,255,0.05)',
      left: -30,
      bottom: -30,
    },

    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    heroEyebrow: {
      color: '#93C5FD',
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 1,
    },

    heroLabel: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      marginTop: 3,
    },

    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
    },

    statusVerified: {
      backgroundColor: '#FFFFFF',
      borderColor: '#D8EEE1',
    },

    statusPending: {
      backgroundColor: '#FFFFFF',
      borderColor: '#F0DFB4',
    },

    statusText: {
      fontSize: 8,
      fontWeight: '800',
    },

    statusTextVerified: {
      color: COLORS.green,
    },

    statusTextPending: {
      color: COLORS.amber,
    },

    heroSpacer: {
      height: 75,
    },

    /* =====================================================
       IDENTITY
    ====================================================== */

    identitySection: {
      alignItems: 'center',
      marginTop: -69,
      paddingHorizontal: 20,
      marginBottom: 18,
    },

    avatarOuter: {
      width: 126,
      height: 126,
      borderRadius: 63,
      padding: 5,
      backgroundColor: '#FFFFFF',
      shadowColor: '#0F172A',
      shadowOffset: {
        width: 0,
        height: 7,
      },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 6,
    },

    profilePhoto: {
      width: '100%',
      height: '100%',
      borderRadius: 58,
      backgroundColor: COLORS.blueSoft,
    },

    avatarFallback: {
      flex: 1,
      borderRadius: 58,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.blue,
    },

    avatarInitials: {
      color: '#FFFFFF',
      fontSize: 31,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    doctorName: {
      color: COLORS.navy,
      fontSize: 21,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 12,
      letterSpacing: -0.3,
    },

    specializationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 6,
    },

    specialization: {
      color: COLORS.blueDark,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
    },

    hospitalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 6,
    },

    hospitalText: {
      color: COLORS.muted,
      fontSize: 9,
      fontWeight: '600',
      textAlign: 'center',
    },

    /* =====================================================
       SUMMARY
    ====================================================== */

    summaryRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 14,
    },

    summaryCard: {
      flex: 1,
      minHeight: 89,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 7,
      paddingVertical: 10,
    },

    summaryLabel: {
      color: COLORS.subtle,
      fontSize: 6,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginTop: 6,
    },

    summaryValue: {
      color: COLORS.navy,
      fontSize: 9,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 4,
    },

    verifiedValue: {
      color: COLORS.green,
    },

    pendingValue: {
      color: COLORS.amber,
    },

    /* =====================================================
       PROFESSIONAL INFORMATION
    ====================================================== */

    sectionCard: {
      marginHorizontal: 16,
      marginBottom: 14,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      overflow: 'hidden',
    },

    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },

    sectionTitle: {
      color: COLORS.navy,
      fontSize: 15,
      fontWeight: '800',
    },

    sectionDescription: {
      color: COLORS.muted,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 4,
    },

    sectionBody: {
      paddingHorizontal: 15,
      backgroundColor: '#FBFCFD',
    },

    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#EDF1F4',
    },

    profileRowIcon: {
      width: 37,
      height: 37,
      borderRadius: 12,
      backgroundColor: COLORS.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    profileRowContent: {
      flex: 1,
    },

    profileRowLabel: {
      color: COLORS.subtle,
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
    },

    profileRowValue: {
      color: COLORS.text,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '700',
      marginTop: 3,
    },

    /* =====================================================
       WEB WORKSPACE
    ====================================================== */

    workspaceCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
      marginHorizontal: 16,
      marginBottom: 14,
      padding: 15,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: '#D6E5F8',
      backgroundColor: COLORS.blueSoft,
    },

    workspaceIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    workspaceContent: {
      flex: 1,
    },

    workspaceEyebrow: {
      color: COLORS.blue,
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 0.7,
    },

    workspaceTitle: {
      color: COLORS.navy,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '800',
      marginTop: 3,
    },

    workspaceText: {
      color: COLORS.textSoft,
      fontSize: 8,
      lineHeight: 13,
      marginTop: 5,
    },

    /* =====================================================
       MOBILE NOTE
    ====================================================== */

    mobileNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      marginHorizontal: 22,
    },

    mobileNoteText: {
      flex: 1,
      color: COLORS.subtle,
      fontSize: 8,
      lineHeight: 13,
      textAlign: 'center',
    },

    /* =====================================================
       STATES
    ====================================================== */

    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      backgroundColor: COLORS.background,
    },

    loadingIcon: {
      width: 60,
      height: 60,
      borderRadius: 19,
      backgroundColor: COLORS.blueSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    errorIcon: {
      backgroundColor: COLORS.dangerSoft,
    },

    loadingTitle: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '800',
      marginTop: 10,
    },

    loadingText: {
      color: COLORS.muted,
      fontSize: 9,
      lineHeight: 14,
      textAlign: 'center',
      marginTop: 5,
    },

    errorText: {
      color: COLORS.muted,
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 280,
    },

    retryButton: {
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 13,
      backgroundColor: COLORS.blue,
      paddingHorizontal: 16,
      marginTop: 16,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800',
    },
  });