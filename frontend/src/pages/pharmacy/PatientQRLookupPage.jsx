/**
 * @component PatientQRLookupPage
 * @desc      Pharmacy staff finds a patient using either
 *            their identity QR card or NIC, then views
 *            active prescriptions after confirming identity
 *            and patient consent.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Search,
  AlertTriangle,
  CheckCircle,
  QrCode,
  ArrowRight,
  ArrowLeft,
  History,
  UserRound,
  ShieldCheck,
  CalendarDays,
  CreditCard,
  Droplets,
  FileText,
  ScanLine,
  Keyboard,
  Camera,
} from 'lucide-react';

import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import QRScanner from '../../components/common/QRScanner';

const formatDate = (iso) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Normalizes a scanned patient QR value.
 *
 * Supports:
 * QR-TEST-001
 *
 * and also URLs such as:
 * http://localhost:5173/lookup/QR-TEST-001
 */
const normalizePatientQrValue = (value) => {
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

    return (
      decodeURIComponent(
        pathParts[
          pathParts.length - 1
        ] || ''
      )
    );

  } catch {
    return trimmedValue;
  }
};

const PatientQRLookupPage = () => {
  const navigate = useNavigate();

  const [lookupMode, setLookupMode] =
    useState('qr');

  const [qrInput, setQrInput] =
    useState('');

  const [nicInput, setNicInput] =
    useState('');

  const [lookupValue, setLookupValue] =
    useState(null);

  const [consentGiven, setConsentGiven] =
    useState(false);

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [manualQrEntry, setManualQrEntry] =
    useState(false);

  /**
   * Fetch patient either by QR code
   * or NIC depending on selected lookup mode.
   */
  const {
    data: patientData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'patient-staff-lookup',
      lookupMode,
      lookupValue,
    ],

    queryFn: async () => {
      if (lookupMode === 'nic') {
        const res = await api.get(
          `/api/patients/nic/${encodeURIComponent(
            lookupValue
          )}`
        );

        return res.data.data;
      }

      const res = await api.get(
        `/api/patients/qr/${encodeURIComponent(
          lookupValue
        )}`
      );

      return res.data.data;
    },

    enabled: !!lookupValue,
    retry: false,
  });

  /**
   * Fetch patient prescriptions only after
   * identity and consent have been confirmed.
   */
  const {
    data: prescriptions,
    isLoading: prescriptionsLoading,
    isError: prescriptionsError,
  } = useQuery({
    queryKey: [
      'patient-prescriptions-staff',
      patientData?.id,
    ],

    queryFn: async () => {
      const res = await api.get(
        `/api/patients/${patientData.id}/prescriptions`
      );

      return res.data.data;
    },

    enabled:
      !!patientData?.id &&
      consentGiven,

    retry: false,
  });

  /**
   * Handles manually entered QR lookup.
   */
  const handleQrSearch = (e) => {
    e.preventDefault();

    const value =
      normalizePatientQrValue(
        qrInput
      );

    if (!value) {
      return;
    }

    setLookupMode('qr');
    setConsentGiven(false);
    setScannerOpen(false);
    setLookupValue(value);
  };

  /**
   * Handles a QR value returned
   * by the camera scanner.
   */
  const handleQrScan = (
    scannedValue
  ) => {
    const value =
      normalizePatientQrValue(
        scannedValue
      );

    if (!value) {
      return;
    }

    setQrInput(value);

    setLookupMode('qr');

    setConsentGiven(false);

    setScannerOpen(false);

    setLookupValue(value);
  };

  /**
   * Handles NIC lookup.
   */
  const handleNicSearch = (e) => {
    e.preventDefault();

    const value =
      nicInput.trim();

    if (!value) {
      return;
    }

    setLookupMode('nic');

    setConsentGiven(false);

    setScannerOpen(false);

    setLookupValue(value);
  };

  /**
   * Switches lookup mode and clears
   * the currently loaded patient.
   */
  const handleModeChange = (
    mode
  ) => {
    setLookupMode(mode);

    setLookupValue(null);

    setConsentGiven(false);

    setScannerOpen(false);

    setManualQrEntry(false);
  };

  /**
   * Clears the current lookup so staff
   * can search for another patient.
   */
  const handleNewLookup = () => {
    setLookupValue(null);

    setQrInput('');

    setNicInput('');

    setConsentGiven(false);

    setScannerOpen(false);

    setManualQrEntry(false);
  };

  /**
   * Only prescriptions that still have
   * medicine available for dispensing
   * should appear here.
   */
  const activePrescriptions =
    (prescriptions || []).filter(
      (prescription) =>
        prescription.status ===
          'active' ||
        prescription.status ===
          'partially_filled'
    );

  return (
    <div className="min-h-screen bg-background">

      {/* ─────────────────────────────────────────────
          Header
      ───────────────────────────────────────────── */}
      <div className="px-6 py-7 sm:px-8 bg-brand-deep">

        <div className="max-w-4xl mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-2 mb-2">

                <UserRound
                  size={18}
                  className="text-brand-deep-foreground/70"
                />

                <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep-foreground/70">
                  Pharmacy Staff — Patient Lookup
                </p>

              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-brand-deep-foreground">
                Find Patient
              </h1>

              <p className="text-sm mt-1 text-brand-deep-foreground/80">
                Scan the patient's identity QR card or search using their NIC.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <Button
                variant="secondary"
                icon={
                  <ArrowLeft
                    size={16}
                  />
                }
                onClick={() =>
                  navigate(
                    '/pharmacy/dashboard'
                  )
                }
              >
                Dashboard
              </Button>

              <Button
                variant="secondary"
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
                History
              </Button>

            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ─────────────────────────────────────────
            Lookup Method
        ───────────────────────────────────────── */}
        <Card
          title="Choose Lookup Method"
          icon={
            <Search size={18} />
          }
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* QR */}
            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  'qr'
                )
              }
              className={`text-left border rounded-xl p-4 transition-all ${
                lookupMode === 'qr'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >

              <div className="flex items-start gap-3">

                <div className="p-2 rounded-lg bg-primary/10 text-primary">

                  <QrCode
                    size={20}
                  />

                </div>

                <div>

                  <p className="text-sm font-bold text-foreground">
                    Patient Identity QR
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Scan the physical Care4U patient card.
                  </p>

                </div>

              </div>

            </button>

            {/* NIC */}
            <button
              type="button"
              onClick={() =>
                handleModeChange(
                  'nic'
                )
              }
              className={`text-left border rounded-xl p-4 transition-all ${
                lookupMode === 'nic'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >

              <div className="flex items-start gap-3">

                <div className="p-2 rounded-lg bg-primary/10 text-primary">

                  <CreditCard
                    size={20}
                  />

                </div>

                <div>

                  <p className="text-sm font-bold text-foreground">
                    Search by NIC
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Fallback when the patient card is unavailable.
                  </p>

                </div>

              </div>

            </button>

          </div>

        </Card>

        {/* ─────────────────────────────────────────
            QR Lookup
        ───────────────────────────────────────── */}
        {lookupMode === 'qr' && (
          <Card
            title="Patient Identity QR"
            icon={
              <QrCode
                size={18}
              />
            }
          >

            {!scannerOpen && (
              <>

                {/* Primary scanner button */}
                <div className="flex flex-col items-center justify-center text-center py-7 px-4 border border-dashed border-primary/30 rounded-xl bg-primary/5">

                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">

                    <ScanLine
                      size={28}
                    />

                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    Scan Patient Identity QR
                  </h3>

                  <p className="text-xs text-muted-foreground mt-2 max-w-sm">
                    Use the device camera to scan the QR code on the patient's physical Care4U identity card.
                  </p>

                  <div className="mt-5">

                    <Button
                      variant="primary"
                      icon={
                        <Camera
                          size={16}
                        />
                      }
                      onClick={() => {
                        setScannerOpen(
                          true
                        );

                        setManualQrEntry(
                          false
                        );
                      }}
                    >
                      Open Camera Scanner
                    </Button>

                  </div>

                </div>

                {/* Manual fallback */}
                <div className="mt-5 pt-5 border-t border-border">

                  {!manualQrEntry ? (

                    <button
                      type="button"
                      onClick={() =>
                        setManualQrEntry(
                          true
                        )
                      }
                      className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >

                      <Keyboard
                        size={15}
                      />

                      Having trouble scanning? Enter QR manually

                    </button>

                  ) : (

                    <div>

                      <div className="flex items-center gap-2 mb-3 text-muted-foreground">

                        <Keyboard
                          size={15}
                        />

                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Manual QR Entry
                        </p>

                      </div>

                      <form
                        onSubmit={
                          handleQrSearch
                        }
                        className="flex flex-col sm:flex-row gap-3"
                      >

                        <Input
                          name="qrInput"
                          value={qrInput}
                          onChange={(e) =>
                            setQrInput(
                              e.target.value
                            )
                          }
                          placeholder="e.g. QR-TEST-001"
                          className="flex-1"
                        />

                        <Button
                          type="submit"
                          variant="secondary"
                          icon={
                            <Search
                              size={16}
                            />
                          }
                        >
                          Find Patient
                        </Button>

                      </form>

                    </div>

                  )}

                </div>

              </>
            )}

            {/* Camera Scanner */}
            {scannerOpen && (
              <QRScanner
                title="Scan Patient Identity QR"
                description="Position the patient's Care4U identity QR inside the camera frame."
                onScan={
                  handleQrScan
                }
                onClose={() =>
                  setScannerOpen(
                    false
                  )
                }
              />
            )}

          </Card>
        )}

        {/* ─────────────────────────────────────────
            NIC Lookup
        ───────────────────────────────────────── */}
        {lookupMode === 'nic' && (
          <Card
            title="Search Patient by NIC"
            icon={
              <CreditCard
                size={18}
              />
            }
          >

            <p className="text-xs text-muted-foreground mb-4">
              Enter the patient's NIC and verify the returned details against their identity document.
            </p>

            <form
              onSubmit={
                handleNicSearch
              }
              className="flex flex-col sm:flex-row gap-3"
            >

              <Input
                name="nicInput"
                value={nicInput}
                onChange={(e) =>
                  setNicInput(
                    e.target.value
                  )
                }
                placeholder="e.g. 200212345678 or 991234567V"
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
                Search NIC
              </Button>

            </form>

          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">

            <Spinner
              size="lg"
            />

            <p className="text-sm text-muted-foreground">
              Looking up patient...
            </p>

          </div>
        )}

        {/* Lookup Error */}
        {isError && (
          <Alert
            type="error"
            message={
              error?.response?.data?.message ||
              'Patient not found. Please check the details and try again.'
            }
          />
        )}

        {/* ─────────────────────────────────────────
            Patient Found
        ───────────────────────────────────────── */}
        {patientData &&
          !isLoading && (
          <>

            {/* Patient details */}
            <Card
              title="Patient Details"
              icon={
                <UserRound
                  size={18}
                />
              }
            >

              <div className="flex flex-col gap-5">

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">

                  <ShieldCheck
                    size={22}
                    className="text-primary shrink-0 mt-0.5"
                  />

                  <div>

                    <p className="text-sm font-semibold text-foreground">
                      Patient record found
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Verify these details against the patient before accessing prescriptions.
                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Name */}
                  <div>

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <UserRound
                        size={15}
                      />

                      <p className="text-xs uppercase tracking-wide">
                        Name
                      </p>

                    </div>

                    <p className="text-sm font-semibold text-foreground mt-2">
                      {patientData.full_name ||
                        '—'}
                    </p>

                  </div>

                  {/* NIC */}
                  <div>

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <CreditCard
                        size={15}
                      />

                      <p className="text-xs uppercase tracking-wide">
                        NIC
                      </p>

                    </div>

                    <p className="text-sm font-semibold text-foreground mt-2">
                      {patientData.nic ||
                        '—'}
                    </p>

                  </div>

                  {/* DOB */}
                  <div>

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <CalendarDays
                        size={15}
                      />

                      <p className="text-xs uppercase tracking-wide">
                        Date of Birth
                      </p>

                    </div>

                    <p className="text-sm font-semibold text-foreground mt-2">
                      {formatDate(
                        patientData.date_of_birth
                      )}
                    </p>

                  </div>

                  {/* Blood group */}
                  <div>

                    <div className="flex items-center gap-2 text-muted-foreground">

                      <Droplets
                        size={15}
                      />

                      <p className="text-xs uppercase tracking-wide">
                        Blood Group
                      </p>

                    </div>

                    <div className="mt-2">

                      {patientData.blood_group ? (

                        <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-destructive/10 text-destructive">
                          {patientData.blood_group}
                        </span>

                      ) : (

                        <p className="text-sm font-semibold text-foreground">
                          —
                        </p>

                      )}

                    </div>

                  </div>

                </div>

                <div className="pt-5 border-t border-border flex justify-end">

                  <Button
                    variant="secondary"
                    onClick={
                      handleNewLookup
                    }
                  >
                    Search Another Patient
                  </Button>

                </div>

              </div>

            </Card>

            {/* Identity / consent */}
            {!consentGiven && (
              <div className="bg-urgent/10 border border-urgent/20 rounded-xl p-6">

                <h2 className="flex items-center gap-2 text-base font-semibold text-urgent-foreground mb-2">

                  <AlertTriangle
                    size={19}
                  />

                  Staff Verification Required

                </h2>

                <p className="text-sm text-urgent-foreground/80">
                  Before viewing prescriptions, confirm that you have verified the patient's identity in person and that the patient has consented to staff-assisted prescription access and dispensing.
                </p>

                <div className="mt-5">

                  <Button
                    variant="urgent"
                    onClick={() =>
                      setConsentGiven(
                        true
                      )
                    }
                    icon={
                      <CheckCircle
                        size={16}
                      />
                    }
                  >
                    I Confirm — Show Prescriptions
                  </Button>

                </div>

              </div>
            )}

            {/* Consent confirmed */}
            {consentGiven && (
              <div className="border border-success/30 bg-success/10 rounded-xl p-4">

                <div className="flex items-start gap-3">

                  <CheckCircle
                    size={20}
                    className="text-success shrink-0 mt-0.5"
                  />

                  <div>

                    <p className="text-sm font-semibold text-success">
                      Identity and consent confirmed
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Eligible active prescriptions can now be accessed.
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* Prescriptions */}
            {consentGiven && (
              <Card
                title={`Active Prescriptions (${activePrescriptions.length})`}
                icon={
                  <QrCode
                    size={18}
                  />
                }
              >

                {prescriptionsLoading && (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">

                    <Spinner
                      size="md"
                    />

                    <p className="text-xs text-muted-foreground">
                      Loading prescriptions...
                    </p>

                  </div>
                )}

                {!prescriptionsLoading &&
                  prescriptionsError && (

                  <Alert
                    type="error"
                    message="Failed to load this patient's prescriptions. Please try again."
                  />

                )}

                {!prescriptionsLoading &&
                  !prescriptionsError &&
                  activePrescriptions.length ===
                    0 && (

                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-border bg-secondary/40">

                    <QrCode className="w-8 h-8 text-muted-foreground/50 mb-3" />

                    <p className="text-sm font-medium text-muted-foreground">
                      No active prescriptions found for this patient.
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Completed and expired prescriptions are not shown.
                    </p>

                  </div>

                )}

                {!prescriptionsLoading &&
                  !prescriptionsError &&
                  activePrescriptions.map(
                    (rx) => (

                    <div
                      key={rx.id}
                      onClick={() =>
                        navigate(
                          `/pharmacy/${rx.qr_code_value}`
                        )
                      }
                      className="group border border-border rounded-xl p-4 mb-3 last:mb-0 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all bg-card"
                    >

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                        <div className="min-w-0">

                          <div className="flex items-start gap-2">

                            <QrCode
                              size={15}
                              className="text-primary shrink-0 mt-0.5"
                            />

                            <p className="text-sm font-mono font-semibold text-foreground break-all">
                              {rx.qr_code_value}
                            </p>

                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">

                            <p className="text-xs text-muted-foreground">

                              <span className="font-semibold">
                                Issued:
                              </span>{' '}

                              {formatDate(
                                rx.created_at
                              )}

                            </p>

                            <p className="text-xs text-muted-foreground">

                              <span className="font-semibold">
                                Expires:
                              </span>{' '}

                              {formatDate(
                                rx.expires_at
                              )}

                            </p>

                          </div>

                          {rx.notes && (
                            <div className="flex items-start gap-2 mt-3">

                              <FileText
                                size={14}
                                className="text-muted-foreground shrink-0 mt-0.5"
                              />

                              <p className="text-xs text-muted-foreground">
                                {rx.notes}
                              </p>

                            </div>
                          )}

                        </div>

                        <Badge
                          status={
                            rx.status
                          }
                        />

                      </div>

                      <div className="mt-4 pt-4 border-t border-border">

                        <p className="flex items-center gap-1.5 text-xs text-primary font-semibold group-hover:text-primary/80 transition-colors">

                          Open prescription for dispensing

                          <ArrowRight
                            size={14}
                          />

                        </p>

                      </div>

                    </div>

                  )
                )}

              </Card>
            )}

          </>
        )}

      </div>

    </div>
  );
};

export default PatientQRLookupPage;