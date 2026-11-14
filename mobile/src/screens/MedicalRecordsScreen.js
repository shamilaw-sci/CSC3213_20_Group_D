/**
 * @file      MedicalRecordsScreen.js
 * @module    Patient
 * @desc      Premium mobile patient medical-record timeline.
 *            Supports filtering, pull-to-refresh, record summaries,
 *            confidential indicators, and detailed record viewing.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';

import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  FileHeart,
  FileText,
  FlaskConical,
  History,
  Image as ImagingIcon,
  LockKeyhole,
  Pill,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react-native';

import {
  getMedicalRecords,
} from '../services/patient.service';

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

  violet: '#7656A8',
  violetSoft: '#F4F0FA',

  green: '#2F855A',
  greenSoft: '#EDF9F2',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* =========================================================
   RECORD TYPES
========================================================= */

const RECORD_TYPES = {
  consultation: {
    label: 'Consultation',
    icon: Stethoscope,
    color: COLORS.teal,
    background: COLORS.tealSoft,
  },

  lab_result: {
    label: 'Lab Result',
    icon: FlaskConical,
    color: COLORS.blue,
    background: COLORS.blueSoft,
  },

  imaging: {
    label: 'Imaging',
    icon: ScanLine,
    color: COLORS.violet,
    background: COLORS.violetSoft,
  },

  prescription: {
    label: 'Prescription',
    icon: Pill,
    color: COLORS.green,
    background: COLORS.greenSoft,
  },

  diagnosis: { label: 'Diagnosis', icon: FileText, color: COLORS.teal, background: COLORS.tealSoft },
  vaccination: { label: 'Vaccination', icon: FileHeart, color: COLORS.teal, background: COLORS.tealSoft },
  other: {
    label: 'Record',
    icon: FileText,
    color: COLORS.navy,
    background: COLORS.navySoft,
  },
};

const FILTERS = [
  { key: 'diagnosis', label: 'Diagnoses' },
  { key: 'vaccination', label: 'Vaccinations' },
  { key: 'other', label: 'Other' },
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'consultation',
    label: 'Consultations',
  },
  {
    key: 'lab_result',
    label: 'Lab',
  },
  {
    key: 'imaging',
    label: 'Imaging',
  },
  {
    key: 'prescription',
    label: 'Prescriptions',
  },
];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Returns presentation metadata for a record type.
 *
 * @param {string} type
 * @returns {Object}
 */
const recordTypeMeta = (
  type
) => {
  return (
    RECORD_TYPES[
      type
    ] ||
    RECORD_TYPES.other
  );
};

/**
 * Formats an ISO date into a readable date.
 *
 * @param {string} dateStr
 * @returns {string}
 */
const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return 'Date unavailable';
  }

  const date =
    new Date(
      dateStr
    );

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

/**
 * Formats a record date with weekday for detail view.
 *
 * @param {string} dateStr
 * @returns {string}
 */
const formatLongDate = (
  dateStr
) => {
  if (!dateStr) {
    return 'Date unavailable';
  }

  const date =
    new Date(
      dateStr
    );

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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

/**
 * @component SummaryCard
 * @desc      Compact medical-record summary statistic.
 */
/** Render a native record metric using label/value/icon/color props; no API side effects.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const SummaryCard = ({
  icon: Icon,
  value,
  label,
  color,
  background,
}) => {
  return (
    <View style={styles.summaryCard}>

      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        <Icon
          size={17}
          color={color}
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

/* =========================================================
   RECORD CARD
========================================================= */

/**
 * @component RecordCard
 * @desc      Premium medical-record timeline card.
 */
/** Render a native record summary and delegate opening through onPress/onOpen props; record selection belongs to the screen.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const RecordCard = ({
  record,
  onPress,
}) => {
  const meta =
    recordTypeMeta(
      record.record_type
    );

  const Icon =
    meta.icon;

  return (
    <TouchableOpacity
      style={styles.recordCard}
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${record.title || meta.label}`}
    >

      <View
        style={[
          styles.recordIcon,
          {
            backgroundColor:
              meta.background,
          },
        ]}
      >

        <Icon
          size={21}
          color={meta.color}
          strokeWidth={2}
        />

      </View>

      <View style={styles.recordContent}>

        <View style={styles.recordTopRow}>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  meta.background,
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    meta.color,
                },
              ]}
            >
              {meta.label}
            </Text>
          </View>

          {record.is_confidential ? (
            <View style={styles.confidentialBadge}>

              <LockKeyhole
                size={10}
                color={COLORS.amber}
              />

              <Text style={styles.confidentialBadgeText}>
                Confidential
              </Text>

            </View>
          ) : null}

        </View>

        <Text
          style={styles.recordTitle}
          numberOfLines={2}
        >
          {record.title ||
            meta.label}
        </Text>

        <View style={styles.recordMetaRow}>

          <CalendarDays
            size={13}
            color={COLORS.subtle}
          />

          <Text style={styles.recordMeta}>
            {formatDate(
              record.created_at
            )}
          </Text>

        </View>

        {record.doctor_name ? (
          <View style={styles.recordMetaRow}>

            <UserRound
              size={13}
              color={COLORS.subtle}
            />

            <Text
              style={styles.recordMeta}
              numberOfLines={1}
            >
              Dr. {
                record.doctor_name
              }
              {record
                .doctor_specialization
                ? ` · ${record.doctor_specialization}`
                : ''}
            </Text>

          </View>
        ) : null}

        {record.follow_up_needed ? (
          <View style={styles.followUpInline}>

            <CalendarCheck2
              size={12}
              color={COLORS.blue}
            />

            <Text style={styles.followUpInlineText}>
              Follow-up required
            </Text>

          </View>
        ) : null}

      </View>

      <View style={styles.chevronShell}>

        <ChevronRight
          size={18}
          color={COLORS.subtle}
        />

      </View>

    </TouchableOpacity>
  );
};

/* =========================================================
   DETAIL SECTION
========================================================= */

/**
 * @component DetailSection
 * @desc      Structured content block inside record detail modal.
 */
const DetailSection = ({
  label,
  value,
}) => {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailSection}>

      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <View style={styles.detailValueCard}>

        <Text style={styles.detailValue}>
          {value}
        </Text>

      </View>

    </View>
  );
};

/* =========================================================
   RECORD DETAIL MODAL
========================================================= */

/**
 * @component RecordDetailModal
 * @desc      Full record detail experience.
 */
/** Render selected record detail with native Modal controls. Props provide record/visibility/close handling; device/back/focus acceptance remains NOT_RUN.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const RecordDetailModal = ({
  record,
  onClose,
}) => {
  if (!record) {
    return null;
  }

  const meta =
    recordTypeMeta(
      record.record_type
    );

  const Icon =
    meta.icon;

  const isConsultation =
    record.record_type ===
    'consultation';

  return (
    <Modal
      visible={
        Boolean(record)
      }
      animationType="slide"
      onRequestClose={
        onClose
      }
      presentationStyle="fullScreen"
    >

      <SafeAreaView style={styles.modalSafeArea}>

        {/* =================================================
            MODAL TOP BAR
        ================================================== */}

        <View style={styles.modalTopBar}>

          <View style={styles.modalBrandArea}>

            <View
              style={[
                styles.modalSmallIcon,
                {
                  backgroundColor:
                    meta.background,
                },
              ]}
            >
              <Icon
                size={18}
                color={meta.color}
              />
            </View>

            <View>

              <Text style={styles.modalBrandEyebrow}>
                MEDICAL RECORD
              </Text>

              <Text style={styles.modalBrandTitle}>
                Record Details
              </Text>

            </View>

          </View>

          <TouchableOpacity
            style={styles.modalCloseIcon}
            activeOpacity={0.75}
            onPress={
              onClose
            }
            accessibilityRole="button"
            accessibilityLabel="Close medical record"
          >

            <X
              size={19}
              color={COLORS.text}
            />

          </TouchableOpacity>

        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={
            styles.modalScroll
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {/* =================================================
              RECORD HERO
          ================================================== */}

          <View style={styles.modalHero}>

            <View style={styles.modalHeroCircleLarge} />
            <View style={styles.modalHeroCircleSmall} />

            <View
              style={[
                styles.modalTypeIcon,
                {
                  backgroundColor:
                    meta.background,
                },
              ]}
            >

              <Icon
                size={24}
                color={meta.color}
              />

            </View>

            <View
              style={[
                styles.modalTypeBadge,
                {
                  backgroundColor:
                    meta.background,
                },
              ]}
            >

              <Text
                style={[
                  styles.modalTypeBadgeText,
                  {
                    color:
                      meta.color,
                  },
                ]}
              >
                {meta.label}
              </Text>

            </View>

            <Text style={styles.modalTitle}>
              {record.title ||
                meta.label}
            </Text>

            <View style={styles.modalDateRow}>

              <CalendarDays
                size={14}
                color="#C8D8E3"
              />

              <Text style={styles.modalDate}>
                {formatLongDate(
                  record.created_at
                )}
              </Text>

            </View>

            {record.doctor_name ? (
              <View style={styles.modalDoctorRow}>

                <Stethoscope
                  size={14}
                  color="#C8D8E3"
                />

                <Text style={styles.modalDoctor}>
                  Dr. {
                    record.doctor_name
                  }
                  {record
                    .doctor_specialization
                    ? ` · ${record.doctor_specialization}`
                    : ''}
                </Text>

              </View>
            ) : null}

          </View>

          {/* =================================================
              CONFIDENTIAL WARNING
          ================================================== */}

          {record.is_confidential ? (
            <View style={styles.confidentialBanner}>

              <View style={styles.confidentialBannerIcon}>

                <LockKeyhole
                  size={17}
                  color={COLORS.amber}
                />

              </View>

              <View style={styles.confidentialBannerContent}>

                <Text style={styles.confidentialBannerTitle}>
                  Confidential medical record
                </Text>

                <Text style={styles.confidentialBannerText}>
                  This record has been marked confidential in your Care4U medical history.
                </Text>

              </View>

            </View>
          ) : null}

          {/* =================================================
              STRUCTURED DETAILS
          ================================================== */}

          <View style={styles.modalBody}>

            <View style={styles.detailHeadingRow}>

              <FileHeart
                size={18}
                color={COLORS.teal}
              />

              <Text style={styles.detailHeading}>
                Clinical information
              </Text>

            </View>

            {isConsultation &&
            record.chief_complaint ? (
              <>

                <DetailSection
                  label="Chief Complaint"
                  value={
                    record
                      .chief_complaint
                  }
                />

                <DetailSection
                  label="Diagnosis"
                  value={
                    record
                      .diagnosis ||
                    'No diagnosis recorded.'
                  }
                />

                <DetailSection
                  label="Treatment Plan"
                  value={
                    record
                      .treatment_plan ||
                    'No treatment plan recorded.'
                  }
                />

                <DetailSection
                  label="Additional Notes"
                  value={
                    record
                      .description
                  }
                />

              </>
            ) : (
              <DetailSection
                label="Details"
                value={
                  record.description ||
                  'No additional details recorded.'
                }
              />
            )}

            {record.follow_up_needed ? (
              <View style={styles.followUpBanner}>

                <View style={styles.followUpIcon}>

                  <CalendarCheck2
                    size={20}
                    color={COLORS.blue}
                  />

                </View>

                <View style={styles.followUpContent}>

                  <Text style={styles.followUpTitle}>
                    Follow-up required
                  </Text>

                  <Text style={styles.followUpText}>
                    Your healthcare provider has indicated that this record requires follow-up care.
                  </Text>

                </View>

              </View>
            ) : null}

          </View>

          {/* =================================================
              PRIVACY NOTE
          ================================================== */}

          <View style={styles.privacyNote}>

            <ShieldCheck
              size={15}
              color={COLORS.subtle}
            />

            <Text style={styles.privacyNoteText}>
              This information is part of your protected Care4U medical record.
            </Text>

          </View>

        </ScrollView>

        <View style={styles.modalFooter}>

          <TouchableOpacity
            style={styles.closeButton}
            activeOpacity={0.8}
            onPress={
              onClose
            }
          >
            <Text style={styles.closeButtonText}>
              Close Record
            </Text>
          </TouchableOpacity>

        </View>

      </SafeAreaView>

    </Modal>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/** Load the session profile records, reject stale async results via loadVersion, clear detail/payload before refresh, and derive type filters. No account-ID fallback or native runtime claim.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const MedicalRecordsScreen = () => {
  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    '';

  const [
    records,
    setRecords,
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
  ] = useState(null);

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(null);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState('all');

  const loadVersion = useRef(0);

  /* =======================================================
     LOAD RECORDS
  ======================================================= */

  const fetchRecords =
    useCallback(
      async (
        background = false
      ) => {
        const version = ++loadVersion.current;
        setSelectedRecord(null);
        setRecords([]);
        if (!patientId) {
          setLoading(
            false
          );

          setError(
            'Patient information is unavailable. Please sign in again.'
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

        setError(
          null
        );

        try {
          const data =
            await getMedicalRecords(
              patientId
            );

          if (version !== loadVersion.current) return;
          setRecords(
            data ||
            []
          );

        } catch (
          err
        ) {
          if (version !== loadVersion.current) return;
          console.error(
            'Medical records load error:',
            err
          );

          setError(
            'Failed to load medical records. Please try again.'
          );

        } finally {
          if (version !== loadVersion.current) return;
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
    fetchRecords();
    return () => { loadVersion.current += 1; };
  }, [
    fetchRecords,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const sortedRecords =
    useMemo(
      () =>
        [
          ...records,
        ].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.created_at
            ) -
            new Date(
              first.created_at
            )
        ),
      [
        records,
      ]
    );

  const filteredRecords =
    useMemo(
      () => {
        if (
          selectedFilter ===
          'all'
        ) {
          return sortedRecords;
        }

        return sortedRecords.filter(
          (
            record
          ) =>
            record.record_type ===
            selectedFilter
        );
      },
      [
        sortedRecords,
        selectedFilter,
      ]
    );

  const consultationCount =
    useMemo(
      () =>
        records.filter(
          (
            record
          ) =>
            record.record_type ===
            'consultation'
        ).length,
      [
        records,
      ]
    );

  const followUpCount =
    useMemo(
      () =>
        records.filter(
          (
            record
          ) =>
            Boolean(
              record.follow_up_needed
            )
        ).length,
      [
        records,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <FileHeart
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Loading your records
        </Text>

        <Text style={styles.loadingText}>
          Preparing your Care4U medical history
        </Text>

      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    records.length ===
      0
  ) {
    return (
      <View style={styles.errorScreen}>

        <View style={styles.errorIcon}>

          <AlertCircle
            size={27}
            color={COLORS.danger}
          />

        </View>

        <Text style={styles.errorTitle}>
          Records unavailable
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.78}
          onPress={() =>
            fetchRecords()
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
     PAGE
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>

      <RecordDetailModal
        record={
          selectedRecord
        }
        onClose={() =>
          setSelectedRecord(
            null
          )
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scroll
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
              fetchRecords(
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

        {/* =================================================
            INTRO
        ================================================== */}

        <View style={styles.introSection}>

          <View style={styles.introIcon}>

            <History
              size={22}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.introContent}>

            <Text style={styles.introEyebrow}>
              YOUR HEALTH HISTORY
            </Text>

            <Text style={styles.introTitle}>
              Care timeline
            </Text>

            <Text style={styles.introDescription}>
              Review consultations, test results, imaging and other clinical records saved in Care4U.
            </Text>

          </View>

        </View>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <View style={styles.summaryRow}>

          <SummaryCard
            icon={FileText}
            value={
              records.length
            }
            label="Total records"
            color={
              COLORS.teal
            }
            background={
              COLORS.tealSoft
            }
          />

          <SummaryCard
            icon={Stethoscope}
            value={
              consultationCount
            }
            label="Consultations"
            color={
              COLORS.blue
            }
            background={
              COLORS.blueSoft
            }
          />

          <SummaryCard
            icon={CalendarCheck2}
            value={
              followUpCount
            }
            label="Follow-ups"
            color={
              followUpCount >
              0
                ? COLORS.amber
                : COLORS.green
            }
            background={
              followUpCount >
              0
                ? COLORS.amberSoft
                : COLORS.greenSoft
            }
          />

        </View>

        {/* =================================================
            FILTERS
        ================================================== */}

        <View style={styles.filterSection}>

          <View style={styles.filterHeadingRow}>

            <Text style={styles.filterHeading}>
              Records
            </Text>

            <Text style={styles.filterCount}>
              {
                filteredRecords.length
              }{' '}
              {filteredRecords.length ===
              1
                ? 'record'
                : 'records'}
            </Text>

          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filterList
            }
          >

            {FILTERS.map(
              (
                filter
              ) => {
                const active =
                  selectedFilter ===
                  filter.key;

                return (
                  <TouchableOpacity
                    key={
                      filter.key
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.filterChip,

                      active &&
                        styles.filterChipActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() =>
                      setSelectedFilter(
                        filter.key
                      )
                    }
                  >

                    <Text
                      style={[
                        styles.filterChipText,

                        active &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>

                  </TouchableOpacity>
                );
              }
            )}

          </ScrollView>

        </View>

        {/* =================================================
            INLINE REFRESH ERROR
        ================================================== */}

        {error ? (
          <View style={styles.inlineWarning}>

            <AlertTriangle
              size={16}
              color={COLORS.amber}
            />

            <Text style={styles.inlineWarningText}>
              {error}
            </Text>

          </View>
        ) : null}

        {/* =================================================
            EMPTY
        ================================================== */}

        {filteredRecords.length ===
        0 ? (

          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>

              <FileHeart
                size={28}
                color={COLORS.teal}
              />

            </View>

            <Text style={styles.emptyTitle}>
              {records.length ===
              0
                ? 'No medical records yet'
                : 'No matching records'}
            </Text>

            <Text style={styles.emptyText}>
              {records.length ===
              0
                ? 'Your medical history will appear here after consultations and other Care4U clinical activity.'
                : 'There are no records in this category yet. Try another filter.'}
            </Text>

            {records.length >
              0 && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                activeOpacity={0.75}
                onPress={() =>
                  setSelectedFilter(
                    'all'
                  )
                }
              >
                <Text style={styles.clearFilterText}>
                  View all records
                </Text>
              </TouchableOpacity>
            )}

          </View>

        ) : (

          <View style={styles.recordsList}>

            {filteredRecords.map(
              (
                record
              ) => (
                <RecordCard
                  key={
                    record.id
                  }
                  record={
                    record
                  }
                  onPress={() =>
                    setSelectedRecord(
                      record
                    )
                  }
                />
              )
            )}

          </View>

        )}

        {/* =================================================
            PRIVACY FOOTER
        ================================================== */}

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={15}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Your medical records are protected by Care4U role-based access controls.
          </Text>

        </View>

        <View style={styles.bottomSpace} />

      </ScrollView>

    </SafeAreaView>
  );
};

/* =========================================================
   STYLES
========================================================= */

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

    scroll: {
      paddingHorizontal: 18,

      paddingTop: 20,

      paddingBottom: 26,
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

      maxWidth: 295,
    },

    /* =====================================================
       SUMMARY
    ====================================================== */

    summaryRow: {
      flexDirection: 'row',

      gap: 9,

      marginBottom: 23,
    },

    summaryCard: {
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

      fontSize: 8,

      lineHeight: 12,

      fontWeight: '600',

      marginTop: 2,
    },

    /* =====================================================
       FILTER
    ====================================================== */

    filterSection: {
      marginBottom: 15,
    },

    filterHeadingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 10,
    },

    filterHeading: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight: '800',
    },

    filterCount: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '600',
    },

    filterList: {
      gap: 7,

      paddingRight: 10,
    },

    filterChip: {
    minHeight: 44,
      minHeight: 36,

      paddingHorizontal: 13,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    filterChipActive: {
      backgroundColor:
        COLORS.navy,

      borderColor:
        COLORS.navy,
    },

    filterChipText: {
      color:
        COLORS.muted,

      fontSize: 9,

      fontWeight: '700',
    },

    filterChipTextActive: {
      color:
        '#FFFFFF',
    },

    /* =====================================================
       RECORD CARD
    ====================================================== */

    recordsList: {
      gap: 10,
    },

    recordCard: {
      minHeight: 124,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 20,

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

    recordIcon: {
      width: 48,
      height: 48,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 12,

      alignSelf:
        'flex-start',
    },

    recordContent: {
      flex: 1,

      minWidth: 0,
    },

    recordTopRow: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      gap: 6,

      marginBottom: 7,
    },

    typeBadge: {
      alignSelf:
        'flex-start',

      borderRadius: 99,

      paddingHorizontal: 8,

      paddingVertical: 4,
    },

    typeBadgeText: {
      fontSize: 7,

      fontWeight: '800',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    confidentialBadge: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 3,

      backgroundColor:
        COLORS.amberSoft,

      borderRadius: 99,

      paddingHorizontal: 7,

      paddingVertical: 4,
    },

    confidentialBadgeText: {
      color:
        COLORS.amber,

      fontSize: 7,

      fontWeight: '800',
    },

    recordTitle: {
      color:
        COLORS.text,

      fontSize: 13,

      lineHeight: 18,

      fontWeight: '800',

      marginBottom: 6,
    },

    recordMetaRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 5,

      marginTop: 3,
    },

    recordMeta: {
      flex: 1,

      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 13,

      fontWeight: '600',
    },

    followUpInline: {
      alignSelf:
        'flex-start',

      flexDirection: 'row',

      alignItems: 'center',

      gap: 4,

      backgroundColor:
        COLORS.blueSoft,

      borderRadius: 99,

      paddingHorizontal: 7,

      paddingVertical: 4,

      marginTop: 7,
    },

    followUpInlineText: {
      color:
        COLORS.blue,

      fontSize: 7,

      fontWeight: '800',
    },

    chevronShell: {
      width: 30,
      height: 30,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      marginLeft: 7,
    },

    /* =====================================================
       EMPTY
    ====================================================== */

    emptyCard: {
      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 22,

      paddingHorizontal: 26,

      paddingVertical: 35,
    },

    emptyIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      backgroundColor:
        COLORS.tealSoft,

      alignItems: 'center',

      justifyContent:
        'center',

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

      maxWidth: 275,

      marginTop: 6,
    },

    clearFilterButton: {
      backgroundColor:
        COLORS.tealSoft,

      borderRadius: 12,

      paddingHorizontal: 13,

      paddingVertical: 9,

      marginTop: 15,
    },

    clearFilterText: {
      color:
        COLORS.tealDark,

      fontSize: 9,

      fontWeight: '800',
    },

    /* =====================================================
       INLINE WARNING
    ====================================================== */

    inlineWarning: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 7,

      backgroundColor:
        COLORS.amberSoft,

      borderRadius: 13,

      padding: 11,

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
       LOADING / ERROR
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

      backgroundColor:
        COLORS.tealSoft,

      alignItems: 'center',

      justifyContent:
        'center',

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

      textAlign: 'center',

      marginTop: 5,
    },

    errorScreen: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 28,
    },

    errorIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      backgroundColor:
        COLORS.dangerSoft,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 15,
    },

    errorTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      fontWeight: '800',

      textAlign: 'center',
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
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      minHeight: 42,

      backgroundColor:
        COLORS.teal,

      borderRadius: 13,

      paddingHorizontal: 15,

      marginTop: 17,
    },

    retryText: {
      color:
        '#FFFFFF',

      fontSize: 10,

      fontWeight: '800',
    },

    /* =====================================================
       MODAL TOP BAR
    ====================================================== */

    modalSafeArea: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    modalTopBar: {
      minHeight: 70,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 18,

      backgroundColor:
        COLORS.surface,

      borderBottomWidth: 1,

      borderBottomColor:
        COLORS.border,
    },

    modalBrandArea: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    modalSmallIcon: {
      width: 39,
      height: 39,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 10,
    },

    modalBrandEyebrow: {
      color:
        COLORS.teal,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.9,
    },

    modalBrandTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 2,
    },

    modalCloseIcon: {
      width: 39,
      height: 39,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    modalScrollView: {
      flex: 1,
    },

    modalScroll: {
      paddingBottom: 25,
    },

    /* =====================================================
       MODAL HERO
    ====================================================== */

    modalHero: {
      position: 'relative',

      overflow: 'hidden',

      backgroundColor:
        COLORS.navy,

      paddingHorizontal: 20,

      paddingTop: 25,

      paddingBottom: 25,
    },

    modalHeroCircleLarge: {
      position: 'absolute',

      width: 180,
      height: 180,

      borderRadius: 90,

      right: -70,
      top: -95,

      backgroundColor:
        'rgba(15,139,131,0.32)',
    },

    modalHeroCircleSmall: {
      position: 'absolute',

      width: 75,
      height: 75,

      borderRadius: 38,

      right: 35,
      bottom: -40,

      backgroundColor:
        'rgba(255,255,255,0.05)',
    },

    modalTypeIcon: {
      width: 46,
      height: 46,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 12,
    },

    modalTypeBadge: {
      alignSelf:
        'flex-start',

      borderRadius: 99,

      paddingHorizontal: 9,

      paddingVertical: 5,

      marginBottom: 9,
    },

    modalTypeBadgeText: {
      fontSize: 8,

      fontWeight: '800',

      textTransform:
        'uppercase',

      letterSpacing: 0.6,
    },

    modalTitle: {
      color:
        '#FFFFFF',

      fontSize: 22,

      lineHeight: 28,

      fontWeight: '800',

      maxWidth: '90%',
    },

    modalDateRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 6,

      marginTop: 12,
    },

    modalDate: {
      color:
        '#C8D8E3',

      fontSize: 10,

      fontWeight: '600',
    },

    modalDoctorRow: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 6,

      marginTop: 7,
    },

    modalDoctor: {
      flex: 1,

      color:
        '#C8D8E3',

      fontSize: 10,

      lineHeight: 15,

      fontWeight: '600',
    },

    /* =====================================================
       CONFIDENTIAL MODAL
    ====================================================== */

    confidentialBanner: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      backgroundColor:
        COLORS.amberSoft,

      borderWidth: 1,

      borderColor:
        '#F1E0B1',

      borderRadius: 16,

      padding: 13,

      marginHorizontal: 18,

      marginTop: 16,
    },

    confidentialBannerIcon: {
      width: 36,
      height: 36,

      borderRadius: 12,

      backgroundColor:
        COLORS.surface,

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 10,
    },

    confidentialBannerContent: {
      flex: 1,
    },

    confidentialBannerTitle: {
      color:
        '#815719',

      fontSize: 10,

      fontWeight: '800',
    },

    confidentialBannerText: {
      color:
        '#956C2B',

      fontSize: 9,

      lineHeight: 14,

      marginTop: 2,
    },

    /* =====================================================
       MODAL DETAILS
    ====================================================== */

    modalBody: {
      paddingHorizontal: 18,

      paddingTop: 21,
    },

    detailHeadingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 7,

      marginBottom: 16,
    },

    detailHeading: {
      color:
        COLORS.text,

      fontSize: 15,

      fontWeight: '800',
    },

    detailSection: {
      marginBottom: 17,
    },

    detailLabel: {
      color:
        COLORS.subtle,

      fontSize: 8,

      fontWeight: '800',

      letterSpacing: 0.7,

      textTransform:
        'uppercase',

      marginBottom: 7,
    },

    detailValueCard: {
      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 16,

      padding: 14,
    },

    detailValue: {
      color:
        COLORS.textSoft,

      fontSize: 12,

      lineHeight: 19,
    },

    /* =====================================================
       FOLLOW-UP
    ====================================================== */

    followUpBanner: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.blueSoft,

      borderWidth: 1,

      borderColor:
        '#D5E7F5',

      borderRadius: 16,

      padding: 13,

      marginTop: 3,
    },

    followUpIcon: {
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

    followUpContent: {
      flex: 1,
    },

    followUpTitle: {
      color:
        COLORS.blue,

      fontSize: 10,

      fontWeight: '800',
    },

    followUpText: {
      color:
        '#567A99',

      fontSize: 9,

      lineHeight: 14,

      marginTop: 2,
    },

    /* =====================================================
       PRIVACY
    ====================================================== */

    privacyNote: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 6,

      marginHorizontal: 25,

      marginTop: 19,
    },

    privacyNoteText: {
      flexShrink: 1,

      color:
        COLORS.subtle,

      fontSize: 8,

      lineHeight: 13,

      textAlign: 'center',
    },

    modalFooter: {
      backgroundColor:
        COLORS.surface,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      paddingHorizontal: 16,

      paddingVertical: 12,
    },

    closeButton: {
      minHeight: 49,

      borderRadius: 15,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.teal,
    },

    closeButtonText: {
      color:
        '#FFFFFF',

      fontSize: 12,

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

      paddingHorizontal: 18,

      marginTop: 19,
    },

    securityFooterText: {
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

export default MedicalRecordsScreen;