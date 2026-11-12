/**
 * @file    PrescriptionsScreen.js
 * @module  Patient
 * @desc    Premium patient prescription screen.
 *          Displays prescription status, medicine details,
 *          dispensing progress, expiry information, and pharmacy QR.
 * @author  S/21/001 — status fix + medicine details by S/21/081
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
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Pill,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  X,
} from 'lucide-react-native';

import {
  getPatientPrescriptions,
} from '../services/prescription.service';

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

  green: '#2F855A',
  greenSoft: '#EDF9F2',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',

  graySoft: '#F1F5F9',
};

/* =========================================================
   STATUS CONFIG
========================================================= */

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    color: COLORS.green,
    background: COLORS.greenSoft,
  },

  partially_filled: {
    label: 'Partially filled',
    icon: Clock3,
    color: COLORS.amber,
    background: COLORS.amberSoft,
  },

  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: COLORS.muted,
    background: COLORS.graySoft,
  },

  expired: {
    label: 'Expired',
    icon: AlertCircle,
    color: COLORS.danger,
    background: COLORS.dangerSoft,
  },
};

/* =========================================================
   FILTERS
========================================================= */

const FILTERS = [
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'active',
    label: 'Active',
  },
  {
    key: 'partially_filled',
    label: 'Partial',
  },
  {
    key: 'history',
    label: 'History',
  },
];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Checks whether a prescription has expired.
 *
 * @param {string} expiresAt
 * @returns {boolean}
 */
const isExpired = (
  expiresAt
) => {
  if (!expiresAt) {
    return false;
  }

  const date =
    new Date(
      expiresAt
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return date <
    new Date();
};

/**
 * Resolves the patient-facing prescription status.
 *
 * @param {string} status
 * @param {string} expiresAt
 * @returns {string}
 */
const resolveStatus = (
  status,
  expiresAt
) => {
  if (
    isExpired(
      expiresAt
    )
  ) {
    return 'expired';
  }

  return (
    status
      ?.toLowerCase() ||
    'active'
  );
};

/**
 * Returns metadata for a prescription status.
 *
 * @param {string} status
 * @returns {Object}
 */
const getStatusMeta = (
  status
) => {
  return (
    STATUS_CONFIG[
      status
    ] || {
      label:
        status ||
        'Unknown',

      icon:
        FileText,

      color:
        COLORS.muted,

      background:
        COLORS.graySoft,
    }
  );
};

/**
 * Formats a date.
 *
 * @param {string} dateStr
 * @returns {string}
 */
const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return '—';
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
    return '—';
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
 * Calculates medicine dispensing progress.
 *
 * @param {Object} item
 * @returns {number}
 */
const getDispensingProgress = (
  item
) => {
  const prescribed =
    Number(
      item
        ?.quantity_prescribed ||
      0
    );

  const dispensed =
    Number(
      item
        ?.quantity_dispensed ||
      0
    );

  if (
    prescribed <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (
        dispensed /
        prescribed
      ) *
        100
    )
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

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
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
}) => {
  const meta =
    getStatusMeta(
      status
    );

  const Icon =
    meta.icon;

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            meta.background,
        },
      ]}
    >

      <Icon
        size={11}
        color={meta.color}
        strokeWidth={2.2}
      />

      <Text
        style={[
          styles.statusText,
          {
            color:
              meta.color,
          },
        ]}
      >
        {meta.label}
      </Text>

    </View>
  );
};

/* =========================================================
   MEDICINE ITEM
========================================================= */

const MedicineItem = ({
  item,
  index,
}) => {
  const prescribed =
    Number(
      item
        ?.quantity_prescribed ||
      0
    );

  const dispensed =
    Number(
      item
        ?.quantity_dispensed ||
      0
    );

  const progress =
    getDispensingProgress(
      item
    );

  return (
    <View style={styles.medicineCard}>

      <View style={styles.medicineHeader}>

        <View style={styles.medicineNumber}>

          <Text style={styles.medicineNumberText}>
            {index + 1}
          </Text>

        </View>

        <View style={styles.medicineTitleArea}>

          <Text
            style={styles.medicineName}
            numberOfLines={2}
          >
            {item.medicine_name}
          </Text>

          <View style={styles.medicineScheduleRow}>

            {item.dosage ? (
              <Text style={styles.medicineScheduleText}>
                {item.dosage}
              </Text>
            ) : null}

            {item.frequency ? (
              <>
                <View style={styles.dotSeparator} />

                <Text style={styles.medicineScheduleText}>
                  {item.frequency}
                </Text>
              </>
            ) : null}

            {item.duration_days ? (
              <>
                <View style={styles.dotSeparator} />

                <Text style={styles.medicineScheduleText}>
                  {item.duration_days}{' '}
                  days
                </Text>
              </>
            ) : null}

          </View>

        </View>

      </View>

      {item.special_notes ? (
        <View style={styles.specialNotesBox}>

          <FileText
            size={13}
            color={COLORS.blue}
          />

          <Text style={styles.specialNotesText}>
            {item.special_notes}
          </Text>

        </View>
      ) : null}

      <View style={styles.quantitySection}>

        <View style={styles.quantityHeader}>

          <Text style={styles.quantityLabel}>
            Dispensing progress
          </Text>

          <Text style={styles.quantityValue}>
            {dispensed} / {prescribed}
          </Text>

        </View>

        <View style={styles.progressTrack}>

          <View
            style={[
              styles.progressFill,
              {
                width:
                  `${progress}%`,
              },
            ]}
          />

        </View>

        <View style={styles.quantityFooter}>

          <Text style={styles.quantityFooterText}>
            Prescribed: {prescribed}
          </Text>

          <Text
            style={[
              styles.quantityFooterText,

              dispensed > 0 &&
                styles.quantityDispensed,
            ]}
          >
            Dispensed: {dispensed}
          </Text>

        </View>

      </View>

    </View>
  );
};

/* =========================================================
   PRESCRIPTION CARD
========================================================= */

const PrescriptionCard = ({
  prescription,
  onShowQR,
}) => {
  const status =
    resolveStatus(
      prescription.status,
      prescription.expires_at
    );

  const validItems =
    (
      prescription.items ||
      []
    ).filter(
      (
        item
      ) =>
        item &&
        item.medicine_name
    );

  const canShowQR =
    (
      status ===
        'active' ||
      status ===
        'partially_filled'
    ) &&
    Boolean(
      prescription
        .qr_code_value
    );

  return (
    <View style={styles.prescriptionCard}>

      {/* ===================================================
          HEADER
      ==================================================== */}

      <View style={styles.prescriptionHeader}>

        <View style={styles.prescriptionIcon}>

          <Pill
            size={21}
            color={COLORS.teal}
          />

        </View>

        <View style={styles.prescriptionHeading}>

          <Text style={styles.prescriptionEyebrow}>
            PRESCRIPTION
          </Text>

          <Text style={styles.prescriptionTitle}>
            {
              validItems.length
            }{' '}
            {validItems.length ===
            1
              ? 'medicine'
              : 'medicines'}
          </Text>

        </View>

        <StatusBadge
          status={
            status
          }
        />

      </View>

      {/* ===================================================
          DATES
      ==================================================== */}

      <View style={styles.datePanel}>

        <View style={styles.dateItem}>

          <CalendarDays
            size={15}
            color={COLORS.teal}
          />

          <View style={styles.dateTextBlock}>

            <Text style={styles.dateLabel}>
              Issued
            </Text>

            <Text style={styles.dateValue}>
              {formatDate(
                prescription
                  .created_at
              )}
            </Text>

          </View>

        </View>

        <View style={styles.dateDivider} />

        <View style={styles.dateItem}>

          <Clock3
            size={15}
            color={
              status ===
              'expired'
                ? COLORS.danger
                : COLORS.blue
            }
          />

          <View style={styles.dateTextBlock}>

            <Text style={styles.dateLabel}>
              Expires
            </Text>

            <Text style={styles.dateValue}>
              {formatDate(
                prescription
                  .expires_at
              )}
            </Text>

          </View>

        </View>

      </View>

      {/* ===================================================
          DOCTOR NOTES
      ==================================================== */}

      {prescription.notes ? (
        <View style={styles.notesBox}>

          <View style={styles.notesIcon}>

            <Stethoscope
              size={15}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.notesContent}>

            <Text style={styles.notesLabel}>
              Doctor's Notes
            </Text>

            <Text style={styles.notesText}>
              {
                prescription.notes
              }
            </Text>

          </View>

        </View>
      ) : null}

      {/* ===================================================
          MEDICINES
      ==================================================== */}

      {validItems.length >
        0 ? (
        <View style={styles.medicinesSection}>

          <View style={styles.medicinesHeadingRow}>

            <Text style={styles.medicinesHeading}>
              Medicines
            </Text>

            <Text style={styles.medicinesCount}>
              {
                validItems.length
              }{' '}
              {
                validItems.length ===
                1
                  ? 'item'
                  : 'items'
              }
            </Text>

          </View>

          {validItems.map(
            (
              item,
              index
            ) => (
              <MedicineItem
                key={
                  item.id ||
                  index
                }
                item={
                  item
                }
                index={
                  index
                }
              />
            )
          )}

        </View>
      ) : (
        <View style={styles.noMedicineBox}>

          <AlertCircle
            size={16}
            color={COLORS.muted}
          />

          <Text style={styles.noMedicineText}>
            No medicine items were recorded for this prescription.
          </Text>

        </View>
      )}

      {/* ===================================================
          QR ACTION
      ==================================================== */}

      {canShowQR ? (
        <TouchableOpacity
          style={styles.qrButton}
          activeOpacity={0.82}
          onPress={() =>
            onShowQR(
              prescription
            )
          }
        >

          <View style={styles.qrButtonIcon}>

            <QrCode
              size={19}
              color="#FFFFFF"
            />

          </View>

          <View style={styles.qrButtonContent}>

            <Text style={styles.qrButtonTitle}>
              Show Pharmacy QR
            </Text>

            <Text style={styles.qrButtonSubtitle}>
              Present this prescription at the pharmacy
            </Text>

          </View>

          <ChevronRight
            size={18}
            color="#FFFFFF"
          />

        </TouchableOpacity>
      ) : (
        <View style={styles.qrUnavailable}>

          <ShieldCheck
            size={15}
            color={COLORS.subtle}
          />

          <Text style={styles.qrUnavailableText}>
            {status ===
            'expired'
              ? 'QR unavailable because this prescription has expired.'
              : status ===
                'completed'
                ? 'This prescription has been fully dispensed.'
                : 'Pharmacy QR is unavailable for this prescription.'}
          </Text>

        </View>
      )}

    </View>
  );
};

/* =========================================================
   QR MODAL
========================================================= */

const PrescriptionQRModal = ({
  prescription,
  onClose,
}) => {
  if (!prescription) {
    return null;
  }

  const qrValue =
    prescription
      .qr_code_value;

  return (
    <Modal
      visible={
        Boolean(
          prescription
        )
      }
      animationType="slide"
      onRequestClose={
        onClose
      }
      presentationStyle="fullScreen"
    >

      <SafeAreaView style={styles.modalSafeArea}>

        <View style={styles.modalTopBar}>

          <View style={styles.modalTopLeft}>

            <View style={styles.modalTopIcon}>

              <QrCode
                size={19}
                color={COLORS.teal}
              />

            </View>

            <View>

              <Text style={styles.modalEyebrow}>
                CARE4U PRESCRIPTION
              </Text>

              <Text style={styles.modalHeaderTitle}>
                Pharmacy QR
              </Text>

            </View>

          </View>

          <TouchableOpacity
            style={styles.modalCloseIcon}
            activeOpacity={0.75}
            onPress={
              onClose
            }
          >

            <X
              size={19}
              color={COLORS.text}
            />

          </TouchableOpacity>

        </View>

        <ScrollView
          contentContainerStyle={
            styles.modalContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          <View style={styles.qrHeroIcon}>

            <ShoppingBag
              size={27}
              color={COLORS.teal}
            />

          </View>

          <Text style={styles.qrModalTitle}>
            Show this to the pharmacist
          </Text>

          <Text style={styles.qrModalSubtitle}>
            Ask the pharmacist to scan this QR code to securely verify your prescription.
          </Text>

          <View style={styles.qrCard}>

            <View style={styles.qrInner}>

              <QRCode
                value={
                  qrValue
                }
                size={230}
                color={COLORS.navy}
                backgroundColor="#FFFFFF"
              />

            </View>

            <View style={styles.qrReferenceArea}>

              <Text style={styles.qrReferenceLabel}>
                PRESCRIPTION REFERENCE
              </Text>

              <Text
                style={styles.qrReference}
                selectable
              >
                {qrValue}
              </Text>

            </View>

          </View>

          <View style={styles.qrSecurityNotice}>

            <ShieldCheck
              size={17}
              color={COLORS.teal}
            />

            <Text style={styles.qrSecurityText}>
              This QR contains only the Care4U prescription reference. The pharmacist must be authenticated to access prescription details.
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
              Close QR
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

const PrescriptionsScreen = () => {
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
    error,
    setError,
  ] = useState(null);

  const [
    selectedPrescription,
    setSelectedPrescription,
  ] = useState(null);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState('all');

  /* =======================================================
     LOAD PRESCRIPTIONS
  ======================================================= */

  const fetchPrescriptions =
    useCallback(
      async (
        background = false
      ) => {
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
            await getPatientPrescriptions(
              patientId
            );

          setPrescriptions(
            data ||
            []
          );

        } catch (
          err
        ) {
          console.error(
            'Prescription load error:',
            err
          );

          setError(
            'Failed to load prescriptions. Please try again.'
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
    fetchPrescriptions();
  }, [
    fetchPrescriptions,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const sortedPrescriptions =
    useMemo(
      () =>
        [
          ...prescriptions,
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
        prescriptions,
      ]
    );

  const activeCount =
    useMemo(
      () =>
        prescriptions.filter(
          (
            prescription
          ) =>
            resolveStatus(
              prescription.status,
              prescription.expires_at
            ) ===
            'active'
        ).length,
      [
        prescriptions,
      ]
    );

  const partialCount =
    useMemo(
      () =>
        prescriptions.filter(
          (
            prescription
          ) =>
            resolveStatus(
              prescription.status,
              prescription.expires_at
            ) ===
            'partially_filled'
        ).length,
      [
        prescriptions,
      ]
    );

  const historyCount =
    useMemo(
      () =>
        prescriptions.filter(
          (
            prescription
          ) => {
            const status =
              resolveStatus(
                prescription.status,
                prescription.expires_at
              );

            return (
              status ===
                'completed' ||
              status ===
                'expired'
            );
          }
        ).length,
      [
        prescriptions,
      ]
    );

  const filteredPrescriptions =
    useMemo(
      () => {
        if (
          selectedFilter ===
          'all'
        ) {
          return sortedPrescriptions;
        }

        return sortedPrescriptions.filter(
          (
            prescription
          ) => {
            const status =
              resolveStatus(
                prescription.status,
                prescription.expires_at
              );

            if (
              selectedFilter ===
              'history'
            ) {
              return (
                status ===
                  'completed' ||
                status ===
                  'expired'
              );
            }

            return (
              status ===
              selectedFilter
            );
          }
        );
      },
      [
        sortedPrescriptions,
        selectedFilter,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <Pill
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Loading prescriptions
        </Text>

        <Text style={styles.loadingText}>
          Preparing your latest medication information
        </Text>

      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    prescriptions.length ===
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
          Prescriptions unavailable
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.78}
          onPress={() =>
            fetchPrescriptions()
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
     MAIN VIEW
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>

      <PrescriptionQRModal
        prescription={
          selectedPrescription
        }
        onClose={() =>
          setSelectedPrescription(
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
              fetchPrescriptions(
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

            <Pill
              size={22}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.introContent}>

            <Text style={styles.introEyebrow}>
              YOUR MEDICATIONS
            </Text>

            <Text style={styles.introTitle}>
              Prescriptions
            </Text>

            <Text style={styles.introDescription}>
              Review medicines, dispensing progress and pharmacy QR codes issued by your Care4U doctors.
            </Text>

          </View>

        </View>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <View style={styles.summaryRow}>

          <SummaryCard
            icon={CheckCircle2}
            value={activeCount}
            label="Active"
            color={COLORS.green}
            background={COLORS.greenSoft}
          />

          <SummaryCard
            icon={Clock3}
            value={partialCount}
            label="Partially filled"
            color={COLORS.amber}
            background={COLORS.amberSoft}
          />

          <SummaryCard
            icon={FileText}
            value={historyCount}
            label="History"
            color={COLORS.blue}
            background={COLORS.blueSoft}
          />

        </View>

        {/* =================================================
            FILTER
        ================================================== */}

        <View style={styles.filterSection}>

          <View style={styles.filterHeadingRow}>

            <Text style={styles.filterHeading}>
              Medication history
            </Text>

            <Text style={styles.filterCount}>
              {
                filteredPrescriptions.length
              }{' '}
              {
                filteredPrescriptions.length ===
                1
                  ? 'prescription'
                  : 'prescriptions'
              }
            </Text>

          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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
                    key={filter.key}
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

        {error ? (
          <View style={styles.inlineWarning}>

            <AlertCircle
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

        {filteredPrescriptions.length ===
        0 ? (

          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>

              <Pill
                size={28}
                color={COLORS.teal}
              />

            </View>

            <Text style={styles.emptyTitle}>
              {prescriptions.length ===
              0
                ? 'No prescriptions yet'
                : 'No matching prescriptions'}
            </Text>

            <Text style={styles.emptyText}>
              {prescriptions.length ===
              0
                ? 'Prescriptions issued by your Care4U doctors will appear here.'
                : 'There are no prescriptions in this category. Try another filter.'}
            </Text>

            {prescriptions.length >
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
                  View all prescriptions
                </Text>

              </TouchableOpacity>
            )}

          </View>

        ) : (

          <View style={styles.prescriptionList}>

            {filteredPrescriptions.map(
              (
                prescription
              ) => (
                <PrescriptionCard
                  key={
                    prescription.id
                  }
                  prescription={
                    prescription
                  }
                  onShowQR={
                    setSelectedPrescription
                  }
                />
              )
            )}

          </View>

        )}

        {/* =================================================
            SECURITY FOOTER
        ================================================== */}

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={15}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Pharmacy access requires an authenticated Care4U pharmacist account.
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
       PRESCRIPTION CARD
    ====================================================== */

    prescriptionList: {
      gap: 13,
    },

    prescriptionCard: {
      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 22,

      padding: 15,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.045,

      shadowRadius: 11,

      elevation: 2,
    },

    prescriptionHeader: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    prescriptionIcon: {
      width: 45,
      height: 45,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,
    },

    prescriptionHeading: {
      flex: 1,

      marginLeft: 10,

      marginRight: 7,
    },

    prescriptionEyebrow: {
      color:
        COLORS.teal,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.8,
    },

    prescriptionTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 2,
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
       DATES
    ====================================================== */

    datePanel: {
      flexDirection: 'row',

      backgroundColor:
        COLORS.background,

      borderRadius: 15,

      padding: 11,

      marginTop: 14,
    },

    dateItem: {
      flex: 1,

      flexDirection: 'row',

      alignItems: 'center',
    },

    dateTextBlock: {
      marginLeft: 7,
    },

    dateLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '700',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    dateValue: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      fontWeight: '700',

      marginTop: 2,
    },

    dateDivider: {
      width: 1,

      backgroundColor:
        COLORS.border,

      marginHorizontal: 9,
    },

    /* =====================================================
       NOTES
    ====================================================== */

    notesBox: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      borderRadius: 15,

      backgroundColor:
        COLORS.tealSoft,

      padding: 11,

      marginTop: 13,
    },

    notesIcon: {
      width: 32,
      height: 32,

      borderRadius: 10,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      marginRight: 8,
    },

    notesContent: {
      flex: 1,
    },

    notesLabel: {
      color:
        COLORS.tealDark,

      fontSize: 8,

      fontWeight: '800',

      textTransform:
        'uppercase',

      letterSpacing: 0.5,
    },

    notesText: {
      color:
        COLORS.tealDark,

      fontSize: 10,

      lineHeight: 15,

      marginTop: 3,
    },

    /* =====================================================
       MEDICINES
    ====================================================== */

    medicinesSection: {
      marginTop: 16,
    },

    medicinesHeadingRow: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 9,
    },

    medicinesHeading: {
      color:
        COLORS.text,

      fontSize: 13,

      fontWeight: '800',
    },

    medicinesCount: {
      color:
        COLORS.muted,

      fontSize: 8,

      fontWeight: '600',
    },

    medicineCard: {
      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 16,

      padding: 12,

      marginBottom: 8,

      backgroundColor:
        '#FCFDFD',
    },

    medicineHeader: {
      flexDirection: 'row',

      alignItems:
        'flex-start',
    },

    medicineNumber: {
      width: 28,
      height: 28,

      borderRadius: 9,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navy,

      marginRight: 9,
    },

    medicineNumberText: {
      color:
        '#FFFFFF',

      fontSize: 9,

      fontWeight: '800',
    },

    medicineTitleArea: {
      flex: 1,
    },

    medicineName: {
      color:
        COLORS.text,

      fontSize: 12,

      lineHeight: 16,

      fontWeight: '800',
    },

    medicineScheduleRow: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      gap: 5,

      marginTop: 4,
    },

    medicineScheduleText: {
      color:
        COLORS.muted,

      fontSize: 8,

      fontWeight: '600',
    },

    dotSeparator: {
      width: 3,
      height: 3,

      borderRadius: 2,

      backgroundColor:
        COLORS.subtle,
    },

    specialNotesBox: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 6,

      backgroundColor:
        COLORS.blueSoft,

      borderRadius: 11,

      padding: 8,

      marginTop: 9,
    },

    specialNotesText: {
      flex: 1,

      color:
        COLORS.blue,

      fontSize: 8,

      lineHeight: 13,

      fontStyle: 'italic',
    },

    /* =====================================================
       QUANTITY
    ====================================================== */

    quantitySection: {
      marginTop: 11,
    },

    quantityHeader: {
      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      marginBottom: 6,
    },

    quantityLabel: {
      color:
        COLORS.muted,

      fontSize: 8,

      fontWeight: '700',
    },

    quantityValue: {
      color:
        COLORS.textSoft,

      fontSize: 8,

      fontWeight: '800',
    },

    progressTrack: {
      height: 5,

      overflow: 'hidden',

      borderRadius: 99,

      backgroundColor:
        '#E9EEF1',
    },

    progressFill: {
      height: '100%',

      borderRadius: 99,

      backgroundColor:
        COLORS.teal,
    },

    quantityFooter: {
      flexDirection: 'row',

      justifyContent:
        'space-between',

      marginTop: 6,
    },

    quantityFooterText: {
      color:
        COLORS.subtle,

      fontSize: 7,
    },

    quantityDispensed: {
      color:
        COLORS.green,

      fontWeight: '700',
    },

    noMedicineBox: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 7,

      backgroundColor:
        COLORS.graySoft,

      borderRadius: 13,

      padding: 11,

      marginTop: 14,
    },

    noMedicineText: {
      flex: 1,

      color:
        COLORS.muted,

      fontSize: 9,

      lineHeight: 14,
    },

    /* =====================================================
       QR BUTTON
    ====================================================== */

    qrButton: {
      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.navy,

      borderRadius: 16,

      padding: 12,

      marginTop: 14,
    },

    qrButtonIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      backgroundColor:
        'rgba(255,255,255,0.10)',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 9,
    },

    qrButtonContent: {
      flex: 1,
    },

    qrButtonTitle: {
      color:
        '#FFFFFF',

      fontSize: 11,

      fontWeight: '800',
    },

    qrButtonSubtitle: {
      color:
        '#BFD1DD',

      fontSize: 8,

      marginTop: 2,
    },

    qrUnavailable: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      justifyContent:
        'center',

      gap: 6,

      paddingHorizontal: 8,

      paddingTop: 13,

      marginTop: 2,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
    },

    qrUnavailableText: {
      flex: 1,

      color:
        COLORS.subtle,

      fontSize: 8,

      lineHeight: 13,
    },

    /* =====================================================
       FILTER EMPTY
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
       QR MODAL
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

    modalTopLeft: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    modalTopIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginRight: 10,
    },

    modalEyebrow: {
      color:
        COLORS.teal,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.9,
    },

    modalHeaderTitle: {
      color:
        COLORS.text,

      fontSize: 14,

      fontWeight: '800',

      marginTop: 2,
    },

    modalCloseIcon: {
      width: 40,
      height: 40,

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

    modalContent: {
      flexGrow: 1,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 22,

      paddingVertical: 30,
    },

    qrHeroIcon: {
      width: 58,
      height: 58,

      borderRadius: 19,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 15,
    },

    qrModalTitle: {
      color:
        COLORS.text,

      fontSize: 20,

      fontWeight: '800',

      textAlign: 'center',
    },

    qrModalSubtitle: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 16,

      textAlign: 'center',

      maxWidth: 285,

      marginTop: 6,

      marginBottom: 24,
    },

    qrCard: {
      width: '100%',

      maxWidth: 330,

      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 24,

      padding: 18,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 8,
      },

      shadowOpacity: 0.09,

      shadowRadius: 18,

      elevation: 5,
    },

    qrInner: {
      padding: 14,

      borderRadius: 16,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    qrReferenceArea: {
      width: '100%',

      alignItems: 'center',

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,

      marginTop: 17,

      paddingTop: 14,
    },

    qrReferenceLabel: {
      color:
        COLORS.subtle,

      fontSize: 7,

      fontWeight: '800',

      letterSpacing: 0.7,
    },

    qrReference: {
      color:
        COLORS.textSoft,

      fontSize: 9,

      textAlign: 'center',

      marginTop: 5,
    },

    qrSecurityNotice: {
      maxWidth: 320,

      flexDirection: 'row',

      alignItems:
        'flex-start',

      gap: 7,

      backgroundColor:
        COLORS.tealSoft,

      borderRadius: 14,

      padding: 11,

      marginTop: 18,
    },

    qrSecurityText: {
      flex: 1,

      color:
        COLORS.tealDark,

      fontSize: 8,

      lineHeight: 13,
    },

    modalFooter: {
      paddingHorizontal: 16,

      paddingVertical: 12,

      backgroundColor:
        COLORS.surface,

      borderTopWidth: 1,

      borderTopColor:
        COLORS.border,
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
       SECURITY FOOTER
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

export default PrescriptionsScreen;
