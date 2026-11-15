/**
 * @file      PatientQRCardScreen.js
 * @module    Patient
 * @desc      Patient identity card showing a QR reference, blood group and emergency contact.
 * @author    Wasana Karunanayaka (S/21/081)
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
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import {
  AlertCircle,
  Droplets,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react-native';

import {
  getPatientProfile,
} from '../services/patient.service';

import useAuthStore from '../store/authStore';

/* DESIGN TOKENS */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E8EDF1',

  navy: '#12344D',
  navySoft: '#EAF1F5',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',
};

/* HELPERS */

const capitalise = (
  value
) => {
  if (
    !value
  ) {
    return '—';
  }

  return (
    value
      .charAt(0)
      .toUpperCase() +
    value.slice(1)
  );
};

/**
 * Use the patient’s initials when a profile photo is unavailable; default to PT if unnamed.
 */
const getInitials = (
  name
) => {
  if (
    !name
  ) {
    return 'PT';
  }

  const parts =
    name
      .trim()
      .split(' ')
      .filter(Boolean);

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length -
        1
    ].charAt(0)
  ).toUpperCase();
};

/* INFORMATION ITEM */

const InfoItem = ({
  icon: Icon,
  label,
  value,
  accent = false,
}) => {
  return (
    <View style={styles.infoItem}>

      <View
        style={[
          styles.infoIcon,

          accent &&
            styles.infoIconAccent,
        ]}
      >

        <Icon
          size={16}
          color={
            accent
              ? COLORS.danger
              : COLORS.teal
          }
        />

      </View>

      <View style={styles.infoText}>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.infoValue,

            accent &&
              styles.infoValueAccent,
          ]}
        >
          {value || '—'}
        </Text>

      </View>

    </View>
  );
};

/* SCREEN */

/**
 * FEATURE: Patient QR identity card
 * LOGIC: Load the session patient profile and encode only qr_code_id; missing IDs show QR unavailable.
 * Initial load failure offers retry; a failed refresh leaves the previous card visible.
 * The QR identifies a patient and does not itself authorize medical-record access.
 */
const PatientQRCardScreen =
  () => {
    const user =
      useAuthStore(
        state =>
          state.user
      );

    // Use the signed-in session profile ID before requesting the QR card; reject an absent patient identity.
    const patientId =
      user?.profile_id ||
      user?.id ||
      '';

    const [
      patient,
      setPatient,
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

    /* LOAD PATIENT */

    const fetchPatient =
      useCallback(
        async (
          background = false
        ) => {
          if (
            !patientId
          ) {
            setLoading(
              false
            );

            setError(
              'Patient account information is unavailable. Please sign in again.'
            );

            return;
          }

          if (
            background
          ) {
            setRefreshing(
              true
            );

          } else {
            setLoading(
              true
            );
          }

          setError(
            null
          );

          try {
            const patientData =
              await getPatientProfile(
                patientId
              );

            setPatient(
              patientData
            );

          } catch (
            err
          ) {
            console.error(
              'Patient QR card load error:',
              err
            );

            setError(
              'Failed to load your QR card. Please try again.'
            );

          } finally {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        },
        [
          patientId,
        ]
      );

    // Load the QR card on entry and whenever the authenticated patient ID changes.
    useEffect(
      () => {
        fetchPatient();
      },
      [
        fetchPatient,
      ]
    );

    /* LOADING */

    if (
      loading
    ) {
      return (
        <View style={styles.centered}>

          <View style={styles.loadingIcon}>

            <QrCode
              size={29}
              color={COLORS.teal}
            />

          </View>

          <ActivityIndicator
            size="small"
            color={COLORS.teal}
          />

          <Text style={styles.loadingTitle}>
            Loading your QR card
          </Text>

          <Text style={styles.loadingText}>
            Preparing your Care4U patient identity
          </Text>

        </View>
      );
    }

    /* ERROR */

    if (
      error &&
      !patient
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
            QR card unavailable
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          {/* Try Again QR Card Button */}
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() =>
              fetchPatient()
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

    const hasQRCode =
      Boolean(
        patient?.qr_code_id
      );

    /* PAGE */

    return (
      <SafeAreaView style={styles.safeArea}>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                fetchPatient(
                  true
                )
              }
              tintColor={
                COLORS.teal
              }
            />
          }
        >

          {/* PATIENT IDENTITY CARD */}

          <View style={styles.identityCard}>

            <View style={styles.identityDecorationOne} />

            <View style={styles.identityDecorationTwo} />

            <View style={styles.identityTop}>

              <View style={styles.avatar}>

                <Text style={styles.avatarText}>
                  {getInitials(
                    patient?.full_name
                  )}
                </Text>

              </View>

              <View style={styles.identityInfo}>

                <Text style={styles.identityEyebrow}>
                  CARE4U PATIENT
                </Text>

                <Text
                  style={styles.patientName}
                  numberOfLines={2}
                >
                  {patient?.full_name ||
                    'Patient'}
                </Text>

                <View style={styles.verifiedRow}>

                  <ShieldCheck
                    size={13}
                    color="#A7DDD8"
                  />

                  <Text style={styles.verifiedText}>
                    Verified patient identity
                  </Text>

                </View>

              </View>

            </View>

            <View style={styles.identityDivider} />

            <View style={styles.identityStats}>

              <View style={styles.identityStat}>

                <Text style={styles.identityStatLabel}>
                  BLOOD GROUP
                </Text>

                <Text style={styles.bloodGroupValue}>
                  {patient?.blood_group ||
                    '—'}
                </Text>

              </View>

              <View style={styles.statDivider} />

              <View style={styles.identityStat}>

                <Text style={styles.identityStatLabel}>
                  GENDER
                </Text>

                <Text style={styles.identityStatValue}>
                  {capitalise(
                    patient?.gender
                  )}
                </Text>

              </View>

              <View style={styles.statDivider} />

              <View style={styles.identityStat}>

                <Text style={styles.identityStatLabel}>
                  NIC
                </Text>

                <Text
                  style={styles.identityStatValue}
                  numberOfLines={1}
                >
                  {patient?.nic ||
                    '—'}
                </Text>

              </View>

            </View>

          </View>

          {/* QR SECTION */}

          <View style={styles.qrCard}>

            <View style={styles.sectionHeading}>

              <Text style={styles.sectionTitle}>
                Patient Identity QR
              </Text>

              <Text style={styles.sectionDescription}>
                Present this QR to authorized Care4U healthcare staff when patient identification is required.
              </Text>

            </View>

            <View style={styles.qrBody}>

              {hasQRCode ? (
                <>

                  <View style={styles.qrOuter}>

                    <View style={styles.qrInner}>

                      {/* Patient Identity QR Code */}
                      <QRCode
                        value={
                          patient.qr_code_id
                        }
                        size={210}
                        color={COLORS.navy}
                        backgroundColor="#FFFFFF"
                      />

                    </View>

                  </View>

                  <View style={styles.scanHint}>

                    <View style={styles.scanHintIcon}>

                      <QrCode
                        size={15}
                        color={COLORS.teal}
                      />

                    </View>

                    <View style={styles.scanHintText}>

                      <Text style={styles.scanHintTitle}>
                        Ready to scan
                      </Text>

                      <Text style={styles.scanHintDescription}>
                        The QR contains your Care4U patient reference only.
                      </Text>

                    </View>

                  </View>

                </>
              ) : (

                <View style={styles.qrUnavailable}>

                  <AlertCircle
                    size={22}
                    color={COLORS.amber}
                  />

                  <Text style={styles.qrUnavailableTitle}>
                    QR unavailable
                  </Text>

                  <Text style={styles.qrUnavailableText}>
                    A patient QR identity has not been assigned to this account.
                  </Text>

                </View>

              )}

            </View>

          </View>

          {/* PATIENT DETAILS */}

          <View style={styles.detailsCard}>

            <View style={styles.sectionHeading}>

              <Text style={styles.sectionTitle}>
                Identity Details
              </Text>

              <Text style={styles.sectionDescription}>
                Key information used to verify your patient profile.
              </Text>

            </View>

            <View style={styles.detailsBody}>

              <InfoItem
                icon={UserRound}
                label="Patient Name"
                value={
                  patient?.full_name
                }
              />

              <InfoItem
                icon={Droplets}
                label="Blood Group"
                value={
                  patient?.blood_group
                }
                accent
              />

              <InfoItem
                icon={Users}
                label="Gender"
                value={
                  capitalise(
                    patient?.gender
                  )
                }
              />

            </View>

          </View>

          {/* EMERGENCY CONTACT */}

          {/* Emergency Contact Card */}
          <View style={styles.emergencyCard}>

            <View style={styles.emergencyHeader}>

              <View style={styles.emergencyTitleArea}>

                <View style={styles.emergencyIcon}>

                  <Phone
                    size={17}
                    color={COLORS.danger}
                  />

                </View>

                <View>

                  <Text style={styles.emergencyEyebrow}>
                    EMERGENCY CONTACT
                  </Text>

                  <Text style={styles.emergencyTitle}>
                    Primary contact
                  </Text>

                </View>

              </View>

            </View>

            <View style={styles.emergencyBody}>

              <View style={styles.emergencyRow}>

                <View style={styles.emergencyInfo}>

                  <Text style={styles.emergencyLabel}>
                    Name
                  </Text>

                  <Text style={styles.emergencyValue}>
                    {patient?.emergency_contact_name ||
                      '—'}
                  </Text>

                </View>

                {patient?.emergency_contact_relationship ? (
                  <View style={styles.relationshipBadge}>

                    <Text style={styles.relationshipText}>
                      {capitalise(
                        patient.emergency_contact_relationship
                      )}
                    </Text>

                  </View>
                ) : null}

              </View>

              <View style={styles.phoneRow}>

                <Phone
                  size={15}
                  color={COLORS.teal}
                />

                <Text style={styles.phoneText}>
                  {patient?.emergency_contact_phone ||
                    '—'}
                </Text>

              </View>

            </View>

          </View>

          {/* SECURITY */}

          <View style={styles.securityNote}>

            <ShieldCheck
              size={15}
              color={COLORS.subtle}
            />

            <Text style={styles.securityText}>
              This QR is a patient reference only. Access to medical information remains protected by Care4U authentication and role-based permissions.
            </Text>

          </View>

        </ScrollView>

      </SafeAreaView>
    );
  };

/* STYLES */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: 17,
      paddingTop: 16,
      paddingBottom: 32,
    },

    /* IDENTITY CARD */

    identityCard: {
      position: 'relative',

      overflow: 'hidden',

      borderRadius: 25,

      backgroundColor:
        COLORS.navy,

      padding: 18,

      marginBottom: 14,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 14,

      elevation: 4,
    },

    identityDecorationOne: {
      position: 'absolute',

      width: 190,
      height: 190,

      borderRadius: 95,

      backgroundColor:
        'rgba(15,139,131,0.38)',

      right: -65,

      top: -100,
    },

    identityDecorationTwo: {
      position: 'absolute',

      width: 80,
      height: 80,

      borderRadius: 40,

      backgroundColor:
        'rgba(255,255,255,0.05)',

      left: 75,

      bottom: -50,
    },

    identityTop: {
      position: 'relative',

      flexDirection: 'row',

      alignItems: 'center',
    },

    avatar: {
      width: 68,

      height: 68,

      borderRadius: 34,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,

      borderWidth: 3,

      borderColor:
        'rgba(255,255,255,0.18)',

      marginRight: 13,
    },

    avatarText: {
      color: '#FFFFFF',

      fontSize: 20,

      fontWeight: '800',

      letterSpacing: 0.5,
    },

    identityInfo: {
      flex: 1,

      minWidth: 0,
    },

    identityEyebrow: {
      color: '#A7DDD8',

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 1,
    },

    patientName: {
      color: '#FFFFFF',

      fontSize: 19,

      lineHeight: 24,

      fontWeight: '800',

      marginTop: 3,
    },

    verifiedRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      marginTop: 6,
    },

    verifiedText: {
      color:
        'rgba(255,255,255,0.7)',

      fontSize: 8,

      fontWeight: '600',
    },

    identityDivider: {
      height: 1,

      backgroundColor:
        'rgba(255,255,255,0.12)',

      marginVertical: 16,
    },

    identityStats: {
      position: 'relative',

      flexDirection: 'row',

      alignItems: 'center',
    },

    identityStat: {
      flex: 1,

      alignItems: 'center',

      minWidth: 0,
    },

    identityStatLabel: {
      color:
        'rgba(255,255,255,0.52)',

      fontSize: 6,

      fontWeight: '800',

      letterSpacing: 0.65,
    },

    identityStatValue: {
      color: '#FFFFFF',

      fontSize: 10,

      fontWeight: '700',

      marginTop: 5,
    },

    bloodGroupValue: {
      color: '#FFB9B9',

      fontSize: 16,

      fontWeight: '800',

      marginTop: 3,
    },

    statDivider: {
      width: 1,

      height: 30,

      backgroundColor:
        'rgba(255,255,255,0.12)',
    },

    /* COMMON SECTION HEADER */

    sectionHeading: {
      paddingHorizontal: 16,

      paddingTop: 16,

      paddingBottom: 14,

      borderBottomWidth: 1,

      borderBottomColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,
    },

    sectionTitle: {
      color:
        COLORS.navy,

      fontSize: 15,

      fontWeight: '800',

      letterSpacing: -0.2,
    },

    sectionDescription: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 4,
    },

    /* QR CARD */

    qrCard: {
      overflow: 'hidden',

      borderRadius: 21,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      marginBottom: 14,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.035,

      shadowRadius: 8,

      elevation: 1,
    },

    qrBody: {
      alignItems: 'center',

      paddingHorizontal: 18,

      paddingTop: 20,

      paddingBottom: 18,

      backgroundColor:
        '#FBFCFD',
    },

    qrOuter: {
      borderRadius: 25,

      padding: 7,

      backgroundColor:
        COLORS.tealSoft,

      borderWidth: 1,

      borderColor:
        '#CEE9E6',
    },

    qrInner: {
      borderRadius: 20,

      padding: 17,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.06,

      shadowRadius: 8,

      elevation: 2,
    },

    scanHint: {
      width: '100%',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 9,

      borderRadius: 14,

      backgroundColor:
        COLORS.tealSoft,

      padding: 11,

      marginTop: 16,
    },

    scanHintIcon: {
      width: 34,

      height: 34,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',
    },

    scanHintText: {
      flex: 1,
    },

    scanHintTitle: {
      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',
    },

    scanHintDescription: {
      color:
        COLORS.tealDark,

      opacity: 0.75,

      fontSize: 8,

      lineHeight: 12,

      marginTop: 2,
    },

    qrUnavailable: {
      alignItems: 'center',

      paddingVertical: 25,

      paddingHorizontal: 14,
    },

    qrUnavailableTitle: {
      color:
        COLORS.text,

      fontSize: 12,

      fontWeight: '800',

      marginTop: 8,
    },

    qrUnavailableText: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      textAlign: 'center',

      marginTop: 4,
    },

    /* DETAILS */

    detailsCard: {
      overflow: 'hidden',

      borderRadius: 21,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      marginBottom: 14,
    },

    detailsBody: {
      paddingHorizontal: 15,

      paddingVertical: 4,

      backgroundColor:
        '#FBFCFD',
    },

    infoItem: {
      flexDirection: 'row',

      alignItems: 'center',

      paddingVertical: 12,

      borderBottomWidth: 1,

      borderBottomColor:
        '#EEF2F4',
    },

    infoIcon: {
      width: 36,

      height: 36,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginRight: 10,
    },

    infoIconAccent: {
      backgroundColor:
        COLORS.dangerSoft,
    },

    infoText: {
      flex: 1,
    },

    infoLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.55,

      textTransform:
        'uppercase',
    },

    infoValue: {
      color:
        COLORS.text,

      fontSize: 11,

      fontWeight: '700',

      marginTop: 3,
    },

    infoValueAccent: {
      color:
        COLORS.danger,

      fontSize: 14,

      fontWeight: '800',
    },

    /* EMERGENCY CONTACT */

    emergencyCard: {
      overflow: 'hidden',

      borderRadius: 21,

      borderWidth: 1,

      borderColor:
        '#F0D4D4',

      backgroundColor:
        COLORS.surface,

      marginBottom: 15,
    },

    emergencyHeader: {
      paddingHorizontal: 15,

      paddingVertical: 14,

      backgroundColor:
        COLORS.dangerSoft,

      borderBottomWidth: 1,

      borderBottomColor:
        '#F0D4D4',
    },

    emergencyTitleArea: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    emergencyIcon: {
      width: 37,

      height: 37,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      marginRight: 9,
    },

    emergencyEyebrow: {
      color:
        COLORS.danger,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.7,
    },

    emergencyTitle: {
      color:
        COLORS.text,

      fontSize: 12,

      fontWeight: '800',

      marginTop: 2,
    },

    emergencyBody: {
      padding: 15,
    },

    emergencyRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      gap: 10,
    },

    emergencyInfo: {
      flex: 1,
    },

    emergencyLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '800',

      textTransform:
        'uppercase',

      letterSpacing: 0.55,
    },

    emergencyValue: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: '800',

      marginTop: 4,
    },

    relationshipBadge: {
      borderRadius: 99,

      backgroundColor:
        COLORS.dangerSoft,

      paddingHorizontal: 9,

      paddingVertical: 5,
    },

    relationshipText: {
      color:
        COLORS.danger,

      fontSize: 7,

      fontWeight: '800',
    },

    phoneRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      borderRadius: 12,

      backgroundColor:
        COLORS.background,

      paddingHorizontal: 11,

      paddingVertical: 10,

      marginTop: 12,
    },

    phoneText: {
      color:
        COLORS.tealDark,

      fontSize: 11,

      fontWeight: '800',
    },

    /* SECURITY */

    securityNote: {
      flexDirection: 'row',

      alignItems: 'flex-start',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 12,
    },

    securityText: {
      flex: 1,

      color:
        COLORS.subtle,

      fontSize: 8,

      lineHeight: 13,

      textAlign: 'center',
    },

    /* STATES */

    centered: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 28,

      backgroundColor:
        COLORS.background,
    },

    loadingIcon: {
      width: 60,

      height: 60,

      borderRadius: 19,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 14,
    },

    errorIcon: {
      backgroundColor:
        COLORS.dangerSoft,
    },

    loadingTitle: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight: '800',

      marginTop: 10,
    },

    loadingText: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      textAlign: 'center',

      marginTop: 5,
    },

    errorText: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      textAlign: 'center',

      maxWidth: 280,

      marginTop: 6,
    },

    retryButton: {
      minHeight: 42,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      borderRadius: 13,

      backgroundColor:
        COLORS.teal,

      paddingHorizontal: 16,

      marginTop: 16,
    },

    retryButtonText: {
      color: '#FFFFFF',

      fontSize: 9,

      fontWeight: '800',
    },
  });

export default PatientQRCardScreen;