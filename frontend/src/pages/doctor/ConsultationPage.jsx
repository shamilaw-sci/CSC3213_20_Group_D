/**
 * @file    ConsultationPage.jsx
 * @module  Doctor
 * @desc    Central doctor consultation workspace.
 *          Combines patient overview, clinical safety information,
 *          medical history, consultation documentation, AI-assisted
 *          note structuring, lab-test ordering, prescribing, and visit completion into
 *          one refresh-safe appointment workspace.
 *
 *          This page reorganizes existing Care4U doctor functionality
 *          without removing the previous PatientLookupPage,
 *          AppointmentQueuePage, ConsultationNotesModal,
 *          PatientNotesModal, or IssuePrescriptionPage implementations.
 *
 *          The consultation is recovered using the appointment ID from
 *          the URL, allowing refresh, direct navigation, and resume flows.
 *
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { API_BASE_URL } from '../../services/api';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ExternalLink,
  FileHeart,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  LayoutDashboard,
  Lock,
  Pill,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
  QRCodeSVG,
} from 'qrcode.react';

import toast from 'react-hot-toast';

import {
  getPatientByQrCode,
  getMedicalRecords,
  getAllergies,
  getPatientHistorySummary,
  getPatientPrescriptions,
  getMedicalDevices,
  getHealthBackground,
  getFamilyHistory,
  getLabReports,
  getConsentAccessStatus,
  requestConsentAccess,
  verifyConsentAccess,
} from '../../services/patient.service';

import {
  createPrescription,
} from '../../services/prescription.service';

import {
  checkDrugInteractions,
} from '../../services/interaction.service';

import {
  searchMedicines,
} from '../../utils/medicineSearch';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';

import useAuthStore from '../../store/authStore';

const API_URL = API_BASE_URL;

/**
 * Shared default structure for a new medicine row.
 */
const EMPTY_MEDICINE = {
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration_days: '',
  quantity_prescribed: '',
  special_notes: '',
};

/**
 * Formats dates consistently throughout
 * the consultation workspace.
 */
const formatDate = (
  iso,
  includeTime = false
) => {
  if (!iso) {
    return '—';
  }

  const date =
    new Date(iso);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—';
  }

  if (includeTime) {
    return date.toLocaleString(
      'en-GB',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

/**
 * Calculates age from a date of birth.
 */
const calculateAge = (
  dateOfBirth
) => {
  if (!dateOfBirth) {
    return null;
  }

  const dob =
    new Date(dateOfBirth);

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
      monthDifference === 0 &&
      today.getDate() <
        dob.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
};

/**
 * Converts a database status into a readable label.
 */
const formatStatus = (
  status
) => {
  if (!status) {
    return 'Unknown';
  }

  return status
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
};

/**
 * Capitalizes a simple text value.
 */
const capitalise = (
  value
) => {
  if (!value) {
    return '—';
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

const formatFamilyRelation = (
  relation
) => {
  if (!relation) {
    return '—';
  }

  return relation
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
};


/**
 * Builds a searchable text representation of a clinical record.
 *
 * Care4U protected categories are stored as labels such as
 * "Mental Health" and "Reproductive Health". The backend remains
 * responsible for access control; this helper is used only to
 * separate temporarily unlocked records from the general timeline
 * after the backend has returned them.
 */
const getClinicalRecordSearchText = (
  record
) => {
  if (!record) {
    return '';
  }

  return [
    record.title,
    record.description,
    record.chief_complaint,
    record.diagnosis,
    record.treatment_plan,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

/**
 * Returns search terms for one Care4U privacy category.
 */
const getProtectedCategorySearchTerms = (
  category
) => {
  if (!category) {
    return [];
  }

  const normalized =
    category
      .toLowerCase()
      .trim();

  const withoutRecords =
    normalized
      .replace(
        /\brecords?\b/g,
        ''
      )
      .trim();

  const terms =
    new Set([
      normalized,
      withoutRecords,
    ]);

  if (
    normalized.includes(
      'std/sti'
    )
  ) {
    terms.add('std');
    terms.add('sti');
    terms.add(
      'sexually transmitted'
    );
  }

  return [...terms]
    .filter(Boolean);
};

/**
 * Checks whether one clinical record belongs to a protected category.
 *
 * This is a presentation helper only. It must never replace backend
 * privacy enforcement.
 */
const recordMatchesProtectedCategory = (
  record,
  category
) => {
  const searchableText =
    getClinicalRecordSearchText(
      record
    );

  return getProtectedCategorySearchTerms(
    category
  ).some(
    (term) =>
      searchableText.includes(
        term
      )
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

  return (
    new Date(expiresAt) <
    new Date()
  );
};

/**
 * Calculates remaining prescription days.
 */
const daysRemaining = (
  expiresAt
) => {
  if (!expiresAt) {
    return null;
  }

  const difference =
    new Date(expiresAt) -
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

/**
 * Calculates the remaining seconds until an expiry time.
 */
const secondsUntil = (
  expiresAt
) => {
  if (!expiresAt) {
    return 0;
  }

  const difference =
    new Date(expiresAt).getTime() -
    Date.now();

  return Math.max(
    0,
    Math.ceil(
      difference /
      1000
    )
  );
};

/**
 * Formats a countdown as MM:SS.
 */
const formatCountdown = (
  totalSeconds
) => {
  const safeSeconds =
    Math.max(
      0,
      totalSeconds ||
      0
    );

  const minutes =
    Math.floor(
      safeSeconds /
      60
    );

  const seconds =
    safeSeconds %
    60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Reusable workspace tab button.
 */
const WorkspaceTab = ({
  active,
  icon,
  label,
  count,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center justify-center sm:justify-start gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(37,99,235,0.18)]'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
      }`}
    >
      {icon}

      <span>
        {label}
      </span>

      {count !== undefined && (
        <span
          className={`ml-auto min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
            active
              ? 'bg-white/20 text-primary-foreground'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

/**
 * Reusable patient/visit field.
 */
const PatientField = ({
  label,
  value,
  className = '',
}) => {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-[#FBFCFE] px-4 py-3.5">
      <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm font-semibold text-slate-900 mt-1.5 break-words ${className}`}
      >
        {value || '—'}
      </p>
    </div>
  );
};

/**
 * Severity badge used for conditions and allergies.
 */
const SeverityBadge = ({
  severity,
}) => {
  const normalized =
    severity?.toLowerCase() ||
    'mild';

  let classes =
    'bg-success/10 text-success border-success/20';

  if (
    normalized === 'severe' ||
    normalized === 'priority'
  ) {
    classes =
      'bg-destructive/10 text-destructive border-destructive/20';

  } else if (
    normalized === 'moderate'
  ) {
    classes =
      'bg-urgent/10 text-urgent-foreground border-urgent/20';
  }

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold border ${classes}`}
    >
      {normalized}
    </span>
  );
};

/**
 * Displays one active prescription.
 */
const ActivePrescriptionRow = ({
  prescription,
}) => {
  const days =
    daysRemaining(
      prescription.expires_at
    );

  const items =
    (
      prescription.items ||
      []
    ).filter(
      (item) =>
        item?.medicine_name
    );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-[#FBFCFE] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">

      <div className="flex items-center justify-between gap-3 mb-2">

        <span className="text-xs font-medium text-muted-foreground">
          {prescription.doctor_name
            ? `Dr. ${prescription.doctor_name}`
            : 'Prescribing doctor unknown'}
        </span>

        <span
          className={`flex items-center gap-1 text-xs ${
            days !== null &&
            days <= 7
              ? 'text-urgent-foreground font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          <Calendar
            size={11}
          />

          Expires{' '}
          {formatDate(
            prescription.expires_at
          )}

          {days !== null &&
            days <= 7 &&
            ` (${days}d left)`}
        </span>

      </div>

      {items.length === 0 ? (

        <p className="text-xs text-muted-foreground">
          No medicines listed.
        </p>

      ) : (

        <div className="flex flex-col gap-1.5">

          {items.map(
            (
              item,
              index
            ) => (

              <div
                key={
                  item.id ||
                  index
                }
                className="flex flex-wrap items-center gap-2"
              >
                <Pill
                  size={12}
                  className="text-primary shrink-0"
                />

                <span className="text-sm text-foreground font-semibold">
                  {
                    item.medicine_name
                  }
                </span>

                <span className="text-xs text-muted-foreground">
                  {
                    item.dosage
                  }

                  {item.frequency
                    ? ` · ${item.frequency}`
                    : ''}
                </span>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
};


/**
 * Visual metadata shared by doctor-facing medical-history cards.
 *
 * The consultation workspace uses the same hierarchy as the
 * patient Medical Records page while retaining the doctor module's
 * blue clinical identity.
 */
const RECORD_TYPE_META = {
  consultation: {
    label: 'Consultation',
    icon: Stethoscope,
    iconClass: 'text-blue-700',
    backgroundClass: 'bg-blue-50',
  },

  lab_result: {
    label: 'Lab Result',
    icon: FlaskConical,
    iconClass: 'text-violet-700',
    backgroundClass: 'bg-violet-50',
  },

  imaging: {
    label: 'Imaging',
    icon: FileText,
    iconClass: 'text-cyan-700',
    backgroundClass: 'bg-cyan-50',
  },

  prescription: {
    label: 'Prescription',
    icon: Pill,
    iconClass: 'text-emerald-700',
    backgroundClass: 'bg-emerald-50',
  },

  other: {
    label: 'Medical Record',
    icon: FileText,
    iconClass: 'text-slate-700',
    backgroundClass: 'bg-slate-100',
  },
};

/**
 * Returns visual metadata for a medical-record category.
 */
const getRecordTypeMeta = (
  recordType
) => {
  return (
    RECORD_TYPE_META[
      recordType
    ] ||
    RECORD_TYPE_META.other
  );
};

/**
 * Reusable premium clinical detail block used by
 * medical-record and consultation-note detail modals.
 */
const DetailBlock = ({
  label,
  children,
  emphasis = false,
}) => {
  if (
    children === null ||
    children === undefined ||
    children === ''
  ) {
    return null;
  }

  return (
    <div>

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-2">
        {label}
      </p>

      <div
        className={`rounded-xl border border-slate-200/80 p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap ${
          emphasis
            ? 'bg-blue-50/70'
            : 'bg-slate-50/80'
        }`}
      >
        {children}
      </div>

    </div>
  );
};

/**
 * Doctor-facing medical-record card.
 *
 * Mirrors the premium patient timeline card so the same
 * record is visually familiar across both portals.
 */
const MedicalRecordCard = ({
  record,
  onOpen,
}) => {
  const meta =
    getRecordTypeMeta(
      record.record_type
    );

  const Icon =
    meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200"
    >

      <div className="flex items-start gap-4">

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.backgroundClass} ${meta.iconClass}`}
        >
          <Icon
            size={19}
          />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${meta.backgroundClass} ${meta.iconClass}`}
            >
              {meta.label}
            </span>

            {record.is_confidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[9px] font-bold">
                <Lock
                  size={10}
                />
                Confidential
              </span>
            )}

          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-snug mt-3">
            {record.title ||
              meta.label}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                size={13}
              />
              {formatDate(
                record.created_at
              )}
            </span>

            {record.doctor_name && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <UserRound
                  size={13}
                />
                <span className="truncate">
                  Dr. {record.doctor_name}
                </span>
              </span>
            )}

          </div>

          {record.follow_up_needed && (
            <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[9px] font-bold">
              <Calendar
                size={11}
              />
              Follow-up required
            </span>
          )}

        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
          <ChevronRight
            size={17}
          />
        </div>

      </div>

    </button>
  );
};

/**
 * Premium consultation-note history card.
 */
const ConsultationNoteCard = ({
  note,
  appointmentId,
  onOpen,
}) => {
  const isCurrentVisit =
    note.appointment_id ===
    appointmentId;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full text-left rounded-2xl border p-4 sm:p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-200 ${
        isCurrentVisit
          ? 'bg-blue-50/45 border-blue-200/80'
          : 'bg-white border-slate-200/80'
      }`}
    >

      <div className="flex items-start gap-4">

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
          <Stethoscope
            size={19}
          />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="inline-flex rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] font-bold">
              Consultation Note
            </span>

            {isCurrentVisit && (
              <span className="inline-flex rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] font-bold">
                Current Visit
              </span>
            )}

            {note.is_confidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[9px] font-bold">
                <Lock
                  size={10}
                />
                Confidential
              </span>
            )}

          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-950 mt-3">
            {note.title ||
              'Consultation'}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                size={13}
              />
              {formatDate(
                note.created_at,
                true
              )}
            </span>

            {note.doctor_name && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <UserRound
                  size={13}
                />
                <span className="truncate">
                  Dr. {note.doctor_name}
                </span>
              </span>
            )}

          </div>

          {(note.diagnosis ||
            note.chief_complaint) && (
            <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
              {note.diagnosis
                ? `Diagnosis: ${note.diagnosis}`
                : `Complaint: ${note.chief_complaint}`}
            </p>
          )}

        </div>

        <div className="w-9 h-9 rounded-xl bg-white/80 border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
          <ChevronRight
            size={17}
          />
        </div>

      </div>

    </button>
  );
};

/**
 * Completed laboratory-report card displayed inside
 * the consultation history workspace.
 */
const LabReportCard = ({
  report,
}) => {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">

      <div className="flex items-start gap-3">

        <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
          <FlaskConical
            size={19}
          />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="inline-flex rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] font-bold">
              Lab Report
            </span>

            <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[9px] font-bold">
              Completed
            </span>

          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-950 mt-3">
            {report.test_type ||
              'Laboratory Test'}
          </h3>

          <div className="space-y-1 mt-2 text-xs text-slate-500">

            <p>
              {formatDate(
                report.created_at,
                true
              )}
            </p>

            {report.lab_name && (
              <p>
                {report.lab_name}
              </p>
            )}

            {report.doctor_name && (
              <p>
                Requested by Dr. {report.doctor_name}
              </p>
            )}

          </div>

          {report.findings && (
            <p className="text-xs text-slate-600 leading-relaxed mt-3 line-clamp-3">
              {report.findings}
            </p>
          )}

        </div>

      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">

        <button
          type="button"
          disabled={!report.report_url}
          onClick={() => {
            if (!report.report_url) {
              return;
            }

            window.open(
              report.report_url,
              '_blank',
              'noopener,noreferrer'
            );
          }}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          <ExternalLink
            size={13}
          />
          {report.report_url
            ? 'View Full Report'
            : 'Report File Unavailable'}
        </button>

      </div>

    </div>
  );
};

/**
 * Compact clinical-safety section used in the always-visible
 * doctor sidebar. Sections share one outer surface instead of
 * stacking multiple heavy cards inside another card.
 */
const SafetySection = ({
  icon: Icon,
  title,
  count,
  iconClass = 'text-primary',
  children,
  className = '',
}) => {
  return (
    <div className={`px-4 py-4 border-t border-slate-100 ${className}`}>

      <div className="flex items-center gap-2.5">

        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
          <Icon
            size={16}
            className={iconClass}
          />
        </div>

        <p className="text-sm font-bold text-slate-950">
          {title}
        </p>

        {count !== undefined && (
          <span className="ml-auto min-w-6 h-6 px-2 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
            {count}
          </span>
        )}

      </div>

      <div className="mt-3 pl-[42px]">
        {children}
      </div>

    </div>
  );
};

/**
 * Main consultation workspace.
 */
const ConsultationPage = () => {
  const consentInFlight = useRef(false);

  const {
    appointmentId,
  } = useParams();

  const navigate =
    useNavigate();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const DOCTOR_ID =
    user?.profile_id ||
    user?.id ||
    '';

  /* =========================================================
     PRIMARY CONSULTATION CONTEXT
  ========================================================= */

  const [
    consultation,
    setConsultation,
  ] = useState(null);

  const [
    patient,
    setPatient,
  ] = useState(null);

  const [
    allergies,
    setAllergies,
  ] = useState([]);

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    labReports,
    setLabReports,
  ] = useState([]);

  const [
    prescriptions,
    setPrescriptions,
  ] = useState([]);

  const [
    medicalDevices,
    setMedicalDevices,
  ] = useState([]);

  const [
    healthBackground,
    setHealthBackground,
  ] = useState([]);

  const [
    familyHistory,
    setFamilyHistory,
  ] = useState([]);

  const [
    previousNotes,
    setPreviousNotes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    clinicalDataLoading,
    setClinicalDataLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'consultation'
  );

  /* =========================================================
     MEDICAL RECORD VIEW
  ========================================================= */

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(null);

  const [
    selectedConsultationNote,
    setSelectedConsultationNote,
  ] = useState(null);

  /* =========================================================
     AI PATIENT HISTORY SUMMARY
  ========================================================= */

  const [
    aiSummary,
    setAiSummary,
  ] = useState(null);

  const [
    isGeneratingSummary,
    setIsGeneratingSummary,
  ] = useState(false);

  const [
    summaryError,
    setSummaryError,
  ] = useState('');

  /* =========================================================
     PATIENT CONSENT ACCESS
  ========================================================= */

  const [
    consentAccessStatus,
    setConsentAccessStatus,
  ] = useState(null);

  const [
    consentStatusLoading,
    setConsentStatusLoading,
  ] = useState(false);

  const [
    isRequestingConsent,
    setIsRequestingConsent,
  ] = useState(false);

  const [
    isVerifyingConsent,
    setIsVerifyingConsent,
  ] = useState(false);

  const [
    showConsentOtpModal,
    setShowConsentOtpModal,
  ] = useState(false);

  const [
    consentOtp,
    setConsentOtp,
  ] = useState('');

  const [
    consentError,
    setConsentError,
  ] = useState('');

  const [
    consentSecondsRemaining,
    setConsentSecondsRemaining,
  ] = useState(0);

  /* =========================================================
     CONSULTATION NOTE FORM
  ========================================================= */

  const [
    observations,
    setObservations,
  ] = useState('');

  const [
    noteForm,
    setNoteForm,
  ] = useState({
    title: '',
    description: '',
    chief_complaint: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_needed: false,
    is_confidential: false,
  });

  const [
    isStructuringNotes,
    setIsStructuringNotes,
  ] = useState(false);

  const [
    isSavingNotes,
    setIsSavingNotes,
  ] = useState(false);

  const [
    notesSaved,
    setNotesSaved,
  ] = useState(false);

  
  /* =========================================================
     PRESCRIPTION FORM
  ========================================================= */

  const [
    medicines,
    setMedicines,
  ] = useState([
    {
      ...EMPTY_MEDICINE
    }
  ]);

  const [
    prescriptionNotes,
    setPrescriptionNotes,
  ] = useState('');

  const [
    prescriptionLoading,
    setPrescriptionLoading,
  ] = useState(false);

  const [
    prescriptionError,
    setPrescriptionError,
  ] = useState('');

  const [
    prescriptionQrValue,
    setPrescriptionQrValue,
  ] = useState(null);

  const [
    activeSuggestionIndex,
    setActiveSuggestionIndex,
  ] = useState(null);

  const [
    medicineSuggestions,
    setMedicineSuggestions,
  ] = useState([]);

  const [
    medicineWarnings,
    setMedicineWarnings,
  ] = useState({});

  const [
    dismissedWarnings,
    setDismissedWarnings,
  ] = useState(
    new Set()
  );

  /* =========================================================
     LAB TEST ORDERING
  ========================================================= */

  const [
    laboratories,
    setLaboratories,
  ] = useState([]);

  const [
    laboratoriesLoading,
    setLaboratoriesLoading,
  ] = useState(false);

  const [
    labOrderForm,
    setLabOrderForm,
  ] = useState({
    laboratoryId: '',
    testTypes: [],
    priority: 'routine',
    notes: '',
  });

  const [
    labOrderLoading,
    setLabOrderLoading,
  ] = useState(false);

  const [
    labOrderError,
    setLabOrderError,
  ] = useState('');

  const [
    labOrderSuccess,
    setLabOrderSuccess,
  ] = useState('');

  /* =========================================================
     CONSULTATION COMPLETION
  ========================================================= */

  const [
    isCompleting,
    setIsCompleting,
  ] = useState(false);

    /* =========================================================
     CONSULTATION SAFETY / NAVIGATION PROTECTION
  ========================================================= */

  /**
   * Controls the confirmation dialog shown before
   * permanently completing the consultation.
   */
  const [
    showCompleteConfirmation,
    setShowCompleteConfirmation,
  ] = useState(false);

  /**
   * Controls the confirmation dialog shown when the
   * doctor tries to leave with unsaved consultation work.
   */
  const [
    showLeaveConfirmation,
    setShowLeaveConfirmation,
  ] = useState(false);

  /**
   * Stores the route the doctor intended to visit
   * after confirming that unsaved changes may be lost.
   */
  const [
    pendingNavigationPath,
    setPendingNavigationPath,
  ] = useState(null);

  /**
   * Prevents the browser unload warning after Care4U
   * intentionally completes or navigates away.
   */
  const allowNavigationRef =
    useRef(false);

  /**
   * Whether this appointment is already closed.
   *
   * Completed consultations remain visible in a
   * read-only clinical review mode.
   */
  const isCompleted =
    consultation?.status ===
    'completed';

      /**
   * Detects whether the doctor has entered consultation
   * information that has not yet been saved.
   *
   * Prescription form edits are also considered because
   * leaving the workspace would discard those values.
   */
  const hasUnsavedChanges =
    useMemo(
      () => {

        if (isCompleted) {
          return false;
        }

        /**
         * Consultation notes are unsaved when any editable
         * consultation field contains meaningful information
         * and a consultation record has not yet been saved.
         */
        const hasUnsavedConsultationNotes =
          !notesSaved &&
          (
            observations.trim() !== '' ||
            noteForm.title.trim() !== '' ||
            noteForm.description.trim() !== '' ||
            noteForm.chief_complaint.trim() !== '' ||
            noteForm.diagnosis.trim() !== '' ||
            noteForm.treatment_plan.trim() !== '' ||
            noteForm.follow_up_needed ||
            noteForm.is_confidential
          );

        /**
         * A new prescription QR means the prescription has
         * already been persisted, so it should not count as
         * unsaved prescription work.
         */
        const hasUnsavedPrescription =
          !prescriptionQrValue &&
          (
            prescriptionNotes.trim() !== '' ||
            medicines.some(
              (medicine) =>
                medicine.medicine_name.trim() !== '' ||
                medicine.dosage.trim() !== '' ||
                medicine.frequency.trim() !== '' ||
                String(
                  medicine.duration_days
                ).trim() !== '' ||
                String(
                  medicine.quantity_prescribed
                ).trim() !== '' ||
                medicine.special_notes.trim() !== ''
            )
          );

        const hasUnsavedLabOrder =
          labOrderForm.laboratoryId !== '' ||
          labOrderForm.testTypes.length > 0 ||
          labOrderForm.priority !== 'routine' ||
          labOrderForm.notes.trim() !== '';

        return (
          hasUnsavedConsultationNotes ||
          hasUnsavedPrescription ||
          hasUnsavedLabOrder
        );
      },
      [
        isCompleted,
        notesSaved,
        observations,
        noteForm,
        medicines,
        prescriptionNotes,
        prescriptionQrValue,
        labOrderForm,
      ]
    );

      /**
   * Protects against refresh, tab close, and browser-level
   * navigation while clinical information is unsaved.
   *
   * Modern browsers display their own standard warning text.
   */
  useEffect(() => {

    const handleBeforeUnload =
      (event) => {

        if (
          !hasUnsavedChanges ||
          allowNavigationRef.current
        ) {
          return;
        }

        event.preventDefault();

        /**
         * Required for compatibility with browsers that still
         * inspect returnValue before showing their warning.
         */
        event.returnValue = '';
      };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {

      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };

  }, [hasUnsavedChanges]);

  /**
   * Loads the refresh-safe appointment context.
   */
  useEffect(() => {

    const loadConsultation =
      async () => {

        if (!appointmentId) {

          setError(
            'Appointment ID is missing.'
          );

          setLoading(false);

          return;
        }

        try {

          setLoading(true);
          setError('');

          const response =
            await fetch(
              `${API_URL}/api/appointments/${appointmentId}/consultation`,
              {
                method: 'GET',
                credentials:
                  'include',
                headers: {
                  'Content-Type':
                    'application/json',
                },
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
              'Failed to load consultation.'
            );
          }

          setConsultation(
            result.data
          );

        } catch (err) {

          console.error(
            'Consultation load error:',
            err
          );

          setError(
            err.message ||
            'Failed to load consultation.'
          );

        } finally {

          setLoading(false);
        }
      };

    loadConsultation();

  }, [appointmentId]);

  /**
   * Loads all existing patient clinical information
   * after the appointment context becomes available.
   *
   * Existing PatientLookupPage service functions are
   * reused rather than creating duplicate APIs.
   */
  useEffect(() => {

    const loadClinicalContext =
      async () => {

        if (
          !consultation
            ?.patient_qr_code_id ||
          !consultation
            ?.patient_id
        ) {
          return;
        }

        try {

          setClinicalDataLoading(
            true
          );

          const [
            patientData,
            allergyData,
            recordData,
            prescriptionData,
            medicalDeviceData,
            healthBackgroundData,
            familyHistoryData,
            labReportData,
            noteResponse,
          ] =
            await Promise.all([
              getPatientByQrCode(
                consultation
                  .patient_qr_code_id
              ),

              getAllergies(
                consultation
                  .patient_id,
                appointmentId
              ),

              getMedicalRecords(
              consultation
                .patient_id,
              user?.role,
              appointmentId
            ),

              getPatientPrescriptions(
                consultation
                  .patient_id,
                appointmentId
              ),

              getMedicalDevices(
                consultation
                  .patient_id,
                appointmentId
              ),

              getHealthBackground(
                consultation
                  .patient_id,
                appointmentId
              ),

              getFamilyHistory(
                consultation
                  .patient_id,
                appointmentId
              ),

              /**
               * Laboratory reports are loaded independently from
               * medical records so the doctor can open the original
               * uploaded report file when one is available.
               *
               * A report-load failure must not block the rest of the
               * consultation context.
               */
              getLabReports(
                consultation
                  .patient_id,
                appointmentId
              ).catch(
                (labReportError) => {
                  console.warn(
                    'Lab report context load warning:',
                    labReportError
                  );

                  return [];
                }
              ),

              fetch(
                `${API_URL}/api/appointments/patients/${consultation.patient_id}/notes`,
                {
                  credentials:
                    'include',
                }
              ),
            ]);

          setPatient(
            patientData ||
            null
          );

          setAllergies(
            allergyData ||
            []
          );

          setRecords(
            recordData ||
            []
          );

          setPrescriptions(
            prescriptionData ||
            []
          );

          setMedicalDevices(
            medicalDeviceData ||
            []
          );

          setHealthBackground(
            healthBackgroundData ||
            []
          );

          setFamilyHistory(
            familyHistoryData ||
            []
          );

          setLabReports(
            labReportData ||
            []
          );

          const noteResult =
            await noteResponse.json();

          const noteRows =
            noteResponse.ok &&
            noteResult.success
              ? (
                  noteResult.data ||
                  []
                )
              : [];

          setPreviousNotes(
            noteRows
          );

          /**
           * If this appointment already has a consultation
           * record, display it instead of allowing another
           * duplicate record to be inserted.
           */
          const existingCurrentNote =
            noteRows.find(
              (note) =>
                note.appointment_id ===
                appointmentId
            );

          if (
            existingCurrentNote
          ) {


            setNotesSaved(true);

            setNoteForm({
              title:
                existingCurrentNote.title ||
                '',

              description:
                existingCurrentNote.description ||
                '',

              chief_complaint:
                existingCurrentNote.chief_complaint ||
                '',

              diagnosis:
                existingCurrentNote.diagnosis ||
                '',

              treatment_plan:
                existingCurrentNote.treatment_plan ||
                '',

              follow_up_needed:
                !!existingCurrentNote.follow_up_needed,

              is_confidential:
                !!existingCurrentNote.is_confidential,
            });
          }

        } catch (err) {

          console.error(
            'Clinical context load error:',
            err
          );

          toast.error(
            'Some patient clinical information could not be loaded.'
          );

        } finally {

          setClinicalDataLoading(
            false
          );
        }
      };

    loadClinicalContext();

  }, [
    consultation,
    appointmentId,
    user?.role,
  ]);

  /* =========================================================
     DERIVED CLINICAL DATA
  ========================================================= */

  const conditions =
  useMemo(
    () =>
      patient?.conditions ||
      [],
    [patient?.conditions]
  );

  const priorityConditions =
    useMemo(
      () =>
        conditions.filter(
          (condition) =>
            condition.is_priority
        ),
      [conditions]
    );

  const severeAllergies =
    useMemo(
      () =>
        allergies.filter(
          (allergy) =>
            allergy.severity
              ?.toLowerCase() ===
            'severe'
        ),
      [allergies]
    );

  const sortedAllergies =
    useMemo(
      () =>
        [...allergies]
          .sort(
            (
              first,
              second
            ) => {

              const firstSevere =
                first.severity
                  ?.toLowerCase() ===
                'severe';

              const secondSevere =
                second.severity
                  ?.toLowerCase() ===
                'severe';

              if (
                firstSevere &&
                !secondSevere
              ) {
                return -1;
              }

              if (
                !firstSevere &&
                secondSevere
              ) {
                return 1;
              }

              return 0;
            }
          ),
      [allergies]
    );

  const activePrescriptions =
    useMemo(
      () =>
        prescriptions.filter(
          (prescription) =>
            !isExpired(
              prescription.expires_at
            ) &&
            prescription.status !==
              'completed'
        ),
      [prescriptions]
    );

  const emergencyRelevantDevices =
    useMemo(
      () =>
        medicalDevices.filter(
          (device) =>
            device
              .is_emergency_relevant
        ),
      [medicalDevices]
    );

  const emergencyRelevantBackground =
    useMemo(
      () =>
        healthBackground.filter(
          (item) =>
            item
              .is_emergency_relevant
        ),
      [healthBackground]
    );

  const emergencyRelevantFamilyHistory =
    useMemo(
      () =>
        familyHistory.filter(
          (item) =>
            item
              .is_emergency_relevant
        ),
      [familyHistory]
    );

  const mostRecentVisit =
    records.length > 0
      ? records[0]
      : null;


  /**
   * Categories currently protected by the patient.
   */
  const protectedCategories =
    useMemo(
      () =>
        consentAccessStatus
          ?.lockedCategories ||
        [],
      [
        consentAccessStatus
          ?.lockedCategories,
      ]
    );

  /**
   * Categories temporarily granted for this consultation.
   */
  const grantedProtectedCategories =
    useMemo(
      () =>
        consentAccessStatus
          ?.grantedCategories ||
        [],
      [
        consentAccessStatus
          ?.grantedCategories,
      ]
    );

  /**
   * Finds the protected category represented by one record.
   */
  const getRecordProtectedCategory =
    (record) =>
      protectedCategories.find(
        (category) =>
          recordMatchesProtectedCategory(
            record,
            category
          )
      ) || null;

  /**
   * Sensitive records returned after successful OTP verification.
   *
   * They are intentionally surfaced in a dedicated section so a
   * doctor does not need to search through a long general timeline.
   */
  const unlockedSensitiveRecords =
    useMemo(
      () => {

        if (
          !consentAccessStatus
            ?.hasActiveGrant
        ) {
          return [];
        }

        return records.filter(
          (record) =>
            grantedProtectedCategories.some(
              (category) =>
                recordMatchesProtectedCategory(
                  record,
                  category
                )
            )
        );
      },
      [
        records,
        consentAccessStatus
          ?.hasActiveGrant,
        grantedProtectedCategories,
      ]
    );

  /**
   * General timeline records exclude protected-category records.
   * Those records are shown only in the temporary-access section.
   *
   * Confidential rows are also held back while privacy state is
   * loading, preventing a brief UI flash before consent status arrives.
   */
  const generalMedicalRecords =
    useMemo(
      () =>
        records.filter(
          (record) => {

            if (
              consentStatusLoading &&
              record.is_confidential
            ) {
              return false;
            }

            return !protectedCategories.some(
              (category) =>
                recordMatchesProtectedCategory(
                  record,
                  category
                )
            );
          }
        ),
      [
        records,
        protectedCategories,
        consentStatusLoading,
      ]
    );

  /**
   * The standalone consultation-note endpoint is kept clear of
   * protected-category notes. If a protected consultation record is
   * temporarily unlocked, it appears in the dedicated sensitive-record
   * section instead of being duplicated here.
   */
  const visiblePreviousNotes =
    useMemo(
      () =>
        previousNotes.filter(
          (note) => {

            if (
              consentStatusLoading &&
              note.is_confidential
            ) {
              return false;
            }

            return !protectedCategories.some(
              (category) =>
                recordMatchesProtectedCategory(
                  note,
                  category
                )
            );
          }
        ),
      [
        previousNotes,
        protectedCategories,
        consentStatusLoading,
      ]
    );


  /**
   * Laboratory reports are ordered newest first so the doctor
   * sees the most clinically recent diagnostic result first.
   */
  const sortedLabReports =
    useMemo(
      () =>
        [...labReports]
          .sort(
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
      [labReports]
    );

  const recentLabReports =
    sortedLabReports.slice(
      0,
      4
    );

  const latestLabReport =
    sortedLabReports[0] ||
    null;

  const age =
    calculateAge(
      consultation
        ?.patient_date_of_birth
    );

  const patientInitials =
    (
      consultation
        ?.patient_name ||
      'Patient'
    )
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
      )
      .join('')
      .toUpperCase();

  /* =========================================================
     SAFE WORKSPACE NAVIGATION
  ========================================================= */

  /**
   * Navigates immediately when there is no unsaved work.
   *
   * If clinical data has been entered but not saved, the
   * requested route is stored and Care4U asks the doctor
   * to confirm before leaving.
   */
  const requestNavigation =
    (
      path
    ) => {

      if (!path) {
        return;
      }

      if (
        !hasUnsavedChanges ||
        isCompleted
      ) {

        allowNavigationRef.current =
          true;

        navigate(
          path
        );

        return;
      }

      setPendingNavigationPath(
        path
      );

      setShowLeaveConfirmation(
        true
      );
    };

  /**
   * Cancels the leave request and keeps the doctor
   * inside the consultation workspace.
   */
  const cancelPendingNavigation =
    () => {

      setShowLeaveConfirmation(
        false
      );

      setPendingNavigationPath(
        null
      );
    };

  /**
   * Confirms that the doctor wants to leave even though
   * unsaved consultation or prescription data may be lost.
   */
  const confirmPendingNavigation =
    () => {

      const destination =
        pendingNavigationPath;

      setShowLeaveConfirmation(
        false
      );

      setPendingNavigationPath(
        null
      );

      if (!destination) {
        return;
      }

      allowNavigationRef.current =
        true;

      navigate(
        destination
      );
    };

  /* =========================================================
     LAB TEST ORDERING
  ========================================================= */

  /**
   * Loads active, verified laboratories that can receive
   * diagnostic requests from the current consultation.
   */
  useEffect(() => {

    let cancelled =
      false;

    const loadLaboratories =
      async () => {

        if (
          !consultation
            ?.patient_id ||
          isCompleted
        ) {
          return;
        }

        try {

          setLaboratoriesLoading(
            true
          );

          setLabOrderError(
            ''
          );

          const response =
            await fetch(
              `${API_URL}/api/doctors/laboratories`,
              {
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
              'Failed to load laboratories.'
            );
          }

          if (!cancelled) {
            setLaboratories(
              result.data ||
              []
            );
          }

        } catch (err) {

          console.error(
            'Laboratory load error:',
            err
          );

          if (!cancelled) {
            setLabOrderError(
              err.message ||
              'Unable to load laboratories.'
            );
          }

        } finally {

          if (!cancelled) {
            setLaboratoriesLoading(
              false
            );
          }
        }
      };

    loadLaboratories();

    return () => {
      cancelled =
        true;
    };

  }, [
    consultation
      ?.patient_id,
    isCompleted,
  ]);

  const selectedLaboratory =
    useMemo(
      () =>
        laboratories.find(
          (laboratory) =>
            laboratory.id ===
            labOrderForm.laboratoryId
        ) ||
        null,
      [
        laboratories,
        labOrderForm.laboratoryId,
      ]
    );

  const availableLabTests =
    useMemo(
      () =>
        Array.isArray(
          selectedLaboratory
            ?.available_tests
        )
          ? selectedLaboratory
              .available_tests
          : [],
      [selectedLaboratory]
    );

  /**
   * Updates one lab-order field.
   * Changing the laboratory clears the selected test because
   * each laboratory may expose a different test catalogue.
   */
  const updateLabOrderField =
    (
      field,
      value
    ) => {

      setLabOrderSuccess(
        ''
      );

      setLabOrderError(
        ''
      );

      setLabOrderForm(
        (previous) => {

          if (
            field ===
            'laboratoryId'
          ) {
            return {
              ...previous,
              laboratoryId:
                value,
              testTypes:
                [],
            };
          }

          return {
            ...previous,
            [field]:
              value,
          };
        }
      );
    };

  /**
   * Adds or removes one test from the current laboratory order.
   *
   * To finish this workflow quickly without changing the existing
   * database schema, Care4U sends one existing lab-test request per
   * selected test while the doctor selects them together in one UI.
   */
  const toggleLabTest =
    (
      testType
    ) => {

      setLabOrderSuccess(
        ''
      );

      setLabOrderError(
        ''
      );

      setLabOrderForm(
        (previous) => {

          const alreadySelected =
            previous.testTypes.includes(
              testType
            );

          return {
            ...previous,

            testTypes:
              alreadySelected
                ? previous.testTypes.filter(
                    (item) =>
                      item !==
                      testType
                  )
                : [
                    ...previous.testTypes,
                    testType,
                  ],
          };
        }
      );
    };

  /**
   * Sends all selected tests to the chosen laboratory.
   *
   * The current backend stores one test type per request, so each
   * selected test is submitted through the existing endpoint with
   * the same patient, appointment, laboratory, priority, and notes.
   */
  const handleOrderLabTest =
    async () => {

      if (isCompleted) {
        return;
      }

      const laboratoryId =
        labOrderForm
          .laboratoryId;

      const testTypes =
        labOrderForm
          .testTypes;

      if (
        !DOCTOR_ID ||
        !consultation
          ?.patient_id
      ) {
        setLabOrderError(
          'Doctor or patient context is unavailable.'
        );

        return;
      }

      if (
        !laboratoryId ||
        testTypes.length ===
          0
      ) {
        setLabOrderError(
          'Please select a laboratory and at least one test.'
        );

        return;
      }

      try {

        setLabOrderLoading(
          true
        );

        setLabOrderError(
          ''
        );

        setLabOrderSuccess(
          ''
        );

        const results =
          await Promise.all(
            testTypes.map(
              async (
                testType
              ) => {

                const response =
                  await fetch(
                    `${API_URL}/api/doctors/${DOCTOR_ID}/lab-test-requests`,
                    {
                      method:
                        'POST',

                      credentials:
                        'include',

                      headers: {
                        'Content-Type':
                          'application/json',
                      },

                      body:
                        JSON.stringify({
                          patientId:
                            consultation
                              .patient_id,

                          appointmentId,

                          laboratoryId,

                          testType,

                          priority:
                            labOrderForm
                              .priority,

                          notes:
                            labOrderForm
                              .notes
                              .trim() ||
                            null,
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
                    `Failed to order ${testType}.`
                  );
                }

                return result.data;
              }
            )
          );

        const successMessage =
          `${results.length} test${results.length === 1 ? '' : 's'} ordered successfully from ${selectedLaboratory?.name || 'the selected laboratory'}.`;

        setLabOrderSuccess(
          successMessage
        );

        setLabOrderForm({
          laboratoryId: '',
          testTypes: [],
          priority: 'routine',
          notes: '',
        });

        toast.success(
          `${results.length} lab test${results.length === 1 ? '' : 's'} ordered.`
        );

      } catch (err) {

        console.error(
          'Lab test order error:',
          err
        );

        const message =
          err.message ||
          'Unable to order the selected lab tests.';

        setLabOrderError(
          message
        );

        toast.error(
          message
        );

      } finally {

        setLabOrderLoading(
          false
        );
      }
    };

  /* =========================================================
     CONSULTATION NOTE HANDLERS
  ========================================================= */

  /**
   * Updates one structured consultation field.
   */
  const updateNoteField = (
    field,
    value
  ) => {

    setNoteForm(
      (previous) => ({
        ...previous,
        [field]:
          value,
      })
    );
  };

  /**
   * Uses the existing appointment AI endpoint to
   * convert free-text observations into structured
   * consultation fields.
   */
  const handleStructureNotes =
    async () => {

      if (
        observations
          .trim()
          .length < 10
      ) {
        toast.error(
          'Please enter at least a short observation before using AI.'
        );

        return;
      }

      try {

        setIsStructuringNotes(
          true
        );

        const response =
          await fetch(
            `${API_URL}/api/appointments/${appointmentId}/summarize-notes`,
            {
              method:
                'POST',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  observations,
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
            'Unable to structure notes.'
          );
        }

        setNoteForm(
          (previous) => ({
            ...previous,

            chief_complaint:
              result.data
                ?.chief_complaint ||
              previous
                .chief_complaint,

            diagnosis:
              result.data
                ?.diagnosis ||
              previous
                .diagnosis,

            treatment_plan:
              result.data
                ?.treatment_plan ||
              previous
                .treatment_plan,

            follow_up_needed:
              !!result.data
                ?.follow_up_needed,

            description:
              previous.description ||
              observations,

            title:
              previous.title ||
              'Consultation',
          })
        );

        toast.success(
          'AI draft generated. This is not a medical diagnosis — review it before saving.'
        );

      } catch (err) {

        console.error(
          'AI note structuring error:',
          err
        );

        toast.error(
          err.message ||
          'Could not structure consultation notes.'
        );

      } finally {

        setIsStructuringNotes(
          false
        );
      }
    };

  /**
   * Saves the consultation medical record.
   */
  const handleSaveNotes =
    async () => {

      if (notesSaved) {
        toast.success(
          'Consultation notes are already saved.'
        );

        return true;
      }

      const title =
        noteForm.title.trim();

      const description =
        (
          noteForm.description ||
          observations
        ).trim();

      const chiefComplaint =
        noteForm
          .chief_complaint
          .trim();

      const diagnosis =
        noteForm
          .diagnosis
          .trim();

      if (
        !title ||
        !description ||
        !chiefComplaint ||
        !diagnosis
      ) {
        toast.error(
          'Title, observations/description, chief complaint, and diagnosis are required.'
        );

        return false;
      }

      try {

        setIsSavingNotes(
          true
        );

        const response =
          await fetch(
            `${API_URL}/api/appointments/${appointmentId}/notes`,
            {
              method:
                'POST',

              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  title,

                  description,

                  chief_complaint:
                    chiefComplaint,

                  diagnosis,

                  treatment_plan:
                    noteForm
                      .treatment_plan
                      .trim(),

                  follow_up_needed:
                    noteForm
                      .follow_up_needed,

                  is_confidential:
                    noteForm
                      .is_confidential,
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
            'Failed to save consultation notes.'
          );
        }

        setNotesSaved(
          true
        );


        setPreviousNotes(
          (previous) => [
            result.data,
            ...previous,
          ]
        );

        toast.success(
          'Consultation notes saved.'
        );

        return true;

      } catch (err) {

        console.error(
          'Save consultation notes error:',
          err
        );

        toast.error(
          err.message ||
          'Failed to save consultation notes.'
        );

        return false;

      } finally {

        setIsSavingNotes(
          false
        );
      }
    };

  /* =========================================================
     TEMPORARY PATIENT CONSENT ACCESS
  ========================================================= */

  /**
   * Refreshes medical records using the current appointment
   * so the backend can apply any active temporary consent grant.
   */
  const refreshMedicalRecords =
    async () => {

      if (
        !consultation
          ?.patient_id
      ) {
        return;
      }

      const refreshedRecords =
        await getMedicalRecords(
          consultation
            .patient_id,
          user?.role,
          appointmentId
        );

      setRecords(
        refreshedRecords ||
        []
      );
    };

  /**
   * Loads the temporary consent-access state for the
   * current doctor consultation.
   */
  useEffect(() => {

    let cancelled =
      false;

    const loadConsentStatus =
      async () => {

        if (
          !consultation
            ?.patient_id ||
          !appointmentId ||
          consultation.status !==
            'in_progress'
        ) {
          setConsentAccessStatus(
            null
          );

          setConsentSecondsRemaining(
            0
          );

          return;
        }

        try {

          setConsentStatusLoading(
            true
          );

          const status =
            await getConsentAccessStatus(
              consultation
                .patient_id,
              appointmentId
            );

          if (cancelled) {
            return;
          }

          setConsentAccessStatus(
            status
          );

          setConsentSecondsRemaining(
            status
              ?.hasActiveGrant
              ? secondsUntil(
                  status.expiresAt
                )
              : 0
          );

        } catch (err) {

          if (cancelled) {
            return;
          }

          console.error(
            'Consent status load error:',
            err
          );

          setConsentAccessStatus(
            null
          );

          setConsentSecondsRemaining(
            0
          );

        } finally {

          if (!cancelled) {
            setConsentStatusLoading(
              false
            );
          }
        }
      };

    loadConsentStatus();

    return () => {
      cancelled =
        true;
    };

  }, [
    consultation
      ?.patient_id,
    consultation
      ?.status,
    appointmentId,
  ]);

  /**
   * Keeps the temporary-access timer visible in the UI.
   * When the grant expires, protected medical records are
   * immediately reloaded so the workspace locks again.
   */
  useEffect(() => {

    if (
      !consentAccessStatus
        ?.hasActiveGrant ||
      !consentAccessStatus
        ?.expiresAt
    ) {
      setConsentSecondsRemaining(
        0
      );

      return undefined;
    }

    let expiryHandled =
      false;

    const updateCountdown =
      async () => {

        const remaining =
          secondsUntil(
            consentAccessStatus
              .expiresAt
          );

        setConsentSecondsRemaining(
          remaining
        );

        if (
          remaining > 0 ||
          expiryHandled
        ) {
          return;
        }

        expiryHandled =
          true;
        // Clear protected payloads before refresh: a failed refresh must not retain expired data.
        setRecords([]);

        setConsentAccessStatus(
          (previous) => ({
            ...(previous || {}),
            hasActiveGrant:
              false,
            grantedCategories:
              [],
            expiresAt:
              null,
          })
        );

        setAiSummary(
          null
        );

        /**
         * Close any open record detail view when temporary consent
         * expires so protected information cannot remain visible in
         * an already-open modal after the backend grant has ended.
         */
        setSelectedRecord(
          null
        );

        setSelectedConsultationNote(
          null
        );

        try {

          await refreshMedicalRecords();

          toast(
            'Temporary patient consent access has expired.'
          );

        } catch (err) {

          console.error(
            'Medical record refresh after consent expiry failed:',
            err
          );
        }
      };

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };

  // refreshMedicalRecords is intentionally read at interval execution time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    consentAccessStatus
      ?.hasActiveGrant,
    consentAccessStatus
      ?.expiresAt,
    consultation
      ?.patient_id,
    appointmentId,
    user?.role,
  ]);

  /**
   * Requests a six-digit consent code from the patient.
   * The backend sends the code to the patient's registered
   * Care4U email address.
   */
  const handleRequestConsentAccess =
    async () => {
      if (consentInFlight.current) return;

      if (
        !consultation
          ?.patient_id ||
        !appointmentId
      ) {
        return;
      }

      consentInFlight.current = true;
      try {

        setIsRequestingConsent(
          true
        );

        setConsentError(
          ''
        );

        const result =
          await requestConsentAccess(
            consultation
              .patient_id,
            appointmentId
          );

        if (
          result
            ?.alreadyGranted
        ) {
          const updatedStatus = {
            hasLockedCategories:
              true,

            lockedCategories:
              result.lockedCategories ||
              consentAccessStatus
                ?.lockedCategories ||
              [],

            hasActiveGrant:
              true,

            grantedCategories:
              result.grantedCategories ||
              [],

            expiresAt:
              result.expiresAt ||
              null,
          };

          setConsentAccessStatus(
            updatedStatus
          );

          setConsentSecondsRemaining(
            secondsUntil(
              updatedStatus
                .expiresAt
            )
          );

          toast.success(
            'Temporary patient consent access is already active.'
          );

          return;
        }

        setConsentAccessStatus(
          (previous) => ({
            ...(previous || {}),

            hasLockedCategories:
              true,

            lockedCategories:
              result
                ?.lockedCategories ||
              previous
                ?.lockedCategories ||
              [],

            hasActiveGrant:
              false,

            grantedCategories:
              [],

            expiresAt:
              null,
          })
        );

        setConsentOtp(
          ''
        );

        setShowConsentOtpModal(
          true
        );

        toast.success(
          'Consent email submitted. Ask the patient to check their inbox and spam folder.'
        );

      } catch (err) {

        console.error(
          'Consent OTP request error:',
          err
        );

        const message =
          err.response
            ?.data
            ?.message ||
          err.message ||
          'Failed to request patient consent.';

        setConsentError(
          message
        );

        toast.error(
          message
        );

      } finally {
        consentInFlight.current = false;

        setIsRequestingConsent(
          false
        );
      }
    };

  /**
   * Verifies the code verbally provided by the patient.
   * A successful verification unlocks only the categories
   * approved for this doctor/patient/appointment context.
   */
  const handleVerifyConsentAccess =
    async () => {
      if (consentInFlight.current) return;

      const normalizedOtp =
        consentOtp
          .replace(
            /\D/g,
            ''
          )
          .slice(
            0,
            6
          );

      if (
        normalizedOtp.length !==
        6
      ) {
        setConsentError(
          'Enter the complete 6-digit consent code.'
        );

        return;
      }

      if (
        !consultation
          ?.patient_id ||
        !appointmentId
      ) {
        return;
      }

      consentInFlight.current = true;
      try {

        setIsVerifyingConsent(
          true
        );

        setConsentError(
          ''
        );

        const result =
          await verifyConsentAccess(
            consultation
              .patient_id,
            appointmentId,
            normalizedOtp
          );

        const updatedStatus = {
          hasLockedCategories:
            true,

          lockedCategories:
            consentAccessStatus
              ?.lockedCategories ||
            result
              ?.grantedCategories ||
            [],

          hasActiveGrant:
            true,

          grantedCategories:
            result
              ?.grantedCategories ||
            [],

          expiresAt:
            result
              ?.expiresAt ||
            null,
        };

        setConsentAccessStatus(
          updatedStatus
        );

        setConsentSecondsRemaining(
          secondsUntil(
            updatedStatus
              .expiresAt
          )
        );

        setConsentOtp(
          ''
        );

        setShowConsentOtpModal(
          false
        );

        /**
         * An existing AI summary may have been generated
         * while protected records were hidden. Clear it so
         * the doctor can regenerate a summary from the newly
         * available record set.
         */
        setAiSummary(
          null
        );

        setSummaryError(
          ''
        );

        await refreshMedicalRecords();

        toast.success(
          'Patient consent verified. Protected records are temporarily unlocked.'
        );

      } catch (err) {

        console.error(
          'Consent OTP verification error:',
          err
        );

        const message =
          err.response
            ?.data
            ?.message ||
          err.message ||
          'Failed to verify patient consent code.';

        setConsentError(
          message
        );

      } finally {
        consentInFlight.current = false;

        setIsVerifyingConsent(
          false
        );
      }
    };

  /* =========================================================
     AI HISTORY SUMMARY
  ========================================================= */

  /**
   * Generates the existing patient-history AI summary
   * only when the doctor requests it.
   */
  const handleGenerateHistorySummary =
    async () => {

      if (
        !consultation
          ?.patient_id
      ) {
        return;
      }

      try {

        setIsGeneratingSummary(
          true
        );

        setSummaryError('');

        const data =
        await getPatientHistorySummary(
          consultation
            .patient_id,
          user?.role,
          appointmentId
        );

        setAiSummary(
          data.summary
        );

      } catch (err) {

        console.error(
          'AI history summary error:',
          err
        );

        setSummaryError(
          'Failed to generate the patient history summary. Please review the medical records manually.'
        );

      } finally {

        setIsGeneratingSummary(
          false
        );
      }
    };

  /* =========================================================
     PRESCRIPTION HANDLERS
  ========================================================= */

  /**
   * Adds one additional medicine row.
   */
  const addMedicine = () => {

    setMedicines(
      (previous) => [
        ...previous,
        {
          ...EMPTY_MEDICINE
        },
      ]
    );
  };

  /**
   * Removes one medicine row while keeping at least
   * one row available.
   */
  const removeMedicine = (
    index
  ) => {

    if (
      medicines.length ===
      1
    ) {
      return;
    }

    setMedicines(
      (previous) =>
        previous.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );

    setDismissedWarnings(
      new Set()
    );
  };

  /**
   * Updates one medicine field.
   */
  const updateMedicine = (
    index,
    field,
    value
  ) => {

    setMedicines(
      (previous) =>
        previous.map(
          (
            medicine,
            medicineIndex
          ) =>
            medicineIndex ===
            index
              ? {
                  ...medicine,
                  [field]:
                    value,
                }
              : medicine
        )
    );
  };

  /**
   * Handles medicine name typing and existing
   * medicine catalogue suggestions.
   */
  const handleMedicineNameChange = (
    index,
    value
  ) => {

    updateMedicine(
      index,
      'medicine_name',
      value
    );

    setActiveSuggestionIndex(
      index
    );

    setMedicineSuggestions(
      searchMedicines(
        value
      )
    );

    setMedicineWarnings(
      (previous) => ({
        ...previous,
        [index]:
          [],
      })
    );
  };

  /**
   * Checks the selected medicine against the
   * current patient's allergy and medication data.
   *
   * The doctor remains responsible for reviewing
   * warnings before prescribing.
   */
  const runConflictCheck =
    async (
      index,
      medicineName
    ) => {

      if (
        !consultation
          ?.patient_id ||
        !medicineName
          ?.trim()
      ) {

        setMedicineWarnings(
          (previous) => ({
            ...previous,
            [index]:
              [],
          })
        );

        return;
      }

      try {

        const warnings =
          await checkDrugInteractions(
            consultation
              .patient_id,
            medicineName,
            appointmentId
          );

        setMedicineWarnings(
          (previous) => ({
            ...previous,
            [index]:
              warnings ||
              [],
          })
        );

      } catch (err) {

        console.error(
          'Drug interaction check error:',
          err
        );

        /**
         * Preserve the existing behaviour:
         * interaction-check failure does not block
         * prescription entry.
         */
        setMedicineWarnings(
          (previous) => ({
            ...previous,
            [index]:
              [],
          })
        );
      }
    };

  /**
   * Applies an existing medicine catalogue suggestion.
   */
  const selectMedicineSuggestion = (
    index,
    medicine
  ) => {

    setMedicines(
      (previous) =>
        previous.map(
          (
            current,
            medicineIndex
          ) =>
            medicineIndex ===
            index
              ? {
                  ...current,

                  medicine_name:
                    medicine.name,

                  dosage:
                    medicine.defaultDosage,

                  frequency:
                    medicine.defaultFrequency,
                }
              : current
        )
    );

    setActiveSuggestionIndex(
      null
    );

    setMedicineSuggestions(
      []
    );

    runConflictCheck(
      index,
      medicine.name
    );
  };

  /**
   * Allows a doctor to acknowledge/dismiss one
   * displayed prescribing warning.
   */
  const dismissWarning = (
    index,
    warning
  ) => {

    setDismissedWarnings(
      (previous) => {

        const updated =
          new Set(
            previous
          );

        updated.add(
          `${index}-${warning.type}-${warning.conflictWith}`
        );

        return updated;
      }
    );
  };

  /**
   * Creates a digital prescription linked directly
   * to the current patient and appointment.
   */
  const handleCreatePrescription =
    async (
      event
    ) => {

      event.preventDefault();

      if (isCompleted) {
        return;
      }

      const invalidMedicine =
        medicines.find(
          (medicine) =>
            !medicine
              .medicine_name
              .trim() ||
            !medicine
              .dosage
              .trim() ||
            !medicine
              .frequency
              .trim() ||
            !medicine
              .duration_days ||
            !medicine
              .quantity_prescribed
        );

      if (
        invalidMedicine
      ) {
        toast.error(
          'Please complete all required medicine fields.'
        );

        return;
      }

      try {

        setPrescriptionLoading(
          true
        );

        setPrescriptionError(
          ''
        );

        setPrescriptionQrValue(
          null
        );

        const prescriptionData = {
          patientId:
            consultation
              .patient_id,

          appointmentId,

          notes:
            prescriptionNotes
              .trim() ||
            null,

          items:
            medicines.map(
              (medicine) => ({
                medicine_name:
                  medicine
                    .medicine_name
                    .trim(),

                dosage:
                  medicine
                    .dosage
                    .trim(),

                frequency:
                  medicine
                    .frequency
                    .trim(),

                duration_days:
                  parseInt(
                    medicine
                      .duration_days,
                    10
                  ),

                quantity_prescribed:
                  parseInt(
                    medicine
                      .quantity_prescribed,
                    10
                  ),

                special_notes:
                  medicine
                    .special_notes
                    .trim() ||
                  null,
              })
            ),
        };

        const response =
          await createPrescription(
            prescriptionData
          );

        setPrescriptionQrValue(
          response.data
            .qr_code_value
        );

        toast.success(
          'Prescription issued successfully.'
        );

        /**
         * Refresh existing medications so the new
         * prescription can appear in patient context.
         */
        try {

          const refreshed =
            await getPatientPrescriptions(
              consultation
                .patient_id,
              appointmentId
            );

          setPrescriptions(
            refreshed ||
            []
          );

        } catch (refreshError) {

          console.error(
            'Prescription refresh error:',
            refreshError
          );
        }

      } catch (err) {

        console.error(
          'Prescription creation error:',
          err
        );

        const message =
          err.response
            ?.data
            ?.message ||
          err.message ||
          'Failed to create prescription';

        setPrescriptionError(
          message
        );

        toast.error(
          message
        );

      } finally {

        setPrescriptionLoading(
          false
        );
      }
    };

  /**
   * Clears the successful prescription screen
   * and prepares another blank prescription.
   */
  const prepareAnotherPrescription =
    () => {

      setPrescriptionQrValue(
        null
      );

      setMedicines([
        {
          ...EMPTY_MEDICINE
        }
      ]);

      setPrescriptionNotes(
        ''
      );

      setMedicineWarnings(
        {}
      );

      setDismissedWarnings(
        new Set()
      );
    };

  /* =========================================================
     COMPLETE CONSULTATION
  ========================================================= */

  /**
   * Opens a confirmation step before the appointment
   * can be permanently marked as completed.
   */
  const handleCompleteConsultation =
    () => {

      if (isCompleted) {

        requestNavigation(
          '/doctor/dashboard'
        );

        return;
      }

      setShowCompleteConfirmation(
        true
      );
    };

  /**
   * Performs the actual consultation completion after
   * explicit doctor confirmation.
   *
   * Unsaved consultation notes are saved first. If note
   * validation or saving fails, completion is stopped.
   */
  const confirmCompleteConsultation =
    async () => {

      try {

        setShowCompleteConfirmation(
          false
        );

        setIsCompleting(
          true
        );

        /**
         * A consultation record must exist before the
         * appointment is considered clinically complete.
         */
        if (!notesSaved) {

          const saved =
            await handleSaveNotes();

          if (!saved) {

            setActiveTab(
              'consultation'
            );

            return;
          }
        }

        const response =
          await fetch(
            `${API_URL}/api/appointments/${appointmentId}/status`,
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
                  status:
                    'completed',
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
            'Failed to complete consultation.'
          );
        }

        /**
         * Completion was intentional, so prevent the browser
         * unsaved-work guard from interrupting navigation.
         */
        allowNavigationRef.current =
          true;

        toast.success(
          'Consultation completed successfully.'
        );

        navigate(
          '/doctor/dashboard'
        );

      } catch (err) {

        console.error(
          'Complete consultation error:',
          err
        );

        toast.error(
          err.message ||
          'Failed to complete consultation.'
        );

      } finally {

        setIsCompleting(
          false
        );
      }
    };

  /* =========================================================
     LOADING / ERROR STATES
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Spinner
            size="lg"
          />

          <p className="text-sm font-medium text-muted-foreground">
            Preparing consultation workspace...
          </p>

        </div>

      </div>
    );
  }

  if (
    error ||
    !consultation
  ) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-6">

        <div className="w-full max-w-lg">

          <Alert
            type="error"
            message={
              error ||
              'Consultation could not be loaded.'
            }
          />

          <div className="mt-5 flex justify-center">

            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  '/doctor/dashboard'
                )
              }
            >
              <ArrowLeft
                size={16}
                className="mr-2"
              />

              Back to Dashboard
            </Button>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] px-4 sm:px-6 pt-6">

      {/* =====================================================
          PATIENT / CONSULTATION HEADER
      ====================================================== */}
      <header className="relative max-w-[1500px] mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#173A63] via-[#1D4F86] to-[#2563EB] shadow-[0_18px_45px_rgba(15,23,42,0.12)]">

        <div className="relative z-10 px-5 sm:px-7 lg:px-8 py-6 sm:py-7">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 sm:gap-6">

            {/* Patient identity */}
            <div className="flex items-center gap-4 min-w-0">

              {consultation
                .patient_photo_url ? (

                <img
                  src={
                    consultation
                      .patient_photo_url
                  }
                  alt="Patient"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/25 shadow-[0_8px_24px_rgba(15,23,42,0.22)] shrink-0"
                />

              ) : (

                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/10 border-4 border-white/20 text-brand-deep-foreground text-xl font-bold shadow-[0_8px_24px_rgba(15,23,42,0.18)] shrink-0">
                  {
                    patientInitials
                  }
                </div>

              )}

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2 mb-1">

                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-deep-foreground/60">
                    {isCompleted
                      ? 'Completed Consultation'
                      : 'Active Consultation'}
                  </span>

                  <Badge
                    status={
                      consultation.status
                    }
                  />

                  {severeAllergies.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-destructive text-destructive-foreground px-2 py-1 rounded-full">
                      <AlertTriangle
                        size={11}
                      />

                      Severe Allergy
                    </span>
                  )}

                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-brand-deep-foreground truncate">
                  {
                    consultation
                      .patient_name
                  }
                </h1>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-brand-deep-foreground/75">

                  {age !== null && (
                    <span>
                      {age} years
                    </span>
                  )}

                  {consultation
                    .patient_gender && (
                    <>
                      <span>
                        •
                      </span>

                      <span className="capitalize">
                        {
                          consultation
                            .patient_gender
                        }
                      </span>
                    </>
                  )}

                  {consultation
                    .patient_blood_group && (
                    <>
                      <span>
                        •
                      </span>

                      <span className="font-bold">
                        Blood{' '}
                        {
                          consultation
                            .patient_blood_group
                        }
                      </span>
                    </>
                  )}

                </div>

              </div>

            </div>

            {/* Visit information + navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between xl:justify-end gap-3 xl:min-w-[470px]">

              <div className="flex flex-wrap items-center gap-2 text-xs text-brand-deep-foreground/85">

                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 shadow-sm backdrop-blur-sm">

                  <Clock
                    size={13}
                  />

                  {formatDate(
                    consultation
                      .scheduled_at,
                    true
                  )}

                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 shadow-sm backdrop-blur-sm">

                  <Stethoscope
                    size={13}
                  />

                  {
                    consultation
                      .type
                      ?.toUpperCase() ||
                    'VISIT'
                  }

                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

                <button
                  type="button"
                  onClick={() =>
                    requestNavigation(
                      '/doctor/queue'
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-brand-deep-foreground text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <ClipboardList
                    size={16}
                  />

                  Queue
                </button>

                <button
                  type="button"
                  onClick={() =>
                    requestNavigation(
                      '/doctor/dashboard'
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-brand-deep-foreground text-sm font-semibold backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <LayoutDashboard
                    size={16}
                  />

                  Dashboard
                </button>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          CLINICAL ALERT STRIP
      ====================================================== */}
      {!clinicalDataLoading &&
        (
          severeAllergies.length >
            0 ||
          priorityConditions.length >
            0
        ) && (

        <div className="max-w-[1500px] mx-auto mt-4 rounded-2xl border border-destructive/20 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.05)]">

          <div className="px-4 sm:px-5 py-3.5 flex flex-wrap gap-x-5 gap-y-2">

            {severeAllergies.map(
              (allergy) => (

                <div
                  key={
                    allergy.id
                  }
                  className="flex items-center gap-2 text-sm font-semibold text-destructive"
                >
                  <AlertTriangle
                    size={15}
                  />

                  Severe allergy:
                  {' '}
                  {
                    allergy.allergen
                  }
                </div>

              )
            )}

            {priorityConditions.map(
              (condition) => (

                <div
                  key={
                    condition.id
                  }
                  className="flex items-center gap-2 text-sm font-semibold text-urgent-foreground"
                >
                  <HeartPulse
                    size={15}
                  />

                  Priority condition:
                  {' '}
                  {
                    condition.condition
                  }
                </div>

              )
            )}

          </div>

        </div>

      )}

      {/* =====================================================
          WORKSPACE
      ====================================================== */}
      <main className="max-w-[1500px] mx-auto py-5 sm:py-6 pb-52 sm:pb-44">

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 xl:gap-6">

          {/* =================================================
              MAIN CLINICAL AREA
          ================================================== */}
          <section className="min-w-0">

            {/* Tabs */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-2 shadow-[0_10px_30px_rgba(15,23,42,0.07)] mb-5 sticky top-2 z-30">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                <WorkspaceTab
                  label="Overview"
                  active={
                    activeTab ===
                    'overview'
                  }
                  icon={
                    <UserRound
                      size={16}
                    />
                  }
                  onClick={() =>
                    setActiveTab(
                      'overview'
                    )
                  }
                />

                <WorkspaceTab
                  label="History"
                  active={
                    activeTab ===
                    'history'
                  }
                  count={
                    records.length
                  }
                  icon={
                    <History
                      size={16}
                    />
                  }
                  onClick={() =>
                    setActiveTab(
                      'history'
                    )
                  }
                />

                <WorkspaceTab
                  label="Consultation"
                  active={
                    activeTab ===
                    'consultation'
                  }
                  icon={
                    <Stethoscope
                      size={16}
                    />
                  }
                  onClick={() =>
                    setActiveTab(
                      'consultation'
                    )
                  }
                />

                <WorkspaceTab
                  label="Prescription"
                  active={
                    activeTab ===
                    'prescription'
                  }
                  count={
                    activePrescriptions
                      .length
                  }
                  icon={
                    <Pill
                      size={16}
                    />
                  }
                  onClick={() =>
                    setActiveTab(
                      'prescription'
                    )
                  }
                />

              </div>

            </div>

            {/* =============================================
                OVERVIEW TAB
            ============================================== */}
            {activeTab ===
              'overview' && (

              <div className="space-y-5">

                {/* Most recent visit */}
                {mostRecentVisit && (

                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">

                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">

                      <Clock
                        size={16}
                        className="text-primary"
                      />

                      Most Recent Visit

                    </div>

                    <span className="text-sm text-muted-foreground">
                      {formatDate(
                        mostRecentVisit
                          .created_at
                      )}
                    </span>

                    <span className="text-sm font-medium text-foreground">
                      {
                        mostRecentVisit
                          .title ||
                        capitalise(
                          mostRecentVisit
                            .record_type
                        )
                      }
                    </span>

                    {mostRecentVisit
                      .doctor_name && (

                      <span className="text-sm text-muted-foreground">
                        Dr.{' '}
                        {
                          mostRecentVisit
                            .doctor_name
                        }
                      </span>

                    )}

                  </div>

                )}

                {/* Patient information */}
                <Card title="Patient Information">

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">

                    <PatientField
                      label="Full Name"
                      value={
                        consultation
                          .patient_name
                      }
                    />

                    <PatientField
                      label="NIC"
                      value={
                        consultation
                          .patient_nic
                      }
                    />

                    <PatientField
                      label="UHI"
                      value={
                        consultation
                          .patient_uhi
                      }
                    />

                    <PatientField
                      label="Date of Birth"
                      value={
                        formatDate(
                          consultation
                            .patient_date_of_birth
                        )
                      }
                    />

                    <PatientField
                      label="Age"
                      value={
                        age !== null
                          ? `${age} years`
                          : '—'
                      }
                    />

                    <PatientField
                      label="Gender"
                      value={
                        capitalise(
                          consultation
                            .patient_gender
                        )
                      }
                    />

                    <PatientField
                      label="Blood Group"
                      value={
                        consultation
                          .patient_blood_group
                      }
                      className="text-destructive"
                    />

                    <PatientField
                      label="Patient QR"
                      value={
                        consultation
                          .patient_qr_code_id
                      }
                    />

                  </div>

                </Card>

                {/* Chronic conditions */}
                <Card
                  title={`Chronic Conditions (${conditions.length})`}
                >

                  {clinicalDataLoading ? (

                    <div className="py-6 flex justify-center">

                      <Spinner
                        size="sm"
                      />

                    </div>

                  ) : conditions.length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-3">
                      No chronic conditions recorded.
                    </p>

                  ) : (

                    <div className="space-y-3 pt-2">

                      {conditions.map(
                        (condition) => (

                          <div
                            key={
                              condition.id
                            }
                            className="flex items-start justify-between gap-4 border border-border rounded-xl p-4"
                          >

                            <div>

                              <p className="text-sm font-bold text-foreground">
                                {
                                  condition
                                    .condition
                                }
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Diagnosed:
                                {' '}
                                {formatDate(
                                  condition
                                    .diagnosed_at
                                )}
                              </p>

                              {condition.notes && (

                                <p className="text-xs text-muted-foreground mt-1">
                                  {
                                    condition
                                      .notes
                                  }
                                </p>

                              )}

                            </div>

                            {condition
                              .is_priority && (

                              <SeverityBadge
                                severity="priority"
                              />

                            )}

                          </div>

                        )
                      )}

                    </div>

                  )}

                </Card>

                {/* Allergies */}
                <Card
                  title={`Known Allergies (${allergies.length})`}
                >

                  {clinicalDataLoading ? (

                    <div className="py-6 flex justify-center">

                      <Spinner
                        size="sm"
                      />

                    </div>

                  ) : allergies.length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-3">
                      No allergies recorded.
                    </p>

                  ) : (

                    <div className="space-y-3 pt-2">

                      {sortedAllergies.map(
                        (allergy) => (

                          <div
                            key={
                              allergy.id
                            }
                            className={`flex items-start justify-between gap-4 rounded-xl p-4 border ${
                              allergy.severity
                                ?.toLowerCase() ===
                              'severe'
                                ? 'bg-destructive/5 border-destructive/30'
                                : 'border-border'
                            }`}
                          >

                            <div>

                              <p className="text-sm font-bold text-foreground">
                                {
                                  allergy
                                    .allergen
                                }
                              </p>

                              {allergy.notes && (

                                <p className="text-xs text-muted-foreground mt-1">
                                  {
                                    allergy
                                      .notes
                                  }
                                </p>

                              )}

                            </div>

                            <SeverityBadge
                              severity={
                                allergy
                                  .severity
                              }
                            />

                          </div>

                        )
                      )}

                    </div>

                  )}

                </Card>

                {/* Medical devices and implants */}
                <Card
                  title={`Medical Devices & Implants (${medicalDevices.length})`}
                >

                  {clinicalDataLoading ? (

                    <div className="py-6 flex justify-center">

                      <Spinner
                        size="sm"
                      />

                    </div>

                  ) : medicalDevices.length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-3">
                      No active medical devices or implants recorded.
                    </p>

                  ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">

                      {medicalDevices.map(
                        (device) => (

                          <div
                            key={
                              device.id
                            }
                            className="rounded-xl border border-border p-4 bg-card"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <div className="flex items-center gap-2">

                                  <HeartPulse
                                    size={16}
                                    className="text-primary shrink-0"
                                  />

                                  <p className="text-sm font-bold text-foreground">
                                    {
                                      device
                                        .device_name
                                    }
                                  </p>

                                </div>

                                {device.device_type && (

                                  <p className="text-xs font-medium text-primary mt-1">
                                    {
                                      device
                                        .device_type
                                    }
                                  </p>

                                )}

                                <p className="text-xs text-muted-foreground mt-2">
                                  Implanted / Started:{' '}
                                  {formatDate(
                                    device
                                      .implanted_at
                                  )}
                                </p>

                                {device.notes && (

                                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                    {
                                      device.notes
                                    }
                                  </p>

                                )}

                              </div>

                              {device
                                .is_emergency_relevant && (

                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[10px] uppercase tracking-wide font-bold shrink-0">
                                  <ShieldAlert
                                    size={10}
                                  />
                                  Emergency
                                </span>

                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </Card>

                {/* Important medical background */}
                <Card
                  title={`Important Medical Background (${healthBackground.length})`}
                >

                  {clinicalDataLoading ? (

                    <div className="py-6 flex justify-center">

                      <Spinner
                        size="sm"
                      />

                    </div>

                  ) : healthBackground.length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-3">
                      No important medical background recorded.
                    </p>

                  ) : (

                    <div className="space-y-3 pt-2">

                      {healthBackground.map(
                        (item) => (

                          <div
                            key={
                              item.id
                            }
                            className="rounded-xl border border-border p-4"
                          >

                            <div className="flex items-start justify-between gap-4">

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <ClipboardList
                                    size={16}
                                    className="text-primary shrink-0"
                                  />

                                  <p className="text-sm font-bold text-foreground">
                                    {
                                      item.title
                                    }
                                  </p>

                                  <span className="text-[10px] uppercase tracking-wide font-bold text-primary bg-primary/10 border border-primary/15 rounded-full px-2 py-1">
                                    {formatStatus(
                                      item
                                        .background_type
                                    )}
                                  </span>

                                </div>

                                <p className="text-xs text-muted-foreground mt-2">
                                  Event Date:{' '}
                                  {formatDate(
                                    item
                                      .event_date
                                  )}
                                </p>

                                {item.notes && (

                                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                    {
                                      item.notes
                                    }
                                  </p>

                                )}

                              </div>

                              {item
                                .is_emergency_relevant && (

                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[10px] uppercase tracking-wide font-bold shrink-0">
                                  <ShieldAlert
                                    size={10}
                                  />
                                  Emergency
                                </span>

                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </Card>

                {/* Family medical history */}
                <Card
                  title={`Family Medical History (${familyHistory.length})`}
                >

                  {clinicalDataLoading ? (

                    <div className="py-6 flex justify-center">

                      <Spinner
                        size="sm"
                      />

                    </div>

                  ) : familyHistory.length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-3">
                      No family medical history recorded.
                    </p>

                  ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">

                      {familyHistory.map(
                        (item) => (

                          <div
                            key={
                              item.id
                            }
                            className="rounded-xl border border-border p-4 bg-card"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <div className="flex items-center gap-2">

                                  <UserRound
                                    size={16}
                                    className="text-primary shrink-0"
                                  />

                                  <p className="text-sm font-bold text-foreground">
                                    {
                                      item.condition
                                    }
                                  </p>

                                </div>

                                <p className="text-xs font-medium text-primary mt-1">
                                  {formatFamilyRelation(
                                    item.relation
                                  )}
                                </p>

                                {item.notes && (

                                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                                    {
                                      item.notes
                                    }
                                  </p>

                                )}

                              </div>

                              {item
                                .is_emergency_relevant && (

                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[10px] uppercase tracking-wide font-bold shrink-0">
                                  <ShieldAlert
                                    size={10}
                                  />
                                  Emergency
                                </span>

                              )}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </Card>

                {/* Visit details */}
                <Card title="Visit Details">

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                    <PatientField
                      label="Appointment ID"
                      value={
                        consultation.id
                      }
                    />

                    <PatientField
                      label="Visit Type"
                      value={
                        consultation
                          .type
                          ?.toUpperCase()
                      }
                    />

                    <PatientField
                      label="Status"
                      value={
                        formatStatus(
                          consultation
                            .status
                        )
                      }
                    />

                    <PatientField
                      label="Scheduled"
                      value={
                        formatDate(
                          consultation
                            .scheduled_at,
                          true
                        )
                      }
                    />

                    <PatientField
                      label="Doctor"
                      value={
                        consultation
                          .doctor_name
                          ? `Dr. ${consultation.doctor_name}`
                          : null
                      }
                    />

                    <PatientField
                      label="Specialization"
                      value={
                        consultation
                          .doctor_specialization
                      }
                    />

                  </div>

                  {consultation.notes && (

                    <div className="mt-5 pt-5 border-t border-border">

                      <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                        Appointment Notes
                      </p>

                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                        {
                          consultation
                            .notes
                        }
                      </p>

                    </div>

                  )}

                </Card>

              </div>

            )}

            {/* =============================================
                HISTORY TAB
            ============================================== */}
            {activeTab ===
              'history' && (

              <div className="space-y-5">

                {/* Patient consent access */}
                {!isCompleted && (

                  <Card title="Protected Medical Information">

                    {consentStatusLoading ? (

                      <div className="py-6 flex justify-center">

                        <Spinner
                          size="sm"
                        />

                      </div>

                    ) : !consentAccessStatus ? (

                      <div className="rounded-xl border border-border bg-secondary/40 p-4">

                        <div className="flex items-start gap-3">

                          <Lock
                            size={18}
                            className="text-muted-foreground shrink-0 mt-0.5"
                          />

                          <div>

                            <p className="text-sm font-bold text-foreground">
                              Privacy status unavailable
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              Care4U could not confirm whether this patient has protected medical categories.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : !consentAccessStatus
                      .hasLockedCategories ? (

                      <div className="rounded-xl border border-success/20 bg-success/5 p-4">

                        <div className="flex items-start gap-3">

                          <CheckCircle2
                            size={18}
                            className="text-success shrink-0 mt-0.5"
                          />

                          <div>

                            <p className="text-sm font-bold text-foreground">
                              No protected categories
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              The patient has not locked any medical-record categories that require temporary doctor consent.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : consentAccessStatus
                      .hasActiveGrant ? (

                      <div className="space-y-4">

                        <div className="rounded-xl border border-success/25 bg-success/5 p-4">

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">

                              <CheckCircle2
                                size={20}
                                className="text-success"
                              />

                            </div>

                            <div className="flex-1">

                              <p className="text-sm font-bold text-foreground">
                                Patient consent verified
                              </p>

                              <p className="text-xs text-muted-foreground mt-1">
                                Protected information is temporarily available for this consultation only.
                              </p>

                            </div>

                            <div className="sm:text-right">

                              <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                                Access remaining
                              </p>

                              <p className="text-lg font-bold text-success font-mono mt-1">
                                {formatCountdown(
                                  consentSecondsRemaining
                                )}
                              </p>

                            </div>

                          </div>

                        </div>

                        <div>

                          <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground mb-2">
                            Temporarily unlocked categories
                          </p>

                          <div className="flex flex-wrap gap-2">

                            {(
                              consentAccessStatus
                                .grantedCategories ||
                              []
                            ).map(
                              (category) => (

                                <span
                                  key={
                                    category
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-success/5 text-xs font-semibold text-foreground"
                                >
                                  <Check
                                    size={12}
                                    className="text-success"
                                  />

                                  {
                                    category
                                  }
                                </span>

                              )
                            )}

                          </div>

                        </div>

                        <p className="text-xs text-muted-foreground">
                          Access expires automatically at{' '}
                          <span className="font-semibold text-foreground">
                            {formatDate(
                              consentAccessStatus
                                .expiresAt,
                              true
                            )}
                          </span>.
                          {' '}The patient's permanent privacy settings are not changed.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-4">

                        <div className="rounded-xl border border-urgent/20 bg-urgent/5 p-4">

                          <div className="flex items-start gap-3">

                            <Lock
                              size={18}
                              className="text-urgent-foreground shrink-0 mt-0.5"
                            />

                            <div>

                              <p className="text-sm font-bold text-foreground">
                                Some medical information is protected
                              </p>

                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                These categories are hidden until the patient approves temporary access with a six-digit code sent to their registered Care4U email.
                              </p>

                            </div>

                          </div>

                        </div>

                        <div>

                          <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground mb-2">
                            Protected categories
                          </p>

                          <div className="flex flex-wrap gap-2">

                            {(
                              consentAccessStatus
                                .lockedCategories ||
                              []
                            ).map(
                              (category) => (

                                <span
                                  key={
                                    category
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-xs font-semibold text-foreground"
                                >
                                  <Lock
                                    size={12}
                                    className="text-muted-foreground"
                                  />

                                  {
                                    category
                                  }
                                </span>

                              )
                            )}

                          </div>

                        </div>

                        {consentError && (

                          <Alert
                            type="error"
                            message={
                              consentError
                            }
                          />

                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">

                          <p className="text-xs text-muted-foreground">
                            Ask the patient before requesting access. The code expires after 10 minutes.
                          </p>

                          <Button
                            variant="primary"
                            loading={
                              isRequestingConsent
                            }
                            onClick={
                              handleRequestConsentAccess
                            }
                          >
                            <Lock
                              size={15}
                              className="mr-2"
                            />

                            Request Patient Access
                          </Button>

                        </div>

                      </div>

                    )}

                  </Card>

                )}

                {/* =================================================
                    TEMPORARILY UNLOCKED SENSITIVE RECORDS
                ================================================== */}
                {consentAccessStatus
                  ?.hasActiveGrant && (

                  <section className="rounded-2xl overflow-hidden border border-success/25 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.05)]">

                    <div className="px-5 sm:px-6 py-5 border-b border-success/15 bg-success/5">

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div className="flex items-start gap-3 min-w-0">

                          <div className="w-11 h-11 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                            <ShieldCheck
                              size={20}
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-success">
                              Temporary Patient Consent
                            </p>

                            <h2 className="text-lg font-bold text-slate-950 mt-1">
                              Temporarily Unlocked Sensitive Records
                            </h2>

                            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                              Protected records approved for this consultation are shown separately from the general medical timeline so they can be reviewed without searching through years of history.
                            </p>

                          </div>

                        </div>

                        <div className="flex items-center gap-3 lg:justify-end">

                          <div className="rounded-xl border border-success/20 bg-white px-4 py-2.5 shadow-sm">

                            <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-500">
                              Access remaining
                            </p>

                            <p className="text-lg font-bold text-success font-mono mt-0.5">
                              {formatCountdown(
                                consentSecondsRemaining
                              )}
                            </p>

                          </div>

                          <span className="min-w-10 h-10 px-3 rounded-xl bg-success/10 text-success flex items-center justify-center text-xs font-bold">
                            {unlockedSensitiveRecords.length}
                          </span>

                        </div>

                      </div>

                      {grantedProtectedCategories.length > 0 && (

                        <div className="flex flex-wrap gap-2 mt-4">

                          {grantedProtectedCategories.map(
                            (category) => (

                              <span
                                key={category}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-success/20 bg-white text-xs font-semibold text-slate-800"
                              >
                                <Check
                                  size={12}
                                  className="text-success"
                                />
                                {category}
                              </span>

                            )
                          )}

                        </div>

                      )}

                    </div>

                    <div className="p-5 sm:p-6 bg-slate-50/45">

                      {unlockedSensitiveRecords.length === 0 ? (

                        <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">

                          <Lock
                            size={22}
                            className="text-slate-400 mx-auto"
                          />

                          <p className="text-sm font-bold text-slate-950 mt-3">
                            No matching protected records found
                          </p>

                          <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
                            Consent is active, but Care4U did not receive a medical record matching the granted protected categories.
                          </p>

                        </div>

                      ) : (

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                          {[...unlockedSensitiveRecords]
                            .sort(
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
                            )
                            .map(
                              (record) => {

                                const protectedCategory =
                                  getRecordProtectedCategory(
                                    record
                                  );

                                return (
                                  <div
                                    key={record.id}
                                    className="space-y-2"
                                  >

                                    {protectedCategory && (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] font-bold">
                                        <Lock
                                          size={10}
                                        />
                                        {protectedCategory}
                                      </span>
                                    )}

                                    <MedicalRecordCard
                                      record={record}
                                      onOpen={() =>
                                        setSelectedRecord(
                                          record
                                        )
                                      }
                                    />

                                  </div>
                                );
                              }
                            )}

                        </div>

                      )}

                      <div className="flex items-start gap-2 mt-5 rounded-xl border border-success/15 bg-success/5 p-4">

                        <ShieldCheck
                          size={15}
                          className="text-success shrink-0 mt-0.5"
                        />

                        <p className="text-xs text-slate-600 leading-relaxed">
                          These records are available only while the current temporary consent grant remains active. They will disappear automatically when access expires, without changing the patient's permanent privacy settings.
                        </p>

                      </div>

                    </div>

                  </section>

                )}

                {/* AI summary */}
                <Card title="AI Clinical Summary">

                  {!aiSummary && (

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      <div>

                        <p className="text-sm font-semibold text-foreground">
                          Generate a clinical history summary
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          AI-generated clinical support only — not a medical diagnosis. Always verify the source records before making clinical decisions.
                        </p>

                      </div>

                      <Button
                        variant="primary"
                        loading={
                          isGeneratingSummary
                        }
                        disabled={
                          records.length ===
                          0
                        }
                        onClick={
                          handleGenerateHistorySummary
                        }
                      >
                        <Sparkles
                          size={16}
                          className="mr-2"
                        />

                        Generate Summary
                      </Button>

                    </div>

                  )}

                  {aiSummary && (

                    <div className="mt-3">

                      <div className="flex items-center gap-2 mb-3">

                        <Brain
                          size={17}
                          className="text-primary"
                        />

                        <span className="text-sm font-bold text-foreground">
                          AI-generated clinical summary
                        </span>

                        <span className="ml-auto text-[10px] uppercase tracking-wide font-bold text-urgent-foreground bg-urgent/10 border border-urgent/20 rounded-full px-2 py-1">
                          Not a diagnosis
                        </span>

                      </div>

                      <div className="bg-secondary/40 border border-border rounded-xl p-4 overflow-x-auto">

                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm
                          ]}
                          components={{
                            h3: ({
                              children
                            }) => (
                              <h3 className="text-sm font-bold text-foreground mt-5 first:mt-0 mb-2">
                                {children}
                              </h3>
                            ),

                            p: ({
                              children
                            }) => (
                              <p className="text-sm leading-relaxed text-foreground mb-2">
                                {children}
                              </p>
                            ),

                            ul: ({
                              children
                            }) => (
                              <ul className="list-disc pl-5 space-y-1 mb-4 text-sm text-foreground">
                                {children}
                              </ul>
                            ),

                            li: ({
                              children
                            }) => (
                              <li className="leading-relaxed">
                                {children}
                              </li>
                            ),

                            strong: ({
                              children
                            }) => (
                              <strong className="font-bold text-foreground">
                                {children}
                              </strong>
                            ),

                            table: ({
                              children
                            }) => (
                              <table className="w-full text-sm border-collapse my-3">
                                {children}
                              </table>
                            ),

                            th: ({
                              children
                            }) => (
                              <th className="border border-border bg-secondary px-3 py-2 text-left font-bold">
                                {children}
                              </th>
                            ),

                            td: ({
                              children
                            }) => (
                              <td className="border border-border px-3 py-2 align-top">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {aiSummary}
                        </ReactMarkdown>

                      </div>

                    </div>

                  )}

                  {summaryError && (

                    <div className="mt-4">

                      <Alert
                        type="error"
                        message={
                          summaryError
                        }
                      />

                    </div>

                  )}

                </Card>

                {/* =================================================
                    RECENT LAB REPORTS
                ================================================== */}
                <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_26px_rgba(15,23,42,0.04)] overflow-hidden">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-5 border-b border-slate-100">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-violet-700">
                        Diagnostics
                      </p>

                      <h2 className="text-lg font-bold text-slate-950 mt-1">
                        Recent Lab Reports
                      </h2>

                      <p className="text-xs text-slate-500 mt-1">
                        Review the patient&apos;s latest completed laboratory results and open the original report file when available.
                      </p>

                    </div>

                    <span className="inline-flex items-center justify-center self-start sm:self-auto min-w-9 h-9 px-3 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold">
                      {labReports.length}
                    </span>

                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50/45">

                    {clinicalDataLoading ? (

                      <div className="py-8 flex justify-center">
                        <Spinner
                          size="sm"
                        />
                      </div>

                    ) : recentLabReports.length === 0 ? (

                      <div className="flex flex-col items-center justify-center text-center py-10 px-4">

                        <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center">
                          <FlaskConical
                            size={24}
                          />
                        </div>

                        <p className="text-sm font-bold text-slate-950 mt-4">
                          No completed lab reports yet
                        </p>

                        <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                          Completed diagnostic reports uploaded by Care4U laboratories will appear here automatically.
                        </p>

                      </div>

                    ) : (

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {recentLabReports.map(
                          (report) => (
                            <LabReportCard
                              key={report.id}
                              report={report}
                            />
                          )
                        )}

                      </div>

                    )}

                  </div>

                </section>

                {/* =================================================
                    CONSULTATION NOTE HISTORY
                ================================================== */}
                <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_26px_rgba(15,23,42,0.04)] overflow-hidden">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-5 border-b border-slate-100">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary">
                        Visit History
                      </p>

                      <h2 className="text-lg font-bold text-slate-950 mt-1">
                        Consultation Notes
                      </h2>

                      <p className="text-xs text-slate-500 mt-1">
                        Open a previous consultation to review its complaint, diagnosis, treatment plan, and follow-up information.
                      </p>

                    </div>

                    <span className="inline-flex items-center justify-center self-start sm:self-auto min-w-9 h-9 px-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
                      {visiblePreviousNotes.length}
                    </span>

                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50/45">

                    {visiblePreviousNotes.length === 0 ? (

                      <div className="flex flex-col items-center justify-center text-center py-10 px-4">

                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                          <Stethoscope
                            size={24}
                          />
                        </div>

                        <p className="text-sm font-bold text-slate-950 mt-4">
                          No consultation notes recorded
                        </p>

                        <p className="text-xs text-slate-500 mt-1 max-w-md">
                          Previous structured consultation notes will appear here.
                        </p>

                      </div>

                    ) : (

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        {[...visiblePreviousNotes]
                          .sort(
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
                          )
                          .map(
                            (note) => (
                              <ConsultationNoteCard
                                key={note.id}
                                note={note}
                                appointmentId={appointmentId}
                                onOpen={() =>
                                  setSelectedConsultationNote(
                                    note
                                  )
                                }
                              />
                            )
                          )}

                      </div>

                    )}

                  </div>

                </section>

                {/* =================================================
                    MEDICAL RECORD TIMELINE
                ================================================== */}
                <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_26px_rgba(15,23,42,0.04)] overflow-hidden">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-5 border-b border-slate-100">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-primary">
                        Clinical History
                      </p>

                      <h2 className="text-lg font-bold text-slate-950 mt-1">
                        Medical Records
                      </h2>

                      <p className="text-xs text-slate-500 mt-1">
                        Browse the patient&apos;s Care4U clinical timeline. Select any record to inspect its full saved details.
                      </p>

                    </div>

                    <span className="inline-flex items-center justify-center self-start sm:self-auto min-w-9 h-9 px-3 rounded-xl bg-module-soft text-primary text-xs font-bold">
                      {generalMedicalRecords.length}
                    </span>

                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50/45">

                    {clinicalDataLoading ? (

                      <div className="py-8 flex justify-center">
                        <Spinner
                          size="md"
                        />
                      </div>

                    ) : generalMedicalRecords.length === 0 ? (

                      <div className="flex flex-col items-center justify-center text-center py-10 px-4">

                        <div className="w-14 h-14 rounded-2xl bg-module-soft text-primary flex items-center justify-center">
                          <FileHeart
                            size={24}
                          />
                        </div>

                        <p className="text-sm font-bold text-slate-950 mt-4">
                          No medical records found
                        </p>

                        <p className="text-xs text-slate-500 mt-1 max-w-md">
                          The patient does not currently have any medical records available to this consultation.
                        </p>

                      </div>

                    ) : (

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        {[...generalMedicalRecords]
                          .sort(
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
                          )
                          .map(
                            (record) => (
                              <MedicalRecordCard
                                key={record.id}
                                record={record}
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

              </div>

            )}

            {/* =============================================
                CONSULTATION TAB
            ============================================== */}
            {activeTab ===
              'consultation' && (

              <div className="space-y-5">

                {notesSaved && (

                  <Alert
                    type="success"
                    message="Consultation notes for this visit have been saved."
                  />

                )}

                <Card title="Clinical Observations">

                  <div className="space-y-4">

                    <div>

                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Free-text observations
                      </label>

                      <textarea
                        value={
                          observations
                        }
                        disabled={
                          notesSaved ||
                          isCompleted
                        }
                        onChange={
                          (event) =>
                            setObservations(
                              event.target.value
                            )
                        }
                        placeholder="Enter symptoms, findings, examination observations, clinical reasoning, or other consultation notes..."
                        rows={7}
                        className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm text-foreground resize-y shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />

                    </div>

                    {!notesSaved &&
                      !isCompleted && (

                      <div className="flex justify-end">

                        <Button
                          variant="secondary"
                          loading={
                            isStructuringNotes
                          }
                          onClick={
                            handleStructureNotes
                          }
                        >
                          <Sparkles
                            size={16}
                            className="mr-2"
                          />

                          Structure with AI
                        </Button>

                      </div>

                    )}

                  </div>

                </Card>

                <Card title="Structured Consultation Notes">

                  <div className="space-y-5">

                    <Input
                      label="Title"
                      value={
                        noteForm.title
                      }
                      disabled={
                        notesSaved ||
                        isCompleted
                      }
                      placeholder="e.g. OPD Consultation"
                      onChange={
                        (event) =>
                          updateNoteField(
                            'title',
                            event.target.value
                          )
                      }
                    />

                    <div>

                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Clinical Description
                      </label>

                      <textarea
                        rows={4}
                        value={
                          noteForm
                            .description
                        }
                        disabled={
                          notesSaved ||
                          isCompleted
                        }
                        onChange={
                          (event) =>
                            updateNoteField(
                              'description',
                              event.target.value
                            )
                        }
                        placeholder="Overall consultation description..."
                        className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                      />

                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                      <div>

                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Chief Complaint
                        </label>

                        <textarea
                          rows={4}
                          value={
                            noteForm
                              .chief_complaint
                          }
                          disabled={
                            notesSaved ||
                            isCompleted
                          }
                          onChange={
                            (event) =>
                              updateNoteField(
                                'chief_complaint',
                                event.target.value
                              )
                          }
                          className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                        />

                      </div>

                      <div>

                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Diagnosis
                        </label>

                        <textarea
                          rows={4}
                          value={
                            noteForm
                              .diagnosis
                          }
                          disabled={
                            notesSaved ||
                            isCompleted
                          }
                          onChange={
                            (event) =>
                              updateNoteField(
                                'diagnosis',
                                event.target.value
                              )
                          }
                          className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                        />

                      </div>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Treatment Plan
                      </label>

                      <textarea
                        rows={5}
                        value={
                          noteForm
                            .treatment_plan
                        }
                        disabled={
                          notesSaved ||
                          isCompleted
                        }
                        onChange={
                          (event) =>
                            updateNoteField(
                              'treatment_plan',
                              event.target.value
                            )
                        }
                        className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                      />

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <label className="flex items-center gap-3 border border-border rounded-xl p-4 cursor-pointer">

                        <input
                          type="checkbox"
                          checked={
                            noteForm
                              .follow_up_needed
                          }
                          disabled={
                            notesSaved ||
                            isCompleted
                          }
                          onChange={
                            (event) =>
                              updateNoteField(
                                'follow_up_needed',
                                event.target.checked
                              )
                          }
                          className="h-4 w-4"
                        />

                        <div>

                          <p className="text-sm font-semibold text-foreground">
                            Follow-up required
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Mark if the patient should return for review.
                          </p>

                        </div>

                      </label>

                      <label className="flex items-center gap-3 border border-border rounded-xl p-4 cursor-pointer">

                        <input
                          type="checkbox"
                          checked={
                            noteForm
                              .is_confidential
                          }
                          disabled={
                            notesSaved ||
                            isCompleted
                          }
                          onChange={
                            (event) =>
                              updateNoteField(
                                'is_confidential',
                                event.target.checked
                              )
                          }
                          className="h-4 w-4"
                        />

                        <div>

                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Lock
                              size={14}
                            />

                            Confidential record
                          </p>

                          <p className="text-xs text-muted-foreground">
                            This label is informational. Patient-selected privacy categories control doctor access.
                          </p>

                        </div>

                      </label>

                    </div>

                    {!notesSaved &&
                      !isCompleted && (

                      <div className="flex justify-end border-t border-border pt-5">

                        <Button
                          variant="primary"
                          loading={
                            isSavingNotes
                          }
                          onClick={
                            handleSaveNotes
                          }
                        >
                          <Save
                            size={16}
                            className="mr-2"
                          />

                          Save Consultation Notes
                        </Button>

                      </div>

                    )}

                  </div>

                </Card>

                <Card
                  title={
                    <span className="flex items-center gap-2">
                      <FlaskConical
                        size={18}
                        className="text-primary"
                      />

                      Order Lab Test
                    </span>
                  }
                >

                  {isCompleted ? (

                    <Alert
                      type="info"
                      message="This consultation is completed. New laboratory tests cannot be ordered from this visit."
                    />

                  ) : (

                    <div className="space-y-5">

                      <div className="rounded-xl bg-module-soft/45 border border-primary/15 p-4">

                        <p className="text-sm font-semibold text-foreground">
                          Send a diagnostic request directly to a Care4U laboratory
                        </p>

                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Select an active laboratory and one or more available tests. Care4U submits the selected tests together from this screen and links them automatically to this patient and consultation.
                        </p>

                      </div>

                      {labOrderSuccess && (

                        <Alert
                          type="success"
                          message={
                            labOrderSuccess
                          }
                        />

                      )}

                      {labOrderError && (

                        <Alert
                          type="error"
                          message={
                            labOrderError
                          }
                        />

                      )}

                      {laboratoriesLoading ? (

                        <div className="py-8 flex flex-col items-center justify-center gap-3">

                          <Spinner
                            size="sm"
                          />

                          <p className="text-xs text-muted-foreground">
                            Loading active laboratories...
                          </p>

                        </div>

                      ) : laboratories.length ===
                        0 ? (

                        <div className="rounded-xl border border-border bg-secondary/30 p-5 text-center">

                          <FlaskConical
                            size={26}
                            className="text-muted-foreground/50 mx-auto"
                          />

                          <p className="text-sm font-semibold text-foreground mt-3">
                            No active laboratories available
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            A verified active laboratory is required before a diagnostic request can be created.
                          </p>

                        </div>

                      ) : (

                        <>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>

                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Laboratory
                                <span className="text-destructive ml-1">
                                  *
                                </span>
                              </label>

                              <select
                                value={
                                  labOrderForm
                                    .laboratoryId
                                }
                                onChange={
                                  (event) =>
                                    updateLabOrderField(
                                      'laboratoryId',
                                      event.target.value
                                    )
                                }
                                className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              >
                                <option value="">
                                  Select laboratory
                                </option>

                                {laboratories.map(
                                  (laboratory) => (

                                    <option
                                      key={
                                        laboratory.id
                                      }
                                      value={
                                        laboratory.id
                                      }
                                    >
                                      {
                                        laboratory.name
                                      }
                                    </option>

                                  )
                                )}
                              </select>

                            </div>

                            <div>

                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Tests
                                <span className="text-destructive ml-1">
                                  *
                                </span>
                              </label>

                              {!labOrderForm
                                .laboratoryId ? (

                                <div className="min-h-[48px] flex items-center rounded-xl border border-border bg-secondary/30 px-4 text-sm text-muted-foreground">
                                  Select a laboratory first
                                </div>

                              ) : availableLabTests
                                  .length ===
                                  0 ? (

                                <div className="min-h-[48px] flex items-center rounded-xl border border-border bg-secondary/30 px-4 text-sm text-muted-foreground">
                                  No tests listed for this laboratory
                                </div>

                              ) : (

                                <div className="rounded-xl border border-border bg-background p-3 max-h-48 overflow-y-auto">

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                    {availableLabTests.map(
                                      (test) => {

                                        const selected =
                                          labOrderForm
                                            .testTypes
                                            .includes(
                                              test
                                            );

                                        return (
                                          <label
                                            key={
                                              test
                                            }
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                                              selected
                                                ? 'border-primary/30 bg-module-soft/60'
                                                : 'border-border hover:bg-secondary/40'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                selected
                                              }
                                              onChange={() =>
                                                toggleLabTest(
                                                  test
                                                )
                                              }
                                              className="w-4 h-4 accent-primary"
                                            />

                                            <span className="text-sm font-medium text-foreground">
                                              {test}
                                            </span>
                                          </label>
                                        );
                                      }
                                    )}

                                  </div>

                                </div>

                              )}

                              {labOrderForm
                                .testTypes
                                .length >
                                0 && (

                                <p className="text-xs text-primary font-semibold mt-2">
                                  {
                                    labOrderForm
                                      .testTypes
                                      .length
                                  } test
                                  {
                                    labOrderForm
                                      .testTypes
                                      .length ===
                                    1
                                      ? ''
                                      : 's'
                                  } selected
                                </p>

                              )}

                            </div>

                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4">

                            <div>

                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Priority
                              </label>

                              <select
                                value={
                                  labOrderForm
                                    .priority
                                }
                                onChange={
                                  (event) =>
                                    updateLabOrderField(
                                      'priority',
                                      event.target.value
                                    )
                                }
                                className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              >
                                <option value="routine">
                                  Routine
                                </option>

                                <option value="urgent">
                                  Urgent
                                </option>

                                <option value="stat">
                                  STAT — Immediate
                                </option>
                              </select>

                            </div>

                            <div>

                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Notes for Laboratory
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  (optional)
                                </span>
                              </label>

                              <textarea
                                rows={3}
                                value={
                                  labOrderForm
                                    .notes
                                }
                                onChange={
                                  (event) =>
                                    updateLabOrderField(
                                      'notes',
                                      event.target.value
                                    )
                                }
                                placeholder="Clinical context, specimen instructions, or other notes for the laboratory..."
                                className="w-full border border-slate-200 rounded-xl bg-white px-4 py-3 text-sm text-foreground resize-y shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              />

                            </div>

                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-5">

                            <p className="text-xs text-muted-foreground max-w-2xl">
                              Routine, urgent, and STAT are the supported laboratory priority levels. The Laboratory module receives new requests with pending status.
                            </p>

                            <Button
                              type="button"
                              variant="primary"
                              className="w-full sm:w-auto"
                              loading={
                                labOrderLoading
                              }
                              disabled={
                                labOrderLoading ||
                                !labOrderForm
                                  .laboratoryId ||
                                labOrderForm
                                  .testTypes
                                  .length ===
                                  0
                              }
                              onClick={
                                handleOrderLabTest
                              }
                            >
                              <FlaskConical
                                size={16}
                                className="mr-2"
                              />

                              Order Selected Tests
                            </Button>

                          </div>

                        </>

                      )}

                    </div>

                  )}

                </Card>

              </div>

            )}

            {/* =============================================
                PRESCRIPTION TAB
            ============================================== */}
            {activeTab ===
              'prescription' && (

              <div className="space-y-5">

                {/* Existing active medicines */}
                <Card
                  title={`Current Medicines (${activePrescriptions.length})`}
                >

                  {activePrescriptions
                    .length ===
                    0 ? (

                    <p className="text-sm text-muted-foreground py-2">
                      No active prescriptions.
                    </p>

                  ) : (

                    <div>

                      {activePrescriptions.map(
                        (
                          prescription
                        ) => (

                          <ActivePrescriptionRow
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

                  )}

                </Card>

                {/* Successful prescription QR */}
                {prescriptionQrValue && (

                  <Card>

                    <div className="py-6 text-center flex flex-col items-center">

                      <CheckCircle2
                        size={36}
                        className="text-success mb-3"
                      />

                      <h2 className="text-xl font-bold text-foreground">
                        Prescription Created Successfully
                      </h2>

                      <p className="text-sm text-muted-foreground mt-1">
                        The patient can present this QR code at a Care4U pharmacy.
                      </p>

                      <div className="mt-6 bg-white border border-border rounded-xl p-5 shadow-sm">

                        <QRCodeSVG
                          value={
                            prescriptionQrValue
                          }
                          size={190}
                        />

                      </div>

                      <p className="text-xs font-mono text-muted-foreground mt-4 break-all">
                        {
                          prescriptionQrValue
                        }
                      </p>

                      {!isCompleted && (

                        <div className="mt-5">

                          <Button
                            variant="secondary"
                            onClick={
                              prepareAnotherPrescription
                            }
                          >
                            <Plus
                              size={16}
                              className="mr-2"
                            />

                            Issue Another Prescription
                          </Button>

                        </div>

                      )}

                    </div>

                  </Card>

                )}

                {/* Prescription form */}
                {!prescriptionQrValue &&
                  !isCompleted && (

                  <form
                    onSubmit={
                      handleCreatePrescription
                    }
                  >

                    <Card title="Issue Prescription">

                      {prescriptionError && (

                        <div className="mb-5">

                          <Alert
                            type="error"
                            message={
                              prescriptionError
                            }
                          />

                        </div>

                      )}

                      <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/15">

                        <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                          Patient Selected
                        </p>

                        <p className="text-sm font-bold text-foreground mt-1">
                          {
                            consultation
                              .patient_name
                          }
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          Prescription will automatically be linked to this consultation.
                        </p>

                      </div>

                      <div className="space-y-5">

                        {medicines.map(
                          (
                            medicine,
                            index
                          ) => (

                            <div
                              key={
                                index
                              }
                              className="border border-border bg-secondary/20 rounded-xl p-5"
                            >

                              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border">

                                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                                  Medicine{' '}
                                  {
                                    index +
                                    1
                                  }
                                </h3>

                                {medicines.length >
                                  1 && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeMedicine(
                                        index
                                      )
                                    }
                                    className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                                  >
                                    <Trash2
                                      size={13}
                                    />

                                    Remove
                                  </button>

                                )}

                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Medicine search */}
                                <div className="relative md:col-span-2">

                                  <Input
                                    label="Medicine Name"
                                    value={
                                      medicine
                                        .medicine_name
                                    }
                                    required
                                    autoComplete="off"
                                    placeholder="e.g. Paracetamol"
                                    onChange={
                                      (event) =>
                                        handleMedicineNameChange(
                                          index,
                                          event.target.value
                                        )
                                    }
                                    onBlur={() =>
                                      setTimeout(
                                        () => {

                                          setActiveSuggestionIndex(
                                            null
                                          );

                                          runConflictCheck(
                                            index,
                                            medicine
                                              .medicine_name
                                          );

                                        },
                                        150
                                      )
                                    }
                                  />

                                  {activeSuggestionIndex ===
                                    index &&
                                    medicineSuggestions
                                      .length >
                                      0 && (

                                    <ul className="absolute z-40 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">

                                      {medicineSuggestions.map(
                                        (
                                          suggestion,
                                          suggestionIndex
                                        ) => (

                                          <li
                                            key={
                                              suggestionIndex
                                            }
                                            onMouseDown={
                                              (
                                                event
                                              ) => {

                                                event.preventDefault();

                                                selectMedicineSuggestion(
                                                  index,
                                                  suggestion
                                                );
                                              }
                                            }
                                            className="px-4 py-3 text-sm hover:bg-secondary cursor-pointer border-b border-border last:border-0"
                                          >

                                            <span className="font-bold text-foreground">
                                              {
                                                suggestion.name
                                              }
                                            </span>

                                            <span className="ml-2 text-xs text-muted-foreground">
                                              {
                                                suggestion.category
                                              }
                                            </span>

                                          </li>

                                        )
                                      )}

                                    </ul>

                                  )}

                                  {/* Allergy / interaction warnings */}
                                  {(medicineWarnings[
                                    index
                                  ] || [])
                                    .filter(
                                      (warning) =>
                                        !dismissedWarnings.has(
                                          `${index}-${warning.type}-${warning.conflictWith}`
                                        )
                                    )
                                    .map(
                                      (
                                        warning,
                                        warningIndex
                                      ) => (

                                        <div
                                          key={
                                            warningIndex
                                          }
                                          className={`mt-3 flex items-start gap-3 p-3 rounded-xl border ${
                                            warning.severity ===
                                            'severe'
                                              ? 'bg-destructive/5 border-destructive/30'
                                              : 'bg-urgent/5 border-urgent/30'
                                          }`}
                                        >

                                          <AlertTriangle
                                            size={17}
                                            className={
                                              warning.severity ===
                                              'severe'
                                                ? 'text-destructive shrink-0 mt-0.5'
                                                : 'text-urgent-foreground shrink-0 mt-0.5'
                                            }
                                          />

                                          <div className="flex-1">

                                            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                                              {warning.type ===
                                              'allergy'
                                                ? 'Allergy Conflict'
                                                : 'Drug Interaction'}
                                            </p>

                                            <p className="text-sm text-muted-foreground mt-1">
                                              {
                                                warning.message
                                              }
                                            </p>

                                          </div>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              dismissWarning(
                                                index,
                                                warning
                                              )
                                            }
                                            className="text-muted-foreground hover:text-foreground text-lg leading-none"
                                          >
                                            ×
                                          </button>

                                        </div>

                                      )
                                    )}

                                </div>

                                <Input
                                  label="Dosage"
                                  value={
                                    medicine
                                      .dosage
                                  }
                                  required
                                  placeholder="e.g. 500mg"
                                  onChange={
                                    (event) =>
                                      updateMedicine(
                                        index,
                                        'dosage',
                                        event.target.value
                                      )
                                  }
                                />

                                <Input
                                  label="Frequency"
                                  value={
                                    medicine
                                      .frequency
                                  }
                                  required
                                  placeholder="e.g. Twice daily"
                                  onChange={
                                    (event) =>
                                      updateMedicine(
                                        index,
                                        'frequency',
                                        event.target.value
                                      )
                                  }
                                />

                                <Input
                                  label="Duration (days)"
                                  type="number"
                                  min="1"
                                  value={
                                    medicine
                                      .duration_days
                                  }
                                  required
                                  placeholder="e.g. 7"
                                  onChange={
                                    (event) =>
                                      updateMedicine(
                                        index,
                                        'duration_days',
                                        event.target.value
                                      )
                                  }
                                />

                                <Input
                                  label="Quantity"
                                  type="number"
                                  min="1"
                                  value={
                                    medicine
                                      .quantity_prescribed
                                  }
                                  required
                                  placeholder="e.g. 14"
                                  onChange={
                                    (event) =>
                                      updateMedicine(
                                        index,
                                        'quantity_prescribed',
                                        event.target.value
                                      )
                                  }
                                />

                                <div className="md:col-span-2">

                                  <Input
                                    label="Special Notes (optional)"
                                    value={
                                      medicine
                                        .special_notes
                                    }
                                    placeholder="e.g. Take after meals"
                                    onChange={
                                      (event) =>
                                        updateMedicine(
                                          index,
                                          'special_notes',
                                          event.target.value
                                        )
                                    }
                                  />

                                </div>

                              </div>

                            </div>

                          )
                        )}

                        <div className="flex justify-start">

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={
                              addMedicine
                            }
                          >
                            <Plus
                              size={16}
                              className="mr-2"
                            />

                            Add Medicine
                          </Button>

                        </div>

                        <div>

                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Prescription Notes (optional)
                          </label>

                          <textarea
                            rows={3}
                            value={
                              prescriptionNotes
                            }
                            onChange={
                              (event) =>
                                setPrescriptionNotes(
                                  event.target.value
                                )
                            }
                            placeholder="General instructions or notes..."
                            className="w-full border border-border rounded-xl bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />

                        </div>

                        <div className="flex justify-end border-t border-border pt-5">

                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={
                              prescriptionLoading
                            }
                          >
                            <Pill
                              size={16}
                              className="mr-2"
                            />

                            Issue Prescription
                          </Button>

                        </div>

                      </div>

                    </Card>

                  </form>

                )}

                {isCompleted && (

                  <Alert
                    type="info"
                    message="This consultation is completed. Prescription entry is read-only."
                  />

                )}

              </div>

            )}

          </section>

          {/* =================================================
              ALWAYS-VISIBLE CLINICAL SAFETY SIDEBAR
          ================================================== */}
          <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]">

              <div className="px-4 py-4 bg-[#12344D] text-white">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck
                      size={19}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Clinical Safety
                    </p>
                    <p className="text-[11px] text-white/65 mt-0.5">
                      Key information to check before treatment
                    </p>
                  </div>

                </div>

              </div>

              {clinicalDataLoading ? (

                <div className="py-10 flex justify-center">
                  <Spinner
                    size="sm"
                  />
                </div>

              ) : (

                <div>

                  {/* Allergies */}
                  <SafetySection
                    icon={ShieldAlert}
                    title="Allergies"
                    count={allergies.length}
                    iconClass={
                      severeAllergies.length > 0
                        ? 'text-destructive'
                        : 'text-primary'
                    }
                    className={
                      severeAllergies.length > 0
                        ? 'bg-red-50/55'
                        : ''
                    }
                  >

                    {allergies.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No allergies recorded.
                      </p>

                    ) : (

                      <div className="space-y-2.5">

                        {sortedAllergies
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (allergy) => (

                              <div
                                key={allergy.id}
                                className="flex items-center justify-between gap-2"
                              >

                                <span className="text-xs font-semibold text-slate-800 min-w-0 truncate">
                                  {allergy.allergen}
                                </span>

                                <SeverityBadge
                                  severity={allergy.severity}
                                />

                              </div>

                            )
                          )}

                      </div>

                    )}

                  </SafetySection>

                  {/* Priority conditions */}
                  <SafetySection
                    icon={HeartPulse}
                    title="Priority Conditions"
                    count={priorityConditions.length}
                  >

                    {priorityConditions.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No priority conditions recorded.
                      </p>

                    ) : (

                      <div className="space-y-2">

                        {priorityConditions.map(
                          (condition) => (
                            <div
                              key={condition.id}
                              className="flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                {condition.condition}
                              </p>
                            </div>
                          )
                        )}

                      </div>

                    )}

                  </SafetySection>

                  {/* Active medicines */}
                  <SafetySection
                    icon={Pill}
                    title="Current Medicines"
                    count={activePrescriptions.length}
                  >

                    {activePrescriptions.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No active prescriptions.
                      </p>

                    ) : (

                      <div className="space-y-2.5">

                        {activePrescriptions
                          .flatMap(
                            (prescription) =>
                              prescription.items ||
                              []
                          )
                          .filter(
                            (item) =>
                              item?.medicine_name
                          )
                          .slice(
                            0,
                            6
                          )
                          .map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                key={item.id || index}
                              >

                                <p className="text-xs font-semibold text-slate-800">
                                  {item.medicine_name}
                                </p>

                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.dosage}
                                  {item.frequency
                                    ? ` · ${item.frequency}`
                                    : ''}
                                </p>

                              </div>

                            )
                          )}

                      </div>

                    )}

                  </SafetySection>

                  {/* Emergency-relevant medical devices */}
                  <SafetySection
                    icon={HeartPulse}
                    title="Emergency Devices"
                    count={emergencyRelevantDevices.length}
                    iconClass="text-rose-600"
                  >

                    {emergencyRelevantDevices.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No emergency-relevant devices recorded.
                      </p>

                    ) : (

                      <div className="space-y-2.5">

                        {emergencyRelevantDevices
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (device) => (

                              <div
                                key={device.id}
                                className="flex items-start gap-2"
                              >

                                <ShieldAlert
                                  size={11}
                                  className="text-rose-600 shrink-0 mt-0.5"
                                />

                                <div>

                                  <p className="text-xs font-semibold text-slate-800">
                                    {device.device_name}
                                  </p>

                                  {device.device_type && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {device.device_type}
                                    </p>
                                  )}

                                </div>

                              </div>

                            )
                          )}

                      </div>

                    )}

                  </SafetySection>

                  {/* Emergency-relevant background */}
                  <SafetySection
                    icon={ClipboardList}
                    title="Critical Background"
                    count={emergencyRelevantBackground.length}
                    iconClass="text-rose-600"
                  >

                    {emergencyRelevantBackground.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No emergency-relevant background recorded.
                      </p>

                    ) : (

                      <div className="space-y-2.5">

                        {emergencyRelevantBackground
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (item) => (

                              <div
                                key={item.id}
                                className="flex items-start gap-2"
                              >

                                <ShieldAlert
                                  size={11}
                                  className="text-rose-600 shrink-0 mt-0.5"
                                />

                                <div>

                                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                    {item.title}
                                  </p>

                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {formatStatus(
                                      item.background_type
                                    )}
                                  </p>

                                </div>

                              </div>

                            )
                          )}

                      </div>

                    )}

                  </SafetySection>

                  {/* Emergency-relevant family history */}
                  <SafetySection
                    icon={UserRound}
                    title="Critical Family History"
                    count={emergencyRelevantFamilyHistory.length}
                    iconClass="text-rose-600"
                  >

                    {emergencyRelevantFamilyHistory.length === 0 ? (

                      <p className="text-xs text-slate-500">
                        No emergency-relevant family history recorded.
                      </p>

                    ) : (

                      <div className="space-y-2.5">

                        {emergencyRelevantFamilyHistory
                          .slice(
                            0,
                            5
                          )
                          .map(
                            (item) => (

                              <div
                                key={item.id}
                                className="flex items-start gap-2"
                              >

                                <ShieldAlert
                                  size={11}
                                  className="text-rose-600 shrink-0 mt-0.5"
                                />

                                <div>

                                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                    {item.condition}
                                  </p>

                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {formatFamilyRelation(
                                      item.relation
                                    )}
                                  </p>

                                </div>

                              </div>

                            )
                          )}

                      </div>

                    )}

                  </SafetySection>

                </div>

              )}

            </section>

            {/* Most recent visit quick reference */}
            <Card title="Recent Clinical Context">

              <div className="space-y-4">

                {mostRecentVisit ? (

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-500">
                      Latest Medical Record
                    </p>

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(
                        mostRecentVisit
                          .created_at
                      )}
                    </p>

                    <p className="text-sm font-bold text-foreground mt-1">
                      {mostRecentVisit
                        .title ||
                        capitalise(
                          mostRecentVisit
                            .record_type
                        )}
                    </p>

                    {mostRecentVisit
                      .doctor_name && (

                      <p className="text-xs text-muted-foreground mt-1">
                        Dr. {mostRecentVisit.doctor_name}
                      </p>

                    )}

                  </div>

                ) : (

                  <p className="text-xs text-muted-foreground">
                    No previous visit history available.
                  </p>

                )}

                {latestLabReport && (

                  <div className="pt-4 border-t border-border">

                    <div className="flex items-center gap-2">

                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                        <FlaskConical
                          size={15}
                        />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-violet-700">
                          Latest Lab Report
                        </p>

                        <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                          {latestLabReport.test_type ||
                            'Laboratory Test'}
                        </p>

                      </div>

                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(
                        latestLabReport.created_at,
                        true
                      )}
                      {latestLabReport.lab_name
                        ? ` · ${latestLabReport.lab_name}`
                        : ''}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-3">

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            'history'
                          )
                        }
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View lab history
                      </button>

                      {latestLabReport.report_url && (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              latestLabReport.report_url,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
                        >
                          <ExternalLink
                            size={12}
                          />
                          Open report
                        </button>
                      )}

                    </div>

                  </div>

                )}

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'history'
                    )
                  }
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View full history
                </button>

              </div>

            </Card>

            {/* Quick reference */}
            <Card title="Quick Reference">

              <div className="space-y-4">

                <PatientField
                  label="NIC"
                  value={
                    consultation
                      .patient_nic
                  }
                />

                <PatientField
                  label="Blood Group"
                  value={
                    consultation
                      .patient_blood_group
                  }
                  className="text-destructive"
                />

                <PatientField
                  label="Patient QR"
                  value={
                    consultation
                      .patient_qr_code_id
                  }
                />

                <PatientField
                  label="Visit Status"
                  value={
                    formatStatus(
                      consultation
                        .status
                    )
                  }
                />

              </div>

            </Card>

            {/* Attending doctor */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">

              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Attending Doctor
              </p>

              <p className="text-sm font-bold text-foreground mt-1">
                {consultation
                  .doctor_name
                  ? `Dr. ${consultation.doctor_name}`
                  : user?.email ||
                    'Doctor'}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {
                  consultation
                    .doctor_specialization ||
                  'Medical Practitioner'
                }
              </p>

            </div>

          </aside>

        </div>

      </main>

      {/* =====================================================
          STICKY CONSULTATION ACTION BAR
      ====================================================== */}
      <div className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 z-50">

        <div className="max-w-[1450px] mx-auto rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_18px_50px_rgba(15,23,42,0.16)] px-4 sm:px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col sm:flex-row sm:items-center gap-3">

          <div className="flex-1">

            <p className="text-sm font-bold text-foreground">
              {isCompleted
                ? 'Consultation Completed'
                : 'Consultation in progress'}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-0.5">

              <p className="text-xs text-muted-foreground">
                {isCompleted
                  ? 'This visit is available for clinical review.'
                  : notesSaved
                    ? 'Consultation notes are saved.'
                    : 'Save your consultation notes before completing the visit.'}
              </p>

              {!isCompleted &&
                hasUnsavedChanges && (

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-urgent/10 text-urgent-foreground text-[10px] font-bold uppercase tracking-wide">

                  <AlertTriangle
                    size={11}
                  />

                  Unsaved Changes

                </span>

              )}

            </div>

          </div>

          {!isCompleted && (
            <>

              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                loading={
                  isSavingNotes
                }
                disabled={
                  notesSaved
                }
                onClick={
                  handleSaveNotes
                }
              >
                {notesSaved ? (
                  <Check
                    size={16}
                    className="mr-2"
                  />
                ) : (
                  <Save
                    size={16}
                    className="mr-2"
                  />
                )}

                {notesSaved
                  ? 'Notes Saved'
                  : 'Save Notes'}
              </Button>

              <Button
                variant="primary"
                className="w-full sm:w-auto"
                loading={
                  isCompleting
                }
                onClick={
                  handleCompleteConsultation
                }
              >
                <ClipboardCheck
                  size={16}
                  className="mr-2"
                />

                Complete Consultation
              </Button>

            </>
          )}

          {isCompleted && (

            <Button
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() =>
                requestNavigation(
                  '/doctor/dashboard'
                )
              }
            >
              <LayoutDashboard
                size={16}
                className="mr-2"
              />

              Return to Dashboard
            </Button>

          )}

        </div>

      </div>

      {/* =====================================================
          PATIENT CONSENT OTP MODAL
      ====================================================== */}
      <Modal
        isOpen={
          showConsentOtpModal
        }
        onClose={() => {

          if (
            isVerifyingConsent
          ) {
            return;
          }

          setShowConsentOtpModal(
            false
          );

          setConsentOtp(
            ''
          );

          setConsentError(
            ''
          );
        }}
        title="Verify Patient Consent"
      >

        <div className="space-y-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

              <Lock
                size={19}
                className="text-primary"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-foreground">
                Enter the code provided by the patient
              </p>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                A six-digit code was submitted for the patient's registered email. Ask the patient to check their inbox and spam folder.
                Ask the patient to read the code to you only if they agree to temporary access.
              </p>

            </div>

          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">

            <label className="block text-xs uppercase tracking-wide font-bold text-muted-foreground mb-2">
              6-digit consent code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={
                consentOtp
              }
              maxLength={6}
              disabled={
                isVerifyingConsent
              }
              onChange={
                (event) => {

                  const value =
                    event.target.value
                      .replace(
                        /\D/g,
                        ''
                      )
                      .slice(
                        0,
                        6
                      );

                  setConsentOtp(
                    value
                  );

                  if (
                    consentError
                  ) {
                    setConsentError(
                      ''
                    );
                  }
                }
              }
              onKeyDown={
                (event) => {

                  if (
                    event.key ===
                      'Enter' &&
                    consentOtp.length ===
                      6 &&
                    !isVerifyingConsent
                  ) {
                    event.preventDefault();

                    handleVerifyConsentAccess();
                  }
                }
              }
              placeholder="000000"
              className="w-full h-14 rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-[0.45em] font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            />

            <p className="text-xs text-muted-foreground mt-2">
              The code expires after 10 minutes and can be used only once.
            </p>

          </div>

          {consentError && (

            <Alert
              type="error"
              message={
                consentError
              }
            />

          )}

          <div className="rounded-xl border border-urgent/20 bg-urgent/5 p-4">

            <div className="flex items-start gap-2">

              <ShieldAlert
                size={15}
                className="text-urgent-foreground shrink-0 mt-0.5"
              />

              <p className="text-xs text-muted-foreground leading-relaxed">
                Successful verification grants temporary access only to this doctor,
                this patient, and this active consultation. The patient's permanent
                privacy settings remain unchanged.
              </p>

            </div>

          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">

            <Button
              variant="secondary"
              disabled={
                isRequestingConsent ||
                isVerifyingConsent
              }
              onClick={
                handleRequestConsentAccess
              }
            >
              Resend Code
            </Button>

            <div className="flex flex-col-reverse sm:flex-row gap-3">

              <Button
                variant="secondary"
                disabled={
                  isVerifyingConsent
                }
                onClick={() => {

                  setShowConsentOtpModal(
                    false
                  );

                  setConsentOtp(
                    ''
                  );

                  setConsentError(
                    ''
                  );
                }}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                loading={
                  isVerifyingConsent
                }
                disabled={
                  consentOtp.length !==
                    6
                }
                onClick={
                  handleVerifyConsentAccess
                }
              >
                <CheckCircle2
                  size={16}
                  className="mr-2"
                />

                Verify & Unlock
              </Button>

            </div>

          </div>

        </div>

      </Modal>

      {/* =====================================================
          CONSULTATION NOTE DETAILS MODAL
      ====================================================== */}
      <Modal
        isOpen={
          !!selectedConsultationNote
        }
        onClose={() =>
          setSelectedConsultationNote(
            null
          )
        }
        title="Consultation Note"
        size="lg"
      >

        {selectedConsultationNote && (

          <div className="space-y-6">

            <div className="relative overflow-hidden rounded-2xl bg-[#12344D] text-white p-5 sm:p-6">

              <div className="absolute -right-14 -top-16 w-44 h-44 rounded-full bg-primary/20" />

              <div className="relative z-10">

                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <Stethoscope
                    size={20}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">

                  <span className="inline-flex rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em]">
                    Consultation Note
                  </span>

                  {selectedConsultationNote.appointment_id ===
                    appointmentId && (
                    <span className="inline-flex rounded-full bg-primary px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em]">
                      Current Visit
                    </span>
                  )}

                </div>

                <h3 className="text-xl sm:text-2xl font-bold mt-3">
                  {selectedConsultationNote.title ||
                    'Consultation'}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-white/70">

                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays
                      size={13}
                    />
                    {formatDate(
                      selectedConsultationNote.created_at,
                      true
                    )}
                  </span>

                  {selectedConsultationNote.doctor_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound
                        size={13}
                      />
                      Dr. {selectedConsultationNote.doctor_name}
                    </span>
                  )}

                </div>

              </div>

            </div>

            {selectedConsultationNote.is_confidential && (
              <Alert
                type="warning"
                message="This consultation note is marked confidential."
              />
            )}

            <div className="space-y-5">

              <DetailBlock
                label="Chief Complaint"
              >
                {selectedConsultationNote.chief_complaint}
              </DetailBlock>

              <DetailBlock
                label="Diagnosis"
                emphasis
              >
                {selectedConsultationNote.diagnosis}
              </DetailBlock>

              <DetailBlock
                label="Treatment Plan"
              >
                {selectedConsultationNote.treatment_plan}
              </DetailBlock>

              <DetailBlock
                label="Clinical Description"
              >
                {selectedConsultationNote.description}
              </DetailBlock>

            </div>

            {selectedConsultationNote.follow_up_needed && (
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">

                <Calendar
                  size={17}
                  className="text-blue-700 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Follow-up required
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This consultation was saved with follow-up required.
                  </p>
                </div>

              </div>
            )}

          </div>

        )}

      </Modal>

      {/* =====================================================
          MEDICAL RECORD DETAILS MODAL
      ====================================================== */}
      <Modal
        isOpen={
          !!selectedRecord
        }
        onClose={() =>
          setSelectedRecord(
            null
          )
        }
        title="Medical Record"
        size="lg"
      >

        {selectedRecord && (() => {

          const meta =
            getRecordTypeMeta(
              selectedRecord.record_type
            );

          const Icon =
            meta.icon;

          return (
            <div className="space-y-6">

              <div className="relative overflow-hidden rounded-2xl bg-[#12344D] text-white p-5 sm:p-6">

                <div className="absolute -right-16 -top-20 w-48 h-48 rounded-full bg-primary/20" />
                <div className="absolute right-10 -bottom-14 w-24 h-24 rounded-full bg-white/5" />

                <div className="relative z-10">

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.backgroundClass} ${meta.iconClass}`}>
                    <Icon
                      size={22}
                    />
                  </div>

                  <div className="inline-flex items-center mt-4 rounded-full bg-white/10 border border-white/10 px-3 py-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em]">
                      {meta.label}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mt-3 leading-tight">
                    {selectedRecord.title ||
                      meta.label}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-white/70">

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays
                        size={14}
                      />
                      {formatDate(
                        selectedRecord.created_at,
                        true
                      )}
                    </span>

                    {selectedRecord.doctor_name && (
                      <span className="inline-flex items-center gap-1.5">
                        <Stethoscope
                          size={14}
                        />
                        Dr. {selectedRecord.doctor_name}
                        {selectedRecord.doctor_specialization
                          ? ` · ${selectedRecord.doctor_specialization}`
                          : ''}
                      </span>
                    )}

                  </div>

                </div>

              </div>

              {selectedRecord.is_confidential && (
                <Alert
                  type="warning"
                  message="This record is marked confidential."
                />
              )}

              {selectedRecord.record_type ===
                'consultation' ? (

                <div className="space-y-5">

                  <DetailBlock
                    label="Chief Complaint"
                  >
                    {selectedRecord.chief_complaint}
                  </DetailBlock>

                  <DetailBlock
                    label="Diagnosis"
                    emphasis
                  >
                    {selectedRecord.diagnosis}
                  </DetailBlock>

                  <DetailBlock
                    label="Treatment Plan"
                  >
                    {selectedRecord.treatment_plan}
                  </DetailBlock>

                  <DetailBlock
                    label="Additional Notes"
                  >
                    {selectedRecord.description}
                  </DetailBlock>

                </div>

              ) : (

                <DetailBlock
                  label="Details"
                >
                  {selectedRecord.description ||
                    'No additional details recorded.'}
                </DetailBlock>

              )}

              {selectedRecord.follow_up_needed && (
                <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">

                  <Calendar
                    size={17}
                    className="text-blue-700 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-sm font-bold text-blue-900">
                      Follow-up required
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      This medical record indicates that the patient requires follow-up care.
                    </p>
                  </div>

                </div>
              )}

            </div>
          );
        })()}

      </Modal>

      {/* =====================================================
          UNSAVED CHANGES CONFIRMATION
      ====================================================== */}
      <Modal
        isOpen={
          showLeaveConfirmation
        }
        onClose={
          cancelPendingNavigation
        }
        title="Unsaved Consultation Changes"
      >

        <div className="space-y-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-urgent/10 flex items-center justify-center shrink-0">

              <AlertTriangle
                size={20}
                className="text-urgent-foreground"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-foreground">
                Leave this consultation?
              </p>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                You have clinical information that has not been saved.
                Leaving now will discard those unsaved changes.
              </p>

            </div>

          </div>

          <div className="bg-secondary/40 border border-border rounded-xl p-4">

            <p className="text-xs text-muted-foreground">
              Saved consultation notes and prescriptions that were already
              issued will remain in Care4U. Only work that has not yet been
              saved will be lost.
            </p>

          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

            <Button
              variant="secondary"
              onClick={
                cancelPendingNavigation
              }
            >
              Stay in Consultation
            </Button>

            <Button
              variant="primary"
              onClick={
                confirmPendingNavigation
              }
            >
              Leave Without Saving
            </Button>

          </div>

        </div>

      </Modal>

      {/* =====================================================
          COMPLETE CONSULTATION CONFIRMATION
      ====================================================== */}
      <Modal
        isOpen={
          showCompleteConfirmation
        }
        onClose={() =>
          setShowCompleteConfirmation(
            false
          )
        }
        title="Complete Consultation"
      >

        <div className="space-y-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

              <ClipboardCheck
                size={20}
                className="text-primary"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-foreground">
                Mark this consultation as completed?
              </p>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Care4U will save the consultation notes first and then close
                this appointment.
              </p>

            </div>

          </div>

          {!notesSaved && (

            <div className="bg-urgent/5 border border-urgent/20 rounded-xl p-4 flex items-start gap-2">

              <AlertTriangle
                size={15}
                className="text-urgent-foreground shrink-0 mt-0.5"
              />

              <p className="text-xs text-muted-foreground">
                Your consultation notes have not been saved yet.
                They will be validated and saved before completion.
              </p>

            </div>

          )}

          {!prescriptionQrValue &&
            (
              prescriptionNotes.trim() !== '' ||
              medicines.some(
                (medicine) =>
                  medicine.medicine_name.trim() !== '' ||
                  medicine.dosage.trim() !== '' ||
                  medicine.frequency.trim() !== '' ||
                  String(
                    medicine.duration_days
                  ).trim() !== '' ||
                  String(
                    medicine.quantity_prescribed
                  ).trim() !== '' ||
                  medicine.special_notes.trim() !== ''
              )
            ) && (

            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-2">

              <AlertTriangle
                size={15}
                className="text-destructive shrink-0 mt-0.5"
              />

              <p className="text-xs text-muted-foreground">
                There is unfinished prescription information. Complete or
                clear the prescription before closing the consultation if
                you intend to issue it.
              </p>

            </div>

          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

            <Button
              variant="secondary"
              disabled={
                isCompleting
              }
              onClick={() =>
                setShowCompleteConfirmation(
                  false
                )
              }
            >
              Continue Consultation
            </Button>

            <Button
              variant="primary"
              loading={
                isCompleting
              }
              onClick={
                confirmCompleteConsultation
              }
            >
              <CheckCircle2
                size={16}
                className="mr-2"
              />

              Confirm Completion
            </Button>

          </div>

        </div>

      </Modal>

    </div>
  );
};

export default ConsultationPage;
