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
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  Activity,
  CheckCircle,
  Clock,
  Droplet,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  X
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

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

  const navigate = useNavigate();

  /**
   * Retrieves active emergency alerts from the backend.
   *
   * @param {boolean} isBackground - Whether the request is a background poll
   * @returns {Promise<void>}
   */
  const fetchAlerts = async (isBackground = false) => {
    try {
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
    const confirmed = window.confirm(
      'Are you sure this emergency has been handled and resolved?'
    );

    if (!confirmed) {
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Activity
              className="animate-pulse"
              size={28}
            />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            Loading active emergencies...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">

        <PageHeader
          eyebrow="Emergency Operations"
          title="Emergency Central Dispatch"
          description="Monitor active SOS alerts, review emergency locations, use audited Break-Glass access, and resolve handled emergencies."
          icon={Activity}
          meta={
            <div className="flex items-center gap-3">

              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-destructive animate-ping opacity-60" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide font-bold text-destructive">
                  Live Feed
                </p>

                <p className="text-sm font-bold text-foreground">
                  Polling every 10 seconds
                </p>
              </div>

            </div>
          }
        />

        <div className="flex justify-end mt-4">

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchAlerts(false);
            }}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>

        </div>

      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {loadError && (

          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div className="flex items-start gap-3">

                <ShieldAlert
                  size={20}
                  className="text-destructive mt-0.5 shrink-0"
                />

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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-background border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <RefreshCw size={15} />
                Retry
              </button>

            </div>

          </div>

        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Active Queue
            </p>

            <h2 className="text-xl font-bold text-foreground mt-1">
              Current Emergency Alerts
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-card border border-border rounded-xl px-4 py-2">
            <Activity
              size={17}
              className="text-destructive"
            />

            <span className="text-sm font-semibold text-foreground">
              {alerts.length}
              {' '}
              {alerts.length === 1
                ? 'Active Alert'
                : 'Active Alerts'}
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-10 md:p-14 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-5">
              <CheckCircle size={38} />
            </div>

            <h2 className="text-2xl font-bold text-foreground">
              No Active Emergencies
            </h2>

            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are currently no active SOS alerts.
              The emergency feed will continue monitoring
              automatically.
            </p>
          </div>

        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">

            {alerts.map((alert) => (
              <article
                key={alert.alert_id}
                className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >

                <div className="h-1.5 bg-destructive" />

                <div className="p-5">

                  <div className="flex items-start justify-between gap-4 mb-5">

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-destructive">
                          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          Active SOS
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-foreground truncate">
                        {alert.full_name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                        <Clock size={15} />

                        <span className="text-sm">
                          {new Date(
                            alert.alert_time
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="w-14 h-14 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col items-center justify-center shrink-0">
                      <Droplet
                        size={18}
                        className="text-destructive"
                      />

                      <span className="text-xs font-bold text-destructive mt-1">
                        {alert.blood_group || 'UNK'}
                      </span>
                    </div>

                  </div>

                  <div className="space-y-3 mb-5">

                    {alert.latitude &&
                    alert.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 bg-secondary/60 border border-border rounded-xl p-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <MapPin size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground">
                            GPS Coordinates
                          </p>

                          <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                            {Number(
                              alert.latitude
                            ).toFixed(5)}
                            {', '}
                            {Number(
                              alert.longitude
                            ).toFixed(5)}
                          </p>
                        </div>

                        <ExternalLink
                          size={16}
                          className="text-muted-foreground group-hover:text-primary"
                        />
                      </a>

                    ) : (
                      <div className="flex items-center gap-3 bg-secondary/60 border border-border rounded-xl p-3">
                        <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                          <MapPin size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            GPS Coordinates
                          </p>

                          <p className="text-sm font-medium text-muted-foreground mt-0.5">
                            Location unavailable
                          </p>
                        </div>
                      </div>
                    )}

                    {alert.emergency_contact_phone && (
                      <a
                        href={`tel:${alert.emergency_contact_phone}`}
                        className="flex items-center gap-3 bg-secondary/60 border border-border rounded-xl p-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Phone size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Emergency Contact
                          </p>

                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {alert.emergency_contact_phone}
                          </p>
                        </div>
                      </a>
                    )}

                  </div>

                  <div className="flex flex-col gap-3">

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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShieldAlert size={18} />

                      {accessingId === alert.patient_id
                        ? 'Authorizing...'
                        : 'Access Emergency Snapshot'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleResolve(
                          alert.alert_id
                        )
                      }
                      disabled={
                        resolvingId ===
                        alert.alert_id
                      }
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-500/30 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={18} />

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

      </main>

      {snapshotPatientId && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close Break-Glass access dialog"
            className="absolute inset-0 bg-black/50"
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
            className="relative z-10 w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >

            <div className="border-b border-border px-5 sm:px-6 py-4 flex items-start justify-between gap-4">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-destructive">
                    Break-Glass Protocol
                  </p>

                  <h2
                    id="break-glass-title"
                    className="text-lg font-bold text-foreground mt-1"
                  >
                    Emergency Snapshot Access
                  </h2>
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
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            <div className="p-5 sm:p-6">

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-5">
                <p className="text-sm font-semibold text-foreground">
                  Audited emergency access
                </p>

                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Enter the medical reason for accessing this patient&apos;s emergency snapshot. The access event will be securely logged.
                </p>
              </div>

              <label
                htmlFor="breakGlassReason"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Medical Reason
                <span className="text-destructive ml-1">
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
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none resize-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />

              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

                <button
                  type="button"
                  disabled={!!accessingId}
                  onClick={() => {
                    setSnapshotPatientId(null);
                    setAccessReason('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-sm font-semibold transition-colors disabled:opacity-50"
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

    </div>
  );
};

export default HospitalEmergencyPage;