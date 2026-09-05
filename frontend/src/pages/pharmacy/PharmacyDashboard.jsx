/**
 * @component PharmacyDashboard
 * @desc      Landing page for pharmacists after login.
 *            Shows today's stats, recent prescriptions,
 *            pharmacy verification status, quick actions,
 *            and a quick QR scan entry point.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Search,
  QrCode,
  UserSearch,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  History,
  Building2,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  LogOut,
  Pill,
  UserRoundPen,
} from 'lucide-react';

import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

import useAuthStore from '../../store/authStore';

/**
 * Formats an ISO date string to readable format.
 * @param {string} iso - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (iso) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

/**
 * Small reusable dashboard statistic card.
 */
const StatCard = ({
  title,
  value,
  description,
  icon,
}) => {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>

          <p className="text-3xl font-bold text-foreground mt-2">
            {value ?? 0}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          {icon}
        </div>
      </div>
    </Card>
  );
};

const PharmacyDashboard = () => {
  const user =
    useAuthStore((state) => state.user);

  const clearUser =
    useAuthStore(
      (state) => state.clearUser
    );

  /**
   * profile_id should contain the linked pharmacy ID.
   * The user ID fallback is kept from the previous implementation.
   */
  const PHARMACY_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const navigate = useNavigate();

  const [
    qrInput,
    setQrInput
  ] = useState('');

  const [
    logoutLoading,
    setLogoutLoading
  ] = useState(false);

  const [
    logoutError,
    setLogoutError
  ] = useState(null);

  /**
   * Loads pharmacy profile information and
   * pharmacy-specific dashboard statistics.
   */
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'pharmacy-dashboard',
      PHARMACY_ID
    ],

    queryFn: async () => {
      const res = await api.get(
        `/api/pharmacies/${PHARMACY_ID}/dashboard`
      );

      return res.data.data;
    },

    enabled: !!PHARMACY_ID,
  });

  // ── Handle QR input search ──
  const handleQrSearch = (e) => {
    e.preventDefault();

    if (qrInput.trim()) {
      navigate(
        `/pharmacy/${qrInput.trim()}`
      );
    }
  };

  /**
   * Logs the pharmacist out of the application.
   */
  const handleLogout = async () => {
    setLogoutLoading(true);
    setLogoutError(null);

    try {
      await api.post(
        '/api/auth/logout'
      );

      clearUser();

      navigate('/login');

    } catch (error) {
      console.error(
        'Pharmacy logout error:',
        error
      );

      setLogoutError(
        error.response?.data?.message ||
        'Logout failed. Please try again.'
      );

    } finally {
      setLogoutLoading(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />

          <p className="text-sm text-muted-foreground">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-destructive font-medium mb-4">
            Failed to load dashboard.
            Please try again.
          </p>

          <Button
            variant="primary"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const pharmacy =
    data?.pharmacy;

  const stats =
    data?.stats;

  const recentPrescriptions =
    stats?.recentPrescriptions || [];

  return (
    <div className="min-h-screen bg-background">

      {/* ─────────────────────────────────────────────
          Header
      ───────────────────────────────────────────── */}
      <div className="px-6 py-7 sm:px-8 bg-brand-deep">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* Pharmacy identity */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2
                  size={18}
                  className="text-brand-deep-foreground/70"
                />

                <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep-foreground/70">
                  Pharmacy Portal
                </p>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-brand-deep-foreground">
                {pharmacy?.name ||
                  'Pharmacy Dashboard'}
              </h1>

              <p className="text-sm mt-1 text-brand-deep-foreground/80">
                {pharmacy?.address ||
                  'Manage prescriptions and dispensing activity'}
              </p>

              {/* Verification indicator */}
              <div className="mt-3">
                {pharmacy?.is_verified ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-deep-foreground text-xs font-semibold">
                    <ShieldCheck size={14} />
                    Verified Pharmacy
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-deep-foreground text-xs font-semibold">
                    <ShieldAlert size={14} />
                    Pending Verification
                  </div>
                )}
              </div>
            </div>

            {/* Header actions */}
            <div className="flex flex-wrap gap-2">

              <Button
                variant="secondary"
                icon={
                  <UserRoundPen
                    size={16}
                  />
                }
                onClick={() =>
                  navigate(
                    '/pharmacy/profile'
                  )
                }
              >
                Profile
              </Button>

              <Button
                variant="secondary"
                icon={
                  <History size={16} />
                }
                onClick={() =>
                  navigate(
                    '/pharmacy/history'
                  )
                }
              >
                History
              </Button>

              <Button
                variant="secondary"
                loading={logoutLoading}
                icon={
                  <LogOut size={16} />
                }
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>

          </div>

          {logoutError && (
            <p className="mt-4 text-sm text-destructive-foreground">
              {logoutError}
            </p>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-7">

        {/* ─────────────────────────────────────────
            Stats
        ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <StatCard
            title="Dispensed Today"
            value={
              stats?.todayDispensed ?? 0
            }
            description="dispensing activities today"
            icon={
              <Pill size={20} />
            }
          />

          <StatCard
            title="This Month"
            value={
              stats?.thisMonthDispensed ??
              0
            }
            description="dispensing activities this month"
            icon={
              <CalendarDays
                size={20}
              />
            }
          />

          <StatCard
            title="Partially Filled"
            value={
              stats?.partiallyFilled ?? 0
            }
            description="prescriptions still remaining"
            icon={
              <Clock3 size={20} />
            }
          />

          <StatCard
            title="Completed"
            value={
              stats?.completedPrescriptions ??
              0
            }
            description="fully dispensed prescriptions"
            icon={
              <CircleCheckBig
                size={20}
              />
            }
          />

        </div>

        {/* ─────────────────────────────────────────
            Quick Actions
        ───────────────────────────────────────── */}
        <Card
          title="Quick Actions"
          icon={<QrCode size={18} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">

            {/* Verify Prescription */}
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById(
                    'prescription-qr-input'
                  )
                  ?.focus();
              }}
              className="text-left border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <QrCode size={20} />
              </div>

              <p className="text-sm font-bold text-foreground">
                Verify Prescription
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Enter a prescription QR
                code and dispense medicines.
              </p>
            </button>

            {/* Patient Lookup */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/pharmacy/patient-lookup'
                )
              }
              className="text-left border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <UserSearch
                  size={20}
                />
              </div>

              <p className="text-sm font-bold text-foreground">
                Patient QR Lookup
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Find prescriptions for
                patients without smartphones.
              </p>
            </button>

            {/* Dispensing History */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/pharmacy/history'
                )
              }
              className="text-left border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <History size={20} />
              </div>

              <p className="text-sm font-bold text-foreground">
                Dispensing History
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Review previous
                prescription dispensing activity.
              </p>
            </button>

          </div>
        </Card>

        {/* ─────────────────────────────────────────
            QR Prescription Verification
        ───────────────────────────────────────── */}
        <Card
          title="Verify Prescription by QR Code"
          icon={<QrCode size={18} />}
        >
          <p className="text-xs text-muted-foreground mb-4">
            Enter the QR code value from
            the patient's prescription to
            verify and dispense.
          </p>

          <form
            onSubmit={handleQrSearch}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              id="prescription-qr-input"
              name="qrInput"
              value={qrInput}
              onChange={(e) =>
                setQrInput(
                  e.target.value
                )
              }
              placeholder="e.g. RX-550e8400-e29b-41d4-..."
              className="flex-1"
            />

            <Button
              type="submit"
              variant="primary"
              icon={
                <Search size={16} />
              }
            >
              Verify Prescription
            </Button>
          </form>

          {/* Patient card lookup */}
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Patient without smartphone?
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Use the patient's Care4U
                  identity QR card instead.
                </p>
              </div>

              <Button
                variant="secondary"
                icon={
                  <UserSearch
                    size={16}
                  />
                }
                onClick={() =>
                  navigate(
                    '/pharmacy/patient-lookup'
                  )
                }
              >
                Patient QR Lookup
              </Button>

            </div>
          </div>
        </Card>

        {/* ─────────────────────────────────────────
            Account Information
        ───────────────────────────────────────── */}
        <Card
          title="Pharmacy Information"
          icon={
            <Building2 size={18} />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pharmacy
              </p>

              <p className="text-sm font-semibold text-foreground mt-1">
                {pharmacy?.name || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                License Number
              </p>

              <p className="text-sm font-semibold text-foreground mt-1">
                {pharmacy?.license_number ||
                  '—'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Phone
              </p>

              <p className="text-sm font-semibold text-foreground mt-1">
                {pharmacy?.phone || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </p>

              <div className="mt-1 flex items-center gap-2">
                {pharmacy?.is_verified ? (
                  <>
                    <ShieldCheck
                      size={16}
                      className="text-success"
                    />

                    <span className="text-sm font-semibold text-success">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert
                      size={16}
                      className="text-urgent-foreground"
                    />

                    <span className="text-sm font-semibold text-urgent-foreground">
                      Pending Approval
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>

          <div className="mt-5 pt-5 border-t border-border flex justify-end">
            <Button
              variant="secondary"
              icon={
                <UserRoundPen
                  size={16}
                />
              }
              onClick={() =>
                navigate(
                  '/pharmacy/profile'
                )
              }
            >
              View Profile
            </Button>
          </div>
        </Card>

        {/* ─────────────────────────────────────────
            Recent Prescriptions
        ───────────────────────────────────────── */}
        <Card
          title="Recent Dispensing Activity"
          icon={
            <ClipboardList
              size={18}
            />
          }
        >
          {recentPrescriptions.length ===
          0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-border bg-secondary/40">

              <ClipboardList className="w-8 h-8 text-muted-foreground/50 mb-3" />

              <p className="text-sm font-medium text-muted-foreground">
                No prescriptions have been
                dispensed by this pharmacy yet.
              </p>

            </div>
          ) : (
            <div className="flex flex-col gap-3">

              {recentPrescriptions.map(
                (rx) => (
                  <div
                    key={rx.id}
                    onClick={() =>
                      navigate(
                        `/pharmacy/${rx.qr_code_value}`
                      )
                    }
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-border rounded-lg hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all bg-card"
                  >

                    <div>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {rx.qr_code_value}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Issued:{' '}
                        {formatDate(
                          rx.created_at
                        )}
                        {' · '}
                        Dispensed:{' '}
                        {formatDate(
                          rx.dispensed_at
                        )}
                      </p>

                      {rx.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires:{' '}
                          {formatDate(
                            rx.expires_at
                          )}
                        </p>
                      )}

                      {rx.notes && (
                        <p className="text-xs text-muted-foreground/70 mt-1 truncate max-w-lg">
                          {rx.notes}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <Badge
                        status={
                          rx.status
                        }
                      />

                      <ArrowRight
                        size={16}
                        className="text-primary opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    </div>

                  </div>
                )
              )}

            </div>
          )}

          <div className="mt-5 pt-5 border-t border-border">
            <Button
              variant="secondary"
              className="w-full"
              icon={
                <History size={16} />
              }
              onClick={() =>
                navigate(
                  '/pharmacy/history'
                )
              }
            >
              View Full Dispensing History
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default PharmacyDashboard;