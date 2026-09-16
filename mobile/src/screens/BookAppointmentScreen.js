/**
 * @file    BookAppointmentScreen.js
 * @module  Patient
 * @desc    Premium mobile appointment booking and rescheduling screen.
 *          Displays doctor details, groups available slots by date,
 *          allows slot selection, optional visit notes, and confirmation.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import {
  AlertCircle,
  BriefcaseMedical,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';

import {
  getDoctorProfile,
  getAvailableSlots,
} from '../services/doctor.service';

import {
  bookAppointment,
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
  navyLight: '#1B4965',
  navySoft: '#EAF1F5',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  blue: '#3973A7',
  blueSoft: '#EEF5FB',

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
 * Returns doctor initials.
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
 * Returns an internal date key for grouping slots.
 *
 * @param {string} isoString
 * @returns {string}
 */
const getDateKey = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toDateString();
};

/**
 * Formats a slot date for the date-selection card.
 *
 * @param {string} isoString
 * @returns {Object}
 */
const formatDateCard = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      weekday: '—',
      day: '—',
      month: '—',
    };
  }

  return {
    weekday:
      date.toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
        }
      ),

    day:
      date.toLocaleDateString(
        'en-US',
        {
          day: 'numeric',
        }
      ),

    month:
      date.toLocaleDateString(
        'en-US',
        {
          month: 'short',
        }
      ),
  };
};

/**
 * Formats a slot time.
 *
 * @param {string} isoString
 * @returns {string}
 */
const formatTime = (
  isoString
) => {
  const date =
    new Date(
      isoString
    );

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
 * Formats a selected slot for the summary.
 *
 * @param {string} isoString
 * @returns {string}
 */
const formatFullSlot = (
  isoString
) => {
  if (!isoString) {
    return 'No time selected';
  }

  const date =
    new Date(
      isoString
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Invalid appointment time';
  }

  return date.toLocaleString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Formats doctor experience.
 *
 * @param {number|string} value
 * @returns {string}
 */
const formatExperience = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'Experience not listed';
  }

  const years =
    Number(value);

  return `${value} ${
    years === 1
      ? 'year'
      : 'years'
  } experience`;
};

/* =========================================================
   DOCTOR PHOTO
========================================================= */

/**
 * @component DoctorPhoto
 * @desc      Large circular doctor portrait with initials fallback.
 */
const DoctorPhoto = ({
  doctor,
}) => {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const doctorName =
    doctor?.full_name ||
    'Care4U Doctor';

  useEffect(() => {
    setImageFailed(
      false
    );
  }, [
    doctor?.photo_url,
  ]);

  return (
    <View style={styles.photoOuter}>

      <View style={styles.photoInner}>

        {doctor?.photo_url &&
        !imageFailed ? (

          <Image
            source={{
              uri:
                doctor.photo_url,
            }}
            style={styles.doctorPhoto}
            resizeMode="cover"
            onError={() =>
              setImageFailed(
                true
              )
            }
            accessibilityLabel={`Doctor ${doctorName} profile photo`}
          />

        ) : (

          <View style={styles.photoFallback}>

            <UserRound
              size={33}
              color="rgba(255,255,255,0.72)"
              strokeWidth={1.7}
            />

            <Text style={styles.photoInitials}>
              {getInitials(
                doctorName
              )}
            </Text>

          </View>

        )}

      </View>

    </View>
  );
};

/* =========================================================
   SECTION HEADER
========================================================= */

/**
 * @component SectionHeader
 * @desc      Consistent booking-screen section title.
 */
const SectionHeader = ({
  step,
  title,
  description,
}) => {
  return (
    <View style={styles.sectionHeader}>

      <View style={styles.stepBadge}>

        <Text style={styles.stepBadgeText}>
          {step}
        </Text>

      </View>

      <View style={styles.sectionHeaderContent}>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        {description ? (
          <Text style={styles.sectionDescription}>
            {description}
          </Text>
        ) : null}

      </View>

    </View>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/**
 * @component BookAppointmentScreen
 * @desc      Creates a new patient appointment or reschedules
 *            an existing appointment.
 */
export default function BookAppointmentScreen({
  doctorId,
  rescheduleId,
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
    doctor,
    setDoctor,
  ] = useState(null);

  const [
    slots,
    setSlots,
  ] = useState([]);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [
    selectedSlot,
    setSelectedSlot,
  ] = useState(null);

  const [
    reason,
    setReason,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isBooking,
    setIsBooking,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  /* =======================================================
     LOAD DOCTOR + AVAILABILITY
  ======================================================= */

  useEffect(() => {
    if (!doctorId) {
      Alert.alert(
        'Doctor unavailable',
        'A valid doctor was not selected.',
        [
          {
            text: 'Return',
            onPress: () =>
              navigate(
                rescheduleId
                  ? 'appointments'
                  : 'search'
              ),
          },
        ]
      );

      return;
    }

    const fetchBookingData =
      async () => {
        setIsLoading(
          true
        );

        setLoadError(
          ''
        );

        try {
          const [
            doctorData,
            slotsData,
          ] =
            await Promise.all([
              getDoctorProfile(
                doctorId
              ),

              getAvailableSlots(
                doctorId
              ),
            ]);

          setDoctor(
            doctorData
          );

          const availableSlots =
            slotsData ||
            [];

          setSlots(
            availableSlots
          );

          if (
            availableSlots.length >
            0
          ) {
            setSelectedDate(
              getDateKey(
                availableSlots[0]
              )
            );
          }

        } catch (
          error
        ) {
          console.error(
            'Mobile booking data error:',
            error
          );

          setLoadError(
            error
              ?.response
              ?.data
              ?.message ||
            'We could not load this doctor’s appointment information.'
          );

        } finally {
          setIsLoading(
            false
          );
        }
      };

    fetchBookingData();

  }, [
    doctorId,
    navigate,
    rescheduleId,
  ]);

  /* =======================================================
     SLOT GROUPING
  ======================================================= */

  const slotGroups =
    useMemo(
      () => {
        const groups =
          {};

        slots.forEach(
          (
            slot
          ) => {
            const key =
              getDateKey(
                slot
              );

            if (!key) {
              return;
            }

            if (
              !groups[key]
            ) {
              groups[key] =
                [];
            }

            groups[
              key
            ].push(
              slot
            );
          }
        );

        return groups;
      },
      [
        slots,
      ]
    );

  const availableDates =
    useMemo(
      () =>
        Object.keys(
          slotGroups
        ),
      [
        slotGroups,
      ]
    );

  const visibleSlots =
    selectedDate
      ? (
          slotGroups[
            selectedDate
          ] ||
          []
        )
      : [];

  /* =======================================================
     BOOK / RESCHEDULE
  ======================================================= */

  const handleBookAppointment =
    async () => {
      if (!patientId) {
        Alert.alert(
          'Unable to book',
          'Your patient account information is unavailable. Please sign in again.'
        );

        return;
      }

      if (!selectedSlot) {
        Alert.alert(
          'Select a time',
          'Please choose an available appointment time before continuing.'
        );

        return;
      }

      setIsBooking(
        true
      );

      try {
        /**
         * Book the replacement/new appointment first.
         * This prevents the patient's original appointment
         * from being lost if the new slot cannot be booked.
         */
        await bookAppointment({
          doctorId,
          patientId,
          scheduledAt:
            selectedSlot,
          type:
            'opd',
          notes:
            reason.trim() ||
            'Regular checkup',
        });

        /**
         * Once the new booking succeeds, cancel the
         * previous appointment during rescheduling.
         */
        if (
          rescheduleId
        ) {
          try {
            await updateAppointmentStatus(
              rescheduleId,
              'cancelled'
            );

          } catch (
            cancelError
          ) {
            console.error(
              'Failed to cancel previous appointment:',
              cancelError
            );
          }
        }

        Alert.alert(
          rescheduleId
            ? 'Appointment rescheduled'
            : 'Appointment booked',
          rescheduleId
            ? 'Your new appointment has been booked successfully.'
            : 'Your appointment has been booked successfully.',
          [
            {
              text: 'View appointments',

              onPress: () =>
                navigate(
                  'appointments'
                ),
            },
          ]
        );

      } catch (
        error
      ) {
        console.error(
          'Appointment booking error:',
          error
        );

        Alert.alert(
          'Booking failed',
          error
            ?.response
            ?.data
            ?.message ||
          'We could not book this appointment. Please try another available time.'
        );

      } finally {
        setIsBooking(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <CalendarPlus
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Preparing your appointment
        </Text>

        <Text style={styles.loadingText}>
          Checking the doctor's latest available times
        </Text>

      </View>
    );
  }

  /* =======================================================
     LOAD ERROR
  ======================================================= */

  if (
    loadError ||
    !doctor
  ) {
    return (
      <View style={styles.errorScreen}>

        <View style={styles.errorIcon}>

          <AlertCircle
            size={28}
            color={COLORS.danger}
          />

        </View>

        <Text style={styles.errorTitle}>
          Booking unavailable
        </Text>

        <Text style={styles.errorText}>
          {loadError ||
            'The selected doctor could not be found.'}
        </Text>

        <TouchableOpacity
          style={styles.returnButton}
          activeOpacity={0.78}
          onPress={() =>
            navigate(
              rescheduleId
                ? 'appointments'
                : 'search'
            )
          }
        >
          <Text style={styles.returnButtonText}>
            {rescheduleId
              ? 'Return to appointments'
              : 'Find another doctor'}
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  /* =======================================================
     MAIN VIEW
  ======================================================= */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.scrollContent
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >

      {/* =====================================================
          RESCHEDULE NOTICE
      ====================================================== */}

      {rescheduleId ? (
        <View style={styles.rescheduleNotice}>

          <View style={styles.rescheduleNoticeIcon}>

            <RotateCcw
              size={18}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.rescheduleNoticeContent}>

            <Text style={styles.rescheduleNoticeTitle}>
              Rescheduling appointment
            </Text>

            <Text style={styles.rescheduleNoticeText}>
              Choose a new available time. Your previous appointment will be cancelled after the new booking succeeds.
            </Text>

          </View>

        </View>
      ) : null}

      {/* =====================================================
          DOCTOR PROFILE CARD
      ====================================================== */}

      <View style={styles.doctorCard}>

        <View style={styles.doctorHero}>

          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />

        </View>

        <View style={styles.photoPosition}>

          <DoctorPhoto
            doctor={
              doctor
            }
          />

        </View>

        <View style={styles.doctorContent}>

          <Text style={styles.networkLabel}>
            CARE4U MEDICAL NETWORK
          </Text>

          <Text style={styles.doctorName}>
            Dr. {
              doctor.full_name ||
              'Care4U Doctor'
            }
          </Text>

          <View style={styles.specialtyPill}>

            <Stethoscope
              size={13}
              color={COLORS.tealDark}
            />

            <Text style={styles.specialtyText}>
              {doctor.specialization ||
                'General Physician'}
            </Text>

          </View>

          <View style={styles.doctorMetaGrid}>

            <View style={styles.doctorMetaCard}>

              <View style={styles.doctorMetaIcon}>

                <Building2
                  size={16}
                  color={COLORS.blue}
                />

              </View>

              <View style={styles.doctorMetaContent}>

                <Text style={styles.doctorMetaLabel}>
                  Hospital
                </Text>

                <Text
                  style={styles.doctorMetaValue}
                  numberOfLines={2}
                >
                  {doctor.hospital_name ||
                    'Care4U Network'}
                </Text>

              </View>

            </View>

            <View style={styles.doctorMetaCard}>

              <View style={styles.doctorMetaIcon}>

                <BriefcaseMedical
                  size={16}
                  color={COLORS.teal}
                />

              </View>

              <View style={styles.doctorMetaContent}>

                <Text style={styles.doctorMetaLabel}>
                  Experience
                </Text>

                <Text
                  style={styles.doctorMetaValue}
                  numberOfLines={2}
                >
                  {formatExperience(
                    doctor
                      .years_experience
                  )}
                </Text>

              </View>

            </View>

          </View>

        </View>

      </View>

      {/* =====================================================
          STEP 1 — DATE
      ====================================================== */}

      <View style={styles.bookingSection}>

        <SectionHeader
          step="1"
          title={
            rescheduleId
              ? 'Choose a new date'
              : 'Choose your date'
          }
          description="Select one of the doctor's available appointment days."
        />

        {availableDates.length ===
        0 ? (

          <View style={styles.noSlotsCard}>

            <View style={styles.noSlotsIcon}>

              <CalendarDays
                size={24}
                color={COLORS.amber}
              />

            </View>

            <Text style={styles.noSlotsTitle}>
              No appointment times available
            </Text>

            <Text style={styles.noSlotsText}>
              This doctor does not currently have any open slots. You can return to Doctor Search and choose another doctor.
            </Text>

            <TouchableOpacity
              style={styles.findDoctorButton}
              activeOpacity={0.78}
              onPress={() =>
                navigate(
                  'search'
                )
              }
            >
              <Stethoscope
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.findDoctorButtonText}>
                Find another doctor
              </Text>
            </TouchableOpacity>

          </View>

        ) : (

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.dateList
            }
          >

            {availableDates.map(
              (
                dateKey
              ) => {
                const firstSlot =
                  slotGroups[
                    dateKey
                  ][0];

                const date =
                  formatDateCard(
                    firstSlot
                  );

                const selected =
                  selectedDate ===
                  dateKey;

                return (
                  <TouchableOpacity
                    key={
                      dateKey
                    }
                    activeOpacity={0.78}
                    style={[
                      styles.dateCard,

                      selected &&
                        styles.dateCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedDate(
                        dateKey
                      );

                      setSelectedSlot(
                        null
                      );
                    }}
                  >

                    <Text
                      style={[
                        styles.dateWeekday,

                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {date.weekday}
                    </Text>

                    <Text
                      style={[
                        styles.dateDay,

                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {date.day}
                    </Text>

                    <Text
                      style={[
                        styles.dateMonth,

                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {date.month}
                    </Text>

                    <View
                      style={[
                        styles.slotCountBadge,

                        selected &&
                          styles.slotCountBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotCountText,

                          selected &&
                            styles.slotCountTextSelected,
                        ]}
                      >
                        {
                          slotGroups[
                            dateKey
                          ].length
                        }{' '}
                        {
                          slotGroups[
                            dateKey
                          ].length ===
                          1
                            ? 'slot'
                            : 'slots'
                        }
                      </Text>
                    </View>

                  </TouchableOpacity>
                );
              }
            )}

          </ScrollView>

        )}

      </View>

      {/* =====================================================
          STEP 2 — TIME
      ====================================================== */}

      {availableDates.length >
        0 && (
        <View style={styles.bookingSection}>

          <SectionHeader
            step="2"
            title="Choose a time"
            description="Available times for your selected date."
          />

          <View style={styles.timeGrid}>

            {visibleSlots.map(
              (
                slot
              ) => {
                const selected =
                  selectedSlot ===
                  slot;

                return (
                  <TouchableOpacity
                    key={
                      slot
                    }
                    activeOpacity={0.76}
                    style={[
                      styles.timeButton,

                      selected &&
                        styles.timeButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedSlot(
                        slot
                      )
                    }
                  >

                    <Clock3
                      size={16}
                      color={
                        selected
                          ? '#FFFFFF'
                          : COLORS.teal
                      }
                    />

                    <Text
                      style={[
                        styles.timeButtonText,

                        selected &&
                          styles.timeButtonTextSelected,
                      ]}
                    >
                      {formatTime(
                        slot
                      )}
                    </Text>

                    {selected ? (
                      <View style={styles.timeSelectedCheck}>

                        <Check
                          size={11}
                          color={COLORS.teal}
                          strokeWidth={3}
                        />

                      </View>
                    ) : null}

                  </TouchableOpacity>
                );
              }
            )}

          </View>

        </View>
      )}

      {/* =====================================================
          STEP 3 — REASON
      ====================================================== */}

      {availableDates.length >
        0 && (
        <View style={styles.bookingSection}>

          <SectionHeader
            step="3"
            title="Reason for visit"
            description="Optional. This helps the doctor understand what you need before the consultation."
          />

          <View style={styles.reasonInputShell}>

            <FileText
              size={18}
              color={COLORS.subtle}
            />

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Regular checkup, fever, follow-up..."
              placeholderTextColor={
                COLORS.subtle
              }
              value={
                reason
              }
              onChangeText={
                setReason
              }
              editable={
                slots.length >
                0
              }
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

          </View>

          <Text style={styles.characterCount}>
            {reason.length}/500
          </Text>

        </View>
      )}

      {/* =====================================================
          APPOINTMENT SUMMARY
      ====================================================== */}

      {selectedSlot ? (
        <View style={styles.summaryCard}>

          <View style={styles.summaryTop}>

            <View style={styles.summaryIcon}>

              <CalendarCheck2
                size={21}
                color={COLORS.teal}
              />

            </View>

            <View style={styles.summaryHeading}>

              <Text style={styles.summaryEyebrow}>
                APPOINTMENT SUMMARY
              </Text>

              <Text style={styles.summaryTitle}>
                Ready to confirm
              </Text>

            </View>

            <CheckCircle2
              size={22}
              color={COLORS.success}
            />

          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>

            <Stethoscope
              size={16}
              color={COLORS.muted}
            />

            <View style={styles.summaryItemContent}>

              <Text style={styles.summaryItemLabel}>
                Doctor
              </Text>

              <Text style={styles.summaryItemValue}>
                Dr. {
                  doctor.full_name
                }
              </Text>

            </View>

          </View>

          <View style={styles.summaryItem}>

            <CalendarDays
              size={16}
              color={COLORS.muted}
            />

            <View style={styles.summaryItemContent}>

              <Text style={styles.summaryItemLabel}>
                Appointment
              </Text>

              <Text style={styles.summaryItemValue}>
                {formatFullSlot(
                  selectedSlot
                )}
              </Text>

            </View>

          </View>

          <View style={styles.summaryItem}>

            <FileText
              size={16}
              color={COLORS.muted}
            />

            <View style={styles.summaryItemContent}>

              <Text style={styles.summaryItemLabel}>
                Visit type
              </Text>

              <Text style={styles.summaryItemValue}>
                OPD Consultation
              </Text>

            </View>

          </View>

        </View>
      ) : null}

      {/* =====================================================
          CONFIRM BUTTON
      ====================================================== */}

      {availableDates.length >
        0 && (
        <TouchableOpacity
          activeOpacity={0.82}
          style={[
            styles.confirmButton,

            !selectedSlot &&
              styles.confirmButtonDisabled,
          ]}
          disabled={
            !selectedSlot ||
            isBooking
          }
          onPress={
            handleBookAppointment
          }
        >

          {isBooking ? (

            <>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text style={styles.confirmButtonText}>
                {rescheduleId
                  ? 'Rescheduling...'
                  : 'Booking...'}
              </Text>
            </>

          ) : (

            <>
              {rescheduleId ? (
                <RotateCcw
                  size={18}
                  color="#FFFFFF"
                />
              ) : (
                <CalendarPlus
                  size={18}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.confirmButtonText}>
                {rescheduleId
                  ? 'Confirm Reschedule'
                  : 'Confirm Appointment'}
              </Text>
            </>

          )}

        </TouchableOpacity>
      )}

      {/* =====================================================
          SECURITY / BOOKING NOTE
      ====================================================== */}

      <View style={styles.securityNote}>

        <ShieldCheck
          size={14}
          color={COLORS.subtle}
        />

        <Text style={styles.securityNoteText}>
          Appointment availability is checked against the doctor's Care4U schedule before booking.
        </Text>

      </View>

      <View style={styles.bottomSpace} />

    </ScrollView>
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

    scrollContent: {
      paddingHorizontal: 18,

      paddingTop: 18,

      paddingBottom: 28,
    },

    /* =====================================================
       LOADING
    ====================================================== */

    loadingScreen: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 28,
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

      marginBottom: 17,
    },

    loadingTitle: {
      color:
        COLORS.text,

      fontSize: 17,

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

    /* =====================================================
       ERROR
    ====================================================== */

    errorScreen: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 30,
    },

    errorIcon: {
      width: 60,
      height: 60,

      borderRadius: 19,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.dangerSoft,

      marginBottom: 15,
    },

    errorTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '800',

      textAlign: 'center',
    },

    errorText: {
      color:
        COLORS.muted,

      fontSize: 11,

      lineHeight: 17,

      textAlign: 'center',

      maxWidth: 285,

      marginTop: 6,
    },

    returnButton: {
      minHeight: 43,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,

      borderRadius: 13,

      paddingHorizontal: 17,

      marginTop: 18,
    },

    returnButtonText: {
      color:
        '#FFFFFF',

      fontSize: 11,

      fontWeight: '800',
    },

    /* =====================================================
       RESCHEDULE NOTICE
    ====================================================== */

    rescheduleNotice: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      backgroundColor:
        COLORS.tealSoft,

      borderWidth: 1,

      borderColor:
        '#C9E9E6',

      borderRadius: 17,

      padding: 13,

      marginBottom: 16,
    },

    rescheduleNoticeIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      backgroundColor:
        COLORS.surface,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 10,
    },

    rescheduleNoticeContent: {
      flex: 1,
    },

    rescheduleNoticeTitle: {
      color:
        COLORS.tealDark,

      fontSize: 11,

      fontWeight: '800',
    },

    rescheduleNoticeText: {
      color:
        COLORS.tealDark,

      opacity: 0.78,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 3,
    },

    /* =====================================================
       DOCTOR CARD
    ====================================================== */

    doctorCard: {
      overflow: 'hidden',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 27,

      marginBottom: 25,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 7,
      },

      shadowOpacity: 0.08,

      shadowRadius: 16,

      elevation: 4,
    },

    doctorHero: {
      position: 'relative',

      height: 115,

      overflow: 'hidden',

      backgroundColor:
        COLORS.navy,
    },

    heroCircleLarge: {
      position: 'absolute',

      width: 180,
      height: 180,

      borderRadius: 90,

      right: -65,
      top: -88,

      backgroundColor:
        'rgba(15,139,131,0.42)',
    },

    heroCircleSmall: {
      position: 'absolute',

      width: 82,
      height: 82,

      borderRadius: 41,

      left: 20,
      top: -37,

      backgroundColor:
        'rgba(255,255,255,0.06)',

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.12)',
    },

    photoPosition: {
      position: 'absolute',

      zIndex: 4,

      top: 48,

      left: 0,
      right: 0,

      alignItems: 'center',
    },

    photoOuter: {
      width: 136,
      height: 136,

      borderRadius: 68,

      padding: 5,

      backgroundColor:
        COLORS.surface,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 9,
      },

      shadowOpacity: 0.18,

      shadowRadius: 18,

      elevation: 7,
    },

    photoInner: {
      flex: 1,

      overflow: 'hidden',

      borderRadius: 63,

      backgroundColor:
        COLORS.navy,
    },

    doctorPhoto: {
      width: '100%',
      height: '100%',
    },

    photoFallback: {
      flex: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navy,
    },

    photoInitials: {
      color:
        '#FFFFFF',

      fontSize: 20,

      fontWeight: '800',

      marginTop: 4,
    },

    doctorContent: {
      paddingHorizontal: 16,

      paddingTop: 77,

      paddingBottom: 16,

      alignItems: 'center',
    },

    networkLabel: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 1.1,
    },

    doctorName: {
      color:
        COLORS.text,

      fontSize: 20,

      lineHeight: 25,

      fontWeight: '800',

      textAlign: 'center',

      marginTop: 5,
    },

    specialtyPill: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      backgroundColor:
        COLORS.tealSoft,

      paddingHorizontal: 11,

      paddingVertical: 6,

      borderRadius: 99,

      marginTop: 10,
    },

    specialtyText: {
      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    doctorMetaGrid: {
      width: '100%',

      flexDirection: 'row',

      gap: 9,

      marginTop: 17,
    },

    doctorMetaCard: {
      flex: 1,

      minHeight: 74,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.background,

      borderRadius: 15,

      padding: 10,
    },

    doctorMetaIcon: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      marginRight: 8,
    },

    doctorMetaContent: {
      flex: 1,

      minWidth: 0,
    },

    doctorMetaLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '700',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    doctorMetaValue: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      lineHeight: 13,

      fontWeight: '700',

      marginTop: 2,
    },

    /* =====================================================
       BOOKING SECTIONS
    ====================================================== */

    bookingSection: {
      marginBottom: 25,
    },

    sectionHeader: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      marginBottom: 13,
    },

    stepBadge: {
      width: 30,
      height: 30,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,

      marginRight: 10,
    },

    stepBadgeText: {
      color:
        '#FFFFFF',

      fontSize: 11,

      fontWeight: '800',
    },

    sectionHeaderContent: {
      flex: 1,
    },

    sectionTitle: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight: '800',
    },

    sectionDescription: {
      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,

      marginTop: 2,
    },

    /* =====================================================
       DATE SELECTION
    ====================================================== */

    dateList: {
      paddingRight: 10,

      gap: 9,
    },

    dateCard: {
      width: 82,
      minHeight: 112,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      paddingVertical: 10,

      paddingHorizontal: 7,
    },

    dateCardSelected: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,

      shadowColor:
        COLORS.navy,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.16,

      shadowRadius: 10,

      elevation: 4,
    },

    dateWeekday: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '700',

      textTransform:
        'uppercase',
    },

    dateDay: {
      color:
        COLORS.text,

      fontSize: 24,

      fontWeight: '800',

      marginVertical: 1,
    },

    dateMonth: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight: '600',
    },

    dateTextSelected: {
      color:
        '#FFFFFF',
    },

    slotCountBadge: {
      backgroundColor:
        COLORS.tealSoft,

      borderRadius: 99,

      paddingHorizontal: 6,

      paddingVertical: 3,

      marginTop: 7,
    },

    slotCountBadgeSelected: {
      backgroundColor:
        'rgba(255,255,255,0.12)',
    },

    slotCountText: {
      color:
        COLORS.tealDark,

      fontSize: 7,

      fontWeight: '800',
    },

    slotCountTextSelected: {
      color:
        '#D9F5F2',
    },

    /* =====================================================
       TIME SELECTION
    ====================================================== */

    timeGrid: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 9,
    },

    timeButton: {
      position: 'relative',

      width: '48%',

      minHeight: 47,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 7,

      paddingHorizontal: 9,
    },

    timeButtonSelected: {
      backgroundColor:
        COLORS.teal,

      borderColor:
        COLORS.teal,

      shadowColor:
        COLORS.teal,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.16,

      shadowRadius: 8,

      elevation: 3,
    },

    timeButtonText: {
      color:
        COLORS.textSoft,

      fontSize: 11,

      fontWeight: '700',
    },

    timeButtonTextSelected: {
      color:
        '#FFFFFF',
    },

    timeSelectedCheck: {
      position: 'absolute',

      right: 6,
      top: 6,

      width: 18,
      height: 18,

      borderRadius: 9,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',
    },

    /* =====================================================
       REASON
    ====================================================== */

    reasonInputShell: {
      minHeight: 110,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 17,

      padding: 13,
    },

    reasonInput: {
      flex: 1,

      minHeight: 82,

      color:
        COLORS.text,

      fontSize: 12,

      lineHeight: 18,

      paddingHorizontal: 10,

      paddingTop: 0,

      paddingBottom: 0,
    },

    characterCount: {
      color:
        COLORS.subtle,

      fontSize: 8,

      textAlign: 'right',

      marginTop: 5,
    },

    /* =====================================================
       NO SLOTS
    ====================================================== */

    noSlotsCard: {
      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 20,

      paddingHorizontal: 24,

      paddingVertical: 28,
    },

    noSlotsIcon: {
      width: 52,
      height: 52,

      borderRadius: 17,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.amberSoft,

      marginBottom: 12,
    },

    noSlotsTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',

      textAlign: 'center',
    },

    noSlotsText: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      textAlign: 'center',

      marginTop: 5,

      maxWidth: 280,
    },

    findDoctorButton: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      backgroundColor:
        COLORS.teal,

      borderRadius: 13,

      paddingHorizontal: 14,

      paddingVertical: 10,

      marginTop: 16,
    },

    findDoctorButtonText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '800',
    },

    /* =====================================================
       SUMMARY
    ====================================================== */

    summaryCard: {
      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 21,

      padding: 15,

      marginBottom: 15,

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

    summaryTop: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    summaryIcon: {
      width: 42,
      height: 42,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,
    },

    summaryHeading: {
      flex: 1,

      marginLeft: 10,
    },

    summaryEyebrow: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 0.8,
    },

    summaryTitle: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: '800',

      marginTop: 2,
    },

    summaryDivider: {
      height: 1,

      backgroundColor:
        COLORS.border,

      marginVertical: 13,
    },

    summaryItem: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      marginBottom: 11,
    },

    summaryItemContent: {
      flex: 1,

      marginLeft: 9,
    },

    summaryItemLabel: {
      color:
        COLORS.subtle,

      fontSize: 8,

      fontWeight: '700',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    summaryItemValue: {
      color:
        COLORS.textSoft,

      fontSize: 10,

      lineHeight: 15,

      fontWeight: '700',

      marginTop: 2,
    },

    /* =====================================================
       CONFIRM
    ====================================================== */

    confirmButton: {
      minHeight: 54,

      borderRadius: 17,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 8,

      backgroundColor:
        COLORS.teal,

      shadowColor:
        COLORS.teal,

      shadowOffset: {
        width: 0,
        height: 7,
      },

      shadowOpacity: 0.2,

      shadowRadius: 14,

      elevation: 5,
    },

    confirmButtonDisabled: {
      backgroundColor:
        '#B9C5CA',

      shadowOpacity: 0,

      elevation: 0,
    },

    confirmButtonText: {
      color:
        '#FFFFFF',

      fontSize: 13,

      fontWeight: '800',
    },

    /* =====================================================
       SECURITY
    ====================================================== */

    securityNote: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 22,

      marginTop: 17,
    },

    securityNoteText: {
      flexShrink: 1,

      color:
        COLORS.subtle,

      fontSize: 8,

      lineHeight: 13,

      textAlign: 'center',
    },

    bottomSpace: {
      height: 10,
    },
  });