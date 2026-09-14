/**
 * @file      PrescriptionsPage.jsx
 * @component PrescriptionsPage
 * @desc      Displays the patient's active and previous prescriptions.
 *            Prescriptions can be expanded to review medicines,
 *            instructions, dispensing progress, and pharmacy QR codes.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  useState,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  QRCodeSVG,
} from 'qrcode.react';

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  Pill,
  QrCode,
  Stethoscope,
} from 'lucide-react';

import {
  getPatientPrescriptions,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';

/* =========================================================
   HELPERS
   ========================================================= */

const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return '—';
  }

  return new Date(
    dateStr
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

const isExpired = (
  expiresAt
) => {
  if (!expiresAt) {
    return false;
  }

  return (
    new Date(
      expiresAt
    ) <
    new Date()
  );
};

const daysRemaining = (
  expiresAt
) => {
  if (!expiresAt) {
    return null;
  }

  const difference =
    new Date(
      expiresAt
    ) -
    new Date();

  return Math.ceil(
    difference /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
};

const resolveBadgeStatus = (
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
    status ||
    'active'
  );
};

const canShowQR = (
  status,
  expiresAt
) => {
  if (
    isExpired(
      expiresAt
    )
  ) {
    return false;
  }

  if (
    status ===
      'completed' ||
    status ===
      'expired'
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   MEDICINE ROW
   ========================================================= */

const MedicineRow = ({
  item,
}) => {
  return (
    <div className="rounded-xl bg-card/75 p-4">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        <div className="flex items-start gap-3 min-w-0">

          <div className="
            w-9 h-9
            rounded-xl
            bg-module-soft
            text-primary
            flex items-center justify-center
            shrink-0
          ">
            <Pill
              size={16}
            />
          </div>

          <div className="min-w-0">

            <p className="text-sm font-bold text-foreground break-words">
              {item.medicine_name}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground">

              {item.dosage && (
                <span>
                  {item.dosage}
                </span>
              )}

              {item.frequency && (
                <>
                  <span>
                    •
                  </span>

                  <span>
                    {item.frequency}
                  </span>
                </>
              )}

              {item.duration_days && (
                <>
                  <span>
                    •
                  </span>

                  <span>
                    {item.duration_days}{' '}
                    day
                    {Number(
                      item.duration_days
                    ) ===
                    1
                      ? ''
                      : 's'}
                  </span>
                </>
              )}

            </div>

            {item.special_notes && (
              <p className="text-xs text-primary font-medium mt-2 leading-relaxed">
                {item.special_notes}
              </p>
            )}

          </div>

        </div>

        <div className="sm:text-right shrink-0">

          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
            Quantity
          </p>

          <p className="text-sm font-bold text-foreground mt-1">
            {item.quantity_prescribed ??
              '—'}{' '}
            prescribed
          </p>

          {Number(
            item.quantity_dispensed
          ) >
            0 && (
            <p className="text-xs font-semibold text-success mt-1">
              {
                item.quantity_dispensed
              }{' '}
              dispensed
            </p>
          )}

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   PRESCRIPTION ROW
   ========================================================= */

const PrescriptionRow = ({
  prescription,
}) => {
  const [
    expanded,
    setExpanded,
  ] = useState(
    false
  );

  const [
    showQR,
    setShowQR,
  ] = useState(
    false
  );

  const expired =
    isExpired(
      prescription.expires_at
    );

  const days =
    daysRemaining(
      prescription.expires_at
    );

  const badgeStatus =
    resolveBadgeStatus(
      prescription.status,
      prescription.expires_at
    );

  const showQRButton =
    canShowQR(
      prescription.status,
      prescription.expires_at
    );

  const validItems =
    (
      prescription.items ||
      []
    ).filter(
      item =>
        item &&
        item.medicine_name
    );

  const expiringSoon =
    !expired &&
    days !== null &&
    days <= 7;

  return (
    <article
      className={`
        rounded-2xl
        overflow-hidden
        transition-colors
        ${
          expired ||
          prescription.status ===
            'completed'
            ? 'bg-secondary/30'
            : 'bg-secondary/45'
        }
      `}
    >

      {/* =====================================================
          PRESCRIPTION SUMMARY
      ====================================================== */}
      <button
        type="button"
        onClick={() =>
          setExpanded(
            previous =>
              !previous
          )
        }
        className="
          w-full
          text-left
          p-4 sm:p-5
          hover:bg-secondary/65
          transition-colors
          focus:outline-none
          focus:ring-2
          focus:ring-inset
          focus:ring-primary
        "
      >

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          {/* Doctor */}
          <div className="flex items-start gap-3 min-w-0 flex-1">

            <div
              className={`
                w-11 h-11
                rounded-xl
                flex items-center justify-center
                shrink-0
                ${
                  expired
                    ? 'bg-card text-muted-foreground'
                    : 'bg-module-soft text-primary'
                }
              `}
            >
              <ClipboardList
                size={19}
              />
            </div>

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <p className="text-sm sm:text-base font-bold text-foreground">
                  {prescription.doctor_name
                    ? `Dr. ${prescription.doctor_name}`
                    : 'Prescription'}
                </p>

                <div className="lg:hidden">
                  <Badge
                    status={
                      badgeStatus
                    }
                  />
                </div>

              </div>

              {prescription.doctor_specialization && (
                <p className="text-xs text-muted-foreground mt-1">
                  {
                    prescription.doctor_specialization
                  }
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1.5">
                {validItems.length}{' '}
                medicine
                {validItems.length ===
                1
                  ? ''
                  : 's'}
              </p>

            </div>

          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:w-[380px]">

            <div className="rounded-xl bg-card/70 px-3.5 py-3">

              <div className="flex items-start gap-2.5">

                <Calendar
                  size={15}
                  className="text-primary shrink-0 mt-0.5"
                />

                <div>

                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Issued
                  </p>

                  <p className="text-xs sm:text-sm font-semibold text-foreground mt-1">
                    {
                      formatDate(
                        prescription.created_at
                      )
                    }
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-card/70 px-3.5 py-3">

              <div className="flex items-start gap-2.5">

                <Clock3
                  size={15}
                  className={`
                    shrink-0 mt-0.5
                    ${
                      expired
                        ? 'text-destructive'
                        : expiringSoon
                          ? 'text-urgent-foreground'
                          : 'text-primary'
                    }
                  `}
                />

                <div>

                  <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                    Expires
                  </p>

                  <p
                    className={`
                      text-xs sm:text-sm
                      font-semibold
                      mt-1
                      ${
                        expired
                          ? 'text-destructive'
                          : expiringSoon
                            ? 'text-urgent-foreground'
                            : 'text-foreground'
                      }
                    `}
                  >
                    {
                      formatDate(
                        prescription.expires_at
                      )
                    }

                    {expiringSoon && (
                      <span className="ml-1">
                        ({days}d)
                      </span>
                    )}

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Status */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">

            <Badge
              status={
                badgeStatus
              }
            />

            <div className="w-8 h-8 rounded-lg bg-card text-muted-foreground flex items-center justify-center">
              {expanded ? (
                <ChevronUp
                  size={16}
                />
              ) : (
                <ChevronDown
                  size={16}
                />
              )}
            </div>

          </div>

          <div className="lg:hidden flex justify-end">

            <div className="w-8 h-8 rounded-lg bg-card text-muted-foreground flex items-center justify-center">
              {expanded ? (
                <ChevronUp
                  size={16}
                />
              ) : (
                <ChevronDown
                  size={16}
                />
              )}
            </div>

          </div>

        </div>

      </button>

      {/* =====================================================
          EXPANDED DETAILS
      ====================================================== */}
      {expanded && (
        <div className="border-t border-border/60 p-4 sm:p-5">

          <div className="space-y-5">

            {/* Doctor notes */}
            {prescription.notes && (
              <div>

                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground mb-2">
                  Doctor's Notes
                </p>

                <div className="rounded-xl bg-card/75 p-4">

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {
                      prescription.notes
                    }
                  </p>

                </div>

              </div>
            )}

            {/* Medicines */}
            <div>

              <div className="flex items-center justify-between gap-3 mb-3">

                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
                  Medicines
                </p>

                <span className="text-xs font-semibold text-primary">
                  {validItems.length}{' '}
                  item
                  {validItems.length ===
                  1
                    ? ''
                    : 's'}
                </span>

              </div>

              {validItems.length ===
              0 ? (

                <div className="rounded-xl bg-card/70 p-4">

                  <p className="text-sm text-muted-foreground">
                    No medicines listed.
                  </p>

                </div>

              ) : (

                <div className="space-y-2.5">

                  {validItems.map(
                    (
                      item,
                      index
                    ) => (
                      <MedicineRow
                        key={
                          item.id ||
                          index
                        }
                        item={
                          item
                        }
                      />
                    )
                  )}

                </div>
              )}

            </div>

            {/* Pharmacy QR */}
            {showQRButton && (
              <div className="pt-5 border-t border-border/60">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div>

                    <p className="text-sm font-bold text-foreground">
                      Pharmacy Dispensing QR
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      Show this prescription QR to an authorized Care4U pharmacist.
                    </p>

                  </div>

                  <Button
                    variant={
                      showQR
                        ? 'secondary'
                        : 'primary'
                    }
                    size="sm"
                    icon={
                      <QrCode
                        size={16}
                      />
                    }
                    onClick={() =>
                      setShowQR(
                        previous =>
                          !previous
                      )
                    }
                  >
                    {showQR
                      ? 'Hide QR Code'
                      : 'Show Pharmacy QR'}
                  </Button>

                </div>

                {showQR &&
                  prescription.qr_code_value && (

                  <div className="
                    mt-4
                    rounded-2xl
                    bg-module-soft/55
                    p-5
                    flex flex-col
                    sm:flex-row
                    sm:items-center
                    gap-5
                  ">

                    <div className="bg-white p-3 rounded-xl shadow-sm shrink-0 self-center sm:self-auto">

                      <QRCodeSVG
                      value={prescription.qr_code_value}
                      size={170}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      level="M"
                    />

                    </div>

                    <div className="text-center sm:text-left">

                      <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                        Prescription Reference
                      </p>

                      <p className="text-xs font-mono font-bold text-foreground mt-2 break-all">
                        {
                          prescription.qr_code_value
                        }
                      </p>

                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-sm">
                        The pharmacist can scan this QR to securely open the prescription and record dispensing.
                      </p>

                    </div>

                  </div>

                )}

              </div>
            )}

          </div>

        </div>
      )}

    </article>
  );
};

/* =========================================================
   MAIN PAGE
   ========================================================= */

const PrescriptionsPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const {
    data:
      prescriptions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'prescriptions',
      patientId,
    ],

    queryFn: () =>
      getPatientPrescriptions(
        patientId
      ),

    enabled:
      !!patientId,
  });

  if (
    isLoading
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading prescriptions...
        </p>

      </div>
    );
  }

  if (
    isError
  ) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message={
              error?.message ||
              'Failed to load prescriptions.'
            }
          />

        </div>

      </div>
    );
  }

  const activePrescriptions =
    prescriptions.filter(
      prescription =>
        !isExpired(
          prescription.expires_at
        ) &&
        prescription.status !==
          'completed'
    );

  const pastPrescriptions =
    prescriptions.filter(
      prescription =>
        isExpired(
          prescription.expires_at
        ) ||
        prescription.status ===
          'completed'
    );

  return (
    <div className="space-y-7">

      {/* =====================================================
          PAGE HERO
      ====================================================== */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Pill
        }
        title="My Prescriptions"
        description="Review medicines prescribed by your doctors and access active prescription QR codes for pharmacy dispensing."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Active
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  activePrescriptions.length
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Past
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  pastPrescriptions.length
                }
              </p>

            </div>

          </div>
        }
      />

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}
      {prescriptions.length ===
      0 && (

        <Card>

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <Stethoscope
                className="w-7 h-7"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No prescriptions yet
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Prescriptions issued during your Care4U consultations will appear here.
            </p>

          </div>

        </Card>

      )}

      {/* =====================================================
          ACTIVE PRESCRIPTIONS
      ====================================================== */}
      {activePrescriptions.length >
        0 && (

        <Card
          title="Active Prescriptions"
        >

          <div className="space-y-3">

            {activePrescriptions.map(
              prescription => (

                <PrescriptionRow
                  key={
                    prescription.id
                  }
                  prescription={
                    prescription
                  }
                />

              )
            )}

          </div>

        </Card>

      )}

      {/* =====================================================
          PAST PRESCRIPTIONS
      ====================================================== */}
      {pastPrescriptions.length >
        0 && (

        <Card
          title="Prescription History"
        >

          <div className="space-y-3">

            {pastPrescriptions.map(
              prescription => (

                <PrescriptionRow
                  key={
                    prescription.id
                  }
                  prescription={
                    prescription
                  }
                />

              )
            )}

          </div>

        </Card>

      )}

    </div>
  );
};

export default PrescriptionsPage;