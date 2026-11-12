/**
 * @file      PrescriptionsPage.jsx
 * @component PrescriptionsPage
 * @desc      Premium patient prescription workspace.
 *            Displays prescription status, medicines,
 *            dispensing progress, expiry information,
 *            and pharmacy QR codes.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  useMemo,
  useState,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  QRCodeSVG,
} from 'qrcode.react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Pill,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  X,
} from 'lucide-react';

import {
  getPatientPrescriptions,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

/* =========================================================
   STATUS CONFIGURATION
========================================================= */

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    textClass: 'text-emerald-700',
    backgroundClass: 'bg-emerald-50',
    borderClass: 'border-emerald-100',
  },

  partially_filled: {
    label: 'Partially filled',
    icon: Clock3,
    textClass: 'text-amber-700',
    backgroundClass: 'bg-amber-50',
    borderClass: 'border-amber-100',
  },

  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    textClass: 'text-slate-600',
    backgroundClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
  },

  expired: {
    label: 'Expired',
    icon: AlertCircle,
    textClass: 'text-red-700',
    backgroundClass: 'bg-red-50',
    borderClass: 'border-red-100',
  },
};

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
 * Normalizes prescription status values.
 */
const normalizeStatus = (
  status
) => {
  if (!status) {
    return 'active';
  }

  return String(
    status
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      '_'
    );
};

/**
 * Checks whether a prescription has expired.
 */
const isExpired = (
  expiresAt
) => {
  if (!expiresAt) {
    return false;
  }

  const expiry =
    new Date(
      expiresAt
    );

  if (
    Number.isNaN(
      expiry.getTime()
    )
  ) {
    return false;
  }

  return expiry <
    new Date();
};

/**
 * Resolves the final patient-facing status.
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

  return normalizeStatus(
    status
  );
};

/**
 * Returns status display metadata.
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

      textClass:
        'text-muted-foreground',

      backgroundClass:
        'bg-secondary',

      borderClass:
        'border-border',
    }
  );
};

/**
 * Formats prescription dates.
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
 * Calculates dispensing percentage.
 */
const getDispensingProgress = (
  item
) => {
  const prescribed =
    Number(
      item?.quantity_prescribed ||
      0
    );

  const dispensed =
    Number(
      item?.quantity_dispensed ||
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
  description,
  iconClass,
  backgroundClass,
}) => {
  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        shadow-[0_8px_24px_rgba(15,23,42,0.045)]
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-muted-foreground
            "
          >
            {label}
          </p>

          <p
            className="
              text-3xl
              font-black
              text-foreground
              tracking-tight
              mt-2
            "
          >
            {value}
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
              mt-1
            "
          >
            {description}
          </p>

        </div>

        <div
          className={`
            w-11 h-11
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            ${backgroundClass}
            ${iconClass}
          `}
        >

          <Icon
            size={20}
            strokeWidth={2}
          />

        </div>

      </div>

    </div>
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
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1.5
        whitespace-nowrap
        ${meta.textClass}
        ${meta.backgroundClass}
        ${meta.borderClass}
      `}
    >

      <Icon
        size={12}
        strokeWidth={2.2}
      />

      <span
        className="
          text-[10px]
          font-bold
        "
      >
        {meta.label}
      </span>

    </span>
  );
};

/* =========================================================
   MEDICINE CARD
========================================================= */

const MedicineCard = ({
  item,
  index,
}) => {
  const prescribed =
    Number(
      item?.quantity_prescribed ||
      0
    );

  const dispensed =
    Number(
      item?.quantity_dispensed ||
      0
    );

  const progress =
    getDispensingProgress(
      item
    );

  return (
    <div
      className="
        rounded-2xl
        border
        border-border/70
        bg-card
        p-4
      "
    >

      <div
        className="
          flex
          items-start
          gap-3
        "
      >

        <div
          className="
            w-9 h-9
            rounded-xl
            bg-[#12344D]
            text-white
            flex
            items-center
            justify-center
            shrink-0
          "
        >

          <span
            className="
              text-xs
              font-black
            "
          >
            {index + 1}
          </span>

        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >

          <p
            className="
              text-sm
              font-bold
              text-foreground
              break-words
            "
          >
            {item.medicine_name}
          </p>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
              mt-1.5
              text-xs
              text-muted-foreground
            "
          >

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
                  ) === 1
                    ? ''
                    : 's'}
                </span>
              </>
            )}

          </div>

        </div>

      </div>

      {/* =================================================
          SPECIAL NOTES
      ================================================== */}

      {item.special_notes && (

        <div
          className="
            flex
            items-start
            gap-2
            rounded-xl
            bg-blue-50
            px-3
            py-2.5
            mt-3
          "
        >

          <FileText
            size={14}
            className="
              text-blue-700
              shrink-0
              mt-0.5
            "
          />

          <p
            className="
              text-xs
              text-blue-700
              italic
              leading-relaxed
            "
          >
            {item.special_notes}
          </p>

        </div>

      )}

      {/* =================================================
          DISPENSING PROGRESS
      ================================================== */}

      <div className="mt-4">

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            mb-2
          "
        >

          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.12em]
              font-bold
              text-muted-foreground
            "
          >
            Dispensing Progress
          </p>

          <p
            className="
              text-xs
              font-bold
              text-foreground
            "
          >
            {dispensed} / {prescribed}
          </p>

        </div>

        <div
          className="
            h-1.5
            rounded-full
            bg-secondary
            overflow-hidden
          "
        >

          <div
            className="
              h-full
              rounded-full
              bg-primary
              transition-all
            "
            style={{
              width:
                `${progress}%`,
            }}
          />

        </div>

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            mt-2
          "
        >

          <span
            className="
              text-[10px]
              text-muted-foreground
            "
          >
            Prescribed: {prescribed}
          </span>

          <span
            className={`
              text-[10px]
              font-semibold
              ${
                dispensed > 0
                  ? 'text-emerald-700'
                  : 'text-muted-foreground'
              }
            `}
          >
            Dispensed: {dispensed}
          </span>

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   QR MODAL
========================================================= */

const PharmacyQRModal = ({
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
    <div
      className="
        fixed
        inset-0
        z-[100]
        bg-slate-950/45
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
    >

      <div
        className="
          w-full
          max-w-md
          max-h-[92vh]
          overflow-y-auto
          rounded-[1.75rem]
          bg-card
          border
          border-border
          shadow-2xl
        "
      >

        {/* =================================================
            MODAL HEADER
        ================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            px-5
            py-4
            border-b
            border-border
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
              "
            >

              <QrCode
                size={19}
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.14em]
                  font-bold
                  text-primary
                "
              >
                Care4U Prescription
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
                Pharmacy QR
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              w-10 h-10
              rounded-xl
              bg-secondary
              text-muted-foreground
              hover:text-foreground
              flex
              items-center
              justify-center
              transition-colors
            "
            aria-label="Close QR code"
          >

            <X
              size={18}
            />

          </button>

        </div>

        {/* =================================================
            QR CONTENT
        ================================================== */}

        <div
          className="
            flex
            flex-col
            items-center
            text-center
            px-6
            py-7
          "
        >

          <div
            className="
              w-14 h-14
              rounded-2xl
              bg-module-soft
              text-primary
              flex
              items-center
              justify-center
              mb-4
            "
          >

            <ShoppingBag
              size={25}
            />

          </div>

          <h3
            className="
              text-xl
              font-bold
              text-foreground
            "
          >
            Show this to the pharmacist
          </h3>

          <p
            className="
              text-sm
              text-muted-foreground
              leading-relaxed
              mt-2
              max-w-sm
            "
          >
            Ask the pharmacist to scan this QR code to securely verify your prescription.
          </p>

          <div
            className="
              w-full
              rounded-2xl
              border
              border-border
              bg-white
              p-5
              mt-6
              shadow-[0_10px_28px_rgba(15,23,42,0.07)]
            "
          >

            <div
              className="
                flex
                justify-center
              "
            >

              <QRCodeSVG
                value={
                  qrValue
                }
                size={220}
                bgColor="#FFFFFF"
                fgColor="#12344D"
                level="M"
              />

            </div>

            <div
              className="
                border-t
                border-border
                mt-5
                pt-4
              "
            >

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.14em]
                  font-bold
                  text-muted-foreground
                "
              >
                Prescription Reference
              </p>

              <p
                className="
                  text-xs
                  font-mono
                  font-bold
                  text-foreground
                  mt-2
                  break-all
                "
              >
                {qrValue}
              </p>

            </div>

          </div>

          <div
            className="
              flex
              items-start
              gap-2
              rounded-xl
              bg-module-soft
              text-left
              p-4
              mt-5
            "
          >

            <ShieldCheck
              size={16}
              className="
                text-primary
                shrink-0
                mt-0.5
              "
            />

            <p
              className="
                text-xs
                text-primary
                leading-relaxed
              "
            >
              This QR contains only the Care4U prescription reference. An authenticated pharmacist must verify it before viewing prescription details.
            </p>

          </div>

        </div>

      </div>

    </div>
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
      item =>
        item &&
        item.medicine_name
    );

  const qrAvailable =
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
    <article
      className="
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        sm:p-6
        shadow-[0_8px_28px_rgba(15,23,42,0.045)]
        hover:shadow-[0_14px_36px_rgba(15,23,42,0.075)]
        transition-shadow
      "
    >

      {/* ===================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              w-12 h-12
              rounded-2xl
              bg-module-soft
              text-primary
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <Pill
              size={21}
            />

          </div>

          <div>

            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-primary
              "
            >
              Prescription
            </p>

            <h3
              className="
                text-base
                sm:text-lg
                font-bold
                text-foreground
                mt-1
              "
            >
              {validItems.length}{' '}
              {validItems.length ===
              1
                ? 'medicine'
                : 'medicines'}
            </h3>

            {prescription
                .doctor_name && (

              <p
                className="
                  text-xs
                  text-muted-foreground
                  mt-1
                "
              >
                Dr. {
                  prescription
                    .doctor_name
                }
                {prescription
                  .doctor_specialization
                  ? ` · ${prescription.doctor_specialization}`
                  : ''}
              </p>

            )}

          </div>

        </div>

        <StatusBadge
          status={
            status
          }
        />

      </div>

      {/* ===================================================
          DATE PANEL
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          gap-3
          mt-5
        "
      >

        <div
          className="
            rounded-xl
            bg-secondary/45
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-9 h-9
                rounded-xl
                bg-card
                border
                border-border/60
                text-primary
                flex
                items-center
                justify-center
              "
            >

              <CalendarDays
                size={16}
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Issued
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-1
                "
              >
                {formatDate(
                  prescription
                    .created_at
                )}
              </p>

            </div>

          </div>

        </div>

        <div
          className="
            rounded-xl
            bg-secondary/45
            p-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className={`
                w-9 h-9
                rounded-xl
                bg-card
                border
                border-border/60
                flex
                items-center
                justify-center
                ${
                  status ===
                  'expired'
                    ? 'text-red-700'
                    : 'text-primary'
                }
              `}
            >

              <Clock3
                size={16}
              />

            </div>

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Expires
              </p>

              <p
                className={`
                  text-sm
                  font-semibold
                  mt-1
                  ${
                    status ===
                    'expired'
                      ? 'text-red-700'
                      : 'text-foreground'
                  }
                `}
              >
                {formatDate(
                  prescription
                    .expires_at
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          DOCTOR NOTES
      ==================================================== */}

      {prescription.notes && (

        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            bg-module-soft/65
            p-4
            mt-4
          "
        >

          <div
            className="
              w-9 h-9
              rounded-xl
              bg-card
              text-primary
              flex
              items-center
              justify-center
              shrink-0
            "
          >

            <Stethoscope
              size={16}
            />

          </div>

          <div>

            <p
              className="
                text-[9px]
                uppercase
                tracking-[0.13em]
                font-bold
                text-primary
              "
            >
              Doctor's Notes
            </p>

            <p
              className="
                text-sm
                text-foreground
                leading-relaxed
                whitespace-pre-wrap
                mt-1.5
              "
            >
              {prescription.notes}
            </p>

          </div>

        </div>

      )}

      {/* ===================================================
          MEDICINES
      ==================================================== */}

      <div className="mt-5">

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            mb-3
          "
        >

          <h4
            className="
              text-sm
              font-bold
              text-foreground
            "
          >
            Medicines
          </h4>

          <span
            className="
              text-xs
              text-muted-foreground
              font-semibold
            "
          >
            {validItems.length}{' '}
            {validItems.length ===
            1
              ? 'item'
              : 'items'}
          </span>

        </div>

        {validItems.length ===
        0 ? (

          <div
            className="
              flex
              items-start
              gap-2
              rounded-xl
              bg-secondary/50
              p-4
            "
          >

            <AlertCircle
              size={16}
              className="
                text-muted-foreground
                shrink-0
                mt-0.5
              "
            />

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >
              No medicines were recorded for this prescription.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {validItems.map(
              (
                item,
                index
              ) => (

                <MedicineCard
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

          </div>

        )}

      </div>

      {/* ===================================================
          QR ACTION
      ==================================================== */}

      <div
        className="
          pt-5
          mt-5
          border-t
          border-border
        "
      >

        {qrAvailable ? (

          <button
            type="button"
            onClick={() =>
              onShowQR(
                prescription
              )
            }
            className="
              group
              w-full
              flex
              items-center
              gap-3
              rounded-xl
              bg-[#12344D]
              text-white
              p-4
              text-left
              hover:bg-[#173F5C]
              transition-colors
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-white/10
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <QrCode
                size={19}
              />

            </div>

            <div className="flex-1">

              <p
                className="
                  text-sm
                  font-bold
                "
              >
                Show Pharmacy QR
              </p>

              <p
                className="
                  text-xs
                  text-slate-300
                  mt-1
                "
              >
                Present this prescription at the pharmacy
              </p>

            </div>

            <span
              className="
                text-xs
                font-bold
                text-white/80
                group-hover:text-white
              "
            >
              Open →
            </span>

          </button>

        ) : (

          <div
            className="
              flex
              items-start
              gap-2
              text-xs
              text-muted-foreground
            "
          >

            <ShieldCheck
              size={15}
              className="
                shrink-0
                mt-0.5
              "
            />

            <p>
              {status ===
              'expired'
                ? 'QR unavailable because this prescription has expired.'
                : status ===
                  'completed'
                  ? 'This prescription has been fully dispensed.'
                  : 'Pharmacy QR is unavailable for this prescription.'}
            </p>

          </div>

        )}

      </div>

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

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState(
    'all'
  );

  const [
    qrPrescription,
    setQrPrescription,
  ] = useState(
    null
  );

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

  /* =======================================================
     DERIVED PRESCRIPTION DATA
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
          prescription =>
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
          prescription =>
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
          prescription => {
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
          prescription => {
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

  if (
    isLoading
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          flex-col
          items-center
          justify-center
          gap-3
        "
      >

        <div
          className="
            w-14 h-14
            rounded-2xl
            bg-module-soft
            text-primary
            flex
            items-center
            justify-center
            mb-1
          "
        >

          <Pill
            size={25}
          />

        </div>

        <Spinner
          size="lg"
        />

        <p
          className="
            text-sm
            font-semibold
            text-foreground
            mt-1
          "
        >
          Loading prescriptions
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Preparing your latest medication information
        </p>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    isError
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          items-center
          justify-center
          px-4
        "
      >

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

  return (
    <div className="space-y-7">

      {/* ===================================================
          QR MODAL
      ==================================================== */}

      {qrPrescription && (

        <PharmacyQRModal
          prescription={
            qrPrescription
          }
          onClose={() =>
            setQrPrescription(
              null
            )
          }
        />

      )}

      {/* ===================================================
          HEADER
      ==================================================== */}

      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Pill
        }
        title="My Prescriptions"
        description="Review medicines, dispensing progress, prescription status and pharmacy QR codes issued by your Care4U doctors."
        meta={
          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Pill
                size={19}
              />

            </div>

            <div>

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-primary
                "
              >
                Medication History
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
                {prescriptions.length}{' '}
                {prescriptions.length ===
                1
                  ? 'prescription'
                  : 'prescriptions'}
              </p>

            </div>

          </div>
        }
      />

      {/* ===================================================
          SUMMARY
      ==================================================== */}

      <section
        className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
        "
      >

        <SummaryCard
          icon={
            CheckCircle2
          }
          label="Active"
          value={
            activeCount
          }
          description="Ready for dispensing"
          iconClass="text-emerald-700"
          backgroundClass="bg-emerald-50"
        />

        <SummaryCard
          icon={
            Clock3
          }
          label="Partially filled"
          value={
            partialCount
          }
          description="Dispensing in progress"
          iconClass="text-amber-700"
          backgroundClass="bg-amber-50"
        />

        <SummaryCard
          icon={
            FileText
          }
          label="History"
          value={
            historyCount
          }
          description="Completed or expired"
          iconClass="text-blue-700"
          backgroundClass="bg-blue-50"
        />

      </section>

      {/* ===================================================
          PRESCRIPTION WORKSPACE
      ==================================================== */}

      <section
        className="
          rounded-2xl
          bg-card
          border
          border-border/70
          shadow-[0_8px_26px_rgba(15,23,42,0.04)]
          overflow-hidden
        "
      >

        {/* =================================================
            TOOLBAR
        ================================================== */}

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-4
            px-5
            sm:px-6
            py-5
            border-b
            border-border
          "
        >

          <div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.15em]
                font-bold
                text-primary
              "
            >
              Your Medications
            </p>

            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                text-foreground
                mt-1
              "
            >
              Prescription history
            </h2>

            <p
              className="
                text-xs
                sm:text-sm
                text-muted-foreground
                mt-1
              "
            >
              {filteredPrescriptions.length}{' '}
              {filteredPrescriptions.length ===
              1
                ? 'prescription'
                : 'prescriptions'}{' '}
              shown
            </p>

          </div>

          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >

            {FILTERS.map(
              filter => {

                const active =
                  selectedFilter ===
                  filter.key;

                return (
                  <button
                    key={
                      filter.key
                    }
                    type="button"
                    onClick={() =>
                      setSelectedFilter(
                        filter.key
                      )
                    }
                    className={`
                      rounded-xl
                      px-3.5
                      py-2
                      text-xs
                      font-bold
                      border
                      transition-all
                      ${
                        active
                          ? 'bg-[#12344D] border-[#12344D] text-white shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/25'
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================== */}

        <div
          className="
            p-5
            sm:p-6
            bg-secondary/10
          "
        >

          {filteredPrescriptions.length ===
          0 ? (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                text-center
                py-14
                px-4
              "
            >

              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >

                <Pill
                  size={28}
                  strokeWidth={1.8}
                />

              </div>

              <h3
                className="
                  text-lg
                  font-bold
                  text-foreground
                "
              >
                {prescriptions.length ===
                0
                  ? 'No prescriptions yet'
                  : 'No matching prescriptions'}
              </h3>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-2
                  max-w-md
                  leading-relaxed
                "
              >
                {prescriptions.length ===
                0
                  ? 'Prescriptions issued during your Care4U consultations will appear here.'
                  : 'There are no prescriptions in this category. Try another filter.'}
              </p>

              {prescriptions.length >
                0 && (

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFilter(
                      'all'
                    )
                  }
                  className="
                    mt-5
                    rounded-xl
                    bg-module-soft
                    text-primary
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    hover:bg-primary
                    hover:text-white
                    transition-colors
                  "
                >
                  View all prescriptions
                </button>

              )}

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                2xl:grid-cols-2
                gap-5
                items-start
              "
            >

              {filteredPrescriptions.map(
                prescription => (

                  <PrescriptionCard
                    key={
                      prescription.id
                    }
                    prescription={
                      prescription
                    }
                    onShowQR={
                      setQrPrescription
                    }
                  />

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* ===================================================
          SECURITY
      ==================================================== */}

      <div
        className="
          flex
          items-center
          justify-center
          gap-2
          text-xs
          text-muted-foreground
          px-4
        "
      >

        <ShieldCheck
          size={15}
        />

        <span>
          Pharmacy access requires an authenticated Care4U pharmacist account.
        </span>

      </div>

    </div>
  );
};

export default PrescriptionsPage;
