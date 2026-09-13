/**
 * @file    DoctorDashboard.jsx
 * @module  Doctor
 * @desc    Doctor clinical dashboard and consultation launchpad.
 *          Prioritizes time-sensitive clinical work by allowing doctors
 *          to identify patients using QR or NIC, begin walk-in visits,
 *          start scheduled consultations, resume active consultations,
 *          review today's workload, inspect AI insights, and process
 *          unreviewed laboratory reports from one central workspace.
 *
 *          Prescribing is intentionally kept inside the consultation
 *          workspace so patient safety information remains available
 *          while medicines are selected.
 *
 * @author  Tharindu (S/21/166)
 */

import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  IdCard,
  LayoutList,
  Play,
  RefreshCw,
  ScanLine,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import toast from 'react-hot-toast';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import QRScanner from '../../components/common/QRScanner';

import {
  bookAppointment,
  updateAppointmentStatus,
} from '../../services/appointment.service';

import useAuthStore from '../../store/authStore';

const API_URL =
  'http://localhost:5000';

/**
 * Polling interval for time-sensitive dashboard information.
 *
 * Background refresh keeps the doctor's queue and active consultation
 * state reasonably current without requiring a manual page reload.
 */
const DASHBOARD_REFRESH_INTERVAL_MS =
  30000;

/**
 * Maps laboratory-report priority values to the existing
 * Badge severity model.
 */
const PRIORITY_MAPPING = {
  stat: 'severe',
  urgent: 'moderate',
  routine: 'mild',
  normal: 'mild',
};

/**
 * Patient finder modes.
 */
const FINDER_MODE = {
  HOME: 'home',
  QR: 'qr',
  NIC: 'nic',
  MANUAL_QR: 'manual_qr',
  CONFIRM: 'confirm',
};

/**
 * Converts a full name into initials for fallback avatars.
 *
 * Example:
 * "Nimasha Perera" -> "NP"
 */
const getInitials = (
  name
) => {
  if (!name) {
    return '?';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0].toUpperCase()
    )
    .join('');
};

/**
 * Formats a time value for quick clinical scanning.
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
    [],
    {
      hour:
        '2-digit',
      minute:
        '2-digit',
    }
  );
};

/**
 * Formats a date in a compact doctor-facing format.
 */
const formatDate = (
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

  return date.toLocaleDateString(
    'en-GB',
    {
      day:
        'numeric',
      month:
        'short',
      year:
        'numeric',
    }
  );
};

/**
 * Calculates patient age from date of birth.
 */
const calculateAge = (
  dateOfBirth
) => {
  if (!dateOfBirth) {
    return null;
  }

  const dob =
    new Date(
      dateOfBirth
    );

  if (
    Number.isNaN(
      dob.getTime()
    )
  ) {
    return null;
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const monthDifference =
    today.getMonth() -
    dob.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference ===
        0 &&
      today.getDate() <
        dob.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
};

/**
 * Converts a decoded patient QR payload into the Care4U QR identity.
 *
 * This supports:
 * - raw QR identifiers
 * - /lookup/:qrCodeId links
 * - complete URLs containing the lookup route
 *
 * Existing patient QR codes therefore continue working without
 * forcing a specific encoding format inside the dashboard.
 */
const normalizeQrCodeValue = (
  decodedValue
) => {
  const raw =
    decodedValue
      ?.trim();

  if (!raw) {
    return '';
  }

  try {

    const parsedUrl =
      new URL(raw);

    const parts =
      parsedUrl.pathname
        .split('/')
        .filter(Boolean);

    const lookupIndex =
      parts.findIndex(
        (part) =>
          part ===
          'lookup'
      );

    if (
      lookupIndex !==
        -1 &&
      parts[
        lookupIndex + 1
      ]
    ) {
      return decodeURIComponent(
        parts[
          lookupIndex + 1
        ]
      );
    }

    return decodeURIComponent(
      parts[
        parts.length - 1
      ] ||
      raw
    );

  } catch {

    const lookupMarker =
      '/lookup/';

    if (
      raw.includes(
        lookupMarker
      )
    ) {
      return decodeURIComponent(
        raw
          .split(
            lookupMarker
          )
          .pop()
          .split(/[?#]/)[0]
      );
    }

    return raw;
  }
};

/**
 * Reusable dashboard section heading.
 */
const SectionHeading = ({
  eyebrow,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">

      <div>

        {eyebrow && (
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-1">
            {eyebrow}
          </p>
        )}

        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {description}
          </p>
        )}

      </div>

      {action}

    </div>
  );
};

/**
 * Main doctor dashboard.
 */
const DoctorDashboard = () => {

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const DOCTOR_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const navigate =
    useNavigate();

  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const [
    doctor,
    setDoctor,
  ] = useState(null);

  const [
    stats,
    setStats,
  ] = useState(null);

  const [
    insights,
    setInsights,
  ] = useState(null);

  const [
    todayAppointments,
    setTodayAppointments,
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
  ] = useState(false);

  /* =========================================================
     LAB REPORT REVIEW
  ========================================================= */

  const [
    unreviewedReports,
    setUnreviewedReports,
  ] = useState([]);

  const [
    showLabModal,
    setShowLabModal,
  ] = useState(false);

  const [
    remarks,
    setRemarks,
  ] = useState({});

  const [
    reviewingId,
    setReviewingId,
  ] = useState(null);

  const [
    reviewError,
    setReviewError,
  ] = useState('');

  /* =========================================================
     PATIENT FINDER
  ========================================================= */

  const [
    showPatientFinder,
    setShowPatientFinder,
  ] = useState(false);

  const [
    finderMode,
    setFinderMode,
  ] = useState(
    FINDER_MODE.HOME
  );

  const [
    nicValue,
    setNicValue,
  ] = useState('');

  const [
    manualQrValue,
    setManualQrValue,
  ] = useState('');

  const [
    patientLookupLoading,
    setPatientLookupLoading,
  ] = useState(false);

  const [
    patientLookupError,
    setPatientLookupError,
  ] = useState('');

  const [
    selectedPatient,
    setSelectedPatient,
  ] = useState(null);

  const [
    startingWalkIn,
    setStartingWalkIn,
  ] = useState(false);

  /**
   * Existing in-progress consultation for the
   * patient currently selected in the finder.
   *
   * When present, Care4U resumes this appointment
   * instead of creating another walk-in visit.
   */
  const [
    existingPatientConsultation,
    setExistingPatientConsultation,
  ] = useState(null);

  /**
   * Tracks the proactive duplicate-consultation
   * check shown during patient confirmation.
   */
  const [
    checkingActiveConsultation,
    setCheckingActiveConsultation,
  ] = useState(false);

  /* =========================================================
     APPOINTMENT ACTIONS
  ========================================================= */

  const [
    appointmentActionId,
    setAppointmentActionId,
  ] = useState(null);

  /**
   * Fetches dashboard information.
   *
   * silent=true is used by background refresh so the entire
   * dashboard does not flash a loading state every 30 seconds.
   */
  const fetchDashboardData =
    useCallback(
      async ({
        silent = false,
      } = {}) => {

        if (!DOCTOR_ID) {
          return;
        }

        try {

          if (silent) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            false
          );

          const [
            docRes,
            statsRes,
            insightsRes,
            labRes,
            appointmentsRes,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/api/doctors/${DOCTOR_ID}`,
                {
                  credentials:
                    'include',
                }
              ),

              fetch(
                `${API_URL}/api/doctors/${DOCTOR_ID}/dashboard-stats`,
                {
                  credentials:
                    'include',
                }
              ),

              fetch(
                `${API_URL}/api/doctors/${DOCTOR_ID}/ai-insights`,
                {
                  credentials:
                    'include',
                }
              ),

              fetch(
                `${API_URL}/api/doctors/${DOCTOR_ID}/unreviewed-lab-reports`,
                {
                  credentials:
                    'include',
                }
              ),

              fetch(
                `${API_URL}/api/doctors/${DOCTOR_ID}/appointments/today`,
                {
                  credentials:
                    'include',
                }
              ),
            ]);

          const [
            docData,
            statsData,
            insightsData,
            labData,
            appointmentsData,
          ] =
            await Promise.all([
              docRes.json(),
              statsRes.json(),
              insightsRes.json(),
              labRes.json(),
              appointmentsRes.json(),
            ]);

          setDoctor(
            docData.data ||
            null
          );

          setStats(
            statsData.data ||
            null
          );

          setInsights(
            insightsData.data ||
            null
          );

          setTodayAppointments(
            appointmentsData.data ||
            []
          );

          const reports =
            labData.data ||
            [];

          setUnreviewedReports(
            reports
          );

          /**
           * Pre-fill a safe default review remark.
           * Existing doctor workflow is preserved.
           */
          setRemarks(
            (previous) => {

              const defaults = {
                ...previous,
              };

              reports.forEach(
                (report) => {

                  if (
                    !defaults[
                      report.id
                    ]
                  ) {
                    defaults[
                      report.id
                    ] =
                      'Reviewed — no further action needed.';
                  }
                }
              );

              return defaults;
            }
          );

        } catch (err) {

          console.error(
            'Dashboard fetch error:',
            err
          );

          if (!silent) {
            setError(
              true
            );
          }

        } finally {

          if (silent) {
            setRefreshing(
              false
            );
          } else {
            setLoading(
              false
            );
          }
        }
      },
      [DOCTOR_ID]
    );

  /**
   * Initial dashboard load and quiet background refresh.
   */
  useEffect(() => {

    fetchDashboardData();

    const intervalId =
      setInterval(
        () => {

          fetchDashboardData({
            silent: true,
          });

        },
        DASHBOARD_REFRESH_INTERVAL_MS
      );

    return () =>
      clearInterval(
        intervalId
      );

  }, [fetchDashboardData]);

  /* =========================================================
     LAB REPORT REVIEW
  ========================================================= */

  /**
   * Marks one laboratory report as reviewed.
   */
  const handleMarkReviewed =
    async (
      reportId
    ) => {

      const remark =
        (
          remarks[
            reportId
          ] ||
          ''
        ).trim();

      if (!remark) {

        setReviewError(
          'Please add a short remark before marking as reviewed.'
        );

        return;
      }

      setReviewingId(
        reportId
      );

      setReviewError(
        ''
      );

      try {

        const response =
          await fetch(
            `${API_URL}/api/doctors/lab-reports/${reportId}/review`,
            {
              method:
                'PUT',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  remark,
                }),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            'Failed to mark report as reviewed'
          );
        }

        setUnreviewedReports(
          (previous) =>
            previous.filter(
              (report) =>
                report.id !==
                reportId
            )
        );

        toast.success(
          'Lab report marked as reviewed.'
        );

      } catch (err) {

        console.error(
          'Review lab report error:',
          err
        );

        setReviewError(
          err.message ||
          'Failed to save. Please try again.'
        );

      } finally {

        setReviewingId(
          null
        );
      }
    };

  /* =========================================================
     PATIENT FINDER HELPERS
  ========================================================= */

  /**
   * Resets transient patient finder information.
   */
  const resetPatientFinder =
    () => {

      setFinderMode(
        FINDER_MODE.HOME
      );

      setNicValue(
        ''
      );

      setManualQrValue(
        ''
      );

      setSelectedPatient(
        null
      );

      setExistingPatientConsultation(
        null
      );

      setCheckingActiveConsultation(
        false
      );

      setPatientLookupError(
        ''
      );

      setPatientLookupLoading(
        false
      );
    };

  /**
   * Opens the patient finder at its main selection screen.
   */
  const openPatientFinder =
    () => {

      resetPatientFinder();

      setShowPatientFinder(
        true
      );
    };

  /**
   * Closes and resets the patient finder.
   */
  const closePatientFinder =
    () => {

      setShowPatientFinder(
        false
      );

      resetPatientFinder();
    };

  /**
   * Checks whether the authenticated doctor already has
   * an in-progress consultation with the selected patient.
   *
   * The backend resolves the doctor from the authenticated
   * session, so the browser only needs to send patientId.
   *
   * This is a proactive UX check. The appointment booking
   * controller also performs the same protection server-side,
   * so duplicate prevention does not depend on this request.
   */
  const checkExistingActiveConsultation =
    async (
      patientId
    ) => {

      if (!patientId) {
        setExistingPatientConsultation(
          null
        );

        return null;
      }

      try {

        setCheckingActiveConsultation(
          true
        );

        setExistingPatientConsultation(
          null
        );

        const response =
          await fetch(
            `${API_URL}/api/appointments/active?patientId=${encodeURIComponent(patientId)}`,
            {
              method:
                'GET',

              credentials:
                'include',
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            'Unable to check active consultation.'
          );
        }

        const activeAppointment =
          result.data ||
          null;

        setExistingPatientConsultation(
          activeAppointment
        );

        return activeAppointment;

      } catch (err) {

        /**
         * Do not block patient entry if the proactive
         * check fails. The booking endpoint performs the
         * same duplicate protection before inserting.
         */
        console.warn(
          'Active consultation check warning:',
          err
        );

        setExistingPatientConsultation(
          null
        );

        return null;

      } finally {

        setCheckingActiveConsultation(
          false
        );
      }
    };

  /**
   * Retrieves a patient using Care4U QR identity.
   */
  const lookupPatientByQr =
    async (
      qrValue
    ) => {

      const normalizedQr =
        normalizeQrCodeValue(
          qrValue
        );

      if (!normalizedQr) {

        setPatientLookupError(
          'Please scan or enter a valid patient QR code.'
        );

        return;
      }

      try {

        setPatientLookupLoading(
          true
        );

        setPatientLookupError(
          ''
        );

        const response =
          await fetch(
            `${API_URL}/api/patients/qr/${encodeURIComponent(normalizedQr)}`,
            {
              credentials:
                'include',
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
            'Patient not found.'
          );
        }

        setSelectedPatient(
          result.data
        );

        setFinderMode(
          FINDER_MODE.CONFIRM
        );

        /**
         * Proactively check whether this patient already
         * has an active consultation with the doctor.
         */
        await checkExistingActiveConsultation(
          result.data.id
        );

      } catch (err) {

        console.error(
          'Patient QR lookup error:',
          err
        );

        setPatientLookupError(
          err.message ||
          'Patient could not be found using this QR code.'
        );

      } finally {

        setPatientLookupLoading(
          false
        );
      }
    };

  /**
   * Retrieves a patient using NIC.
   *
   * Backend access is limited to authenticated
   * pharmacist and doctor roles.
   */
  const lookupPatientByNic =
    async (
      event
    ) => {

      event?.preventDefault();

      const normalizedNic =
        nicValue.trim();

      if (!normalizedNic) {

        setPatientLookupError(
          'Please enter the patient NIC.'
        );

        return;
      }

      try {

        setPatientLookupLoading(
          true
        );

        setPatientLookupError(
          ''
        );

        const response =
          await fetch(
            `${API_URL}/api/patients/nic/${encodeURIComponent(normalizedNic)}`,
            {
              method:
                'GET',

              credentials:
                'include',
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
            'Patient not found.'
          );
        }

        setSelectedPatient(
          result.data
        );

        setFinderMode(
          FINDER_MODE.CONFIRM
        );

      } catch (err) {

        console.error(
          'Patient NIC lookup error:',
          err
        );

        setPatientLookupError(
          err.message ||
          'No patient could be found using this NIC.'
        );

      } finally {

        setPatientLookupLoading(
          false
        );
      }
    };

  /**
   * Handles a decoded camera QR value.
   */
  const handlePatientQrScan =
    async (
      decodedValue
    ) => {

      await lookupPatientByQr(
        decodedValue
      );
    };

  /**
   * Handles manual QR identity entry.
   */
  const handleManualQrLookup =
    async (
      event
    ) => {

      event.preventDefault();

      await lookupPatientByQr(
        manualQrValue
      );
    };

  /**
   * Creates a walk-in appointment for the confirmed
   * patient and immediately begins the consultation.
   *
   * The appointment is first created through the existing
   * booking service and then moved into in_progress.
   */
  const handleStartWalkInVisit =
    async () => {

      if (
        !selectedPatient?.id
      ) {
        return;
      }

      try {

        setStartingWalkIn(
          true
        );

        /**
         * If the proactive check already found an active
         * consultation, resume it immediately.
         */
        if (
          existingPatientConsultation?.id
        ) {

          const existingId =
            existingPatientConsultation.id;

          toast.success(
            `Active consultation found for ${selectedPatient.full_name || 'patient'}. Resuming it.`
          );

          closePatientFinder();

          navigate(
            `/doctor/consultation/${existingId}`
          );

          return;
        }

        const appointment =
          await bookAppointment({
            patientId:
              selectedPatient.id,

            doctorId:
              DOCTOR_ID,

            scheduledAt:
              new Date()
                .toISOString(),

            type:
              'opd',

            notes:
              'Walk-in consultation',
          });

        if (!appointment?.id) {
          throw new Error(
            'Appointment was created but no appointment ID was returned.'
          );
        }

        /**
         * If the backend returned an existing active
         * consultation, it is already in_progress.
         *
         * Newly-created walk-ins begin immediately rather
         * than remaining in scheduled state.
         */
        if (
          appointment.status !==
          'in_progress'
        ) {
          await updateAppointmentStatus(
            appointment.id,
            'in_progress'
          );

          toast.success(
            `Consultation started for ${selectedPatient.full_name || 'patient'}.`
          );

        } else {

          toast.success(
            `Existing active consultation found for ${selectedPatient.full_name || 'patient'}. Resuming it.`
          );
        }

        closePatientFinder();

        navigate(
          `/doctor/consultation/${appointment.id}`
        );

      } catch (err) {

        console.error(
          'Walk-in consultation start error:',
          err
        );

        setPatientLookupError(
          err.response
            ?.data
            ?.message ||
          err.message ||
          'Unable to start consultation.'
        );

      } finally {

        setStartingWalkIn(
          false
        );
      }
    };

  /* =========================================================
     APPOINTMENT ACTIONS
  ========================================================= */

  /**
   * Starts a previously scheduled consultation.
   */
  const handleStartScheduledConsultation =
    async (
      appointmentId
    ) => {

      if (!appointmentId) {
        return;
      }

      try {

        setAppointmentActionId(
          appointmentId
        );

        await updateAppointmentStatus(
          appointmentId,
          'in_progress'
        );

        navigate(
          `/doctor/consultation/${appointmentId}`
        );

      } catch (err) {

        console.error(
          'Start scheduled consultation error:',
          err
        );

        toast.error(
          err.response
            ?.data
            ?.message ||
          err.message ||
          'Unable to start consultation.'
        );

      } finally {

        setAppointmentActionId(
          null
        );
      }
    };

  /**
   * Opens an already active consultation.
   */
  const handleResumeConsultation =
    (
      appointmentId
    ) => {

      if (!appointmentId) {
        return;
      }

      navigate(
        `/doctor/consultation/${appointmentId}`
      );
    };

  /* =========================================================
     DERIVED DASHBOARD DATA
  ========================================================= */

  const unreviewedCount =
    unreviewedReports.length;

  /**
   * Active consultations are sorted oldest first so a doctor
   * can immediately resume the visit that is already underway.
   */
  const activeConsultations =
    useMemo(
      () =>
        todayAppointments
          .filter(
            (appointment) =>
              appointment.status ===
              'in_progress'
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                first.scheduled_at
              ) -
              new Date(
                second.scheduled_at
              )
          ),
      [todayAppointments]
    );

  const activeConsultation =
    activeConsultations[0] ||
    null;

  /**
   * Prefer the richer appointment row from today's queue
   * when identifying the next scheduled patient.
   */
  const nextScheduledPatient =
    useMemo(
      () => {

        const scheduled =
          todayAppointments
            .filter(
              (appointment) =>
                appointment.status ===
                'scheduled'
            )
            .sort(
              (
                first,
                second
              ) =>
                new Date(
                  first.scheduled_at
                ) -
                new Date(
                  second.scheduled_at
                )
            );

        return (
          scheduled[0] ||
          stats?.nextPatient ||
          null
        );
      },
      [
        todayAppointments,
        stats,
      ]
    );

  const STAT_CARDS = [
    {
      key:
        'total',

      label:
        "Today's Total",

      value:
        stats?.total ??
        0,

      icon:
        Users,

      color:
        'text-foreground',

      iconBg:
        'bg-secondary',

      iconColor:
        'text-muted-foreground',
    },
    {
      key:
        'pending',

      label:
        'Waiting',

      value:
        stats?.pending ??
        0,

      icon:
        Clock,

      color:
        'text-urgent-foreground',

      iconBg:
        'bg-urgent/10',

      iconColor:
        'text-urgent-foreground',
    },
    {
      key:
        'inProgress',

      label:
        'In Progress',

      value:
        stats?.inProgress ??
        0,

      icon:
        Activity,

      color:
        'text-primary',

      iconBg:
        'bg-primary/10',

      iconColor:
        'text-primary',
    },
    {
      key:
        'completed',

      label:
        'Completed',

      value:
        stats?.completed ??
        0,

      icon:
        CheckCircle2,

      color:
        'text-success',

      iconBg:
        'bg-success/10',

      iconColor:
        'text-success',
    },
  ];

  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">

        <div className="flex flex-col items-center gap-3">

          <Spinner
            size="lg"
          />

          <p className="text-sm font-medium text-muted-foreground">
            Preparing today's clinical workspace...
          </p>

        </div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">

        <div className="max-w-md w-full">

          <Alert
            type="error"
            message="Failed to load the doctor dashboard. Please try again."
          />

          <div className="mt-4 flex justify-center">

            <Button
              variant="primary"
              onClick={() =>
                fetchDashboardData()
              }
            >
              <RefreshCw
                size={16}
                className="mr-2"
              />

              Try Again
            </Button>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* =====================================================
            PRIMARY CLINICAL ACTION
        ====================================================== */}
        <section className="mb-8">

          <div className="relative overflow-hidden bg-card border border-primary/20 rounded-2xl shadow-sm">

            {/* Accent */}
            <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />

            <div className="p-5 sm:p-7">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                <div className="flex items-start gap-4 max-w-2xl">

                  <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">

                    <ScanLine
                      size={24}
                    />

                  </div>

                  <div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                      Fast Patient Entry
                    </p>

                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                      Find Patient & Start Consultation
                    </h2>

                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Scan the patient's Care4U QR code or use NIC fallback. Confirm identity once, then open the complete consultation workspace immediately.
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">

                      <span className="flex items-center gap-1.5">

                        <CheckCircle2
                          size={13}
                          className="text-success"
                        />

                        Patient confirmation

                      </span>

                      <span className="flex items-center gap-1.5">

                        <CheckCircle2
                          size={13}
                          className="text-success"
                        />

                        Walk-in visit creation

                      </span>

                      <span className="flex items-center gap-1.5">

                        <CheckCircle2
                          size={13}
                          className="text-success"
                        />

                        Direct consultation entry

                      </span>

                    </div>

                  </div>

                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={
                    openPatientFinder
                  }
                  className="w-full lg:w-auto shrink-0"
                >
                  <ScanLine
                    size={18}
                    className="mr-2"
                  />

                  Find Patient
                </Button>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            TODAY'S OVERVIEW
        ====================================================== */}
        <section className="mb-8">

          <SectionHeading
            eyebrow="Today"
            title="Clinical Overview"
            description="A quick view of today's workload and consultation progress."
            action={(
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/doctor/queue'
                  )
                }
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Open full queue

                <ArrowRight
                  size={14}
                />
              </button>
            )}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

            {STAT_CARDS.map(
              ({
                key,
                label,
                value,
                icon,
                color,
                iconBg,
                iconColor,
              }) => (

                <div
                  key={key}
                  className="group bg-card rounded-xl shadow-sm border border-border p-4 sm:p-5 flex items-center justify-between hover:shadow-md transition-shadow"
                >

                  <div>

                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      {label}
                    </p>

                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${color}`}>
                      {value}
                    </p>

                  </div>

                  <div
                    className={`${iconBg} ${iconColor} rounded-xl p-2.5 shrink-0`}
                  >

                    {createElement(
                      icon,
                      {
                        size:
                          20,
                      }
                    )}

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* =====================================================
            NEXT / ACTIVE CONSULTATION
        ====================================================== */}
        <section className="mb-8">

          <SectionHeading
            eyebrow="Patient Flow"
            title="What Needs Attention"
            description="Start the next scheduled patient or return to a consultation already in progress."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Active consultation */}
            <div
              className={`relative overflow-hidden rounded-2xl border shadow-sm ${
                activeConsultation
                  ? 'bg-primary/5 border-primary/25'
                  : 'bg-card border-border'
              }`}
            >

              {activeConsultation && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
              )}

              <div className="p-5 sm:p-6">

                <div className="flex items-center gap-2 mb-4">

                  <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">

                    <Activity
                      size={18}
                    />

                  </span>

                  <div>

                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary">
                      Active
                    </p>

                    <h3 className="text-lg font-bold text-foreground">
                      Current Consultation
                    </h3>

                  </div>

                </div>

                {activeConsultation ? (

                  <div>

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(
                          activeConsultation
                            .patient_name
                        )}
                      </div>

                      <div className="min-w-0">

                        <p className="text-lg font-bold text-foreground truncate">
                          {
                            activeConsultation
                              .patient_name
                          }
                        </p>

                        <p className="text-sm text-muted-foreground mt-0.5">

                          {formatTime(
                            activeConsultation
                              .scheduled_at
                          )}

                          {' · '}

                          {activeConsultation
                            .type
                            ?.toUpperCase() ||
                            'VISIT'}

                        </p>

                      </div>

                    </div>

                    <Button
                      variant="primary"
                      className="w-full mt-5"
                      onClick={() =>
                        handleResumeConsultation(
                          activeConsultation.id
                        )
                      }
                    >
                      <Stethoscope
                        size={16}
                        className="mr-2"
                      />

                      Resume Consultation
                    </Button>

                  </div>

                ) : (

                  <div className="py-4">

                    <CheckCircle2
                      size={28}
                      className="text-success/70"
                    />

                    <p className="text-sm font-semibold text-foreground mt-3">
                      No consultation currently in progress
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Start the next scheduled patient or identify a walk-in patient.
                    </p>

                  </div>

                )}

              </div>

            </div>

            {/* Next patient */}
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm">

              <div className="p-5 sm:p-6">

                <div className="flex items-center gap-2 mb-4">

                  <span className="w-9 h-9 rounded-xl bg-secondary text-primary flex items-center justify-center">

                    <CalendarClock
                      size={18}
                    />

                  </span>

                  <div>

                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      Scheduled
                    </p>

                    <h3 className="text-lg font-bold text-foreground">
                      Next Patient
                    </h3>

                  </div>

                </div>

                {nextScheduledPatient ? (

                  <div>

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(
                          nextScheduledPatient
                            .patient_name
                        )}
                      </div>

                      <div className="min-w-0">

                        <p className="text-lg font-bold text-foreground truncate">
                          {
                            nextScheduledPatient
                              .patient_name
                          }
                        </p>

                        <p className="text-sm text-muted-foreground mt-0.5">

                          {formatTime(
                            nextScheduledPatient
                              .scheduled_at
                          )}

                          {' · '}

                          {nextScheduledPatient
                            .type
                            ?.toUpperCase() ||
                            'VISIT'}

                        </p>

                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">

                      <Button
                        variant="primary"
                        loading={
                          appointmentActionId ===
                          nextScheduledPatient.id
                        }
                        disabled={
                          !!activeConsultation &&
                          activeConsultation.id !==
                            nextScheduledPatient.id
                        }
                        onClick={() =>
                          handleStartScheduledConsultation(
                            nextScheduledPatient.id
                          )
                        }
                      >
                        <Play
                          size={15}
                          className="mr-2"
                        />

                        Start Consultation
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(
                            '/doctor/queue'
                          )
                        }
                      >
                        <LayoutList
                          size={15}
                          className="mr-2"
                        />

                        View Queue
                      </Button>

                    </div>

                    {activeConsultation &&
                      activeConsultation.id !==
                        nextScheduledPatient.id && (

                      <p className="text-xs text-urgent-foreground mt-3 flex items-start gap-1.5">

                        <AlertTriangle
                          size={13}
                          className="shrink-0 mt-0.5"
                        />

                        Finish or resume the active consultation before starting another patient.

                      </p>

                    )}

                  </div>

                ) : (

                  <div className="py-4">

                    <CheckCircle2
                      size={28}
                      className="text-success/70"
                    />

                    <p className="text-sm font-semibold text-foreground mt-3">
                      No waiting scheduled patients
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Today's scheduled queue is currently clear.
                    </p>

                  </div>

                )}

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            QUICK ACCESS + AI INSIGHTS
        ====================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-5 mb-8">

          {/* Quick access */}
          <div>

            <SectionHeading
              eyebrow="Navigation"
              title="Quick Access"
            />

            <div className="space-y-3">

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/doctor/queue'
                  )
                }
                className="group w-full bg-card rounded-xl shadow-sm border border-border p-4 text-left hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4"
              >

                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">

                  <CalendarClock
                    size={20}
                  />

                </div>

                <div className="flex-1">

                  <p className="text-sm font-bold text-foreground">
                    Today's Appointment Queue
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage scheduled, active, and completed consultations
                  </p>

                </div>

                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                />

              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/doctor/profile'
                  )
                }
                className="group w-full bg-card rounded-xl shadow-sm border border-border p-4 text-left hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4"
              >

                <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">

                  <UserRound
                    size={20}
                  />

                </div>

                <div className="flex-1">

                  <p className="text-sm font-bold text-foreground">
                    Doctor Profile
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review professional details and availability
                  </p>

                </div>

                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                />

              </button>

              <button
                type="button"
                onClick={() =>
                  setShowLabModal(
                    true
                  )
                }
                className="group w-full bg-card rounded-xl shadow-sm border border-border p-4 text-left hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4"
              >

                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    unreviewedCount >
                    0
                      ? 'bg-urgent/10 text-urgent-foreground'
                      : 'bg-secondary text-primary'
                  }`}
                >

                  <FileText
                    size={20}
                  />

                </div>

                <div className="flex-1">

                  <div className="flex items-center gap-2">

                    <p className="text-sm font-bold text-foreground">
                      Lab Reports
                    </p>

                    {unreviewedCount >
                      0 && (

                      <span className="px-2 py-0.5 rounded-full bg-urgent/10 text-urgent-foreground text-[10px] font-bold">
                        {
                          unreviewedCount
                        } pending
                      </span>

                    )}

                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review outstanding laboratory results
                  </p>

                </div>

                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                />

              </button>

            </div>

          </div>

          {/* AI insights */}
          <div>

            <SectionHeading
              eyebrow="Clinical Support"
              title="AI Insights"
              description="Automatically surfaced patterns from today's available clinical information."
            />

            <div className="bg-card relative overflow-hidden rounded-2xl shadow-sm border border-border p-5 sm:p-6 min-h-[220px]">

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/20" />

              <div className="flex items-center gap-2 mb-4">

                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">

                  <Sparkles
                    size={18}
                    className="text-primary"
                  />

                </div>

                <div>

                  <p className="text-sm font-bold text-foreground">
                    Today's Clinical Signals
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    Decision support — verify against patient records
                  </p>

                </div>

              </div>

              {insights?.insights &&
              insights.insights.length >
                0 ? (

                <ul className="space-y-3">

                  {insights.insights.map(
                    (
                      item,
                      index
                    ) => (

                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-3 bg-secondary/35 rounded-xl p-3"
                      >

                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />

                        <span className="leading-relaxed">
                          {item}
                        </span>

                      </li>

                    )
                  )}

                </ul>

              ) : (

                <div className="flex flex-col items-center justify-center text-center py-8">

                  <Sparkles
                    size={28}
                    className="text-muted-foreground/30"
                  />

                  <p className="text-sm font-medium text-muted-foreground mt-3">
                    {insights?.note ||
                      'No clinical insights available yet.'}
                  </p>

                </div>

              )}

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          PATIENT FINDER MODAL
      ====================================================== */}
      <Modal
        isOpen={
          showPatientFinder
        }
        onClose={
          closePatientFinder
        }
        title="Find Patient"
        size="lg"
      >

        <div className="min-h-[360px]">

          {/* Global finder error */}
          {patientLookupError && (

            <div className="mb-4">

              <Alert
                type="error"
                message={
                  patientLookupError
                }
              />

            </div>

          )}

          {/* ===============================================
              FINDER HOME
          ================================================ */}
          {finderMode ===
            FINDER_MODE.HOME && (

            <div>

              <div className="mb-6">

                <p className="text-sm font-semibold text-foreground">
                  Identify the patient before starting a consultation.
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  QR scanning is fastest. NIC and manual QR entry remain available when the camera cannot be used.
                </p>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Camera QR */}
                <button
                  type="button"
                  onClick={() => {

                    setPatientLookupError(
                      ''
                    );

                    setFinderMode(
                      FINDER_MODE.QR
                    );
                  }}
                  className="group relative overflow-hidden border-2 border-primary/20 bg-primary/5 hover:border-primary/50 rounded-2xl p-5 text-left transition-all"
                >

                  <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">

                    <Camera
                      size={21}
                    />

                  </div>

                  <p className="text-base font-bold text-foreground">
                    Scan Patient QR
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Use the camera to scan the patient's Care4U identity QR code.
                  </p>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-4">

                    Recommended

                    <ChevronRight
                      size={13}
                      className="group-hover:translate-x-1 transition-transform"
                    />

                  </span>

                </button>

                {/* NIC */}
                <button
                  type="button"
                  onClick={() => {

                    setPatientLookupError(
                      ''
                    );

                    setFinderMode(
                      FINDER_MODE.NIC
                    );
                  }}
                  className="group border border-border bg-card hover:border-primary/40 rounded-2xl p-5 text-left transition-all"
                >

                  <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center mb-4">

                    <IdCard
                      size={21}
                    />

                  </div>

                  <p className="text-base font-bold text-foreground">
                    Search by NIC
                  </p>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Secure fallback when a QR code is damaged, unavailable, or cannot be scanned.
                  </p>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-4">

                    Search NIC

                    <ChevronRight
                      size={13}
                      className="group-hover:translate-x-1 transition-transform"
                    />

                  </span>

                </button>

              </div>

              {/* Manual QR */}
              <button
                type="button"
                onClick={() => {

                  setPatientLookupError(
                    ''
                  );

                  setFinderMode(
                    FINDER_MODE.MANUAL_QR
                  );
                }}
                className="w-full mt-4 flex items-center justify-between gap-4 border border-dashed border-border rounded-xl p-4 hover:border-primary/40 hover:bg-secondary/30 transition-colors text-left"
              >

                <div className="flex items-center gap-3">

                  <ScanLine
                    size={17}
                    className="text-muted-foreground"
                  />

                  <div>

                    <p className="text-sm font-semibold text-foreground">
                      Enter QR code manually
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Useful when the patient provides the QR identity as text.
                    </p>

                  </div>

                </div>

                <ChevronRight
                  size={17}
                  className="text-muted-foreground"
                />

              </button>

            </div>

          )}

          {/* ===============================================
              CAMERA QR SCANNER
          ================================================ */}
          {finderMode ===
            FINDER_MODE.QR && (

            <div>

              {patientLookupLoading ? (

                <div className="py-16 flex flex-col items-center">

                  <Spinner
                    size="lg"
                  />

                  <p className="text-sm text-muted-foreground mt-3">
                    Verifying patient...
                  </p>

                </div>

              ) : (

                <QRScanner
                  title="Scan Patient Identity QR"
                  description="Point the camera at the patient's Care4U QR code. The camera closes automatically after a successful scan."
                  onScan={
                    handlePatientQrScan
                  }
                  onClose={() => {

                    setPatientLookupError(
                      ''
                    );

                    setFinderMode(
                      FINDER_MODE.HOME
                    );
                  }}
                />

              )}

            </div>

          )}

          {/* ===============================================
              NIC LOOKUP
          ================================================ */}
          {finderMode ===
            FINDER_MODE.NIC && (

            <div>

              <button
                type="button"
                onClick={() => {

                  setPatientLookupError(
                    ''
                  );

                  setFinderMode(
                    FINDER_MODE.HOME
                  );
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-5"
              >
                <X
                  size={13}
                />

                Choose another method
              </button>

              <div className="max-w-xl mx-auto py-5">

                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">

                  <IdCard
                    size={23}
                  />

                </div>

                <h3 className="text-lg font-bold text-foreground">
                  Search Patient by NIC
                </h3>

                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Enter the NIC exactly as registered in Care4U.
                </p>

                <form
                  onSubmit={
                    lookupPatientByNic
                  }
                  className="space-y-4"
                >

                  <Input
                    label="Patient NIC"
                    value={
                      nicValue
                    }
                    placeholder="e.g. 200012345678"
                    autoFocus
                    disabled={
                      patientLookupLoading
                    }
                    onChange={
                      (event) => {

                        setNicValue(
                          event.target.value
                        );

                        setPatientLookupError(
                          ''
                        );
                      }
                    }
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={
                      patientLookupLoading
                    }
                    disabled={
                      !nicValue.trim()
                    }
                  >
                    <Search
                      size={16}
                      className="mr-2"
                    />

                    Search Patient
                  </Button>

                </form>

              </div>

            </div>

          )}

          {/* ===============================================
              MANUAL QR LOOKUP
          ================================================ */}
          {finderMode ===
            FINDER_MODE.MANUAL_QR && (

            <div>

              <button
                type="button"
                onClick={() => {

                  setPatientLookupError(
                    ''
                  );

                  setFinderMode(
                    FINDER_MODE.HOME
                  );
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-5"
              >

                <X
                  size={13}
                />

                Choose another method

              </button>

              <div className="max-w-xl mx-auto py-5">

                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">

                  <ScanLine
                    size={23}
                  />

                </div>

                <h3 className="text-lg font-bold text-foreground">
                  Enter Patient QR Identity
                </h3>

                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Paste the QR identifier or a complete Care4U patient lookup link.
                </p>

                <form
                  onSubmit={
                    handleManualQrLookup
                  }
                  className="space-y-4"
                >

                  <Input
                    label="Patient QR Code"
                    value={
                      manualQrValue
                    }
                    placeholder="QR ID or patient lookup URL"
                    autoFocus
                    disabled={
                      patientLookupLoading
                    }
                    onChange={
                      (event) => {

                        setManualQrValue(
                          event.target.value
                        );

                        setPatientLookupError(
                          ''
                        );
                      }
                    }
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={
                      patientLookupLoading
                    }
                    disabled={
                      !manualQrValue.trim()
                    }
                  >
                    <Search
                      size={16}
                      className="mr-2"
                    />

                    Find Patient
                  </Button>

                </form>

              </div>

            </div>

          )}

          {/* ===============================================
              PATIENT CONFIRMATION
          ================================================ */}
          {finderMode ===
            FINDER_MODE.CONFIRM &&
            selectedPatient && (

            <div>

              <div className="mb-5">

                <div className="flex items-center gap-2 text-success">

                  <CheckCircle2
                    size={18}
                  />

                  <p className="text-sm font-bold">
                    Patient identified
                  </p>

                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  Confirm these details before opening the patient's consultation.
                </p>

              </div>

              <div className="border border-border bg-card rounded-2xl overflow-hidden">

                <div className="bg-brand-deep p-5">

                  <div className="flex items-center gap-4">

                    {selectedPatient.photo_url ? (

                      <img
                        src={
                          selectedPatient
                            .photo_url
                        }
                        alt="Patient"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shrink-0"
                      />

                    ) : (

                      <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 text-brand-deep-foreground flex items-center justify-center font-bold text-lg shrink-0">
                        {getInitials(
                          selectedPatient
                            .full_name
                        )}
                      </div>

                    )}

                    <div className="min-w-0">

                      <p className="text-xl font-bold text-brand-deep-foreground truncate">
                        {
                          selectedPatient
                            .full_name
                        }
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-brand-deep-foreground/70">

                        {selectedPatient
                          .date_of_birth && (

                          <span>
                            {calculateAge(
                              selectedPatient
                                .date_of_birth
                            )}{' '}
                            years
                          </span>

                        )}

                        {selectedPatient
                          .gender && (

                          <span className="capitalize">
                            {
                              selectedPatient
                                .gender
                            }
                          </span>

                        )}

                        {selectedPatient
                          .blood_group && (

                          <span className="font-bold">
                            Blood{' '}
                            {
                              selectedPatient
                                .blood_group
                            }
                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

                <div className="p-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                        NIC
                      </p>

                      <p className="text-sm font-semibold text-foreground mt-1">
                        {
                          selectedPatient
                            .nic ||
                          '—'
                        }
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                        UHI
                      </p>

                      <p className="text-sm font-semibold text-foreground mt-1">
                        {
                          selectedPatient
                            .uhi ||
                          '—'
                        }
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                        Date of Birth
                      </p>

                      <p className="text-sm font-semibold text-foreground mt-1">
                        {formatDate(
                          selectedPatient
                            .date_of_birth
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                        QR Identity
                      </p>

                      <p className="text-xs font-mono font-semibold text-foreground mt-1 break-all">
                        {
                          selectedPatient
                            .qr_code_id ||
                          '—'
                        }
                      </p>

                    </div>

                  </div>

                  {checkingActiveConsultation ? (

                    <div className="mt-5 p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">

                      <Spinner
                        size="sm"
                      />

                      <div>

                        <p className="text-xs font-bold text-foreground">
                          Checking active consultations...
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          Care4U is checking whether this patient already has an active visit with you.
                        </p>

                      </div>

                    </div>

                  ) : existingPatientConsultation ? (

                    <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20">

                      <div className="flex items-start gap-3">

                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">

                          <Activity
                            size={17}
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-foreground">
                            Active consultation already exists
                          </p>

                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            This patient already has an in-progress consultation with you. Care4U will resume that visit instead of creating a duplicate appointment.
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">

                            <span className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-muted-foreground">

                              <Clock
                                size={11}
                              />

                              Started{' '}
                              {formatTime(
                                existingPatientConsultation.scheduled_at
                              )}

                            </span>

                            <span className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1 text-muted-foreground">

                              <Stethoscope
                                size={11}
                              />

                              {existingPatientConsultation.type
                                ?.toUpperCase() ||
                                'VISIT'}

                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="mt-5 p-3 rounded-xl bg-urgent/5 border border-urgent/20 flex items-start gap-2">

                      <AlertTriangle
                        size={15}
                        className="text-urgent-foreground shrink-0 mt-0.5"
                      />

                      <p className="text-xs text-muted-foreground">
                        Verify the patient's identity verbally before starting the consultation. A new walk-in appointment will be created for this patient.
                      </p>

                    </div>

                  )}

                </div>

              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-5">

                <Button
                  variant="secondary"
                  disabled={
                    startingWalkIn
                  }
                  onClick={() => {

                    setSelectedPatient(
                      null
                    );

                    setExistingPatientConsultation(
                      null
                    );

                    setCheckingActiveConsultation(
                      false
                    );

                    setPatientLookupError(
                      ''
                    );

                    setFinderMode(
                      FINDER_MODE.HOME
                    );
                  }}
                >
                  Wrong Patient
                </Button>

                <Button
                  variant="primary"
                  loading={
                    startingWalkIn
                  }
                  disabled={
                    checkingActiveConsultation
                  }
                  onClick={
                    handleStartWalkInVisit
                  }
                >
                  {existingPatientConsultation ? (

                    <Activity
                      size={16}
                      className="mr-2"
                    />

                  ) : (

                    <Stethoscope
                      size={16}
                      className="mr-2"
                    />

                  )}

                  {checkingActiveConsultation
                    ? 'Checking Existing Visit...'
                    : existingPatientConsultation
                      ? 'Resume Existing Consultation'
                      : 'Confirm & Start Consultation'}
                </Button>

              </div>

            </div>

          )}

        </div>

      </Modal>

      {/* =====================================================
          LAB REPORT REVIEW MODAL
      ====================================================== */}
      <Modal
        isOpen={
          showLabModal
        }
        onClose={() => {

          setShowLabModal(
            false
          );

          setReviewError(
            ''
          );
        }}
        title={`Unreviewed Lab Reports ${
          unreviewedCount >
          0
            ? `(${unreviewedCount})`
            : ''
        }`}
        size="lg"
      >

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">

          {reviewError && (

            <Alert
              type="error"
              message={
                reviewError
              }
            />

          )}

          {unreviewedReports
            .length ===
            0 ? (

            <div className="text-center py-10 flex flex-col items-center">

              <CheckCircle2
                className="text-success mb-3"
                size={36}
              />

              <p className="text-foreground font-bold">
                All caught up
              </p>

              <p className="text-muted-foreground text-sm font-medium mt-1">
                No unreviewed lab reports.
              </p>

            </div>

          ) : (

            unreviewedReports.map(
              (
                report
              ) => (

                <div
                  key={
                    report.id
                  }
                  className="border border-border bg-secondary/30 rounded-xl p-4"
                >

                  <div className="flex items-start justify-between gap-4 mb-3">

                    <div>

                      <p className="font-bold text-foreground">
                        {
                          report
                            .patient_name
                        }
                      </p>

                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        {
                          report
                            .test_type
                        }
                      </p>

                    </div>

                    <Badge
                      severity={
                        PRIORITY_MAPPING[
                          report.priority
                        ] ||
                        'mild'
                      }
                      label={
                        report.priority
                      }
                    />

                  </div>

                  <div className="bg-card border border-border rounded-lg p-3 mb-4">

                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                      {
                        report
                          .findings
                      }
                    </p>

                  </div>

                  {report.report_url && (

                    <a
                      href={
                        report
                          .report_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline mb-4 inline-block"
                    >
                      View full report
                    </a>

                  )}

                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-2">

                    <div className="flex-1">

                      <Input
                        label=""
                        value={
                          remarks[
                            report.id
                          ] ||
                          ''
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setRemarks(
                              (
                                previous
                              ) => ({
                                ...previous,

                                [report.id]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                        }
                        placeholder="Add a remark before marking reviewed..."
                      />

                    </div>

                    <Button
                      onClick={() =>
                        handleMarkReviewed(
                          report.id
                        )
                      }
                      loading={
                        reviewingId ===
                        report.id
                      }
                      variant="primary"
                      className="whitespace-nowrap"
                    >
                      Mark Reviewed
                    </Button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </Modal>

    </div>
  );
};

export default DoctorDashboard;