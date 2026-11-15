/**
 * @file    HospitalEmergencyPage.jsx
 * @module  Hospital
 * @desc    Emergency operations page for authenticated hospital staff.
 *          Displays active SOS alerts, audited Break-Glass access,
 *          emergency locations, contacts, and alert resolution actions.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Droplet,
  ExternalLink,
  MapPin,
  Phone,
  Radio,
  RefreshCw,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

/**
 * Converts a patient name into compact initials for the
 * emergency alert avatar fallback.
 *
 * @param {string} name - Patient full name
 * @returns {string} Patient initials
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
        part[0]
          .toUpperCase()
    )
    .join('');
};

/**
 * Formats an emergency alert time for fast scanning.
 *
 * @param {string} value - Alert timestamp
 * @returns {string} Formatted local time
 */
const formatAlertTime = (
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
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );
};

/**
 * @component HospitalEmergencyPage
 * @desc      Displays live emergency alerts for authenticated
 *            hospital staff and provides audited emergency actions.
 */
const HospitalEmergencyPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [accessingId, setAccessingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotPatientId, setSnapshotPatientId] = useState(null);
  const [accessReason, setAccessReason] = useState('');
  const [alertToResolve, setAlertToResolve] = useState(null);

  const navigate = useNavigate();

  /**
   * Retrieves active emergency alerts from the backend.
   *
   * @param {boolean} isBackground - Whether the request is a background poll
   * @returns {Promise<void>}
   */
  const fetchAlerts = async (isBackground = false) => {
    try {
      // Background polling suppresses repeated network-error alerts; manual loads show the failure.
      if (!isBackground) {
        setLoadError('');
      }

      const response = await api.get(
        '/api/emergencies/alerts'
      );

      if (response.data.success) {
        setAlerts(
          response.data.data || []
        );

        setLoadError('');
      }

    } catch (error) {
      console.error(
        'Error fetching alerts:',
        error
      );

      if (!isBackground) {
        const message =
          error.response?.data?.message ||
          'Failed to load active emergencies';

        setLoadError(
          message
        );

        toast.error(
          message
        );
      }

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh active alerts every ten seconds; clear the timer when the dashboard unmounts.
  useEffect(() => {
    fetchAlerts();

    const intervalId = setInterval(
      () => {
        fetchAlerts(true);
      },
      10000
    );

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /**
   * Marks an active emergency alert as resolved.
   *
   * @param {string} alertId - UUID of the emergency alert
   * @returns {Promise<void>}
   */
  const handleResolve = async (alertId) => {
    if (!alertId) {
      return;
    }

    // Disable repeated resolve clicks while the chosen alert is being updated.
    setResolvingId(alertId);

    try {
      const response = await api.patch(
        `/api/emergencies/alerts/${alertId}/resolve`
      );

      if (response.data.success) {
        toast.success(
          'Emergency marked as resolved'
        );

        setAlerts(
          (previousAlerts) =>
            previousAlerts.filter(
              (alert) =>
                alert.alert_id !== alertId
            )
        );

        setAlertToResolve(null);
      }

    } catch (error) {
      console.error(
        'Error resolving alert:',
        error
      );

      toast.error(
        error.response?.data?.message ||
        'Failed to resolve alert'
      );

    } finally {
      setResolvingId(null);
    }
  };

  /**
   * Opens the audited Break-Glass reason form.
   *
   * @param {string} patientId - UUID of the patient
   * @returns {void}
   */
  const openSnapshotAccess = (patientId) => {
    setSnapshotPatientId(
      patientId
    );

    setAccessReason(
      ''
    );
  };

  /**
   * Records the required Break-Glass reason before opening
   * the minimal emergency patient snapshot.
   *
   * @returns {Promise<void>}
   */
  const handleAccessSnapshot = async () => {
    // Require a nonempty medical reason before recording Break-Glass emergency access.
    const reason =
      accessReason.trim();

    if (
      !snapshotPatientId ||
      !reason
    ) {
      toast.error(
        'Medical reason is required for the audit log.'
      );

      return;
    }

    setAccessingId(
      snapshotPatientId
    );

    try {
      const response = await api.post(
        '/api/emergencies/access-logs',
        {
          patientId:
            snapshotPatientId,
          reason
        }
      );

      if (response.data.success) {
        toast.success(
          'Access logged securely.'
        );

        const patientId =
          snapshotPatientId;

        setSnapshotPatientId(
          null
        );

        setAccessReason(
          ''
        );

        // Open the snapshot only after the backend logs access and saves the temporary session grant.
        navigate(
          `/hospital/emergency/snapshot/${patientId}`
        );
      }

    } catch (error) {
      console.error(
        'Error logging access:',
        error
      );

      toast.error(
        error.response?.data?.message ||
        'Failed to authorize access'
      );

    } finally {
      setAccessingId(
        null
      );
    }
  };

  /**
   * Count alerts that include both coordinates for the dashboard summary.
   */
  const locationCount =
    useMemo(
      () =>
        alerts.filter(
          (alert) =>
            alert.latitude &&
            alert.longitude
        ).length,
      [alerts]
    );

  /**
   * Count alerts that include an emergency contact phone number.
   */
  const contactCount =
    useMemo(
      () =>
        alerts.filter(
          (alert) =>
            alert.emergency_contact_phone
        ).length,
      [alerts]
    );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#F6F8FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center shadow-sm">
            <Activity
              className="animate-pulse"
              size={29}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              Loading emergency operations
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Connecting to the live Care4U SOS feed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F6F8FA]">

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 sm:pt-8">

        <PageHeader
          eyebrow="Hospital Emergency"
          title="Emergency Operations"
          description="Monitor live SOS alerts, review patient locations and contacts, use audited Break-Glass access, and close incidents after emergency care has been coordinated."
          icon={Activity}
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/hospital/dashboard'
                  )
                }
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setRefreshing(true);
                  fetchAlerts(false);
                }}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>
            </div>
          }
          meta={
            <div className="flex items-center gap-3">

              <div className="relative w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                <Radio size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-red-600">
                  Live SOS Feed
                </p>

                <p className="text-sm font-bold text-foreground mt-0.5">
                  Every 10 seconds
                </p>
              </div>

            </div>
          }
        />

      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-7 sm:py-8">

        {loadError && (

          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <ShieldAlert size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground">
                    Emergency feed unavailable
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    {loadError}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setRefreshing(true);
                  fetchAlerts(false);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <RefreshCw size={15} />
                Retry Feed
              </button>

            </div>

          </div>

        )}

        {/* =====================================================
            EMERGENCY SUMMARY
        ====================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="rounded-2xl bg-white border border-border/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Active SOS
                </p>
                <p className="text-3xl font-black text-red-600 tracking-tight mt-2">
                  {alerts.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open emergency alerts
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-border/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  GPS Available
                </p>
                <p className="text-3xl font-black text-foreground tracking-tight mt-2">
                  {locationCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alerts with coordinates
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <MapPin size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-border/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Contacts Ready
                </p>
                <p className="text-3xl font-black text-foreground tracking-tight mt-2">
                  {contactCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Emergency contacts available
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Phone size={20} />
              </div>
            </div>
          </div>

        </section>

        {/* =====================================================
            ACTIVE ALERTS
        ====================================================== */}
        <section>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">
                Live Response Queue
              </p>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                Active Emergency Alerts
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Prioritize active alerts, verify location and contact details, then access only the minimum emergency information required.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-white border border-border px-3.5 py-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>

              <span className="text-xs font-bold text-foreground">
                {alerts.length} live
              </span>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="bg-white border border-border/70 rounded-2xl shadow-[0_8px_26px_rgba(15,23,42,0.04)] p-10 md:p-14 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CheckCircle2 size={38} />
              </div>

              <h2 className="text-2xl font-bold text-foreground">
                No active emergencies
              </h2>

              <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                There are currently no active SOS alerts. Care4U will continue monitoring the emergency feed automatically.
              </p>

              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 border border-border px-3 py-1.5 mt-5">
                <Radio size={13} className="text-cyan-700" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Monitoring remains active
                </span>
              </div>
            </div>

          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {alerts.map((alert) => (
                <article
                  key={alert.alert_id}
                  className="group relative overflow-hidden bg-white border border-border/70 rounded-2xl shadow-[0_8px_26px_rgba(15,23,42,0.045)] hover:shadow-[0_15px_38px_rgba(15,23,42,0.075)] transition-all"
                >

                  <div className="absolute inset-y-0 left-0 w-1.5 bg-red-500" />

                  <div className="p-5 sm:p-6 pl-6 sm:pl-7">

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">

                      <div className="flex items-start gap-4 min-w-0">

                        <div className="w-12 h-12 rounded-2xl bg-[#12344D] text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm">
                          {getInitials(
                            alert.full_name
                          )}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              Active SOS
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 border border-border px-2.5 py-1 text-[9px] font-bold text-muted-foreground">
                              <Clock3 size={11} />
                              {formatAlertTime(
                                alert.alert_time
                              )}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-foreground mt-2 truncate">
                            {alert.full_name || 'Unknown Patient'}
                          </h3>

                          <p className="text-xs text-muted-foreground mt-1">
                            Emergency alert received through Care4U SOS
                          </p>

                        </div>

                      </div>

                      <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 flex items-center gap-3 shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-white text-red-600 flex items-center justify-center border border-red-100">
                          <Droplet size={17} />
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-red-500">
                            Blood Group
                          </p>
                          <p className="text-base font-black text-red-700 mt-0.5">
                            {alert.blood_group || 'UNK'}
                          </p>
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                      {alert.latitude &&
                      alert.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/location rounded-xl border border-border bg-secondary/25 p-4 hover:bg-cyan-50 hover:border-cyan-200 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                              <MapPin size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Emergency Location
                              </p>

                              <p className="text-sm font-bold text-foreground mt-1 truncate">
                                {Number(
                                  alert.latitude
                                ).toFixed(5)}
                                {', '}
                                {Number(
                                  alert.longitude
                                ).toFixed(5)}
                              </p>

                              <p className="text-[11px] text-cyan-700 font-semibold mt-2 flex items-center gap-1">
                                Open in Maps
                                <ExternalLink size={11} />
                              </p>
                            </div>
                          </div>
                        </a>

                      ) : (
                        <div className="rounded-xl border border-border bg-secondary/25 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                              <MapPin size={17} />
                            </div>

                            <div>
                              <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Emergency Location
                              </p>

                              <p className="text-sm font-semibold text-muted-foreground mt-1">
                                Location unavailable
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {alert.emergency_contact_phone ? (
                        <a
                          href={`tel:${alert.emergency_contact_phone}`}
                          className="rounded-xl border border-border bg-secondary/25 p-4 hover:bg-cyan-50 hover:border-cyan-200 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                              <Phone size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Emergency Contact
                              </p>

                              <p className="text-sm font-bold text-foreground mt-1">
                                {alert.emergency_contact_phone}
                              </p>

                              <p className="text-[11px] text-cyan-700 font-semibold mt-2">
                                Call contact
                              </p>
                            </div>
                          </div>
                        </a>

                      ) : (
                        <div className="rounded-xl border border-border bg-secondary/25 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                              <Phone size={17} />
                            </div>

                            <div>
                              <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                                Emergency Contact
                              </p>

                              <p className="text-sm font-semibold text-muted-foreground mt-1">
                                Contact unavailable
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 mb-5 flex items-start gap-3">
                      <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />

                      <p className="text-xs text-amber-900 leading-relaxed">
                        Break-Glass access is audited. Open the emergency snapshot only when the information is required for immediate patient care.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openSnapshotAccess(
                            alert.patient_id
                          )
                        }
                        disabled={
                          accessingId ===
                          alert.patient_id
                        }
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShieldAlert size={17} />

                        {accessingId === alert.patient_id
                          ? 'Authorizing...'
                          : 'Access Emergency Snapshot'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setAlertToResolve(
                            alert
                          )
                        }
                        disabled={
                          resolvingId ===
                          alert.alert_id
                        }
                        className="sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-border text-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={17} />

                        {resolvingId === alert.alert_id
                          ? 'Resolving...'
                          : 'Mark Resolved'}
                      </button>

                    </div>

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground px-4 text-center">
          <ShieldAlert size={14} className="text-cyan-700 shrink-0" />
          <span>
            Emergency snapshot access and incident resolution actions are protected by Care4U role-based controls and audit logging.
          </span>
        </div>

      </main>

      {/* =====================================================
          BREAK-GLASS ACCESS DIALOG
      ====================================================== */}
      {snapshotPatientId && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close Break-Glass access dialog"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => {
              if (!accessingId) {
                setSnapshotPatientId(null);
                setAccessReason('');
              }
            }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="break-glass-title"
            className="relative z-10 w-full max-w-lg bg-white border border-border rounded-2xl shadow-2xl overflow-hidden"
          >

            <div className="relative overflow-hidden bg-[#12344D] px-5 sm:px-6 py-5 text-white">
              <div className="absolute -right-10 -top-14 w-36 h-36 rounded-full bg-red-500/15" />
              <div className="absolute right-16 -bottom-16 w-28 h-28 rounded-full bg-cyan-400/10" />

              <div className="relative flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                  <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-300/20 text-red-200 flex items-center justify-center shrink-0">
                    <ShieldAlert size={21} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-200">
                      Break-Glass access
                    </p>

                    <h2
                      id="break-glass-title"
                      className="text-xl font-bold mt-1"
                    >
                      Emergency Snapshot Access
                    </h2>

                    <p className="text-xs text-white/65 mt-1">
                      Immediate-care access with mandatory audit logging
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  aria-label="Close"
                  disabled={!!accessingId}
                  onClick={() => {
                    setSnapshotPatientId(null);
                    setAccessReason('');
                  }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <X size={19} />
                </button>

              </div>
            </div>

            <div className="p-5 sm:p-6">

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
                <p className="text-sm font-bold text-amber-900">
                  Audited emergency access
                </p>

                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Enter the clinical reason for accessing this patient&apos;s emergency snapshot. Care4U records the staff member, patient, time, and stated reason.
                </p>
              </div>

              <label
                htmlFor="breakGlassReason"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Medical Reason
                <span className="text-red-600 ml-1">
                  *
                </span>
              </label>

              <textarea
                id="breakGlassReason"
                rows={4}
                autoFocus
                value={accessReason}
                disabled={!!accessingId}
                onChange={(event) =>
                  setAccessReason(
                    event.target.value
                  )
                }
                placeholder="e.g. Unconscious patient requiring immediate allergy and medication review"
                className="w-full rounded-xl border border-border bg-[#FBFCFD] px-4 py-3 text-sm text-foreground outline-none resize-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 disabled:opacity-50"
              />

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                <button
                  type="button"
                  disabled={!!accessingId}
                  onClick={() => {
                    setSnapshotPatientId(null);
                    setAccessReason('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-border text-foreground hover:bg-secondary/50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    !!accessingId ||
                    !accessReason.trim()
                  }
                  onClick={
                    handleAccessSnapshot
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldAlert size={17} />

                  {accessingId
                    ? 'Authorizing...'
                    : 'Authorize Emergency Access'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          RESOLVE CONFIRMATION DIALOG
      ====================================================== */}
      {alertToResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close resolve confirmation dialog"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => {
              if (!resolvingId) {
                setAlertToResolve(null);
              }
            }}
          />

          <div className="relative z-10 w-full max-w-md bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-5 sm:px-6 py-5 border-b border-border flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                    Incident Resolution
                  </p>
                  <h2 className="text-lg font-bold text-foreground mt-1">
                    Mark emergency as resolved?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={!!resolvingId}
                onClick={() =>
                  setAlertToResolve(null)
                }
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-border bg-secondary/25 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#12344D] text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(
                      alertToResolve.full_name
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {alertToResolve.full_name || 'Emergency patient'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alert received {formatAlertTime(
                        alertToResolve.alert_time
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mt-5">
                Confirm only after the emergency has been handled and no further active SOS response is required for this alert.
              </p>

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  disabled={!!resolvingId}
                  onClick={() =>
                    setAlertToResolve(null)
                  }
                  className="px-4 py-2.5 rounded-xl bg-white border border-border text-foreground hover:bg-secondary/50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Keep Active
                </button>

                <button
                  type="button"
                  disabled={
                    resolvingId ===
                    alertToResolve.alert_id
                  }
                  onClick={() =>
                    handleResolve(
                      alertToResolve.alert_id
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />

                  {resolvingId === alertToResolve.alert_id
                    ? 'Resolving...'
                    : 'Confirm Resolution'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HospitalEmergencyPage;
