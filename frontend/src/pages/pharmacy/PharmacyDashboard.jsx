/**
 * @component PharmacyDashboard
 * @desc      Landing page for pharmacists after login.
 *            Shows pharmacy statistics, quick actions,
 *            prescription QR scanning, recent activity.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Search,
  QrCode,
  UserSearch,
  ArrowRight,
  ClipboardList,
  History,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  Pill,
  Camera,
  Keyboard,
  ScanLine,
} from 'lucide-react';

import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import QRScanner from '../../components/common/QRScanner';

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
 * Normalizes prescription QR values.
 *
 * Supports a plain QR value:
 * RX-xxxx
 *
 * and also URLs containing the QR value,
 * such as:
 * http://localhost:5173/pharmacy/RX-xxxx
 */
const normalizePrescriptionQrValue = (value) => {
  if (!value) return '';

  const trimmedValue =
    value.trim();

  try {
    const url =
      new URL(trimmedValue);

    const pathParts =
      url.pathname
        .split('/')
        .filter(Boolean);

    return decodeURIComponent(
      pathParts[
        pathParts.length - 1
      ] || ''
    );

  } catch {
    return trimmedValue;
  }
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
    useAuthStore(
      (state) => state.user
    );

  /**
   * profile_id should contain the linked pharmacy ID.
   * The user ID fallback is kept from the previous implementation.
   */
  const PHARMACY_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const navigate =
    useNavigate();

  const [
    qrInput,
    setQrInput
  ] = useState('');

  const [
    scannerOpen,
    setScannerOpen
  ] = useState(false);

  const [
    manualQrEntry,
    setManualQrEntry
  ] = useState(false);

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

  /**
   * Handles manually entered prescription QR.
   */
  const handleQrSearch = (e) => {
    e.preventDefault();

    const value =
      normalizePrescriptionQrValue(
        qrInput
      );

    if (!value) {
      return;
    }

    navigate(
      `/pharmacy/${encodeURIComponent(
        value
      )}`
    );
  };

  /**
   * Handles prescription QR returned by
   * the camera scanner.
   */
  const handlePrescriptionQrScan = (
    scannedValue
  ) => {
    const value =
      normalizePrescriptionQrValue(
        scannedValue
      );

    if (!value) {
      return;
    }

    setQrInput(value);
    setScannerOpen(false);

    navigate(
      `/pharmacy/${encodeURIComponent(
        value
      )}`
    );
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

  const stats =
    data?.stats;

  const recentPrescriptions =
    stats?.recentPrescriptions ||
    [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-7">

        {/* ─────────────────────────────────────────
            Stats
        ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <StatCard
            title="Dispensed Today"
            value={
              stats?.todayDispensed ??
              0
            }
            description="dispensing activities today"
            icon={
              <Pill
                size={20}
              />
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
              stats?.partiallyFilled ??
              0
            }
            description="prescriptions still remaining"
            icon={
              <Clock3
                size={20}
              />
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
            Main Pharmacy Actions
        ───────────────────────────────────────── */}
        <Card
          title="Find Prescription or Patient"
          icon={
            <ScanLine
              size={18}
            />
          }
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Prescription QR */}
            <button
              type="button"
              onClick={() => {
                setScannerOpen(true);
                setManualQrEntry(false);
              }}
              className="text-left border border-primary/30 bg-primary/5 rounded-xl p-5 hover:border-primary hover:shadow-sm transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">

                <Camera
                  size={22}
                />

              </div>

              <p className="text-sm font-bold text-foreground">
                Scan Prescription QR
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Scan the digital prescription QR shown on the patient's smartphone.
              </p>

            </button>

            {/* Patient QR / NIC */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/pharmacy/patient-lookup'
                )
              }
              className="text-left border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">

                <UserSearch
                  size={22}
                />

              </div>

              <p className="text-sm font-bold text-foreground">
                Find Patient
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Scan a patient identity QR card or search using NIC.
              </p>

            </button>

            {/* History */}
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/pharmacy/history'
                )
              }
              className="text-left border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-secondary/30 transition-all"
            >

              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">

                <History
                  size={22}
                />

              </div>

              <p className="text-sm font-bold text-foreground">
                Dispensing History
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Review medicines previously dispensed by this pharmacy.
              </p>

            </button>

          </div>

        </Card>

        {/* ─────────────────────────────────────────
            Prescription QR Scanner
        ───────────────────────────────────────── */}
        {scannerOpen && (
          <Card
            title="Scan Prescription QR"
            icon={
              <QrCode
                size={18}
              />
            }
          >

            <QRScanner
              title="Scan Prescription QR"
              description="Point the camera at the prescription QR displayed on the patient's smartphone."
              onScan={
                handlePrescriptionQrScan
              }
              onClose={() =>
                setScannerOpen(false)
              }
            />

          </Card>
        )}

        {/* ─────────────────────────────────────────
            Manual Prescription QR Fallback
        ───────────────────────────────────────── */}
        <Card
          title="Prescription QR Fallback"
          icon={
            <QrCode
              size={18}
            />
          }
        >

          {!manualQrEntry ? (

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <p className="text-sm font-semibold text-foreground">
                  Having trouble scanning?
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Manually enter the prescription QR value only when camera scanning is unavailable.
                </p>

              </div>

              <Button
                variant="secondary"
                icon={
                  <Keyboard
                    size={16}
                  />
                }
                onClick={() =>
                  setManualQrEntry(
                    true
                  )
                }
              >
                Enter QR Manually
              </Button>

            </div>

          ) : (

            <div>

              <form
                onSubmit={
                  handleQrSearch
                }
                className="flex flex-col sm:flex-row gap-3"
              >

                <Input
                  name="qrInput"
                  value={
                    qrInput
                  }
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
                    <Search
                      size={16}
                    />
                  }
                >
                  Verify
                </Button>

              </form>

              <div className="mt-3">

                <button
                  type="button"
                  onClick={() => {
                    setManualQrEntry(
                      false
                    );

                    setQrInput('');
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Hide manual entry
                </button>

              </div>

            </div>

          )}

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
                No prescriptions have been dispensed by this pharmacy yet.
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
                <History
                  size={16}
                />
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