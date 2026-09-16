/**
 * @file      LabReportsScreen.js
 * @module    Patient
 * @desc      Premium mobile laboratory-report screen.
 *            Supports image report preview, PDF opening,
 *            unread indicators, pull-to-refresh, and read tracking.
 * @author    Wasana Karunanayaka (S/21/081)
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
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';

import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileImage,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react-native';

import {
  getLabReports,
  markLabReportAsRead,
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
   HELPERS
========================================================= */

/**
 * Formats a report timestamp.
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

  return date.toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Removes query parameters before checking file extension.
 *
 * Example:
 * report.png?token=123 -> report.png
 */
const cleanFileUrl = (
  url
) => {
  if (!url) {
    return '';
  }

  return String(url)
    .split('?')[0]
    .split('#')[0]
    .toLowerCase();
};

/**
 * Determines whether the uploaded report is an image.
 *
 * @param {string} url
 * @returns {boolean}
 */
const isImageReport = (
  url
) => {
  const cleanUrl =
    cleanFileUrl(
      url
    );

  return [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
  ].some(
    extension =>
      cleanUrl.endsWith(
        extension
      )
  );
};

/**
 * Determines whether the uploaded report is a PDF.
 *
 * @param {string} url
 * @returns {boolean}
 */
const isPdfReport = (
  url
) => {
  return cleanFileUrl(
    url
  ).endsWith(
    '.pdf'
  );
};

/**
 * Returns display information for the uploaded file.
 *
 * @param {string} url
 * @returns {Object}
 */
const getFileMeta = (
  url
) => {
  if (
    isImageReport(
      url
    )
  ) {
    return {
      type: 'image',
      label: 'Image Report',
      icon: FileImage,
      color: COLORS.violet,
      background:
        COLORS.violetSoft,
    };
  }

  if (
    isPdfReport(
      url
    )
  ) {
    return {
      type: 'pdf',
      label: 'PDF Report',
      icon: FileText,
      color: COLORS.blue,
      background:
        COLORS.blueSoft,
    };
  }

  return {
    type: 'document',
    label: 'Lab Document',
    icon: FileText,
    color: COLORS.teal,
    background:
      COLORS.tealSoft,
  };
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
   IMAGE REPORT MODAL
========================================================= */

const ImageReportModal = ({
  report,
  onClose,
}) => {
  if (!report) {
    return null;
  }

  return (
    <Modal
      visible={
        Boolean(report)
      }
      animationType="slide"
      onRequestClose={
        onClose
      }
      presentationStyle="fullScreen"
    >

      <SafeAreaView style={styles.modalSafeArea}>

        {/* =================================================
            TOP BAR
        ================================================== */}

        <View style={styles.modalTopBar}>

          <View style={styles.modalHeading}>

            <View style={styles.modalHeadingIcon}>

              <ImageIcon
                size={19}
                color={COLORS.violet}
              />

            </View>

            <View>

              <Text style={styles.modalEyebrow}>
                LAB REPORT
              </Text>

              <Text style={styles.modalTitle}>
                {
                  report.test_type ||
                  'Diagnostic Report'
                }
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

        {/* =================================================
            IMAGE
        ================================================== */}

        <ScrollView
          style={styles.imagePreviewScroll}
          contentContainerStyle={
            styles.imagePreviewContent
          }
          maximumZoomScale={4}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={
            false
          }
          showsHorizontalScrollIndicator={
            false
          }
        >

          <View style={styles.imagePreviewCard}>

            <Image
              source={{
                uri:
                  report.report_url,
              }}
              style={styles.reportImage}
              resizeMode="contain"
            />

          </View>

          <View style={styles.imageReportInfo}>

            <View style={styles.imageReportInfoRow}>

              <CalendarDays
                size={14}
                color={COLORS.subtle}
              />

              <Text style={styles.imageReportInfoText}>
                {formatDate(
                  report.created_at
                )}
              </Text>

            </View>

            {report.lab_name ? (
              <View style={styles.imageReportInfoRow}>

                <Building2
                  size={14}
                  color={COLORS.subtle}
                />

                <Text style={styles.imageReportInfoText}>
                  {report.lab_name}
                </Text>

              </View>
            ) : null}

            {report.doctor_name ? (
              <View style={styles.imageReportInfoRow}>

                <Stethoscope
                  size={14}
                  color={COLORS.subtle}
                />

                <Text style={styles.imageReportInfoText}>
                  Dr. {
                    report.doctor_name
                  }
                </Text>

              </View>
            ) : null}

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
              Close Report
            </Text>
          </TouchableOpacity>

        </View>

      </SafeAreaView>

    </Modal>
  );
};

/* =========================================================
   LAB REPORT CARD
========================================================= */

const LabReportCard = ({
  report,
  onOpen,
}) => {
  const fileMeta =
    getFileMeta(
      report.report_url
    );

  const FileIcon =
    fileMeta.icon;

  const isNew =
    report.status ===
      'completed' &&
    !report.is_read;

  return (
    <TouchableOpacity
      style={styles.reportCard}
      activeOpacity={0.78}
      onPress={() =>
        onOpen(
          report
        )
      }
    >

      {/* ===================================================
          TOP
      ==================================================== */}

      <View style={styles.reportTop}>

        <View
          style={[
            styles.reportIcon,
            {
              backgroundColor:
                fileMeta.background,
            },
          ]}
        >

          <FileIcon
            size={22}
            color={
              fileMeta.color
            }
          />

        </View>

        <View style={styles.reportTitleArea}>

          <View style={styles.reportBadgeRow}>

            <View
              style={[
                styles.fileBadge,
                {
                  backgroundColor:
                    fileMeta.background,
                },
              ]}
            >

              <Text
                style={[
                  styles.fileBadgeText,
                  {
                    color:
                      fileMeta.color,
                  },
                ]}
              >
                {fileMeta.label}
              </Text>

            </View>

            {isNew ? (
              <View style={styles.newBadge}>

                <View style={styles.newDot} />

                <Text style={styles.newBadgeText}>
                  New Result
                </Text>

              </View>
            ) : (
              <View style={styles.viewedBadge}>

                <CheckCircle2
                  size={10}
                  color={COLORS.muted}
                />

                <Text style={styles.viewedBadgeText}>
                  Viewed
                </Text>

              </View>
            )}

          </View>

          <Text
            style={styles.reportTitle}
            numberOfLines={2}
          >
            {report.test_type ||
              'Laboratory Report'}
          </Text>

        </View>

      </View>

      {/* ===================================================
          IMAGE PREVIEW
      ==================================================== */}

      {isImageReport(
        report.report_url
      ) ? (
        <View style={styles.thumbnailContainer}>

          <Image
            source={{
              uri:
                report.report_url,
            }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />

          <View style={styles.thumbnailOverlay}>

            <Eye
              size={17}
              color="#FFFFFF"
            />

            <Text style={styles.thumbnailOverlayText}>
              View image
            </Text>

          </View>

        </View>
      ) : null}

      {/* ===================================================
          DETAILS
      ==================================================== */}

      <View style={styles.reportDetails}>

        {report.lab_name ? (
          <View style={styles.detailRow}>

            <Building2
              size={14}
              color={COLORS.subtle}
            />

            <View style={styles.detailTextBlock}>

              <Text style={styles.detailLabel}>
                Laboratory
              </Text>

              <Text
                style={styles.detailValue}
                numberOfLines={1}
              >
                {report.lab_name}
              </Text>

            </View>

          </View>
        ) : null}

        {report.doctor_name ? (
          <View style={styles.detailRow}>

            <Stethoscope
              size={14}
              color={COLORS.subtle}
            />

            <View style={styles.detailTextBlock}>

              <Text style={styles.detailLabel}>
                Requested By
              </Text>

              <Text
                style={styles.detailValue}
                numberOfLines={1}
              >
                Dr. {
                  report.doctor_name
                }
              </Text>

            </View>

          </View>
        ) : null}

        <View style={styles.detailRow}>

          <CalendarDays
            size={14}
            color={COLORS.subtle}
          />

          <View style={styles.detailTextBlock}>

            <Text style={styles.detailLabel}>
              Report Date
            </Text>

            <Text style={styles.detailValue}>
              {formatDate(
                report.created_at
              )}
            </Text>

          </View>

        </View>

      </View>

      {/* ===================================================
          ACTION
      ==================================================== */}

      <View style={styles.openReportButton}>

        <View style={styles.openReportButtonLeft}>

          {fileMeta.type ===
          'image' ? (
            <ImageIcon
              size={16}
              color="#FFFFFF"
            />
          ) : (
            <FileText
              size={16}
              color="#FFFFFF"
            />
          )}

          <Text style={styles.openReportButtonText}>
            {fileMeta.type ===
            'image'
              ? 'View Report Image'
              : fileMeta.type ===
                'pdf'
                ? 'Open PDF Report'
                : 'Open Report'}
          </Text>

        </View>

        <ChevronRight
          size={17}
          color="#FFFFFF"
        />

      </View>

    </TouchableOpacity>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

const LabReportsScreen = () => {
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
    reports,
    setReports,
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
    imageReport,
    setImageReport,
  ] = useState(null);

  /* =======================================================
     LOAD REPORTS
  ======================================================= */

  const fetchReports =
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
            await getLabReports(
              patientId
            );

          setReports(
            data ||
            []
          );

        } catch (
          err
        ) {
          console.error(
            'Lab reports load error:',
            err
          );

          setError(
            'Failed to load lab reports. Please try again.'
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
    fetchReports();
  }, [
    fetchReports,
  ]);

  /* =======================================================
     MARK REPORT READ
  ======================================================= */

  const markAsRead =
    async (
      report
    ) => {
      if (
        report.is_read ||
        !patientId
      ) {
        return;
      }

      try {
        await markLabReportAsRead(
          patientId,
          report.id
        );

        setReports(
          previousReports =>
            previousReports.map(
              item =>
                item.id ===
                report.id
                  ? {
                      ...item,
                      is_read:
                        true,
                    }
                  : item
            )
        );

      } catch (
        err
      ) {
        console.error(
          'Failed to mark lab report as read:',
          err
        );
      }
    };

  /* =======================================================
     OPEN REPORT
  ======================================================= */

  const handleOpenReport =
    async (
      report
    ) => {
      if (
        !report.report_url
      ) {
        Alert.alert(
          'Report unavailable',
          'No uploaded document is linked to this laboratory report.'
        );

        return;
      }

      /**
       * Image reports are displayed directly
       * inside the Care4U app.
       */
      if (
        isImageReport(
          report.report_url
        )
      ) {
        setImageReport(
          report
        );

        await markAsRead(
          report
        );

        return;
      }

      /**
       * PDFs and other supported documents are
       * opened with the device's file/browser viewer.
       */
      try {
        const supported =
          await Linking.canOpenURL(
            report.report_url
          );

        if (!supported) {
          Alert.alert(
            'Unable to open report',
            'This document cannot be opened on your device.'
          );

          return;
        }

        await Linking.openURL(
          report.report_url
        );

        await markAsRead(
          report
        );

      } catch (
        err
      ) {
        console.error(
          'Lab report open error:',
          err
        );

        Alert.alert(
          'Unable to open report',
          'The report document could not be opened. Please try again.'
        );
      }
    };

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const sortedReports =
    useMemo(
      () =>
        [
          ...reports,
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
        reports,
      ]
    );

  const unreadCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            report.status ===
              'completed' &&
            !report.is_read
        ).length,
      [
        reports,
      ]
    );

  const imageCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            isImageReport(
              report.report_url
            )
        ).length,
      [
        reports,
      ]
    );

  const pdfCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            isPdfReport(
              report.report_url
            )
        ).length,
      [
        reports,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <View style={styles.loadingScreen}>

        <View style={styles.loadingIcon}>

          <FlaskConical
            size={27}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          size="small"
          color={COLORS.teal}
        />

        <Text style={styles.loadingTitle}>
          Loading lab reports
        </Text>

        <Text style={styles.loadingText}>
          Preparing your latest diagnostic results
        </Text>

      </View>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    reports.length ===
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
          Lab reports unavailable
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.78}
          onPress={() =>
            fetchReports()
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

      <ImageReportModal
        report={
          imageReport
        }
        onClose={() =>
          setImageReport(
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
              fetchReports(
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

            <FlaskConical
              size={22}
              color={COLORS.teal}
            />

          </View>

          <View style={styles.introContent}>

            <Text style={styles.introEyebrow}>
              DIAGNOSTIC RESULTS
            </Text>

            <Text style={styles.introTitle}>
              Lab reports
            </Text>

            <Text style={styles.introDescription}>
              Review diagnostic reports uploaded by Care4U laboratories as images or PDF documents.
            </Text>

          </View>

        </View>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <View style={styles.summaryRow}>

          <SummaryCard
            icon={FlaskConical}
            value={
              reports.length
            }
            label="Reports"
            color={COLORS.teal}
            background={COLORS.tealSoft}
          />

          <SummaryCard
            icon={AlertCircle}
            value={
              unreadCount
            }
            label="New results"
            color={
              unreadCount >
              0
                ? COLORS.amber
                : COLORS.green
            }
            background={
              unreadCount >
              0
                ? COLORS.amberSoft
                : COLORS.greenSoft
            }
          />

          <SummaryCard
            icon={FileImage}
            value={
              imageCount +
              pdfCount
            }
            label="Documents"
            color={COLORS.blue}
            background={COLORS.blueSoft}
          />

        </View>

        {/* =================================================
            LIST TITLE
        ================================================== */}

        <View style={styles.listHeading}>

          <View>

            <Text style={styles.listHeadingTitle}>
              Diagnostic history
            </Text>

            <Text style={styles.listHeadingText}>
              {
                sortedReports.length
              }{' '}
              {
                sortedReports.length ===
                1
                  ? 'report'
                  : 'reports'
              }{' '}
              available
            </Text>

          </View>

          {unreadCount >
            0 && (
            <View style={styles.newResultsBadge}>

              <View style={styles.newResultsDot} />

              <Text style={styles.newResultsText}>
                {unreadCount}{' '}
                new
              </Text>

            </View>
          )}

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

        {sortedReports.length ===
        0 ? (

          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>

              <FlaskConical
                size={28}
                color={COLORS.teal}
              />

            </View>

            <Text style={styles.emptyTitle}>
              No lab reports yet
            </Text>

            <Text style={styles.emptyText}>
              When a doctor orders a laboratory test and the laboratory completes it, the uploaded report will appear here.
            </Text>

          </View>

        ) : (

          <View style={styles.reportList}>

            {sortedReports.map(
              report => (
                <LabReportCard
                  key={
                    report.id
                  }
                  report={
                    report
                  }
                  onOpen={
                    handleOpenReport
                  }
                />
              )
            )}

          </View>

        )}

        {/* =================================================
            SECURITY
        ================================================== */}

        <View style={styles.securityFooter}>

          <ShieldCheck
            size={15}
            color={COLORS.subtle}
          />

          <Text style={styles.securityFooterText}>
            Diagnostic reports are available only through your authenticated Care4U patient account.
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
       LIST
    ====================================================== */

    listHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 12,
    },

    listHeadingTitle: {
      color:
        COLORS.text,
      fontSize: 17,
      fontWeight: '800',
    },

    listHeadingText: {
      color:
        COLORS.muted,
      fontSize: 9,
      marginTop: 2,
    },

    newResultsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 99,
      backgroundColor:
        COLORS.amberSoft,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    newResultsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        COLORS.amber,
    },

    newResultsText: {
      color:
        COLORS.amber,
      fontSize: 8,
      fontWeight: '800',
    },

    reportList: {
      gap: 11,
    },

    /* =====================================================
       REPORT CARD
    ====================================================== */

    reportCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 21,
      padding: 14,
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

    reportTop: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    reportIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    reportTitleArea: {
      flex: 1,
      minWidth: 0,
    },

    reportBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
    },

    fileBadge: {
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    fileBadgeText: {
      fontSize: 7,
      fontWeight: '800',
      textTransform:
        'uppercase',
      letterSpacing: 0.5,
    },

    newBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 99,
      backgroundColor:
        COLORS.greenSoft,
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    newDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        COLORS.green,
    },

    newBadgeText: {
      color:
        COLORS.green,
      fontSize: 7,
      fontWeight: '800',
    },

    viewedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderRadius: 99,
      backgroundColor:
        '#F1F5F9',
      paddingHorizontal: 7,
      paddingVertical: 4,
    },

    viewedBadgeText: {
      color:
        COLORS.muted,
      fontSize: 7,
      fontWeight: '800',
    },

    reportTitle: {
      color:
        COLORS.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '800',
      marginTop: 7,
    },

    /* =====================================================
       IMAGE THUMBNAIL
    ====================================================== */

    thumbnailContainer: {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: 170,
      borderRadius: 15,
      backgroundColor:
        COLORS.background,
      marginTop: 13,
    },

    thumbnailImage: {
      width: '100%',
      height: '100%',
    },

    thumbnailOverlay: {
      position: 'absolute',
      right: 9,
      bottom: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 99,
      paddingHorizontal: 9,
      paddingVertical: 6,
      backgroundColor:
        'rgba(18,52,77,0.88)',
    },

    thumbnailOverlayText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '800',
    },

    /* =====================================================
       REPORT DETAILS
    ====================================================== */

    reportDetails: {
      backgroundColor:
        COLORS.background,
      borderRadius: 15,
      padding: 11,
      marginTop: 13,
      gap: 9,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    detailTextBlock: {
      flex: 1,
      minWidth: 0,
      marginLeft: 8,
    },

    detailLabel: {
      color:
        COLORS.subtle,
      fontSize: 7,
      fontWeight: '700',
      textTransform:
        'uppercase',
      letterSpacing: 0.5,
    },

    detailValue: {
      color:
        COLORS.textSoft,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
    },

    /* =====================================================
       OPEN BUTTON
    ====================================================== */

    openReportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      backgroundColor:
        COLORS.navy,
      borderRadius: 14,
      paddingHorizontal: 12,
      minHeight: 46,
      marginTop: 13,
    },

    openReportButtonLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    openReportButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
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
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    /* =====================================================
       IMAGE MODAL
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

    modalHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 10,
    },

    modalHeadingIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor:
        COLORS.violetSoft,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 10,
    },

    modalEyebrow: {
      color:
        COLORS.violet,
      fontSize: 7,
      fontWeight: '800',
      letterSpacing: 0.9,
    },

    modalTitle: {
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

    imagePreviewScroll: {
      flex: 1,
    },

    imagePreviewContent: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },

    imagePreviewCard: {
      width: '100%',
      minHeight: 480,
      overflow: 'hidden',
      borderRadius: 18,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    reportImage: {
      width: '100%',
      minHeight: 480,
    },

    imageReportInfo: {
      width: '100%',
      borderRadius: 16,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 13,
      marginTop: 14,
      gap: 9,
    },

    imageReportInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    imageReportInfoText: {
      flex: 1,
      color:
        COLORS.textSoft,
      fontSize: 10,
      fontWeight: '600',
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
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    /* =====================================================
       SECURITY
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

export default LabReportsScreen;