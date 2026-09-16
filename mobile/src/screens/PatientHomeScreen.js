/**
 * @file    PatientHomeScreen.js
 * @module  Patient
 * @desc    Premium patient home dashboard for the Care4U mobile app.
 *          Shows patient identity, next appointment, health summary,
 *          quick-access care tools, and personalized health infographics.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import {
  AlertTriangle,
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react-native';

import api from '../services/api';

import {
  getPatientAppointments,
} from '../services/appointment.service';

import {
  getPatientPrescriptions,
} from '../services/prescription.service';

import useAuthStore from '../store/authStore';

import HealthAwarenessFeed from '../components/HealthAwarenessFeed';

/* =========================================================
   CARE4U MOBILE DESIGN TOKENS
========================================================= */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E8EDF1',

  navy: '#12344D',
  navyLight: '#1B4965',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  blue: '#3973A7',
  blueSoft: '#EEF5FB',

  violet: '#7656A8',
  violetSoft: '#F4F0FA',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',

  success: '#2F855A',
  successSoft: '#EDF9F2',
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Returns initials from a person's full name.
 *
 * @param {string} name - Full patient name
 * @returns {string} Initials
 */
const getInitials = (
  name
) => {
  if (!name) {
    return 'P';
  }

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
          .toUpperCase()
    )
    .join('');
};

/**
 * Returns the patient's first name.
 *
 * @param {string} name - Full patient name
 * @returns {string} First name
 */
const getFirstName = (
  name
) => {
  if (!name) {
    return 'there';
  }

  return (
    name
      .trim()
      .split(' ')[0]
  );
};

/**
 * Returns a time-aware greeting.
 *
 * @returns {string} Greeting
 */
const getGreeting = () => {
  const hour =
    new Date()
      .getHours();

  if (
    hour < 12
  ) {
    return 'Good morning';
  }

  if (
    hour < 18
  ) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

/**
 * Formats the current date for the dashboard greeting.
 *
 * @returns {string} Formatted current date
 */
const formatToday = () => {
  return new Date()
    .toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }
    );
};

/**
 * Formats an appointment date.
 *
 * @param {string} value - ISO date
 * @returns {string} Formatted date
 */
const formatAppointmentDate = (
  value
) => {
  if (!value) {
    return 'Date unavailable';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Date unavailable';
  }

  return date
    .toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
};

/**
 * Formats an appointment time.
 *
 * @param {string} value - ISO date
 * @returns {string} Formatted time
 */
const formatAppointmentTime = (
  value
) => {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  return date
    .toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    );
};

/**
 * Converts an appointment status into a readable label.
 *
 * @param {string} status - Appointment status
 * @returns {string} Formatted status
 */
const formatStatus = (
  status
) => {
  if (!status) {
    return 'Scheduled';
  }

  return status
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      (character) =>
        character
          .toUpperCase()
    );
};

/**
 * Checks whether a prescription is still clinically active.
 *
 * @param {Object} prescription - Prescription object
 * @returns {boolean} Whether prescription is active
 */
const isActivePrescription = (
  prescription
) => {
  const status =
    prescription
      ?.status;

  if (
    status !== 'active' &&
    status !==
      'partially_filled'
  ) {
    return false;
  }

  if (
    prescription
      ?.expires_at
  ) {
    const expiry =
      new Date(
        prescription
          .expires_at
      );

    if (
      !Number.isNaN(
        expiry.getTime()
      ) &&
      expiry <
        new Date()
    ) {
      return false;
    }
  }

  return true;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

/**
 * @component SectionTitle
 * @desc      Compact section heading for the dashboard.
 */
const SectionTitle = ({
  title,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.sectionTitleRow}>

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {actionLabel &&
      onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.65}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionActionText}>
            {actionLabel}
          </Text>

          <ChevronRight
            size={15}
            color={COLORS.teal}
          />
        </TouchableOpacity>
      ) : null}

    </View>
  );
};

/**
 * @component MetricCard
 * @desc      Displays one compact patient health metric.
 */
const MetricCard = ({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBackground,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.metricCard}
      activeOpacity={0.76}
      onPress={onPress}
    >

      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        <Icon
          size={17}
          color={iconColor}
          strokeWidth={2.2}
        />
      </View>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
        numberOfLines={1}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
};

/**
 * @component QuickActionCard
 * @desc      Premium shortcut card for common patient workflows.
 */
const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBackground,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.quickActionCard}
      activeOpacity={0.78}
      onPress={onPress}
    >

      <View style={styles.quickActionTop}>

        <View
          style={[
            styles.quickActionIcon,
            {
              backgroundColor:
                iconBackground,
            },
          ]}
        >
          <Icon
            size={21}
            color={iconColor}
            strokeWidth={2.15}
          />
        </View>

        <View style={styles.quickActionArrow}>
          <ChevronRight
            size={17}
            color={COLORS.subtle}
          />
        </View>

      </View>

      <Text style={styles.quickActionTitle}>
        {title}
      </Text>

      <Text
        style={styles.quickActionDescription}
        numberOfLines={2}
      >
        {description}
      </Text>

    </TouchableOpacity>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/**
 * @component PatientHomeScreen
 * @desc      Main patient dashboard for the mobile application.
 * @param {Function} navigate - Root mobile navigation callback
 */
const PatientHomeScreen = ({
  navigate,
}) => {
  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const [
    patient,
    setPatient,
  ] = useState(null);

  const [
    allergies,
    setAllergies,
  ] = useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    dashboardWarning,
    setDashboardWarning,
  ] = useState('');

  const [
    photoLoadFailed,
    setPhotoLoadFailed,
  ] = useState(false);

  /**
   * Loads the patient dashboard information.
   *
   * Promise.allSettled is used so one failed secondary
   * request does not make the entire dashboard unusable.
   *
   * @param {boolean} background - Whether this is pull-to-refresh
   * @returns {Promise<void>}
   */
  const loadDashboard =
    useCallback(
      async (
        background = false
      ) => {
        if (!patientId) {
          setLoading(false);

          return;
        }

        if (background) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setDashboardWarning(
          ''
        );

        try {
          const results =
            await Promise
              .allSettled([
                api.get(
                  `/api/patients/${patientId}`
                ),

                api.get(
                  `/api/patients/${patientId}/allergies`
                ),

                getPatientAppointments(
                  patientId
                ),

                getPatientPrescriptions(
                  patientId
                ),
              ]);

          const [
            patientResult,
            allergyResult,
            appointmentResult,
            prescriptionResult,
          ] = results;

          if (
            patientResult
              .status ===
            'fulfilled'
          ) {
            setPatient(
              patientResult
                .value
                ?.data
                ?.data ||
              null
            );
          }

          if (
            allergyResult
              .status ===
            'fulfilled'
          ) {
            setAllergies(
              allergyResult
                .value
                ?.data
                ?.data ||
              []
            );
          }

          if (
            appointmentResult
              .status ===
            'fulfilled'
          ) {
            setAppointments(
              appointmentResult
                .value ||
              []
            );
          }

          if (
            prescriptionResult
              .status ===
            'fulfilled'
          ) {
            setPrescriptions(
              prescriptionResult
                .value ||
              []
            );
          }

          const failures =
            results.filter(
              (
                result
              ) =>
                result
                  .status ===
                'rejected'
            );

          if (
            failures.length ===
            results.length
          ) {
            setDashboardWarning(
              'We could not refresh your Care4U information. Pull down to try again.'
            );
          } else if (
            failures.length >
            0
          ) {
            setDashboardWarning(
              'Some information could not be refreshed.'
            );
          }

        } catch (error) {
          console.error(
            'Patient dashboard load error:',
            error
          );

          setDashboardWarning(
            'We could not refresh your Care4U information.'
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

  useEffect(() => {
    loadDashboard();
  }, [
    loadDashboard,
  ]);

  /**
   * Allows a new patient profile photo URL to be retried.
   */
  useEffect(() => {
    setPhotoLoadFailed(
      false
    );
  }, [
    patient?.photo_url,
  ]);

  /**
   * Finds the patient's nearest future appointment.
   */
  const nextAppointment =
    useMemo(
      () => {
        const now =
          new Date();

        return [
          ...appointments,
        ]
          .filter(
            (
              appointment
            ) => {
              if (
                !appointment
                  ?.scheduled_at
              ) {
                return false;
              }

              const appointmentDate =
                new Date(
                  appointment
                    .scheduled_at
                );

              if (
                Number.isNaN(
                  appointmentDate
                    .getTime()
                )
              ) {
                return false;
              }

              return (
                appointmentDate >
                  now &&
                [
                  'scheduled',
                  'confirmed',
                ].includes(
                  appointment
                    .status
                )
              );
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                first
                  .scheduled_at
              ) -
              new Date(
                second
                  .scheduled_at
              )
          )[0] ||
        null;
      },
      [
        appointments,
      ]
    );

  const activePrescriptionCount =
    useMemo(
      () =>
        prescriptions
          .filter(
            isActivePrescription
          )
          .length,
      [
        prescriptions,
      ]
    );

  const severeAllergyCount =
    useMemo(
      () =>
        allergies.filter(
          (
            allergy
          ) =>
            allergy
              ?.severity
              ?.toLowerCase() ===
            'severe'
        ).length,
      [
        allergies,
      ]
    );

  const patientName =
    patient?.full_name ||
    user?.full_name ||
    '';

  const quickActions = [
    {
      id:
        'prescriptions',

      title:
        'Prescriptions',

      description:
        'Medicines, status and pharmacy QR',

      icon:
        Pill,

      iconColor:
        COLORS.teal,

      iconBackground:
        COLORS.tealSoft,

      onPress:
        () =>
          navigate(
            'prescriptions'
          ),
    },

    {
      id:
        'labreports',

      title:
        'Lab Reports',

      description:
        'View your latest test results',

      icon:
        FlaskConical,

      iconColor:
        COLORS.blue,

      iconBackground:
        COLORS.blueSoft,

      onPress:
        () =>
          navigate(
            'labreports'
          ),
    },

    {
      id:
        'qrcard',

      title:
        'My QR Card',

      description:
        'Secure Care4U patient identity',

      icon:
        QrCode,

      iconColor:
        COLORS.violet,

      iconBackground:
        COLORS.violetSoft,

      onPress:
        () =>
          navigate(
            'qrcard'
          ),
    },

    {
      id:
        'aichat',

      title:
        'AI Assistant',

      description:
        'General health guidance and help',

      icon:
        Bot,

      iconColor:
        COLORS.tealDark,

      iconBackground:
        COLORS.tealSoft,

      onPress:
        () =>
          navigate(
            'aichat'
          ),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingMark}>
          <HeartPulse
            size={28}
            color={COLORS.teal}
            strokeWidth={2}
          />
        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Getting things ready
        </Text>

        <Text style={styles.loadingText}>
          Loading your latest health information
        </Text>

      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={
        styles.content
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
            loadDashboard(
              true
            )
          }
          tintColor={
            COLORS.teal
          }
          colors={[
            COLORS.teal,
          ]}
        />
      }
    >

      {/* =====================================================
          PERSONAL GREETING
      ====================================================== */}

      <View style={styles.identitySection}>

        <View style={styles.identityText}>

          <Text style={styles.todayText}>
            {formatToday()}
          </Text>

          <Text style={styles.greetingText}>
            {getGreeting()},{'\n'}
            <Text style={styles.patientFirstName}>
              {getFirstName(
                patientName
              )}
            </Text>
          </Text>

          <View style={styles.secureRow}>

            <ShieldCheck
              size={13}
              color={COLORS.teal}
            />

            <Text style={styles.secureText}>
              Your Care4U health space
            </Text>

          </View>

        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarShell}
          onPress={() =>
            navigate(
              'profile'
            )
          }
        >

          {patient
              ?.photo_url &&
          !photoLoadFailed ? (

            <Image
              source={{
                uri:
                  patient
                    .photo_url,
              }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() =>
                setPhotoLoadFailed(
                  true
                )
              }
              accessibilityLabel={`${patientName || 'Patient'} profile photo`}
            />

          ) : (

            <View style={styles.avatarFallback}>

              <Text style={styles.avatarInitials}>
                {getInitials(
                  patientName
                )}
              </Text>

            </View>

          )}

          <View style={styles.avatarOnlineDot} />

        </TouchableOpacity>

      </View>

      {/* =====================================================
          PARTIAL LOAD WARNING
      ====================================================== */}

      {dashboardWarning ? (
        <View style={styles.warningCard}>

          <AlertTriangle
            size={17}
            color={COLORS.amber}
          />

          <Text style={styles.warningText}>
            {dashboardWarning}
          </Text>

        </View>
      ) : null}

      {/* =====================================================
          NEXT APPOINTMENT
      ====================================================== */}

      <SectionTitle
        title="Next appointment"
        actionLabel="All visits"
        onAction={() =>
          navigate(
            'appointments'
          )
        }
      />

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.appointmentCard}
        onPress={() =>
          nextAppointment
            ? navigate(
                'appointments'
              )
            : navigate(
                'search'
              )
        }
      >

        <View style={styles.decorativeCircleLarge} />
        <View style={styles.decorativeCircleSmall} />

        {nextAppointment ? (
          <>

            <View style={styles.appointmentTop}>

              <View style={styles.appointmentIcon}>

                <Stethoscope
                  size={21}
                  color="#FFFFFF"
                  strokeWidth={2}
                />

              </View>

              <View style={styles.appointmentHeading}>

                <Text style={styles.appointmentEyebrow}>
                  UPCOMING VISIT
                </Text>

                <Text
                  style={styles.appointmentDoctor}
                  numberOfLines={1}
                >
                  Dr.{' '}
                  {
                    nextAppointment
                      .doctor_name ||
                    'Care4U Doctor'
                  }
                </Text>

                <Text
                  style={styles.appointmentSpecialty}
                  numberOfLines={1}
                >
                  {
                    nextAppointment
                      .doctor_specialization ||
                    'Medical consultation'
                  }
                </Text>

              </View>

              <View style={styles.appointmentStatus}>

                <Text style={styles.appointmentStatusText}>
                  {formatStatus(
                    nextAppointment
                      .status
                  )}
                </Text>

              </View>

            </View>

            <View style={styles.appointmentDivider} />

            <View style={styles.appointmentDetails}>

              <View style={styles.appointmentDetail}>

                <CalendarDays
                  size={16}
                  color="#BFD5E2"
                />

                <Text style={styles.appointmentDetailText}>
                  {formatAppointmentDate(
                    nextAppointment
                      .scheduled_at
                  )}
                </Text>

              </View>

              <View style={styles.detailSeparator} />

              <View style={styles.appointmentDetail}>

                <Clock3
                  size={16}
                  color="#BFD5E2"
                />

                <Text style={styles.appointmentDetailText}>
                  {formatAppointmentTime(
                    nextAppointment
                      .scheduled_at
                  )}
                </Text>

              </View>

            </View>

            <View style={styles.appointmentBottom}>

              <Text style={styles.appointmentType}>
                {
                  nextAppointment
                    ?.type
                    ? formatStatus(
                        nextAppointment
                          .type
                      )
                    : 'Appointment'
                }
              </Text>

              <View style={styles.appointmentOpen}>

                <Text style={styles.appointmentOpenText}>
                  View details
                </Text>

                <ChevronRight
                  size={15}
                  color="#FFFFFF"
                />

              </View>

            </View>

          </>

        ) : (

          <View style={styles.noAppointmentContent}>

            <View style={styles.noAppointmentIcon}>

              <CalendarDays
                size={24}
                color="#FFFFFF"
              />

            </View>

            <Text style={styles.noAppointmentTitle}>
              Your schedule is clear
            </Text>

            <Text style={styles.noAppointmentText}>
              No upcoming appointments. Find a Care4U doctor whenever you need one.
            </Text>

            <View style={styles.noAppointmentAction}>

              <Search
                size={16}
                color={COLORS.navy}
              />

              <Text style={styles.noAppointmentActionText}>
                Find a doctor
              </Text>

            </View>

          </View>
        )}

      </TouchableOpacity>

      {/* =====================================================
          HEALTH SNAPSHOT
      ====================================================== */}

      <SectionTitle
        title="Health at a glance"
      />

      <View style={styles.metricsRow}>

        <MetricCard
          icon={Pill}
          value={
            activePrescriptionCount
          }
          label="Active meds"
          iconColor={
            COLORS.teal
          }
          iconBackground={
            COLORS.tealSoft
          }
          onPress={() =>
            navigate(
              'prescriptions'
            )
          }
        />

        <MetricCard
          icon={AlertTriangle}
          value={
            allergies.length
          }
          label={
            severeAllergyCount >
            0
              ? 'Allergies'
              : 'Allergies'
          }
          iconColor={
            severeAllergyCount >
            0
              ? COLORS.danger
              : COLORS.amber
          }
          iconBackground={
            severeAllergyCount >
            0
              ? COLORS.dangerSoft
              : COLORS.amberSoft
          }
          onPress={() =>
            navigate(
              'profile'
            )
          }
        />

        <MetricCard
          icon={HeartPulse}
          value={
            patient
              ?.blood_group ||
            '—'
          }
          label="Blood type"
          iconColor={
            COLORS.blue
          }
          iconBackground={
            COLORS.blueSoft
          }
          onPress={() =>
            navigate(
              'profile'
            )
          }
        />

      </View>

      {severeAllergyCount >
        0 && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() =>
            navigate(
              'profile'
            )
          }
          style={styles.allergyNotice}
        >

          <View style={styles.allergyNoticeIcon}>

            <AlertTriangle
              size={17}
              color={COLORS.danger}
            />

          </View>

          <View style={styles.allergyNoticeContent}>

            <Text style={styles.allergyNoticeTitle}>
              Critical allergy information saved
            </Text>

            <Text style={styles.allergyNoticeText}>
              {severeAllergyCount}{' '}
              severe{' '}
              {severeAllergyCount ===
              1
                ? 'allergy is'
                : 'allergies are'}{' '}
              recorded in your Care4U profile.
            </Text>

          </View>

          <ChevronRight
            size={17}
            color={COLORS.danger}
          />

        </TouchableOpacity>
      )}

      {/* =====================================================
          QUICK ACCESS
      ====================================================== */}

      <SectionTitle
        title="Quick access"
      />

      <View style={styles.quickGrid}>

        {quickActions.map(
          (
            action
          ) => (
            <QuickActionCard
              key={
                action.id
              }
              {...action}
            />
          )
        )}

      </View>

      {/* =====================================================
          FIND DOCTOR
      ====================================================== */}

      <TouchableOpacity
        activeOpacity={0.82}
        style={styles.doctorBanner}
        onPress={() =>
          navigate(
            'search'
          )
        }
      >

        <View style={styles.doctorBannerIcon}>

          <Search
            size={21}
            color={COLORS.teal}
          />

        </View>

        <View style={styles.doctorBannerContent}>

          <Text style={styles.doctorBannerEyebrow}>
            CARE WHEN YOU NEED IT
          </Text>

          <Text style={styles.doctorBannerTitle}>
            Find the right doctor
          </Text>

          <Text style={styles.doctorBannerText}>
            Search by specialty and choose an available appointment.
          </Text>

        </View>

        <View style={styles.doctorBannerArrow}>

          <ChevronRight
            size={19}
            color="#FFFFFF"
          />

        </View>

      </TouchableOpacity>

      {/* =====================================================
          PERSONALIZED HEALTH CONTENT
      ====================================================== */}

      <View style={styles.healthSectionHeader}>

        <View>

          <View style={styles.healthLabelRow}>

            <Sparkles
              size={14}
              color={COLORS.teal}
            />

            <Text style={styles.healthLabel}>
              FOR YOU
            </Text>

          </View>

          <Text style={styles.healthTitle}>
            Health insights
          </Text>

          <Text style={styles.healthSubtitle}>
            Personalized using your saved health profile
          </Text>

        </View>

      </View>

      <View style={styles.healthFeedCard}>

        <HealthAwarenessFeed
          patientAllergies={
            allergies
          }
        />

      </View>

      {/* =====================================================
          SECURITY NOTE
      ====================================================== */}

      <View style={styles.securityFooter}>

        <ShieldCheck
          size={15}
          color={COLORS.subtle}
        />

        <Text style={styles.securityFooterText}>
          Your medical information is protected by Care4U access controls.
        </Text>

      </View>

      <View style={styles.bottomSpace} />

    </ScrollView>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 28,
    },

    /* =====================================================
       LOADING
    ====================================================== */

    loadingScreen: {
      flex: 1,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      paddingHorizontal: 30,
    },

    loadingMark: {
      width: 60,
      height: 60,

      borderRadius: 20,

      alignItems: 'center',
      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 18,
    },

    loadingTitle: {
      marginTop: 14,

      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '700',
    },

    loadingText: {
      marginTop: 5,

      color:
        COLORS.muted,

      fontSize: 12,

      textAlign: 'center',
    },

    /* =====================================================
       IDENTITY
    ====================================================== */

    identitySection: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 25,
    },

    identityText: {
      flex: 1,

      paddingRight: 15,
    },

    todayText: {
      color:
        COLORS.muted,

      fontSize: 11,

      fontWeight: '600',

      marginBottom: 7,
    },

    greetingText: {
      color:
        COLORS.text,

      fontSize: 25,

      lineHeight: 31,

      fontWeight: '500',

      letterSpacing: -0.5,
    },

    patientFirstName: {
      color:
        COLORS.text,

      fontWeight: '800',
    },

    secureRow: {
      marginTop: 9,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,
    },

    secureText: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight: '600',
    },

    avatarShell: {
      width: 66,
      height: 66,

      borderRadius: 33,

      padding: 3,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.1,

      shadowRadius: 12,

      elevation: 4,
    },

    avatarImage: {
      width: '100%',
      height: '100%',

      borderRadius: 30,
    },

    avatarFallback: {
      flex: 1,

      borderRadius: 30,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,
    },

    avatarInitials: {
      color:
        '#FFFFFF',

      fontSize: 18,

      fontWeight: '800',
    },

    avatarOnlineDot: {
      position: 'absolute',

      right: 1,
      bottom: 3,

      width: 14,
      height: 14,

      borderRadius: 7,

      backgroundColor:
        '#38B27C',

      borderWidth: 3,

      borderColor:
        COLORS.surface,
    },

    /* =====================================================
       WARNING
    ====================================================== */

    warningCard: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 9,

      backgroundColor:
        COLORS.amberSoft,

      borderRadius: 14,

      paddingHorizontal: 13,
      paddingVertical: 11,

      borderWidth: 1,

      borderColor:
        '#F4E3B1',

      marginBottom: 18,
    },

    warningText: {
      flex: 1,

      color:
        '#815719',

      fontSize: 11,

      lineHeight: 17,

      fontWeight: '600',
    },

    /* =====================================================
       SECTION TITLE
    ====================================================== */

    sectionTitleRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginTop: 4,

      marginBottom: 11,
    },

    sectionTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '800',

      letterSpacing: -0.2,
    },

    sectionAction: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    sectionActionText: {
      color:
        COLORS.teal,

      fontSize: 11,

      fontWeight: '700',
    },

    /* =====================================================
       APPOINTMENT
    ====================================================== */

    appointmentCard: {
      position: 'relative',

      overflow: 'hidden',

      minHeight: 190,

      borderRadius: 24,

      backgroundColor:
        COLORS.navy,

      padding: 18,

      marginBottom: 24,

      shadowColor:
        COLORS.navy,

      shadowOffset: {
        width: 0,
        height: 10,
      },

      shadowOpacity: 0.2,

      shadowRadius: 18,

      elevation: 6,
    },

    decorativeCircleLarge: {
      position: 'absolute',

      width: 180,
      height: 180,

      borderRadius: 90,

      right: -92,
      top: -88,

      backgroundColor:
        'rgba(255,255,255,0.045)',
    },

    decorativeCircleSmall: {
      position: 'absolute',

      width: 100,
      height: 100,

      borderRadius: 50,

      right: -33,
      bottom: -50,

      backgroundColor:
        'rgba(15,139,131,0.22)',
    },

    appointmentTop: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    appointmentIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      backgroundColor:
        'rgba(255,255,255,0.12)',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    appointmentHeading: {
      flex: 1,

      marginLeft: 11,

      marginRight: 8,
    },

    appointmentEyebrow: {
      color:
        '#9BC6C4',

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 1,
    },

    appointmentDoctor: {
      color:
        '#FFFFFF',

      fontSize: 15,

      fontWeight: '800',

      marginTop: 3,
    },

    appointmentSpecialty: {
      color:
        '#BCD0DC',

      fontSize: 10,

      marginTop: 2,
    },

    appointmentStatus: {
      backgroundColor:
        'rgba(255,255,255,0.12)',

      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 99,
    },

    appointmentStatusText: {
      color:
        '#DDF7F4',

      fontSize: 8,

      fontWeight: '800',
    },

    appointmentDivider: {
      height: 1,

      backgroundColor:
        'rgba(255,255,255,0.10)',

      marginVertical: 16,
    },

    appointmentDetails: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    appointmentDetail: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,
    },

    appointmentDetailText: {
      color:
        '#E2ECF2',

      fontSize: 11,

      fontWeight: '600',
    },

    detailSeparator: {
      width: 1,
      height: 15,

      backgroundColor:
        'rgba(255,255,255,0.18)',

      marginHorizontal: 13,
    },

    appointmentBottom: {
      marginTop: 16,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    appointmentType: {
      color:
        '#95AFC0',

      fontSize: 9,

      fontWeight: '700',

      letterSpacing: 0.7,

      textTransform:
        'uppercase',
    },

    appointmentOpen: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 2,
    },

    appointmentOpenText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '700',
    },

    noAppointmentContent: {
      minHeight: 155,

      justifyContent:
        'center',

      alignItems:
        'flex-start',
    },

    noAppointmentIcon: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        'rgba(255,255,255,0.12)',

      marginBottom: 13,
    },

    noAppointmentTitle: {
      color:
        '#FFFFFF',

      fontSize: 18,

      fontWeight: '800',
    },

    noAppointmentText: {
      color:
        '#BCD0DC',

      fontSize: 11,

      lineHeight: 17,

      maxWidth: '85%',

      marginTop: 5,

      marginBottom: 16,
    },

    noAppointmentAction: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      backgroundColor:
        '#FFFFFF',

      borderRadius: 12,

      paddingHorizontal: 12,

      paddingVertical: 9,
    },

    noAppointmentActionText: {
      color:
        COLORS.navy,

      fontSize: 11,

      fontWeight: '800',
    },

    /* =====================================================
       METRICS
    ====================================================== */

    metricsRow: {
      flexDirection: 'row',

      gap: 9,

      marginBottom: 16,
    },

    metricCard: {
      flex: 1,

      minHeight: 113,

      borderRadius: 18,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 12,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.035,

      shadowRadius: 7,

      elevation: 1,
    },

    metricIcon: {
      width: 35,
      height: 35,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 10,
    },

    metricValue: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight: '800',
    },

    metricLabel: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '600',

      marginTop: 2,
    },

    allergyNotice: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.dangerSoft,

      borderWidth: 1,

      borderColor:
        '#F2D2D2',

      borderRadius: 16,

      padding: 12,

      marginBottom: 24,
    },

    allergyNoticeIcon: {
      width: 36,
      height: 36,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      marginRight: 10,
    },

    allergyNoticeContent: {
      flex: 1,

      paddingRight: 8,
    },

    allergyNoticeTitle: {
      color:
        '#873737',

      fontSize: 11,

      fontWeight: '800',
    },

    allergyNoticeText: {
      color:
        '#A15A5A',

      fontSize: 9,

      lineHeight: 14,

      marginTop: 2,
    },

    /* =====================================================
       QUICK ACTIONS
    ====================================================== */

    quickGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 10,

      marginBottom: 20,
    },

    quickActionCard: {
      flexBasis: '47%',

      flexGrow: 1,

      minHeight: 142,

      borderRadius: 19,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 14,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.04,

      shadowRadius: 9,

      elevation: 1,
    },

    quickActionTop: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 15,
    },

    quickActionIcon: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    quickActionArrow: {
      width: 28,
      height: 28,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F8FAFB',
    },

    quickActionTitle: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: '800',
    },

    quickActionDescription: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 4,
    },

    /* =====================================================
       DOCTOR BANNER
    ====================================================== */

    doctorBanner: {
      minHeight: 105,

      borderRadius: 21,

      padding: 14,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      marginBottom: 27,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.04,

      shadowRadius: 10,

      elevation: 1,
    },

    doctorBannerIcon: {
      width: 48,
      height: 48,

      borderRadius: 16,

      backgroundColor:
        COLORS.tealSoft,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    doctorBannerContent: {
      flex: 1,

      paddingRight: 8,
    },

    doctorBannerEyebrow: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 0.9,
    },

    doctorBannerTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 2,
    },

    doctorBannerText: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 3,
    },

    doctorBannerArrow: {
      width: 34,
      height: 34,

      borderRadius: 12,

      backgroundColor:
        COLORS.teal,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    /* =====================================================
       HEALTH CONTENT
    ====================================================== */

    healthSectionHeader: {
      marginBottom: 12,
    },

    healthLabelRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      marginBottom: 4,
    },

    healthLabel: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 1,
    },

    healthTitle: {
      color:
        COLORS.text,

      fontSize: 18,

      fontWeight: '800',

      letterSpacing: -0.2,
    },

    healthSubtitle: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 15,

      marginTop: 3,
    },

    healthFeedCard: {
      overflow: 'hidden',

      borderRadius: 22,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      marginBottom: 20,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.055,

      shadowRadius: 12,

      elevation: 2,
    },

    /* =====================================================
       SECURITY FOOTER
    ====================================================== */

    securityFooter: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 20,

      marginTop: 2,
    },

    securityFooterText: {
      color:
        COLORS.subtle,

      fontSize: 9,

      lineHeight: 14,

      textAlign: 'center',

      flexShrink: 1,
    },

    bottomSpace: {
      height: 12,
    },
  });

export default PatientHomeScreen;