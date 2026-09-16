/**
 * @file    DoctorSearchScreen.js
 * @module  Patient
 * @desc    Premium mobile doctor discovery screen.
 *          Lets patients search verified doctors by specialty
 *          and hospital, view doctor profile photos and details,
 *          and continue directly into appointment booking.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import {
  BadgeCheck,
  Building2,
  CalendarPlus,
  ChevronRight,
  GraduationCap,
  Search,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react-native';

import {
  searchDoctors,
} from '../services/doctor.service';

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

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Converts a doctor's full name into initials.
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
 * Creates a readable experience value.
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
   SEARCH FIELD
========================================================= */

/**
 * @component SearchField
 * @desc      Shared doctor-search input with visible label,
 *            icon, and clear action.
 */
const SearchField = ({
  label,
  value,
  placeholder,
  icon: Icon,
  onChangeText,
  onClear,
}) => {
  return (
    <View style={styles.fieldGroup}>

      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputShell,

          Boolean(value) &&
            styles.inputShellActive,
        ]}
      >

        <Icon
          size={18}
          color={
            value
              ? COLORS.teal
              : COLORS.subtle
          }
          strokeWidth={2}
        />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={
            onChangeText
          }
          placeholder={
            placeholder
          }
          placeholderTextColor={
            COLORS.subtle
          }
          autoCorrect={false}
          returnKeyType="search"
        />

        {Boolean(value) && (
          <TouchableOpacity
            style={styles.clearButton}
            activeOpacity={0.7}
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
          >
            <X
              size={15}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        )}

      </View>

    </View>
  );
};

/* =========================================================
   DOCTOR PHOTO
========================================================= */

/**
 * @component DoctorPhoto
 * @desc      Large doctor portrait with initials fallback.
 */
const DoctorPhoto = ({
  doctor,
}) => {
  const [
    photoFailed,
    setPhotoFailed,
  ] = useState(false);

  const doctorName =
    doctor?.full_name ||
    'Care4U Doctor';

  useEffect(() => {
    setPhotoFailed(false);
  }, [
    doctor?.photo_url,
  ]);

  return (
    <View style={styles.photoShell}>

      {doctor?.photo_url &&
      !photoFailed ? (

        <Image
          source={{
            uri:
              doctor.photo_url,
          }}
          style={styles.doctorPhoto}
          resizeMode="cover"
          onError={() =>
            setPhotoFailed(
              true
            )
          }
          accessibilityLabel={`Doctor ${doctorName} profile photo`}
        />

      ) : (

        <View style={styles.photoFallback}>

          <UserRound
            size={27}
            color="rgba(255,255,255,0.72)"
            strokeWidth={1.8}
          />

          <Text style={styles.photoInitials}>
            {getInitials(
              doctorName
            )}
          </Text>

        </View>

      )}

      {doctor?.is_verified && (
        <View style={styles.verifiedBadge}>

          <BadgeCheck
            size={14}
            color="#FFFFFF"
            fill={COLORS.teal}
          />

          <Text style={styles.verifiedText}>
            Verified
          </Text>

        </View>
      )}

    </View>
  );
};

/* =========================================================
   DOCTOR CARD
========================================================= */

/**
 * @component DoctorCard
 * @desc      Large doctor profile card with portrait,
 *            professional information, and booking action.
 */
const DoctorCard = ({
  doctor,
  onBook,
}) => {
  const doctorName =
    doctor?.full_name ||
    'Care4U Doctor';

  const specialization =
    doctor?.specialization ||
    'General Medicine';

  const hospitalName =
    doctor?.hospital_name ||
    'Care4U Network';

  return (
    <TouchableOpacity
      style={styles.doctorCard}
      activeOpacity={0.84}
      onPress={onBook}
      accessibilityRole="button"
      accessibilityLabel={`Book appointment with Doctor ${doctorName}`}
    >

      {/* ===================================================
          MAIN PROFILE
      ==================================================== */}

      <View style={styles.profileRow}>

        <DoctorPhoto
          doctor={doctor}
        />

        <View style={styles.profileContent}>

          <Text
            style={styles.doctorName}
            numberOfLines={2}
          >
            Dr. {doctorName}
          </Text>

          <Text
            style={styles.specialization}
            numberOfLines={2}
          >
            {specialization}
          </Text>

          <View style={styles.hospitalRow}>

            <Building2
              size={13}
              color={COLORS.muted}
            />

            <Text
              style={styles.hospitalText}
              numberOfLines={2}
            >
              {hospitalName}
            </Text>

          </View>

          <View style={styles.experiencePill}>

            <Stethoscope
              size={12}
              color={COLORS.tealDark}
            />

            <Text style={styles.experienceText}>
              {formatExperience(
                doctor
                  ?.years_experience
              )}
            </Text>

          </View>

        </View>

      </View>

      {/* ===================================================
          PROFESSIONAL DETAILS
      ==================================================== */}

      {(doctor?.qualifications ||
        doctor?.slmc_reg_number) && (
        <View style={styles.professionalPanel}>

          {doctor
              ?.qualifications ? (
            <View style={styles.professionalItem}>

              <View style={styles.professionalIcon}>

                <GraduationCap
                  size={15}
                  color={COLORS.blue}
                />

              </View>

              <View style={styles.professionalContent}>

                <Text style={styles.professionalLabel}>
                  Qualifications
                </Text>

                <Text
                  style={styles.professionalValue}
                  numberOfLines={2}
                >
                  {
                    doctor
                      .qualifications
                  }
                </Text>

              </View>

            </View>
          ) : null}

          {doctor
              ?.slmc_reg_number ? (
            <View style={styles.professionalItem}>

              <View style={styles.professionalIcon}>

                <BadgeCheck
                  size={15}
                  color={COLORS.teal}
                />

              </View>

              <View style={styles.professionalContent}>

                <Text style={styles.professionalLabel}>
                  SLMC Registration
                </Text>

                <Text style={styles.professionalValue}>
                  {
                    doctor
                      .slmc_reg_number
                  }
                </Text>

              </View>

            </View>
          ) : null}

        </View>
      )}

      {/* ===================================================
          BOOKING
      ==================================================== */}

      <View style={styles.cardFooter}>

        <View style={styles.availabilityArea}>

          <View style={styles.availabilityDot} />

          <View>

            <Text style={styles.availabilityTitle}>
              Appointment booking
            </Text>

            <Text style={styles.availabilityText}>
              View available dates and times
            </Text>

          </View>

        </View>

        <View style={styles.bookButton}>

          <CalendarPlus
            size={16}
            color="#FFFFFF"
          />

          <Text style={styles.bookButtonText}>
            Book
          </Text>

          <ChevronRight
            size={14}
            color="#FFFFFF"
          />

        </View>

      </View>

    </TouchableOpacity>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/**
 * @component DoctorSearchScreen
 * @desc      Patient doctor discovery and booking screen.
 *
 * @param {Function} navigate
 */
export default function DoctorSearchScreen({
  navigate,
}) {
  const [
    doctors,
    setDoctors,
  ] = useState([]);

  const [
    specialty,
    setSpecialty,
  ] = useState('');

  const [
    hospital,
    setHospital,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
     SEARCH
  ======================================================= */

  /**
   * Loads doctors matching the current search filters.
   *
   * @param {boolean} background
   * @returns {Promise<void>}
   */
  const fetchDoctors =
    useCallback(
      async (
        background = false
      ) => {
        if (background) {
          setRefreshing(
            true
          );
        } else {
          setIsLoading(
            true
          );
        }

        setError('');

        try {
          const data =
            await searchDoctors({
              specialty:
                specialty.trim(),

              hospitalName:
                hospital.trim(),
            });

          setDoctors(
            data ||
            []
          );

        } catch (
          requestError
        ) {
          console.error(
            'Doctor search error:',
            requestError
          );

          setError(
            requestError
              ?.response
              ?.data
              ?.message ||
            'We could not load doctors right now.'
          );

          setDoctors(
            []
          );

        } finally {
          setIsLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        specialty,
        hospital,
      ]
    );

  /**
   * Debounces search while the user types.
   */
  useEffect(() => {
    const timer =
      setTimeout(
        () => {
          fetchDoctors();
        },
        450
      );

    return () =>
      clearTimeout(
        timer
      );

  }, [
    fetchDoctors,
  ]);

  const hasFilters =
    Boolean(
      specialty.trim() ||
      hospital.trim()
    );

  const clearFilters =
    () => {
      setSpecialty('');
      setHospital('');
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    isLoading &&
    doctors.length ===
      0
  ) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <Search
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Finding doctors
        </Text>

        <Text style={styles.loadingText}>
          Searching the Care4U medical network
        </Text>

      </View>
    );
  }

  return (
    <View style={styles.container}>

      <FlatList
        data={doctors}
        keyExtractor={(
          item
        ) =>
          item.id
        }
        renderItem={({
          item,
        }) => (
          <DoctorCard
            doctor={item}
            onBook={() =>
              navigate(
                'BookAppointment',
                {
                  doctorId:
                    item.id,
                }
              )
            }
          />
        )}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              fetchDoctors(
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
        contentContainerStyle={
          styles.listContent
        }

        ListHeaderComponent={(
          <>

            {/* =============================================
                INTRO
            ============================================== */}

            <View style={styles.introSection}>

              <View style={styles.introIcon}>

                <Stethoscope
                  size={22}
                  color={COLORS.teal}
                />

              </View>

              <View style={styles.introContent}>

                <Text style={styles.introEyebrow}>
                  CARE4U MEDICAL NETWORK
                </Text>

                <Text style={styles.introTitle}>
                  Find your doctor
                </Text>

                <Text style={styles.introDescription}>
                  Explore verified doctors and choose the right specialist for your care.
                </Text>

              </View>

            </View>

            {/* =============================================
                SEARCH PANEL
            ============================================== */}

            <View style={styles.searchCard}>

              <View style={styles.searchCardHeader}>

                <View>

                  <Text style={styles.searchCardTitle}>
                    Search doctors
                  </Text>

                  <Text style={styles.searchCardSubtitle}>
                    Search by specialty, doctor name or hospital
                  </Text>

                </View>

                {hasFilters && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    activeOpacity={0.7}
                    onPress={
                      clearFilters
                    }
                  >
                    <X
                      size={13}
                      color={COLORS.teal}
                    />

                    <Text style={styles.clearFiltersText}>
                      Clear
                    </Text>

                  </TouchableOpacity>
                )}

              </View>

              <SearchField
                label="Doctor or specialty"
                value={specialty}
                placeholder="e.g. Cardiologist or Perera"
                icon={Stethoscope}
                onChangeText={
                  setSpecialty
                }
                onClear={() =>
                  setSpecialty(
                    ''
                  )
                }
              />

              <SearchField
                label="Hospital"
                value={hospital}
                placeholder="Search hospital name"
                icon={Building2}
                onChangeText={
                  setHospital
                }
                onClear={() =>
                  setHospital(
                    ''
                  )
                }
              />

            </View>

            {/* =============================================
                RESULTS HEADER
            ============================================== */}

            <View style={styles.resultsHeader}>

              <View>

                <Text style={styles.resultsEyebrow}>
                  {hasFilters
                    ? 'MATCHING YOUR SEARCH'
                    : 'AVAILABLE DOCTORS'}
                </Text>

                <Text style={styles.resultsTitle}>
                  {doctors.length}{' '}
                  {doctors.length ===
                  1
                    ? 'doctor'
                    : 'doctors'}
                </Text>

              </View>

              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.teal}
                />
              )}

            </View>

            {error ? (
              <View style={styles.errorBanner}>

                <View style={styles.errorIcon}>

                  <X
                    size={15}
                    color={COLORS.danger}
                  />

                </View>

                <View style={styles.errorContent}>

                  <Text style={styles.errorTitle}>
                    Search unavailable
                  </Text>

                  <Text style={styles.errorText}>
                    {error}
                  </Text>

                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    fetchDoctors()
                  }
                >
                  <Text style={styles.retryText}>
                    Retry
                  </Text>
                </TouchableOpacity>

              </View>
            ) : null}

          </>
        )}

        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyCard}>

              <View style={styles.emptyIcon}>

                <UserRound
                  size={28}
                  color={COLORS.teal}
                />

              </View>

              <Text style={styles.emptyTitle}>
                No doctors found
              </Text>

              <Text style={styles.emptyText}>
                {hasFilters
                  ? 'Try a different doctor, specialty or hospital, or clear the current filters.'
                  : 'There are no doctors available at the moment.'}
              </Text>

              {hasFilters && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  activeOpacity={0.78}
                  onPress={
                    clearFilters
                  }
                >
                  <Search
                    size={16}
                    color="#FFFFFF"
                  />

                  <Text style={styles.emptyActionText}>
                    View all doctors
                  </Text>

                </TouchableOpacity>
              )}

            </View>
          ) : null
        }

        ListFooterComponent={
          doctors.length >
          0 ? (
            <View style={styles.footerNote}>

              <BadgeCheck
                size={15}
                color={COLORS.teal}
              />

              <Text style={styles.footerText}>
                All doctors shown here are verified Care4U medical professionals.
              </Text>

            </View>
          ) : (
            <View style={styles.bottomSpace} />
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

      paddingBottom: 25,
    },

    /* =====================================================
       INTRO
    ====================================================== */

    introSection: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      marginBottom: 20,
    },

    introIcon: {
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

    introContent: {
      flex: 1,
    },

    introEyebrow: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 1,
    },

    introTitle: {
      color:
        COLORS.text,

      fontSize: 25,

      lineHeight: 31,

      fontWeight: '800',

      letterSpacing: -0.5,

      marginTop: 3,
    },

    introDescription: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      marginTop: 5,

      maxWidth: 290,
    },

    /* =====================================================
       SEARCH
    ====================================================== */

    searchCard: {
      backgroundColor:
        COLORS.surface,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 15,

      marginBottom: 22,

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

    searchCardHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 15,
    },

    searchCardTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',
    },

    searchCardSubtitle: {
      color:
        COLORS.subtle,

      fontSize: 9,

      marginTop: 2,

      maxWidth: 250,
    },

    clearFiltersButton: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      paddingHorizontal: 9,

      paddingVertical: 7,

      borderRadius: 10,

      backgroundColor:
        COLORS.tealSoft,
    },

    clearFiltersText: {
      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',
    },

    fieldGroup: {
      marginBottom: 13,
    },

    fieldLabel: {
      color:
        COLORS.textSoft,

      fontSize: 10,

      fontWeight: '700',

      marginBottom: 7,
    },

    inputShell: {
      minHeight: 48,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      paddingHorizontal: 12,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#FBFCFD',
    },

    inputShellActive: {
      borderColor:
        '#B7DFDC',

      backgroundColor:
        '#FCFFFF',
    },

    input: {
      flex: 1,

      color:
        COLORS.text,

      fontSize: 12,

      paddingHorizontal: 9,

      paddingVertical: 10,
    },

    clearButton: {
      width: 28,
      height: 28,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F1F4F6',
    },

    /* =====================================================
       RESULTS
    ====================================================== */

    resultsHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 11,
    },

    resultsEyebrow: {
      color:
        COLORS.teal,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 0.9,
    },

    resultsTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '800',

      marginTop: 2,
    },

    /* =====================================================
       DOCTOR CARD
    ====================================================== */

    doctorCard: {
      backgroundColor:
        COLORS.surface,

      borderRadius: 24,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      padding: 13,

      marginBottom: 14,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.055,

      shadowRadius: 14,

      elevation: 3,
    },

    profileRow: {
      flexDirection: 'row',

      alignItems:
        'stretch',
    },

    /* =====================================================
       DOCTOR PHOTO
    ====================================================== */

    photoShell: {
      position: 'relative',

      width: 106,
      height: 132,

      borderRadius: 19,

      overflow: 'hidden',

      backgroundColor:
        COLORS.navySoft,

      marginRight: 14,
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

      fontSize: 19,

      fontWeight: '800',

      marginTop: 5,
    },

    verifiedBadge: {
      position: 'absolute',

      left: 7,
      bottom: 7,

      flexDirection: 'row',

      alignItems: 'center',

      gap: 3,

      backgroundColor:
        'rgba(15, 139, 131, 0.94)',

      borderRadius: 99,

      paddingHorizontal: 7,

      paddingVertical: 4,

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.24)',
    },

    verifiedText: {
      color:
        '#FFFFFF',

      fontSize: 7,

      fontWeight: '800',
    },

    /* =====================================================
       DOCTOR IDENTITY
    ====================================================== */

    profileContent: {
      flex: 1,

      minWidth: 0,

      justifyContent:
        'center',

      paddingVertical: 2,
    },

    doctorName: {
      color:
        COLORS.text,

      fontSize: 16,

      lineHeight: 20,

      fontWeight: '800',
    },

    specialization: {
      color:
        COLORS.teal,

      fontSize: 11,

      lineHeight: 16,

      fontWeight: '700',

      marginTop: 4,
    },

    hospitalRow: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 5,

      marginTop: 11,
    },

    hospitalText: {
      flex: 1,

      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 13,

      fontWeight: '600',
    },

    experiencePill: {
      alignSelf:
        'flex-start',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor:
        COLORS.tealSoft,

      borderRadius: 99,

      paddingHorizontal: 8,

      paddingVertical: 6,

      marginTop: 10,
    },

    experienceText: {
      color:
        COLORS.tealDark,

      fontSize: 8,

      fontWeight: '700',
    },

    /* =====================================================
       PROFESSIONAL DETAILS
    ====================================================== */

    professionalPanel: {
      backgroundColor:
        COLORS.background,

      borderRadius: 16,

      padding: 11,

      marginTop: 13,

      gap: 10,
    },

    professionalItem: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    professionalIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      marginRight: 9,
    },

    professionalContent: {
      flex: 1,

      minWidth: 0,
    },

    professionalLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '700',

      letterSpacing: 0.5,

      textTransform:
        'uppercase',
    },

    professionalValue: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      lineHeight: 13,

      fontWeight: '700',

      marginTop: 2,
    },

    /* =====================================================
       CARD FOOTER
    ====================================================== */

    cardFooter: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      marginTop: 13,

      paddingTop: 13,
    },

    availabilityArea: {
      flex: 1,

      flexDirection: 'row',

      alignItems: 'center',

      paddingRight: 8,
    },

    availabilityDot: {
      width: 8,
      height: 8,

      borderRadius: 4,

      backgroundColor:
        COLORS.teal,

      marginRight: 7,
    },

    availabilityTitle: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      fontWeight: '700',
    },

    availabilityText: {
      color:
        COLORS.subtle,

      fontSize: 8,

      marginTop: 1,
    },

    bookButton: {
      minHeight: 39,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 4,

      paddingHorizontal: 12,

      borderRadius: 13,

      backgroundColor:
        COLORS.teal,
    },

    bookButtonText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '800',
    },

    /* =====================================================
       ERROR
    ====================================================== */

    errorBanner: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.dangerSoft,

      borderWidth: 1,

      borderColor:
        '#F2D4D4',

      borderRadius: 15,

      padding: 11,

      marginBottom: 13,
    },

    errorIcon: {
      width: 31,
      height: 31,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FFFFFF',

      marginRight: 8,
    },

    errorContent: {
      flex: 1,

      paddingRight: 8,
    },

    errorTitle: {
      color:
        COLORS.danger,

      fontSize: 10,

      fontWeight: '800',
    },

    errorText: {
      color:
        '#A15A5A',

      fontSize: 9,

      lineHeight: 13,

      marginTop: 2,
    },

    retryText: {
      color:
        COLORS.danger,

      fontSize: 9,

      fontWeight: '800',
    },

    /* =====================================================
       EMPTY
    ====================================================== */

    emptyCard: {
      backgroundColor:
        COLORS.surface,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems: 'center',

      paddingHorizontal: 25,

      paddingVertical: 34,

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

      fontSize: 15,

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

      maxWidth: 275,
    },

    emptyAction: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      backgroundColor:
        COLORS.teal,

      borderRadius: 13,

      paddingHorizontal: 13,

      paddingVertical: 10,

      marginTop: 16,
    },

    emptyActionText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '800',
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

      fontSize: 10,

      marginTop: 5,

      textAlign: 'center',
    },

    /* =====================================================
       FOOTER
    ====================================================== */

    footerNote: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 20,

      paddingTop: 12,

      paddingBottom: 5,
    },

    footerText: {
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