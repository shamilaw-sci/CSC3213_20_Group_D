/**
 * @file      MedicalRecordsPage.jsx
 * @component MedicalRecordsPage
 * @desc      Premium patient medical-record timeline.
 *            Displays record summaries, filtering, clinical cards,
 *            confidential indicators, and full record details.
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
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  FileHeart,
  FileText,
  FlaskConical,
  History,
  LockKeyhole,
  Pill,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import {
  getMedicalRecords,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

/* =========================================================
   RECORD TYPE CONFIGURATION
========================================================= */

const RECORD_TYPES = {
  consultation: {
    label: 'Consultation',
    icon: Stethoscope,
    colorClass: 'text-primary',
    backgroundClass: 'bg-module-soft',
  },

  lab_result: {
    label: 'Lab Result',
    icon: FlaskConical,
    colorClass: 'text-blue-700',
    backgroundClass: 'bg-blue-50',
  },

  imaging: {
    label: 'Imaging',
    icon: ScanLine,
    colorClass: 'text-violet-700',
    backgroundClass: 'bg-violet-50',
  },

  prescription: {
    label: 'Prescription',
    icon: Pill,
    colorClass: 'text-emerald-700',
    backgroundClass: 'bg-emerald-50',
  },

  diagnosis: { label: 'Diagnosis', icon: FileText, colorClass: 'text-primary', backgroundClass: 'bg-module-soft' },
  vaccination: { label: 'Vaccination', icon: FileHeart, colorClass: 'text-primary', backgroundClass: 'bg-module-soft' },
  other: {
    label: 'Record',
    icon: FileText,
    colorClass: 'text-slate-700',
    backgroundClass: 'bg-slate-100',
  },
};

const FILTERS = [
  { key: 'diagnosis', label: 'Diagnoses' },
  { key: 'vaccination', label: 'Vaccinations' },
  { key: 'other', label: 'Other' },
  {
    key: 'all',
    label: 'All',
  },
  {
    key: 'consultation',
    label: 'Consultations',
  },
  {
    key: 'lab_result',
    label: 'Lab',
  },
  {
    key: 'imaging',
    label: 'Imaging',
  },
  {
    key: 'prescription',
    label: 'Prescriptions',
  },
];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Returns display metadata for a medical-record type.
 */
const getRecordMeta = (
  type
) => {
  return (
    RECORD_TYPES[
      type
    ] ||
    RECORD_TYPES.other
  );
};

/**
 * Formats a medical record date.
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
 * Formats long date used in record detail.
 */
const formatLongDate = (
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

  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

/** Render a record summary metric from icon/label/value/description/color props; purely presentational.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const SummaryCard = ({
  icon: Icon,
  label,
  value,
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
            strokeWidth={
              2
            }
          />

        </div>

      </div>

    </div>
  );
};

/* =========================================================
   RECORD CARD
========================================================= */

/** Render one record summary and call onOpen on keyboard/click activation. Props are record and onOpen; the parent owns selection.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const RecordCard = ({
  record,
  onOpen,
}) => {
  const meta =
    getRecordMeta(
      record.record_type
    );

  const Icon =
    meta.icon;

  return (
    <button
      type="button"
      onClick={
        onOpen
      }
      className="
        group
        w-full
        text-left
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        shadow-[0_8px_26px_rgba(15,23,42,0.04)]
        hover:shadow-[0_14px_36px_rgba(15,23,42,0.075)]
        hover:-translate-y-0.5
        transition-all
        duration-200
      "
    >

      <div
        className="
          flex
          items-start
          gap-4
        "
      >

        <div
          className={`
            w-12 h-12
            rounded-2xl
            flex
            items-center
            justify-center
            shrink-0
            ${meta.backgroundClass}
            ${meta.colorClass}
          `}
        >

          <Icon
            size={21}
            strokeWidth={
              2
            }
          />

        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >

          {/* ===============================================
              TYPE + PRIVACY
          ================================================ */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >

            <span
              className={`
                inline-flex
                items-center
                rounded-full
                px-2.5
                py-1
                text-[9px]
                font-bold
                uppercase
                tracking-[0.1em]
                ${meta.backgroundClass}
                ${meta.colorClass}
              `}
            >
              {meta.label}
            </span>

            {record.is_confidential && (

              <span
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-full
                  px-2.5
                  py-1
                  text-[9px]
                  font-bold
                  text-amber-700
                  bg-amber-50
                "
              >

                <LockKeyhole
                  size={10}
                />

                Confidential

              </span>

            )}

          </div>

          {/* ===============================================
              TITLE
          ================================================ */}

          <h3
            className="
              text-base
              sm:text-lg
              font-bold
              text-foreground
              leading-snug
              mt-3
            "
          >
            {record.title ||
              meta.label}
          </h3>

          {/* ===============================================
              META
          ================================================ */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-2
              mt-3
            "
          >

            <div
              className="
                flex
                items-center
                gap-1.5
                text-xs
                text-muted-foreground
              "
            >

              <CalendarDays
                size={14}
              />

              <span>
                {formatDate(
                  record.created_at
                )}
              </span>

            </div>

            {record.doctor_name && (

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  text-xs
                  text-muted-foreground
                  min-w-0
                "
              >

                <UserRound
                  size={14}
                  className="shrink-0"
                />

                <span className="truncate">
                  Dr. {
                    record.doctor_name
                  }
                  {record
                    .doctor_specialization
                    ? ` · ${record.doctor_specialization}`
                    : ''}
                </span>

              </div>

            )}

          </div>

          {/* ===============================================
              FOLLOW-UP
          ================================================ */}

          {record.follow_up_needed && (

            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-blue-50
                text-blue-700
                px-2.5
                py-1
                mt-3
              "
            >

              <CalendarCheck2
                size={11}
              />

              <span
                className="
                  text-[9px]
                  font-bold
                "
              >
                Follow-up required
              </span>

            </div>

          )}

        </div>

        <div
          className="
            w-9 h-9
            rounded-xl
            bg-secondary/60
            text-muted-foreground
            flex
            items-center
            justify-center
            shrink-0
            group-hover:bg-module-soft
            group-hover:text-primary
            transition-colors
          "
        >

          <ChevronRight
            size={18}
          />

        </div>

      </div>

    </button>
  );
};

/* =========================================================
   DETAIL BLOCK
========================================================= */

const DetailBlock = ({
  label,
  children,
  emphasis = false,
}) => {
  if (!children) {
    return null;
  }

  return (
    <div>

      <p
        className="
          text-[10px]
          font-bold
          text-muted-foreground
          uppercase
          tracking-[0.14em]
          mb-2
        "
      >
        {label}
      </p>

      <div
        className={`
          rounded-xl
          border
          border-border/60
          p-4
          text-sm
          text-foreground
          leading-relaxed
          ${
            emphasis
              ? 'bg-module-soft/55'
              : 'bg-secondary/40'
          }
        `}
      >
        {children}
      </div>

    </div>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

/** Read the owning profile records through React Query; derive sorted/filter/count views. Only a selected object in the current result can open a detail dialog. Missing profile or failed API denies display.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const MedicalRecordsPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    '';

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(
    null
  );

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState(
    'all'
  );

  const {
    data:
      records = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'medicalRecords',
      patientId,
    ],

    queryFn: () =>
      getMedicalRecords(
        patientId
      ),

    enabled:
      !!patientId,
  });

  /* =======================================================
     DERIVED RECORD DATA
  ======================================================= */

  const sortedRecords =
    useMemo(
      () =>
        [
          ...records,
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
        records,
      ]
    );

  const filteredRecords =
    useMemo(
      () => {
        if (
          selectedFilter ===
          'all'
        ) {
          return sortedRecords;
        }

        return sortedRecords.filter(
          record =>
            record.record_type ===
            selectedFilter
        );
      },
      [
        sortedRecords,
        selectedFilter,
      ]
    );

  const consultationCount =
    useMemo(
      () =>
        records.filter(
          record =>
            record.record_type ===
            'consultation'
        ).length,
      [
        records,
      ]
    );

  const followUpCount =
    useMemo(
      () =>
        records.filter(
          record =>
            Boolean(
              record.follow_up_needed
            )
        ).length,
      [
        records,
      ]
    );

  const confidentialCount =
    useMemo(
      () =>
        records.filter(
          record =>
            Boolean(
              record.is_confidential
            )
        ).length,
      [
        records,
      ]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (!patientId) return <Alert type="error" message="Your patient profile is unavailable. Please sign in again." />;

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

          <FileHeart
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
          Loading your records
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Preparing your Care4U medical history
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
              error?.response?.status === 401
                ? 'Your session has ended. Please sign in again.'
                : 'Could not load your medical records. Check your connection and try again.'
            }
          />

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* ===================================================
          PAGE HEADER
      ==================================================== */}

      <PageHeader
        eyebrow="Patient Portal"
        icon={
          FileHeart
        }
        title="Medical Records"
        description="Review consultations, test results, imaging, prescriptions and other clinical information saved in Care4U."
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

              <History
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
                Health History
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
                {records.length ===
                0
                  ? 'No records yet'
                  : `${records.length} record${
                      records.length ===
                      1
                        ? ''
                        : 's'
                    }`}
              </p>

              {confidentialCount >
                0 && (

                <p
                  className="
                    text-[11px]
                    text-muted-foreground
                    mt-0.5
                  "
                >
                  {confidentialCount}{' '}
                  confidential
                </p>

              )}

            </div>

          </div>
        }
      />

      {/* ===================================================
          SUMMARY CARDS
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
            FileText
          }
          label="Total Records"
          value={
            records.length
          }
          description="Saved health records"
          iconClass="text-primary"
          backgroundClass="bg-module-soft"
        />

        <SummaryCard
          icon={
            Stethoscope
          }
          label="Consultations"
          value={
            consultationCount
          }
          description="Clinical visits"
          iconClass="text-blue-700"
          backgroundClass="bg-blue-50"
        />

        <SummaryCard
          icon={
            CalendarCheck2
          }
          label="Follow-ups"
          value={
            followUpCount
          }
          description={
            followUpCount ===
            0
              ? 'Nothing pending'
              : 'Require attention'
          }
          iconClass={
            followUpCount >
            0
              ? 'text-amber-700'
              : 'text-emerald-700'
          }
          backgroundClass={
            followUpCount >
            0
              ? 'bg-amber-50'
              : 'bg-emerald-50'
          }
        />

      </section>

      {/* ===================================================
          RECORD TIMELINE
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
            SECTION HEADER
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
              Your Health History
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
              Care timeline
            </h2>

            <p
              className="
                text-xs
                sm:text-sm
                text-muted-foreground
                mt-1
              "
            >
              {filteredRecords.length}{' '}
              {filteredRecords.length ===
              1
                ? 'record'
                : 'records'}{' '}
              shown
            </p>

          </div>

          {/* ===============================================
              FILTER CHIPS
          ================================================ */}

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
                    aria-pressed={active}
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
            RECORD CONTENT
        ================================================== */}

        <div
          className="
            p-5
            sm:p-6
            bg-secondary/10
          "
        >

          {filteredRecords.length ===
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

                <FileHeart
                  size={28}
                  strokeWidth={
                    1.8
                  }
                />

              </div>

              <h3
                className="
                  text-lg
                  font-bold
                  text-foreground
                "
              >
                {records.length ===
                0
                  ? 'No medical records yet'
                  : 'No matching records'}
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
                {records.length ===
                0
                  ? 'Your Care4U medical history will appear here after consultations and other clinical activity.'
                  : 'There are no records in this category yet. Try another filter.'}
              </p>

              {records.length >
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
                  View all records
                </button>

              )}

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-4
              "
            >

              {filteredRecords.map(
                record => (

                  <RecordCard
                    key={
                      record.id
                    }
                    record={
                      record
                    }
                    onOpen={() =>
                      setSelectedRecord(
                        record
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* ===================================================
          SECURITY FOOTER
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
          Your medical records are protected by Care4U role-based access controls.
        </span>

      </div>

      {/* ===================================================
          RECORD DETAIL MODAL
      ==================================================== */}

      <Modal
        manageFocus
        isOpen={
          !!selectedRecord && records.includes(selectedRecord)
        }
        onClose={() =>
          setSelectedRecord(
            null
          )
        }
        title="Medical Record"
        size="lg"
      >

        {records.includes(selectedRecord) && selectedRecord && (() => {
          const meta =
            getRecordMeta(
              selectedRecord
                .record_type
            );

          const Icon =
            meta.icon;

          return (
            <div className="space-y-6">

              {/* ===========================================
                  RECORD HERO
              ============================================ */}

              <div
                className="
                  relative
                  overflow-hidden
                  rounded-2xl
                  bg-[#12344D]
                  text-white
                  p-5
                  sm:p-6
                "
              >

                <div
                  className="
                    absolute
                    -right-16
                    -top-20
                    w-48 h-48
                    rounded-full
                    bg-primary/20
                  "
                />

                <div
                  className="
                    absolute
                    right-10
                    -bottom-14
                    w-24 h-24
                    rounded-full
                    bg-white/5
                  "
                />

                <div
                  className="
                    relative
                    z-10
                  "
                >

                  <div
                    className={`
                      w-12 h-12
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      ${meta.backgroundClass}
                      ${meta.colorClass}
                    `}
                  >

                    <Icon
                      size={22}
                    />

                  </div>

                  <div
                    className="
                      inline-flex
                      items-center
                      mt-4
                      rounded-full
                      bg-white/10
                      border
                      border-white/10
                      px-3
                      py-1.5
                    "
                  >

                    <span
                      className="
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                      "
                    >
                      {meta.label}
                    </span>

                  </div>

                  <h3
                    className="
                      text-xl
                      sm:text-2xl
                      font-bold
                      mt-3
                      leading-tight
                    "
                  >
                    {selectedRecord.title ||
                      meta.label}
                  </h3>

                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-x-4
                      gap-y-2
                      mt-4
                      text-xs
                      text-slate-300
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                      "
                    >

                      <CalendarDays
                        size={14}
                      />

                      <span>
                        {formatLongDate(
                          selectedRecord
                            .created_at
                        )}
                      </span>

                    </div>

                    {selectedRecord
                        .doctor_name && (

                      <div
                        className="
                          flex
                          items-center
                          gap-1.5
                        "
                      >

                        <Stethoscope
                          size={14}
                        />

                        <span>
                          Dr. {
                            selectedRecord
                              .doctor_name
                          }
                          {selectedRecord
                            .doctor_specialization
                            ? ` · ${selectedRecord.doctor_specialization}`
                            : ''}
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              </div>

              {/* ===========================================
                  CONFIDENTIAL WARNING
              ============================================ */}

              {selectedRecord
                  .is_confidential && (

                <div
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    bg-amber-50
                    border
                    border-amber-100
                    p-4
                  "
                >

                  <div
                    className="
                      w-9 h-9
                      rounded-xl
                      bg-white
                      text-amber-700
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >

                    <LockKeyhole
                      size={16}
                    />

                  </div>

                  <div>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-amber-800
                      "
                    >
                      Confidential medical record
                    </p>

                    <p
                      className="
                        text-xs
                        text-amber-700
                        mt-1
                        leading-relaxed
                      "
                    >
                      This record has been marked confidential in your Care4U medical history.
                    </p>

                  </div>

                </div>

              )}

              {/* ===========================================
                  CLINICAL INFORMATION
              ============================================ */}

              <div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-5
                  "
                >

                  <FileHeart
                    size={18}
                    className="text-primary"
                  />

                  <h4
                    className="
                      text-base
                      font-bold
                      text-foreground
                    "
                  >
                    Clinical information
                  </h4>

                </div>

                {selectedRecord
                    .record_type ===
                    'consultation' ? (

                  <div className="space-y-5">

                    {selectedRecord
                        .chief_complaint && (

                      <DetailBlock
                        label="Chief Complaint"
                      >
                        {
                          selectedRecord
                            .chief_complaint
                        }
                      </DetailBlock>

                    )}

                    {selectedRecord
                        .diagnosis && (

                      <DetailBlock
                        label="Diagnosis"
                        emphasis
                      >
                        {
                          selectedRecord
                            .diagnosis
                        }
                      </DetailBlock>

                    )}

                    {selectedRecord
                        .treatment_plan && (

                      <DetailBlock
                        label="Treatment Plan"
                      >
                        {
                          selectedRecord
                            .treatment_plan
                        }
                      </DetailBlock>

                    )}

                    {selectedRecord
                        .description && (

                      <DetailBlock
                        label="Additional Notes"
                      >
                        {
                          selectedRecord
                            .description
                        }
                      </DetailBlock>

                    )}

                  </div>

                ) : (

                  <DetailBlock
                    label="Details"
                  >
                    {selectedRecord
                      .description ||
                      'No additional details recorded.'}
                  </DetailBlock>

                )}

              </div>

              {/* ===========================================
                  FOLLOW-UP NOTICE
              ============================================ */}

              {selectedRecord
                  .follow_up_needed && (

                <div
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    bg-blue-50
                    border
                    border-blue-100
                    p-4
                  "
                >

                  <div
                    className="
                      w-9 h-9
                      rounded-xl
                      bg-white
                      text-blue-700
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >

                    <CalendarCheck2
                      size={17}
                    />

                  </div>

                  <div>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-blue-800
                      "
                    >
                      Follow-up required
                    </p>

                    <p
                      className="
                        text-xs
                        text-blue-700
                        mt-1
                        leading-relaxed
                      "
                    >
                      Your healthcare provider has indicated that this record requires follow-up care.
                    </p>

                  </div>

                </div>

              )}

              {/* ===========================================
                  PRIVACY NOTE
              ============================================ */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-xs
                  text-muted-foreground
                  pt-1
                "
              >

                <ShieldCheck
                  size={14}
                />

                <span>
                  This information is part of your protected Care4U medical record.
                </span>

              </div>

            </div>
          );
        })()}

      </Modal>

    </div>
  );
};

export default MedicalRecordsPage;