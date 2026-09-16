/**
 * @file    MyAppointmentsScreen.js
 * @module  Patient
 * @desc    Premium mobile appointment-management screen.
 *          Displays upcoming and past visits with clear status,
 *          cancel confirmation, rescheduling, refresh, and booking.
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
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';

import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  XCircle,
} from 'lucide-react-native';

import {
  getPatientAppointments,
  updateAppointmentStatus,
} from '../services/appointment.service';

import useAuthStore from '../store/authStore';

/* =========================================================
   DESIGN TOKENS
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
  navySoft: '#EAF1F5',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  blue: '#3973A7',
  blueSoft: '#EEF5FB',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  success: '#2F855A',
  successSoft: '#EDF9F2',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    text: COLORS.blue,
    background: COLORS.blueSoft,
    icon: CalendarDays,
  },

  confirmed: {
    label: 'Confirmed',
    text: COLORS.tealDark,
    background: COLORS.tealSoft,
    icon: CheckCircle2,
  },

  in_progress: {
    label: 'In Progress',
    text: COLORS.amber,
    background: COLORS.amberSoft,
    icon: Clock3,
  },

  completed: {
    label: 'Completed',
    text: COLORS.success,
    background: COLORS.successSoft,
    icon: CheckCircle2,
  },

  cancelled: {
    label: 'Cancelled',
    text: COLORS.danger,
    background: COLORS.dangerSoft,
    icon: XCircle,
  },
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Converts a doctor's name into initials.
 *
 * @param {string} name
 * @returns {string}
 */
const getInitials = (
  name
) => {
  if (!name) {
    return 'DR';
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
 * Formats appointment date.
 *
 * @param {string} value
 * @returns {string}
 */
const formatDate = (
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

  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

/**
 * Formats appointment time.
 *
 * @param {string} value
 * @returns {string}
 */
const formatTime = (
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

  return date.toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Converts an appointment type into readable text.
 *
 * @param {string} value
 * @returns {string}
 */
const formatType = (
  value
) => {
  if (!value) {
    return 'Consultation';
  }

  return value
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
 * Resolves styling and label for an appointment status.
 *
 * @param {string} status
 * @returns {Object}
 */
const getStatusConfig = (
  status
) => {
  return (
    STATUS_CONFIG[
      status
    ] || {
      label:
        status ||
        'Unknown',

      text:
        COLORS.muted,

      background:
        '#F1F5F9',

      icon:
        Clock3,
    }
  );
};

/**
 * Determines whether the appointment belongs
 * in the upcoming section.
 *
 * @param {Object} appointment
 * @returns {boolean}
 */
const isUpcomingAppointment = (
  appointment
) => {
  return [
    'scheduled',
    'confirmed',
    'in_progress',
  ].includes(
    appointment
      ?.status
  );
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

/**
 * @component SummaryTile
 * @desc      Compact appointment metric.
 */
const SummaryTile = ({
  value,
  label,
  icon: Icon,
  iconColor,
  iconBackground,
}) => {
  return (
    <View style={styles.summaryTile}>

      <View
        style={[
          styles.summaryIcon,
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

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>

    </View>
  );
};

/**
 * @component StatusBadge
 * @desc      Appointment status badge with both
 *            icon and text for accessibility.
 */
const StatusBadge = ({
  status,
}) => {
  const config =
    getStatusConfig(
      status
    );

  const Icon =
    config.icon;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            config.background,
        },
      ]}
    >
      <Icon
        size={11}
        color={config.text}
        strokeWidth={2.3}
      />

      <Text
        style={[
          styles.statusText,
          {
            color:
              config.text,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

/* =========================================================
   APPOINTMENT CARD
========================================================= */

/**
 * @component AppointmentCard
 * @desc      Displays a single appointment and available actions.
 */
const AppointmentCard = ({
  appointment,
  onCancel,
  onReschedule,
  cancelling,
}) => {
  const isScheduled =
    appointment
      .status ===
    'scheduled';

  const isCancelled =
    appointment
      .status ===
    'cancelled';

  const doctorName =
    appointment
      .doctor_name ||
    'Care4U Doctor';

  return (
    <View
      style={[
        styles.appointmentCard,

        isCancelled &&
          styles.cancelledCard,
      ]}
    >

      {/* ===================================================
          DOCTOR
      ==================================================== */}

      <View style={styles.cardTop}>

        <View style={styles.doctorAvatar}>

          <Text style={styles.doctorInitials}>
            {getInitials(
              doctorName
            )}
          </Text>

        </View>

        <View style={styles.doctorContent}>

          <Text
            style={styles.doctorName}
            numberOfLines={1}
          >
            Dr. {doctorName}
          </Text>

          <Text
            style={styles.specialization}
            numberOfLines={1}
          >
            {
              appointment
                .doctor_specialization ||
              'Medical Consultation'
            }
          </Text>

        </View>

        <StatusBadge
          status={
            appointment.status
          }
        />

      </View>

      {/* ===================================================
          DATE / TIME
      ==================================================== */}

      <View style={styles.visitInfoCard}>

        <View style={styles.visitInfoRow}>

          <View style={styles.visitIcon}>

            <CalendarDays
              size={16}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.visitTextBlock}>

            <Text style={styles.visitLabel}>
              Date
            </Text>

            <Text style={styles.visitValue}>
              {formatDate(
                appointment
                  .scheduled_at
              )}
            </Text>

          </View>

        </View>

        <View style={styles.infoDivider} />

        <View style={styles.visitInfoRow}>

          <View style={styles.visitIcon}>

            <Clock3
              size={16}
              color={COLORS.blue}
            />

          </View>

          <View style={styles.visitTextBlock}>

            <Text style={styles.visitLabel}>
              Time
            </Text>

            <Text style={styles.visitValue}>
              {formatTime(
                appointment
                  .scheduled_at
              )}
            </Text>

          </View>

        </View>

      </View>

      {/* ===================================================
          TYPE
      ==================================================== */}

      <View style={styles.typeRow}>

        <View style={styles.typeLeft}>

          <Stethoscope
            size={15}
            color={COLORS.muted}
          />

          <Text style={styles.typeText}>
            {formatType(
              appointment.type
            )}
          </Text>

        </View>

        <Text style={styles.referenceText}>
          Care4U Visit
        </Text>

      </View>

      {/* ===================================================
          ACTIONS
      ==================================================== */}

      {isScheduled && (
        <View style={styles.actionRow}>

          <TouchableOpacity
            style={styles.rescheduleButton}
            activeOpacity={0.76}
            disabled={
              cancelling
            }
            onPress={() =>
              onReschedule(
                appointment
              )
            }
          >
            <RotateCcw
              size={16}
              color={COLORS.tealDark}
            />

            <Text style={styles.rescheduleText}>
              Reschedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,

              cancelling &&
                styles.disabledButton,
            ]}
            activeOpacity={0.76}
            disabled={
              cancelling
            }
            onPress={() =>
              onCancel(
                appointment.id
              )
            }
          >
            {cancelling ? (

              <ActivityIndicator
                size="small"
                color={COLORS.danger}
              />

            ) : (

              <XCircle
                size={16}
                color={COLORS.danger}
              />

            )}

            <Text style={styles.cancelText}>
              {cancelling
                ? 'Cancelling'
                : 'Cancel'}
            </Text>
          </TouchableOpacity>

        </View>
      )}

      {appointment
          .status ===
        'confirmed' && (
        <View style={styles.confirmedNotice}>

          <CheckCircle2
            size={15}
            color={COLORS.teal}
          />

          <Text style={styles.confirmedNoticeText}>
            Your appointment has been confirmed by the care team.
          </Text>

        </View>
      )}

      {appointment
          .status ===
        'in_progress' && (
        <View style={styles.progressNotice}>

          <Clock3
            size={15}
            color={COLORS.amber}
          />

          <Text style={styles.progressNoticeText}>
            Your consultation is currently in progress.
          </Text>

        </View>
      )}

    </View>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/**
 * @component MyAppointmentsScreen
 * @desc      Patient appointment-management screen.
 */
export default function MyAppointmentsScreen({
  navigate,
}) {
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
    appointments,
    setAppointments,
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
    error,
    setError,
  ] = useState('');

  const [
    selectedView,
    setSelectedView,
  ] = useState(
    'upcoming'
  );

  const [
    cancellingId,
    setCancellingId,
  ] = useState(null);

  /**
   * Loads patient appointments.
   */
  const fetchAppointments =
    useCallback(
      async ({
        background = false,
      } = {}) => {
        if (!patientId) {
          setLoading(false);

          setError(
            'Patient information is unavailable.'
          );

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

        setError('');

        try {
          const data =
            await getPatientAppointments(
              patientId
            );

          setAppointments(
            data ||
            []
          );

        } catch (
          requestError
        ) {
          console.error(
            'Appointment load error:',
            requestError
          );

          setError(
            'We could not load your appointments. Please try again.'
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
    fetchAppointments();
  }, [
    fetchAppointments,
  ]);

  /**
   * Handles appointment cancellation.
   */
  const handleCancel = (
    appointmentId
  ) => {
    Alert.alert(
      'Cancel appointment?',
      'This appointment will be marked as cancelled. You can book another visit later if needed.',
      [
        {
          text:
            'Keep appointment',

          style:
            'cancel',
        },

        {
          text:
            'Cancel appointment',

          style:
            'destructive',

          onPress:
            async () => {
              try {
                setCancellingId(
                  appointmentId
                );

                await updateAppointmentStatus(
                  appointmentId,
                  'cancelled'
                );

                setAppointments(
                  (
                    previous
                  ) =>
                    previous.map(
                      (
                        appointment
                      ) =>
                        appointment.id ===
                        appointmentId
                          ? {
                              ...appointment,
                              status:
                                'cancelled',
                            }
                          : appointment
                    )
                );

                Alert.alert(
                  'Appointment cancelled',
                  'Your appointment has been cancelled successfully.'
                );

              } catch (
                requestError
              ) {
                console.error(
                  'Appointment cancellation error:',
                  requestError
                );

                Alert.alert(
                  'Unable to cancel',
                  'We could not cancel this appointment. Please try again.'
                );

              } finally {
                setCancellingId(
                  null
                );
              }
            },
        },
      ]
    );
  };

  /**
   * Starts the existing appointment reschedule flow.
   */
  const handleReschedule = (
    appointment
  ) => {
    const doctorId =
      appointment
        .doctor_id ||
      appointment
        .doctorId ||
      appointment
        .doctor
        ?.id;

    if (!doctorId) {
      Alert.alert(
        'Unable to reschedule',
        'The doctor information for this appointment is unavailable.'
      );

      return;
    }

    navigate(
      'BookAppointment',
      {
        doctorId,
        rescheduleId:
          appointment.id,
      }
    );
  };

  /* =======================================================
     DERIVED APPOINTMENT DATA
  ======================================================= */

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            isUpcomingAppointment
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
          ),
      [
        appointments,
      ]
    );

  const pastAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (
              appointment
            ) =>
              !isUpcomingAppointment(
                appointment
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second
                  .scheduled_at
              ) -
              new Date(
                first
                  .scheduled_at
              )
          ),
      [
        appointments,
      ]
    );

  const completedCount =
    appointments.filter(
      (
        appointment
      ) =>
        appointment
          .status ===
        'completed'
    ).length;

  const displayedAppointments =
    selectedView ===
    'upcoming'
      ? upcomingAppointments
      : pastAppointments;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <CalendarDays
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Loading your visits
        </Text>

        <Text style={styles.loadingText}>
          Fetching your latest appointment information
        </Text>

      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    appointments.length ===
      0
  ) {
    return (
      <View style={styles.stateScreen}>

        <View style={styles.errorIcon}>

          <AlertCircle
            size={28}
            color={COLORS.danger}
          />

        </View>

        <Text style={styles.stateTitle}>
          Appointments unavailable
        </Text>

        <Text style={styles.stateText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.78}
          onPress={() =>
            fetchAppointments()
          }
        >
          <RefreshCw
            size={16}
            color="#FFFFFF"
          />

          <Text style={styles.retryText}>
            Try again
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  /* =======================================================
     MAIN CONTENT
  ======================================================= */

  return (
    <View style={styles.container}>

      <FlatList
        data={
          displayedAppointments
        }
        keyExtractor={(
          item
        ) =>
          item.id
        }
        renderItem={({
          item,
        }) => (
          <AppointmentCard
            appointment={
              item
            }
            cancelling={
              cancellingId ===
              item.id
            }
            onCancel={
              handleCancel
            }
            onReschedule={
              handleReschedule
            }
          />
        )}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              fetchAppointments({
                background:
                  true,
              })
            }
            tintColor={
              COLORS.teal
            }
            colors={[
              COLORS.teal,
            ]}
          />
        }
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={(
          <>
            {/* ===============================================
                INTRO
            ================================================ */}

            <View style={styles.introRow}>

              <View style={styles.introContent}>

                <Text style={styles.introEyebrow}>
                  YOUR CARE SCHEDULE
                </Text>

                <Text style={styles.introTitle}>
                  Visits
                </Text>

                <Text style={styles.introText}>
                  Review upcoming care, reschedule when needed, or look back at completed visits.
                </Text>

              </View>

              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.78}
                onPress={() =>
                  navigate(
                    'search'
                  )
                }
              >
                <CalendarPlus
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

            </View>

            {/* ===============================================
                SUMMARY
            ================================================ */}

            <View style={styles.summaryRow}>

              <SummaryTile
                icon={CalendarDays}
                value={
                  upcomingAppointments
                    .length
                }
                label="Upcoming"
                iconColor={
                  COLORS.teal
                }
                iconBackground={
                  COLORS.tealSoft
                }
              />

              <SummaryTile
                icon={CheckCircle2}
                value={
                  completedCount
                }
                label="Completed"
                iconColor={
                  COLORS.success
                }
                iconBackground={
                  COLORS.successSoft
                }
              />

              <SummaryTile
                icon={History}
                value={
                  pastAppointments
                    .length
                }
                label="History"
                iconColor={
                  COLORS.blue
                }
                iconBackground={
                  COLORS.blueSoft
                }
              />

            </View>

            {/* ===============================================
                FILTER
            ================================================ */}

            <View style={styles.segmentedControl}>

              <TouchableOpacity
                style={[
                  styles.segmentButton,

                  selectedView ===
                    'upcoming' &&
                    styles.segmentButtonActive,
                ]}
                activeOpacity={0.75}
                onPress={() =>
                  setSelectedView(
                    'upcoming'
                  )
                }
              >
                <CalendarDays
                  size={15}
                  color={
                    selectedView ===
                    'upcoming'
                      ? COLORS.tealDark
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.segmentText,

                    selectedView ===
                      'upcoming' &&
                      styles.segmentTextActive,
                  ]}
                >
                  Upcoming
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,

                  selectedView ===
                    'history' &&
                    styles.segmentButtonActive,
                ]}
                activeOpacity={0.75}
                onPress={() =>
                  setSelectedView(
                    'history'
                  )
                }
              >
                <History
                  size={15}
                  color={
                    selectedView ===
                    'history'
                      ? COLORS.tealDark
                      : COLORS.muted
                  }
                />

                <Text
                  style={[
                    styles.segmentText,

                    selectedView ===
                      'history' &&
                      styles.segmentTextActive,
                  ]}
                >
                  History
                </Text>
              </TouchableOpacity>

            </View>

            {error ? (
              <View style={styles.inlineWarning}>

                <AlertCircle
                  size={15}
                  color={COLORS.amber}
                />

                <Text style={styles.inlineWarningText}>
                  {error}
                </Text>

              </View>
            ) : null}

          </>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>

              {selectedView ===
              'upcoming' ? (
                <CalendarDays
                  size={27}
                  color={COLORS.teal}
                />
              ) : (
                <History
                  size={27}
                  color={COLORS.teal}
                />
              )}

            </View>

            <Text style={styles.emptyTitle}>
              {selectedView ===
              'upcoming'
                ? 'No upcoming visits'
                : 'No visit history yet'}
            </Text>

            <Text style={styles.emptyText}>
              {selectedView ===
              'upcoming'
                ? 'Your schedule is clear. Find a Care4U doctor whenever you need an appointment.'
                : 'Completed and cancelled appointments will appear here.'}
            </Text>

            {selectedView ===
            'upcoming' && (
              <TouchableOpacity
                style={styles.emptyAction}
                activeOpacity={0.78}
                onPress={() =>
                  navigate(
                    'search'
                  )
                }
              >
                <Search
                  size={16}
                  color="#FFFFFF"
                />

                <Text style={styles.emptyActionText}>
                  Find a doctor
                </Text>

                <ChevronRight
                  size={15}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

          </View>
        )}
        ListFooterComponent={
          displayedAppointments
            .length >
          0 ? (
            <TouchableOpacity
              style={styles.footerBookCard}
              activeOpacity={0.78}
              onPress={() =>
                navigate(
                  'search'
                )
              }
            >

              <View style={styles.footerBookIcon}>

                <CalendarPlus
                  size={20}
                  color={COLORS.teal}
                />

              </View>

              <View style={styles.footerBookContent}>

                <Text style={styles.footerBookTitle}>
                  Need another appointment?
                </Text>

                <Text style={styles.footerBookText}>
                  Find a doctor and choose an available time.
                </Text>

              </View>

              <ChevronRight
                size={18}
                color={COLORS.teal}
              />

            </TouchableOpacity>
          ) : (
            <View style={styles.bottomSpacer} />
          )
        }
      />

    </View>
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

    listContent: {
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 26,
    },

    /* =====================================================
       INTRO
    ====================================================== */

    introRow: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      marginBottom: 20,
    },

    introContent: {
      flex: 1,

      paddingRight: 15,
    },

    introEyebrow: {
      color:
        COLORS.teal,

      fontSize: 9,

      fontWeight: '800',

      letterSpacing: 1,
    },

    introTitle: {
      color:
        COLORS.text,

      fontSize: 27,

      lineHeight: 33,

      fontWeight: '800',

      letterSpacing: -0.6,

      marginTop: 3,
    },

    introText: {
      color:
        COLORS.muted,

      fontSize: 11,

      lineHeight: 17,

      marginTop: 5,

      maxWidth: 280,
    },

    bookButton: {
      width: 46,
      height: 46,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,

      shadowColor:
        COLORS.teal,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.18,

      shadowRadius: 10,

      elevation: 4,
    },

    /* =====================================================
       SUMMARY
    ====================================================== */

    summaryRow: {
      flexDirection: 'row',

      gap: 9,

      marginBottom: 18,
    },

    summaryTile: {
      flex: 1,

      minHeight: 112,

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

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

    summaryIcon: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 10,
    },

    summaryValue: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight: '800',
    },

    summaryLabel: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '600',

      marginTop: 2,
    },

    /* =====================================================
       SEGMENTED CONTROL
    ====================================================== */

    segmentedControl: {
      flexDirection: 'row',

      backgroundColor:
        '#EDF1F3',

      borderRadius: 16,

      padding: 4,

      marginBottom: 16,
    },

    segmentButton: {
      flex: 1,

      minHeight: 42,

      borderRadius: 12,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,
    },

    segmentButtonActive: {
      backgroundColor:
        COLORS.surface,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.06,

      shadowRadius: 5,

      elevation: 2,
    },

    segmentText: {
      color:
        COLORS.muted,

      fontSize: 11,

      fontWeight: '700',
    },

    segmentTextActive: {
      color:
        COLORS.tealDark,
    },

    /* =====================================================
       APPOINTMENT CARD
    ====================================================== */

    appointmentCard: {
      backgroundColor:
        COLORS.surface,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 16,

      marginBottom: 12,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.045,

      shadowRadius: 10,

      elevation: 2,
    },

    cancelledCard: {
      opacity: 0.72,
    },

    cardTop: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    doctorAvatar: {
      width: 47,
      height: 47,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navy,
    },

    doctorInitials: {
      color:
        '#FFFFFF',

      fontSize: 13,

      fontWeight: '800',
    },

    doctorContent: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,

      marginRight: 7,
    },

    doctorName: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',
    },

    specialization: {
      color:
        COLORS.muted,

      fontSize: 10,

      marginTop: 3,
    },

    statusBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 99,
    },

    statusText: {
      fontSize: 8,

      fontWeight: '800',
    },

    /* =====================================================
       VISIT INFORMATION
    ====================================================== */

    visitInfoCard: {
      flexDirection: 'row',

      backgroundColor:
        COLORS.background,

      borderRadius: 16,

      padding: 12,

      marginTop: 15,
    },

    visitInfoRow: {
      flex: 1,

      flexDirection: 'row',

      alignItems: 'center',
    },

    visitIcon: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,
    },

    visitTextBlock: {
      flex: 1,

      marginLeft: 8,
    },

    visitLabel: {
      color:
        COLORS.subtle,

      fontSize: 8,

      fontWeight: '700',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    visitValue: {
      color:
        COLORS.textSoft,

      fontSize: 10,

      fontWeight: '700',

      marginTop: 2,
    },

    infoDivider: {
      width: 1,

      backgroundColor:
        COLORS.border,

      marginHorizontal: 8,
    },

    typeRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingTop: 13,

      marginTop: 2,
    },

    typeLeft: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,
    },

    typeText: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight: '600',
    },

    referenceText: {
      color:
        COLORS.subtle,

      fontSize: 9,

      fontWeight: '600',
    },

    /* =====================================================
       ACTIONS
    ====================================================== */

    actionRow: {
      flexDirection: 'row',

      gap: 9,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      marginTop: 14,

      paddingTop: 14,
    },

    rescheduleButton: {
      flex: 1,

      minHeight: 43,

      borderRadius: 13,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      backgroundColor:
        COLORS.tealSoft,

      borderWidth: 1,

      borderColor:
        '#C8EAE7',
    },

    rescheduleText: {
      color:
        COLORS.tealDark,

      fontSize: 11,

      fontWeight: '800',
    },

    cancelButton: {
      flex: 1,

      minHeight: 43,

      borderRadius: 13,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      backgroundColor:
        COLORS.dangerSoft,

      borderWidth: 1,

      borderColor:
        '#F2D4D4',
    },

    cancelText: {
      color:
        COLORS.danger,

      fontSize: 11,

      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.6,
    },

    confirmedNotice: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      backgroundColor:
        COLORS.tealSoft,

      borderRadius: 12,

      paddingHorizontal: 11,

      paddingVertical: 9,

      marginTop: 13,
    },

    confirmedNoticeText: {
      flex: 1,

      color:
        COLORS.tealDark,

      fontSize: 9,

      lineHeight: 14,

      fontWeight: '600',
    },

    progressNotice: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      backgroundColor:
        COLORS.amberSoft,

      borderRadius: 12,

      paddingHorizontal: 11,

      paddingVertical: 9,

      marginTop: 13,
    },

    progressNoticeText: {
      flex: 1,

      color:
        '#815719',

      fontSize: 9,

      lineHeight: 14,

      fontWeight: '600',
    },

    /* =====================================================
       EMPTY / ERROR / LOADING
    ====================================================== */

    loadingScreen: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      paddingHorizontal: 28,
    },

    loadingIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 16,
    },

    loadingTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: '800',

      marginTop: 13,
    },

    loadingText: {
      color:
        COLORS.muted,

      fontSize: 11,

      textAlign: 'center',

      marginTop: 5,
    },

    stateScreen: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      paddingHorizontal: 28,
    },

    errorIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.dangerSoft,

      marginBottom: 15,
    },

    stateTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '800',

      textAlign: 'center',
    },

    stateText: {
      color:
        COLORS.muted,

      fontSize: 11,

      lineHeight: 17,

      textAlign: 'center',

      marginTop: 6,

      maxWidth: 280,
    },

    retryButton: {
      minHeight: 43,

      paddingHorizontal: 17,

      borderRadius: 13,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      backgroundColor:
        COLORS.teal,

      marginTop: 18,
    },

    retryText: {
      color:
        '#FFFFFF',

      fontSize: 11,

      fontWeight: '800',
    },

    emptyCard: {
      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      paddingHorizontal: 25,

      paddingVertical: 35,

      marginTop: 2,
    },

    emptyIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 14,
    },

    emptyTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: '800',

      textAlign: 'center',
    },

    emptyText: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      textAlign: 'center',

      marginTop: 6,

      maxWidth: 280,
    },

    emptyAction: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      backgroundColor:
        COLORS.teal,

      borderRadius: 13,

      paddingHorizontal: 14,

      paddingVertical: 11,

      marginTop: 17,
    },

    emptyActionText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '800',
    },

    inlineWarning: {
      flexDirection: 'row',

      alignItems: 'flex-start',

      gap: 7,

      backgroundColor:
        COLORS.amberSoft,

      borderRadius: 12,

      padding: 10,

      marginBottom: 12,
    },

    inlineWarningText: {
      flex: 1,

      color:
        '#815719',

      fontSize: 9,

      lineHeight: 14,

      fontWeight: '600',
    },

    /* =====================================================
       FOOTER BOOKING CTA
    ====================================================== */

    footerBookCard: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      padding: 13,

      marginTop: 5,

      marginBottom: 6,
    },

    footerBookIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginRight: 11,
    },

    footerBookContent: {
      flex: 1,

      paddingRight: 8,
    },

    footerBookTitle: {
      color:
        COLORS.text,

      fontSize: 11,

      fontWeight: '800',
    },

    footerBookText: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 2,
    },

    bottomSpacer: {
      height: 10,
    },
  });