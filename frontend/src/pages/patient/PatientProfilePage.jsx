/**
 * @file    PatientProfilePage.jsx
 * @component PatientProfilePage
 * @desc    Displays and allows editing of the patient's profile.
 * Includes smart autocomplete for adding allergies, secure deletion,
 * profile photo upload (CARE4U-65), and a redesigned Ultra-Clean Light Mode header.
 * Avatar sized up to 96px for reliable visual identification.
 * Chronic conditions management added in CARE4U-79.
 * Vaccination Records added in CARE4U-148.
 * AI Vaccination Bulk Card Scanning added in CARE4U-154.
 * Smart Health Awareness Feed added in CARE4U-280 (Epic 8.13).
 * Privacy & Consent Controls added in CARE4U-284 (Epic 8.12).
 * Medical Devices & Implants management added for emergency readiness.
 * Important Medical Background management added for major past health events.
 * Family Medical History management added for clinically relevant family conditions.
 * Stage 4A review: profile/consent only; clinical list CRUD and AI remain separate partial scope.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { API_BASE_URL } from '../../services/api';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  User,
  Droplets,
  Phone,
  Calendar,
  Edit2,
  X,
  Save,
  AlertTriangle,
  Trash2,
  Plus,
  Camera,
  Syringe,
  ScanLine,
  Shield,
  Lock,
  Unlock,
  HeartPulse,
  History,
  Users
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';


import { 
  getPatientProfile, 
  updatePatientProfile, 
  uploadPatientPhoto,
  getAllergies, 
  addAllergy, 
  deleteAllergy,
  getConditions,
  addCondition,
  deleteCondition,
  getMedicalDevices,
  addMedicalDevice,
  deleteMedicalDevice,
  getHealthBackground,
  addHealthBackground,
  deleteHealthBackground,
  getFamilyHistory,
  addFamilyHistory,
  deleteFamilyHistory,
  getVaccinations,
  addBulkVaccinations,
  deleteVaccination,
  scanVaccinationCard,
  getConsentSettings,
  updateConsentSettings
} from '../../services/patient.service';

import { searchAllergens } from '../../utils/allergenSearch';
import { searchVaccines } from '../../utils/vaccineSearch';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal'; 
import HealthAwarenessFeed from '../../components/common/HealthAwarenessFeed';

/**
 * Fetches the currently logged-in patient's real ID from the session,
 * replacing what used to be a hardcoded test patient ID.
 */
/** Resolve the current patient profile through acknowledged /me; account IDs are never substituted. No inputs; returns patientId/loading. Its mount effect performs the credentialed read.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const usePatientId = () => {
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            credentials: 'include',
          }
        );

        const data = await res.json();

        if (
          res.ok && data.success === true && data.data?.role === 'patient' &&
          typeof data.data?.profile_id === 'string' && data.data.profile_id
        ) {
          setPatientId(
            data.data.profile_id
          );
        }

      } catch (err) {
        console.error(
          'Failed to fetch current user:',
          err
        );

      } finally {
        setLoading(false);
      }
    };

    fetchMe();

  }, []);

  return {
    patientId,
    loading
  };
};

// ─── Sensitive Categories for Consent ──────────
const SENSITIVE_CATEGORIES = [
  'Mental Health',
  'Reproductive Health',
  'Substance Abuse',
  'STD/STI Records'
];

const HEALTH_BACKGROUND_TYPES = [
  {
    value: 'major_surgery',
    label: 'Major Surgery'
  },
  {
    value: 'major_procedure',
    label: 'Major Procedure'
  },
  {
    value: 'organ_transplant',
    label: 'Organ Transplant'
  },
  {
    value: 'major_hospitalization',
    label: 'Major Hospitalization'
  },
  {
    value: 'serious_past_condition',
    label: 'Serious Past Condition'
  },
  {
    value: 'other',
    label: 'Other'
  }
];


const FAMILY_RELATIONS = [
  {
    value: 'mother',
    label: 'Mother'
  },
  {
    value: 'father',
    label: 'Father'
  },
  {
    value: 'sister',
    label: 'Sister'
  },
  {
    value: 'brother',
    label: 'Brother'
  },
  {
    value: 'daughter',
    label: 'Daughter'
  },
  {
    value: 'son',
    label: 'Son'
  },
  {
    value: 'maternal_grandmother',
    label: 'Maternal Grandmother'
  },
  {
    value: 'maternal_grandfather',
    label: 'Maternal Grandfather'
  },
  {
    value: 'paternal_grandmother',
    label: 'Paternal Grandmother'
  },
  {
    value: 'paternal_grandfather',
    label: 'Paternal Grandfather'
  },
  {
    value: 'other',
    label: 'Other'
  }
];

// ─── Photo upload constraints (mirrors backend middleware/upload.js) ──────────
const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MAX_PHOTO_SIZE_BYTES =
  2 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';

  return new Date(
    dateStr
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );
};

const formatAge = (dateStr) => {
  if (!dateStr) return '—';

  const birthDate = new Date(dateStr);

  if (Number.isNaN(birthDate.getTime())) {
    return '—';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age -= 1;
  }

  return `${age} yrs`;
};

const capitalise = (str) => {
  if (!str) return '—';

  return (
    str.charAt(0).toUpperCase() +
    str.slice(1)
  );
};

const getAvatarSrc = (patient) => {
  if (patient?.photo_url) {
    return patient.photo_url;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    patient?.full_name || 'Patient'
  )}&background=0D9488&color=fff&size=120&bold=true&rounded=true`;
};

const getHealthBackgroundTypeLabel = (
  type
) => {
  const match =
    HEALTH_BACKGROUND_TYPES.find(
      item =>
        item.value === type
    );

  return (
    match?.label ||
    capitalise(
      type?.replaceAll('_', ' ')
    )
  );
};


const getFamilyRelationLabel = (
  relation
) => {
  const match =
    FAMILY_RELATIONS.find(
      item =>
        item.value === relation
    );

  return (
    match?.label ||
    capitalise(
      relation?.replaceAll('_', ' ')
    )
  );
};

// ─── Severity Badge ───────────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  priority: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    label: 'Priority'
  },
  severe: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    label: 'Severe'
  },
    moderate: {
    bg: 'bg-urgent/10',
    text: 'text-urgent-foreground',
    label: 'Moderate'
  },
  mild: {
    bg: 'bg-success/10',
    text: 'text-success',
    label: 'Mild'
  },
};

const SeverityBadge = ({
  severity
}) => {
  const style =
    SEVERITY_STYLES[
      severity?.toLowerCase()
    ] ||
    SEVERITY_STYLES.mild;

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
};

// ─── Profile Field Component ──────────────────────────────────────────────────
/** Render one read-only profile field. Props supply icon, label and value; missing values use the existing fallback. No API side effects.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const ProfileField = ({
  icon: Icon,
  label,
  value
}) => (
  <div className="rounded-xl bg-secondary/45 p-4">

    <div className="flex items-start gap-3">

      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

          <Icon
            size={16}
          />

        </div>
      )}

      <div className="min-w-0">

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>

        <p className="text-sm font-semibold text-foreground mt-1 break-words">
          {value || '—'}
        </p>

      </div>

    </div>

  </div>
);

// ─── Premium Section Shell ───────────────────────────────────────────────────
/** Render a themed section and optional Edit Mode action. Props supply heading, description, children, editing and action callback; it does not persist data.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const SectionPanel = ({
  title,
  description,
  editing = false,
  actionLabel = 'Add',
  onAction,
  children,
  className = ''
}) => (
  <section
    className={`overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_28px_rgba(15,23,42,0.045)] ${className}`}
  >

    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-5 border-b border-border bg-card">

      <div className="min-w-0">

        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#12344D]">
          {title}
        </h2>

        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}

      </div>

      {editing && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-module-soft text-primary px-3 py-2 text-xs font-bold hover:bg-primary hover:text-white transition-colors"
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}

    </div>

    <div className="bg-secondary/15 px-5 sm:px-6 py-5">
      {children}
    </div>

  </section>
);

// ─── Premium Summary Tile ────────────────────────────────────────────────────
/** Render a profile statistic from label/value/helper/icon props; wrapping prevents narrow-screen overflow. No data access.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const SummaryTile = ({
  label,
  value,
  helper,
  icon: Icon,
  iconClass = 'text-primary',
  iconBgClass = 'bg-module-soft'
}) => (
  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">

    <div className="flex flex-wrap items-start justify-between gap-3">

      <div className="min-w-0 break-words">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>

        <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-2">
          {value}
        </p>

        {helper && (
          <p className="text-xs text-muted-foreground mt-1">
            {helper}
          </p>
        )}
      </div>

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass} ${iconClass}`}>
        <Icon size={20} strokeWidth={2} />
      </div>

    </div>

  </div>
);

// ─── Banner Load Animations ─────────────────────────────
const BannerAnimationStyles = () => (
  <style>{`
    @keyframes cuAvatarPop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }

    @keyframes cuFadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes cuGlowPulse {
      0%   { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
      70%  { box-shadow: 0 0 0 18px rgba(20, 184, 166, 0); }
      100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
    }

    .cu-avatar-pop {
      animation: cuAvatarPop 450ms ease-out both;
    }

    .cu-fade-slide-up {
      animation: cuFadeSlideUp 450ms ease-out both;
    }

    .cu-glow-ring {
      animation: cuGlowPulse 1400ms ease-out 350ms 1;
      border-radius: 9999px;
    }

    @media (prefers-reduced-motion: reduce) {
      .cu-avatar-pop,
      .cu-fade-slide-up,
      .cu-glow-ring {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        box-shadow: none !important;
      }
    }
  `}</style>
);

// ─── Main Page Component ──────────────────────────────────────────────────────
/** Coordinate self-profile reads and profile/consent saves. Query keys use patientId; refs exclude duplicate writes. Clinical list CRUD/AI controls remain partial dependencies of this large screen.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const PatientProfilePage = () => {
  const consentInFlight = useRef(false);
  const profileInFlight = useRef(false);
  const {
    patientId,
    loading: patientIdLoading
  } = usePatientId();

  const queryClient =
    useQueryClient();

  const [
    isEditing,
    setIsEditing
  ] = useState(false);

  // ── Photo Upload State ──
  const photoInputRef =
    useRef(null);

  // ── Allergy UI State ──
  const [
    isAddAllergyModalOpen,
    setIsAddAllergyModalOpen
  ] = useState(false);

  const [
    isDeleteModalOpen,
    setIsDeleteModalOpen
  ] = useState(false);

  const [
    allergyToDelete,
    setAllergyToDelete
  ] = useState(null);

  // ── Condition UI State ──
  const [
    isAddConditionModalOpen,
    setIsAddConditionModalOpen
  ] = useState(false);

  const [
    isDeleteConditionModalOpen,
    setIsDeleteConditionModalOpen
  ] = useState(false);

  const [
    conditionToDelete,
    setConditionToDelete
  ] = useState(null);

  // ── Medical Device UI State ──
  const [
    isAddDeviceModalOpen,
    setIsAddDeviceModalOpen
  ] = useState(false);

  const [
    isDeleteDeviceModalOpen,
    setIsDeleteDeviceModalOpen
  ] = useState(false);

  const [
    deviceToDelete,
    setDeviceToDelete
  ] = useState(null);

  const [
    deviceNameInput,
    setDeviceNameInput
  ] = useState('');

  const [
    deviceTypeInput,
    setDeviceTypeInput
  ] = useState('');

  const [
    implantedAtInput,
    setImplantedAtInput
  ] = useState('');

  const [
    deviceNotesInput,
    setDeviceNotesInput
  ] = useState('');

  const [
    isEmergencyRelevantInput,
    setIsEmergencyRelevantInput
  ] = useState(true);

  // ── Important Medical Background UI State ──
  const [
    isAddBackgroundModalOpen,
    setIsAddBackgroundModalOpen
  ] = useState(false);

  const [
    isDeleteBackgroundModalOpen,
    setIsDeleteBackgroundModalOpen
  ] = useState(false);

  const [
    backgroundToDelete,
    setBackgroundToDelete
  ] = useState(null);

  const [
    backgroundTypeInput,
    setBackgroundTypeInput
  ] = useState('major_surgery');

  const [
    backgroundTitleInput,
    setBackgroundTitleInput
  ] = useState('');

  const [
    backgroundEventDateInput,
    setBackgroundEventDateInput
  ] = useState('');

  const [
    backgroundNotesInput,
    setBackgroundNotesInput
  ] = useState('');

  const [
    isBackgroundEmergencyRelevantInput,
    setIsBackgroundEmergencyRelevantInput
  ] = useState(false);


  // ── Family Medical History UI State ──
  const [
    isAddFamilyHistoryModalOpen,
    setIsAddFamilyHistoryModalOpen
  ] = useState(false);

  const [
    isDeleteFamilyHistoryModalOpen,
    setIsDeleteFamilyHistoryModalOpen
  ] = useState(false);

  const [
    familyHistoryToDelete,
    setFamilyHistoryToDelete
  ] = useState(null);

  const [
    familyRelationInput,
    setFamilyRelationInput
  ] = useState('mother');

  const [
    familyConditionInput,
    setFamilyConditionInput
  ] = useState('');

  const [
    familyHistoryNotesInput,
    setFamilyHistoryNotesInput
  ] = useState('');

  const [
    isFamilyHistoryEmergencyRelevantInput,
    setIsFamilyHistoryEmergencyRelevantInput
  ] = useState(false);

  // ── Vaccination UI State ──
  const [
    isAddVaccinationModalOpen,
    setIsAddVaccinationModalOpen
  ] = useState(false);

  const [
    isDeleteVaccinationModalOpen,
    setIsDeleteVaccinationModalOpen
  ] = useState(false);

  const [
    vaccinationToDelete,
    setVaccinationToDelete
  ] = useState(null);

  const scanVaccineInputRef =
    useRef(null);

  // ── Autocomplete State (Allergies) ──
  const [
    allergenInput,
    setAllergenInput
  ] = useState('');

  const [
    allergySuggestions,
    setAllergySuggestions
  ] = useState([]);

  const [
    showAllergySuggestions,
    setShowAllergySuggestions
  ] = useState(false);

  const [
    selectedSeverity,
    setSelectedSeverity
  ] = useState('mild');

  const [
    allergyNotes,
    setAllergyNotes
  ] = useState('');

  const allergyDropdownRef =
    useRef(null);

  // ── Dynamic Bulk Autocomplete State (Vaccinations) ──
  const [
    bulkVaccines,
    setBulkVaccines
  ] = useState([
    {
      id: 'initial-row',
      vaccineName: '',
      dateAdministered: '',
      doseNumber: '',
      notes: ''
    }
  ]);

  const [
    activeVaccineRowId,
    setActiveVaccineRowId
  ] = useState(null);

  const [
    vaccineSuggestions,
    setVaccineSuggestions
  ] = useState([]);

  // ── Add Condition Form State ──
  const [
    conditionInput,
    setConditionInput
  ] = useState('');

  const [
    diagnosedAtInput,
    setDiagnosedAtInput
  ] = useState('');

  const [
    conditionNotes,
    setConditionNotes
  ] = useState('');

  const [
    isPriorityInput,
    setIsPriorityInput
  ] = useState(false);

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        allergyDropdownRef.current &&
        !allergyDropdownRef.current.contains(
          event.target
        )
      ) {
        setShowAllergySuggestions(
          false
        );
      }

      if (
        !event.target.closest(
          '.vaccine-autocomplete-container'
        )
      ) {
        setActiveVaccineRowId(
          null
        );
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

  }, []);

  const handleAllergenInputChange = (
    e
  ) => {
    const value =
      e.target.value;

    setAllergenInput(
      value
    );

    setAllergySuggestions(
      searchAllergens(
        value
      )
    );

    setShowAllergySuggestions(
      true
    );
  };

  const handleSelectAllergySuggestion = (
    suggestion
  ) => {
    setAllergenInput(
      suggestion.name
    );

    setShowAllergySuggestions(
      false
    );
  };

  const addVaccineRow = () => {
    setBulkVaccines([
      ...bulkVaccines,
      {
        id: Date.now(),
        vaccineName: '',
        dateAdministered: '',
        doseNumber: '',
        notes: ''
      }
    ]);
  };

  const removeVaccineRow = (
    id
  ) => {
    setBulkVaccines(
      bulkVaccines.filter(
        v =>
          v.id !== id
      )
    );
  };

  const updateVaccineRow = (
    id,
    field,
    value
  ) => {
    setBulkVaccines(
      bulkVaccines.map(
        v =>
          v.id === id
            ? {
                ...v,
                [field]: value
              }
            : v
      )
    );

    if (
      field ===
      'vaccineName'
    ) {
      setVaccineSuggestions(
        searchVaccines(
          value
        )
      );

      setActiveVaccineRowId(
        id
      );
    }
  };

  // ── Queries ──
  const {
    data: patient,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [
      'patient',
      patientId
    ],
    queryFn: () =>
      getPatientProfile(
        patientId
      ),
    enabled:
      !!patientId,
  });

  const {
    data: allergies = [],
    isLoading:
      allergiesLoading
  } = useQuery({
    queryKey: [
      'allergies',
      patientId
    ],
    queryFn: () =>
      getAllergies(
        patientId
      ),
    enabled:
      !!patient,
  });

  const {
    data: conditions = [],
    isLoading:
      conditionsLoading
  } = useQuery({
    queryKey: [
      'conditions',
      patientId
    ],
    queryFn: () =>
      getConditions(
        patientId
      ),
    enabled:
      !!patient,
  });

  const {
    data: medicalDevices = [],
    isLoading:
      medicalDevicesLoading
  } = useQuery({
    queryKey: [
      'medical-devices',
      patientId
    ],
    queryFn: () =>
      getMedicalDevices(
        patientId
      ),
    enabled:
      !!patient,
  });

  const {
    data: healthBackground = [],
    isLoading:
      healthBackgroundLoading
  } = useQuery({
    queryKey: [
      'health-background',
      patientId
    ],
    queryFn: () =>
      getHealthBackground(
        patientId
      ),
    enabled:
      !!patient,
  });


  const {
    data: familyHistory = [],
    isLoading:
      familyHistoryLoading
  } = useQuery({
    queryKey: [
      'family-history',
      patientId
    ],
    queryFn: () =>
      getFamilyHistory(
        patientId
      ),
    enabled:
      !!patient,
  });

  const {
    data: vaccinations = [],
    isLoading:
      vaccinationsLoading
  } = useQuery({
    queryKey: [
      'vaccinations',
      patientId
    ],
    queryFn: () =>
      getVaccinations(
        patientId
      ),
    enabled:
      !!patient,
  });

  const {
    data: lockedCategories = [],
    isError: consentFailed,
    isLoading:
      consentLoading
  } = useQuery({ 
    queryKey: [
      'consent',
      patientId
    ], 
    queryFn: () =>
      getConsentSettings(
        patientId
      ), 
    enabled:
      !!patient 
  });

  // ── Form Setup ──
  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors
    }
  } = useForm();

  // ── Mutations ──
  const updateMutation =
    useMutation({
      onSettled: () => { profileInFlight.current = false; },
      mutationFn:
        (data) =>
          updatePatientProfile(
            patientId,
            data
          ),

      onSuccess:
        (
          updatedPatient
        ) => {
          queryClient.setQueryData(
            [
              'patient',
              patientId
            ],
            updatedPatient
          );

          toast.success(
            'Profile updated successfully'
          );

          setIsEditing(
            false
          );
        },

      onError:
        () =>
          toast.error(
            'Failed to update profile.'
          ),
    });

  const uploadPhotoMutation =
    useMutation({
      mutationFn:
        (file) =>
          uploadPatientPhoto(
            patientId,
            file
          ),

      onSuccess:
        (
          updatedPatient
        ) => {
          queryClient.setQueryData(
            [
              'patient',
              patientId
            ],
            updatedPatient
          );

          toast.success(
            'Profile photo updated'
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to upload photo.'
          ),
    });

  const addAllergyMutation =
    useMutation({
      mutationFn:
        (data) =>
          addAllergy(
            patientId,
            data.allergen,
            data.severity,
            data.notes
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'allergies',
              patientId
            ]
          });

          toast.success(
            'Allergy added successfully'
          );

          setIsAddAllergyModalOpen(
            false
          );

          setAllergenInput('');
          setSelectedSeverity('mild');
          setAllergyNotes('');
        },

      onError:
        () =>
          toast.error(
            'Failed to add allergy.'
          ),
    });

  const deleteAllergyMutation =
    useMutation({
      mutationFn:
        (allergyId) =>
          deleteAllergy(
            patientId,
            allergyId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'allergies',
              patientId
            ]
          });

          toast.success(
            'Allergy removed successfully'
          );

          setIsDeleteModalOpen(
            false
          );

          setAllergyToDelete(
            null
          );
        },

      onError:
        () =>
          toast.error(
            'Failed to remove allergy.'
          ),
    });

  const addConditionMutation =
    useMutation({
      mutationFn:
        (data) =>
          addCondition(
            patientId,
            data.condition,
            data.diagnosedAt,
            data.notes,
            data.isPriority
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'conditions',
              patientId
            ]
          });

          toast.success(
            'Condition added successfully'
          );

          setIsAddConditionModalOpen(
            false
          );

          setConditionInput('');
          setDiagnosedAtInput('');
          setConditionNotes('');
          setIsPriorityInput(false);
        },

      onError:
        () =>
          toast.error(
            'Failed to add condition.'
          ),
    });

  const deleteConditionMutation =
    useMutation({
      mutationFn:
        (conditionId) =>
          deleteCondition(
            patientId,
            conditionId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'conditions',
              patientId
            ]
          });

          toast.success(
            'Condition removed successfully'
          );

          setIsDeleteConditionModalOpen(
            false
          );

          setConditionToDelete(
            null
          );
        },

      onError:
        () =>
          toast.error(
            'Failed to remove condition.'
          ),
    });

  const addMedicalDeviceMutation =
    useMutation({
      mutationFn:
        (deviceData) =>
          addMedicalDevice(
            patientId,
            deviceData
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'medical-devices',
              patientId
            ]
          });

          toast.success(
            'Medical device added successfully'
          );

          setIsAddDeviceModalOpen(
            false
          );

          setDeviceNameInput('');
          setDeviceTypeInput('');
          setImplantedAtInput('');
          setDeviceNotesInput('');
          setIsEmergencyRelevantInput(
            true
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to add medical device.'
          ),
    });

  const deleteMedicalDeviceMutation =
    useMutation({
      mutationFn:
        (deviceId) =>
          deleteMedicalDevice(
            patientId,
            deviceId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'medical-devices',
              patientId
            ]
          });

          toast.success(
            'Medical device removed successfully'
          );

          setIsDeleteDeviceModalOpen(
            false
          );

          setDeviceToDelete(
            null
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to remove medical device.'
          ),
    });

  const addHealthBackgroundMutation =
    useMutation({
      mutationFn:
        (backgroundData) =>
          addHealthBackground(
            patientId,
            backgroundData
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'health-background',
              patientId
            ]
          });

          toast.success(
            'Medical background added successfully'
          );

          setIsAddBackgroundModalOpen(
            false
          );

          setBackgroundTypeInput(
            'major_surgery'
          );
          setBackgroundTitleInput('');
          setBackgroundEventDateInput('');
          setBackgroundNotesInput('');
          setIsBackgroundEmergencyRelevantInput(
            false
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to add medical background.'
          ),
    });

  const deleteHealthBackgroundMutation =
    useMutation({
      mutationFn:
        (backgroundId) =>
          deleteHealthBackground(
            patientId,
            backgroundId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'health-background',
              patientId
            ]
          });

          toast.success(
            'Medical background removed successfully'
          );

          setIsDeleteBackgroundModalOpen(
            false
          );

          setBackgroundToDelete(
            null
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to remove medical background.'
          ),
    });


  const addFamilyHistoryMutation =
    useMutation({
      mutationFn:
        (familyHistoryData) =>
          addFamilyHistory(
            patientId,
            familyHistoryData
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'family-history',
              patientId
            ]
          });

          toast.success(
            'Family medical history added successfully'
          );

          setIsAddFamilyHistoryModalOpen(
            false
          );

          setFamilyRelationInput(
            'mother'
          );
          setFamilyConditionInput('');
          setFamilyHistoryNotesInput('');
          setIsFamilyHistoryEmergencyRelevantInput(
            false
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to add family medical history.'
          ),
    });

  const deleteFamilyHistoryMutation =
    useMutation({
      mutationFn:
        (familyHistoryId) =>
          deleteFamilyHistory(
            patientId,
            familyHistoryId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'family-history',
              patientId
            ]
          });

          toast.success(
            'Family medical history removed successfully'
          );

          setIsDeleteFamilyHistoryModalOpen(
            false
          );

          setFamilyHistoryToDelete(
            null
          );
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to remove family medical history.'
          ),
    });

  const addBulkVaccinationMutation =
    useMutation({
      mutationFn:
        (data) =>
          addBulkVaccinations(
            patientId,
            data.vaccinations
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'vaccinations',
              patientId
            ]
          });

          toast.success(
            'Vaccinations saved successfully'
          );

          setIsAddVaccinationModalOpen(
            false
          );

          setBulkVaccines([
            {
              id: 'initial-row',
              vaccineName: '',
              dateAdministered: '',
              doseNumber: '',
              notes: ''
            }
          ]);
        },

      onError:
        () =>
          toast.error(
            'Failed to add vaccinations.'
          ),
    });

  const deleteVaccinationMutation =
    useMutation({
      mutationFn:
        (
          vaccinationId
        ) =>
          deleteVaccination(
            patientId,
            vaccinationId
          ),

      onSuccess:
        () => {
          queryClient.invalidateQueries({
            queryKey: [
              'vaccinations',
              patientId
            ]
          });

          toast.success(
            'Vaccination removed successfully'
          );

          setIsDeleteVaccinationModalOpen(
            false
          );

          setVaccinationToDelete(
            null
          );
        },

      onError:
        () =>
          toast.error(
            'Failed to remove vaccination.'
          ),
    });

  const scanVaccinationMutation =
    useMutation({
      mutationFn:
        (file) =>
          scanVaccinationCard(
            patientId,
            file
          ),

      onSuccess:
        (data) => {
          toast.success(
            'Card scanned successfully! Please verify details.'
          );

          const extractedArray =
            Array.isArray(data)
              ? data
              : [data];

          const newBulkRows =
            extractedArray.map(
              (
                item,
                index
              ) => ({
                id:
                  Date.now() +
                  index,
                vaccineName:
                  item.vaccineName ||
                  '',
                dateAdministered:
                  item.dateAdministered ||
                  '',
                doseNumber:
                  item.doseNumber ||
                  '',
                notes: ''
              })
            );

          if (
            newBulkRows.length >
            0
          ) {
            setBulkVaccines(
              newBulkRows
            );
          }
        },

      onError:
        (err) =>
          toast.error(
            err?.response?.data?.message ||
            'Failed to scan card.'
          )
    });

  // Privacy changes save separately from the profile form; failed writes keep the last confirmed list.
  const consentMutation =
    useMutation({
      mutationFn:
        (
          newCategories
        ) =>
          updateConsentSettings(
            patientId,
            newCategories
          ),

      onSettled: () => { consentInFlight.current = false; },
      onSuccess:
        (settings) => {
          queryClient.setQueryData(['consent', patientId], settings.locked_categories);
          queryClient.invalidateQueries({
            queryKey: [
              'consent',
              patientId
            ]
          });

          toast.success(
            'Privacy settings updated'
          );
        },

      onError:
        () =>
          toast.error(
            'Failed to update privacy settings.'
          ),
    });

  // ── Handlers ──
  /** Compute the complete next lock list for one category and submit once. Confirmed query state changes only after success; read failures and overlapping saves deny changes.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const handleToggleConsent = (
    category
  ) => {
    if (!isEditing || consentInFlight.current || consentLoading || consentFailed) return;
    consentInFlight.current = true;
    const isLocked =
      lockedCategories.includes(
        category
      );

    let newCategories;

    if (isLocked) {
      newCategories =
        lockedCategories.filter(
          c =>
            c !== category
        );

    } else {
      newCategories = [
        ...lockedCategories,
        category
      ];
    }

    consentMutation.mutate(
      newCategories
    );
  };

  /** Populate the editable name/blood/contact fields from the last confirmed profile and enter Edit Mode. Cancelling profile edits does not reverse separately saved privacy settings.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const handleEditClick = () => {
    reset({
      full_name:
        patient?.full_name ||
        '',
      blood_group:
        patient?.blood_group ||
        '',
      emergency_contact_name:
        patient?.emergency_contact_name ||
        '',
      emergency_contact_phone:
        patient?.emergency_contact_phone ||
        '',
      emergency_contact_relationship:
        patient?.emergency_contact_relationship ||
        '',
    });

    setIsEditing(
      true
    );
  };

  const handlePhotoButtonClick =
    () =>
      photoInputRef.current?.click();

  const handlePhotoFileChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    if (
      !ALLOWED_PHOTO_TYPES.includes(
        file.type
      )
    ) {
      return toast.error(
        'Please select a JPEG, PNG, or WEBP image.'
      );
    }

    if (
      file.size >
      MAX_PHOTO_SIZE_BYTES
    ) {
      return toast.error(
        'Image must be 2MB or smaller.'
      );
    }

    uploadPhotoMutation.mutate(
      file
    );
  };

  const handleScanVaccineClick =
    () =>
      scanVaccineInputRef.current?.click();

  const handleScanVaccineChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    if (
      !ALLOWED_PHOTO_TYPES.includes(
        file.type
      )
    ) {
      return toast.error(
        'Please select a valid image file (JPEG, PNG, WEBP).'
      );
    }

    scanVaccinationMutation.mutate(
      file
    );
  };

  const submitAddAllergy = (
    e
  ) => {
    e.preventDefault();

    if (
      !allergenInput.trim()
    ) {
      return toast.error(
        'Please enter or select an allergen.'
      );
    }

    addAllergyMutation.mutate({
      allergen:
        allergenInput.trim(),
      severity:
        selectedSeverity,
      notes:
        allergyNotes.trim()
    });
  };

  const submitAddCondition = (
    e
  ) => {
    e.preventDefault();

    if (
      !conditionInput.trim()
    ) {
      return toast.error(
        'Please enter a condition name.'
      );
    }

    addConditionMutation.mutate({
      condition:
        conditionInput.trim(),
      diagnosedAt:
        diagnosedAtInput,
      notes:
        conditionNotes.trim(),
      isPriority:
        isPriorityInput
    });
  };

  const submitAddMedicalDevice = (
    e
  ) => {
    e.preventDefault();

    if (
      !deviceNameInput.trim()
    ) {
      return toast.error(
        'Please enter the medical device or implant name.'
      );
    }

    addMedicalDeviceMutation.mutate({
      deviceName:
        deviceNameInput.trim(),
      deviceType:
        deviceTypeInput.trim(),
      implantedAt:
        implantedAtInput,
      notes:
        deviceNotesInput.trim(),
      isEmergencyRelevant:
        isEmergencyRelevantInput
    });
  };

  const submitAddHealthBackground = (
    e
  ) => {
    e.preventDefault();

    if (
      !backgroundTitleInput.trim()
    ) {
      return toast.error(
        'Please enter a title for this medical background record.'
      );
    }

    addHealthBackgroundMutation.mutate({
      backgroundType:
        backgroundTypeInput,
      title:
        backgroundTitleInput.trim(),
      eventDate:
        backgroundEventDateInput,
      notes:
        backgroundNotesInput.trim(),
      isEmergencyRelevant:
        isBackgroundEmergencyRelevantInput
    });
  };


  const submitAddFamilyHistory = (
    e
  ) => {
    e.preventDefault();

    if (
      !familyConditionInput.trim()
    ) {
      return toast.error(
        'Please enter the family medical condition.'
      );
    }

    addFamilyHistoryMutation.mutate({
      relation:
        familyRelationInput,
      condition:
        familyConditionInput.trim(),
      notes:
        familyHistoryNotesInput.trim(),
      isEmergencyRelevant:
        isFamilyHistoryEmergencyRelevantInput
    });
  };

  const submitBulkVaccination = (
    e
  ) => {
    if (
      e &&
      e.preventDefault
    ) {
      e.preventDefault();
    }

    const validVaccines =
      bulkVaccines.filter(
        v =>
          v.vaccineName.trim() !==
            '' ||
          v.dateAdministered.trim() !==
            ''
      );

    if (
      validVaccines.length ===
      0
    ) {
      return toast.error(
        'Please complete at least one vaccination record.'
      );
    }

    const hasMissingFields =
      validVaccines.some(
        v =>
          v.vaccineName.trim() ===
            '' ||
          v.dateAdministered.trim() ===
            ''
      );

    if (hasMissingFields) {
      return toast.error(
        'Please ensure both Vaccine Name and Date are filled for all active rows.'
      );
    }

    addBulkVaccinationMutation.mutate({
      vaccinations:
        validVaccines
    });
  };

  const promptDeleteAllergy = (
    allergy
  ) => {
    setAllergyToDelete(
      allergy
    );

    setIsDeleteModalOpen(
      true
    );
  };

  const promptDeleteCondition = (
    condition
  ) => {
    setConditionToDelete(
      condition
    );

    setIsDeleteConditionModalOpen(
      true
    );
  };

  const promptDeleteMedicalDevice = (
    device
  ) => {
    setDeviceToDelete(
      device
    );

    setIsDeleteDeviceModalOpen(
      true
    );
  };

  const promptDeleteHealthBackground = (
    background
  ) => {
    setBackgroundToDelete(
      background
    );

    setIsDeleteBackgroundModalOpen(
      true
    );
  };


  const promptDeleteFamilyHistory = (
    familyHistoryRecord
  ) => {
    setFamilyHistoryToDelete(
      familyHistoryRecord
    );

    setIsDeleteFamilyHistoryModalOpen(
      true
    );
  };

  const promptDeleteVaccination = (
    vaccination
  ) => {
    setVaccinationToDelete(
      vaccination
    );

    setIsDeleteVaccinationModalOpen(
      true
    );
  };

  const confirmDeleteAllergy =
    () => {
      if (
        allergyToDelete
      ) {
        deleteAllergyMutation.mutate(
          allergyToDelete.id
        );
      }
    };

  // Sort allergies so severe ones appear at the top
  const sortedAllergies = [
    ...allergies
  ].sort(
    (
      a,
      b
    ) => {
      if (
        a.severity?.toLowerCase() ===
          'severe' &&
        b.severity?.toLowerCase() !==
          'severe'
      ) {
        return -1;
      }

      if (
        a.severity?.toLowerCase() !==
          'severe' &&
        b.severity?.toLowerCase() ===
          'severe'
      ) {
        return 1;
      }

      return 0;
    }
  );

  // ── Render States ──
if (
  patientIdLoading ||
  isLoading
) {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

      <Spinner
        size="lg"
      />

      <p className="text-sm text-muted-foreground">
        Loading your health profile...
      </p>

    </div>
  );
}

if (isError) {
  return (
    <div className="min-h-[55vh] flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <Alert
          type="error"
          message={
            error?.message ||
            'Failed to load profile.'
          }
        />

      </div>

    </div>
  );
}

  return (
    <div className="space-y-7 pb-10">

      <BannerAnimationStyles />

      {/* =====================================================
          PREMIUM PROFILE HERO
      ====================================================== */}
      <section
        className="
          relative
          overflow-hidden
          rounded-[2rem]
          border
          border-primary/15
          bg-gradient-to-br
          from-[#084F49]
          via-[#0B6F68]
          to-[#19B8A9]
          shadow-[0_16px_44px_rgba(15,92,83,0.18)]
        "
      >

        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-24 -top-28 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -left-10 -top-14 w-36 h-36 rounded-full border border-white/10 bg-white/5" />
          <div className="absolute right-[31%] -bottom-20 w-44 h-44 rounded-full border border-white/10 bg-white/5" />
          <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(32deg,transparent_32%,white_33%,white_35%,transparent_36%,transparent_64%,white_65%,white_67%,transparent_68%)] bg-[length:180px_110px]" />
        </div>

        <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-9 lg:py-9">

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-7 lg:gap-10 lg:items-center">

            {/* Patient identity */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 min-w-0">

              {/* Large profile photo */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 self-center sm:self-auto">

                <div className="cu-glow-ring absolute inset-0" />

                <div className="relative w-full h-full rounded-full bg-white p-1.5 shadow-[0_18px_42px_rgba(2,44,40,0.28)]">
                  <img
                    src={getAvatarSrc(patient)}
                    alt="Profile"
                    className="cu-avatar-pop w-full h-full rounded-full object-cover bg-[#0B5F58]"
                  />
                </div>

                {uploadPhotoMutation.isPending && (
                  <div className="absolute inset-1.5 rounded-full bg-black/45 flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={handlePhotoButtonClick}
                    disabled={uploadPhotoMutation.isPending}
                    title="Change profile photo"
                    className="
                      absolute
                      bottom-1 right-1
                      w-10 h-10
                      rounded-full
                      border-[3px]
                      border-white
                      bg-[#12344D]
                      text-white
                      shadow-lg
                      flex items-center justify-center
                      hover:bg-[#173F5C]
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    <Camera size={17} />
                  </button>
                )}

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

              </div>

              <div className="min-w-0 text-center sm:text-left">

                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <User size={13} className="text-white/85" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/90">
                    Care4U Patient
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black tracking-tight text-white mt-3">
                  {patient?.full_name || 'Patient'}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3 text-xs sm:text-sm text-white/80">
                  <span>{formatAge(patient?.date_of_birth)}</span>
                  <span className="w-1 h-1 rounded-full bg-white/35" />
                  <span>{capitalise(patient?.gender)}</span>

                  {patient?.blood_group && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/35" />
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF5350] text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                        <Droplets size={12} />
                        {patient.blood_group}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-white/75 mt-3 max-w-xl leading-relaxed mx-auto sm:mx-0">
                  Keep your identity, emergency contact details, clinical safety information, vaccination history, and privacy preferences current in one place.
                </p>

                <div className="mt-4 flex justify-center sm:justify-start">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border border-white/25
                        bg-white/12
                        text-white
                        px-4 py-2.5
                        text-sm
                        font-bold
                        backdrop-blur-sm
                        hover:bg-white/18
                        hover:border-white/35
                        transition-all
                      "
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/12 text-white px-4 py-2.5 text-sm font-bold backdrop-blur-sm">
                      <Edit2 size={16} />
                      Edit Mode Active
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Care4U QR — web keeps QR identity in the profile header */}
            <div className="w-full lg:w-[286px]">
              {patient?.qr_code_id ? (
                <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-[0_16px_34px_rgba(2,44,40,0.18)]">

                  <div className="flex items-center gap-4">

                    <div className="rounded-xl border border-slate-100 bg-white p-2 shrink-0">
                      <QRCodeSVG
                        value={patient.qr_code_id}
                        size={92}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#0F172A"
                        className="w-[76px] h-[76px] sm:w-[92px] sm:h-[92px]"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">
                        My Care4U QR
                      </p>

                      <p className="text-sm font-extrabold text-[#12344D] mt-1">
                        Patient Identity
                      </p>

                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Show this QR to your doctor or pharmacist.
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-5 text-center backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/80">
                    QR unavailable
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          HEALTH AWARENESS
      ====================================================== */}
      {!isEditing && (
        <HealthAwarenessFeed
          patientAllergies={allergies}
        />
      )}

      {/* =====================================================
          HEALTH SNAPSHOT
      ====================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryTile
          label="Blood Group"
          value={patient?.blood_group || '—'}
          helper="Emergency identity"
          icon={Droplets}
          iconClass="text-destructive"
          iconBgClass="bg-destructive/10"
        />

        <SummaryTile
          label="Allergies"
          value={allergies.length}
          helper={allergies.length === 1 ? 'Known allergy' : 'Known allergies'}
          icon={AlertTriangle}
          iconClass="text-urgent-foreground"
          iconBgClass="bg-urgent/10"
        />

        <SummaryTile
          label="Conditions"
          value={conditions.length}
          helper={conditions.some(item => item.is_priority) ? 'Priority condition on file' : 'Active conditions'}
          icon={HeartPulse}
          iconClass="text-primary"
          iconBgClass="bg-module-soft"
        />

        <SummaryTile
          label="Vaccinations"
          value={vaccinations.length}
          helper="Recorded doses"
          icon={Syringe}
          iconClass="text-success"
          iconBgClass="bg-success/10"
        />
      </section>

      {/* =====================================================
          GLOBAL PROFILE FORM
      ====================================================== */}
      <form
        onSubmit={event => handleSubmit(
          data => { if (!profileInFlight.current) { profileInFlight.current = true; updateMutation.mutate(data); } }
        )(event)}
        className="space-y-6"
      >

        {/* ===================================================
            PERSONAL + EMERGENCY
        ==================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <SectionPanel
            title="Personal Information"
            description="Your core identity and demographic information. Protected identity fields stay read-only."
          >

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfileField icon={User} label="Full Name" value={patient?.full_name} />
                <ProfileField icon={Droplets} label="Blood Group" value={patient?.blood_group} />
                <ProfileField icon={Calendar} label="Date of Birth" value={formatDate(patient?.date_of_birth)} />
                <ProfileField icon={User} label="Gender" value={capitalise(patient?.gender)} />
                <ProfileField icon={User} label="NIC" value={patient?.nic} />
              </div>
            ) : (
              <div className="space-y-4">

                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  error={errors.full_name?.message}
                  {...register(
                    'full_name',
                    {
                      required: 'Full name is required'
                    }
                  )}
                />

                <div className="flex flex-col gap-1">
                  <label htmlFor="profile-blood-group" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Blood Group <span className="text-destructive">*</span>
                  </label>

                  <select id="profile-blood-group" aria-invalid={!!errors.blood_group} aria-describedby={errors.blood_group ? "profile-blood-group-error" : undefined}
                    className="w-full min-h-11 px-3 py-2.5 text-sm text-foreground bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register(
                      'blood_group',
                      {
                        required: 'Required'
                      }
                    )}
                  >
                    <option value="">Select blood group</option>
                    {[
                      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
                    ].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  {errors.blood_group && <p id="profile-blood-group-error" role="alert" className="text-sm text-destructive">Choose a blood group.</p>}
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  <Shield size={15} className="shrink-0 mt-0.5" />
                  <span>Date of birth, gender, and NIC are protected identity fields and are not editable here.</span>
                </div>

              </div>
            )}

          </SectionPanel>

          <SectionPanel
            title="Emergency Contact"
            description="The person Care4U can contact when urgent support is needed."
          >

            {!isEditing ? (
              <div className="space-y-3">
                <ProfileField icon={User} label="Contact Name" value={patient?.emergency_contact_name} />
                <ProfileField icon={Phone} label="Contact Phone" value={patient?.emergency_contact_phone} />
                <ProfileField icon={Users} label="Relationship" value={capitalise(patient?.emergency_contact_relationship)} />
              </div>
            ) : (
              <div className="space-y-4">

                <Input
                  label="Contact Name"
                  placeholder="Enter contact name"
                  {...register('emergency_contact_name')}
                />

                <Input
                  label="Contact Phone"
                  placeholder="Enter contact phone"
                  error={errors.emergency_contact_phone?.message}
                  {...register(
                    'emergency_contact_phone',
                    {
                      pattern: {
                        value: /^[0-9+\s\-()]{7,15}$/,
                        message: 'Invalid phone number'
                      }
                    }
                  )}
                />

                <div className="flex flex-col gap-1">
                  <label htmlFor="profile-relationship" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Relationship
                  </label>

                  <select id="profile-relationship"
                    className="w-full min-h-11 px-3 py-2.5 text-sm text-foreground bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('emergency_contact_relationship')}
                  >
                    <option value="">Select relationship</option>
                    {[
                      'parent', 'sibling', 'spouse', 'child', 'friend', 'other'
                    ].map(relation => (
                      <option key={relation} value={relation}>
                        {capitalise(relation)}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            )}

          </SectionPanel>

        </div>

        {/* ===================================================
            CONDITIONS + ALLERGIES
        ==================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <SectionPanel
            title="Chronic Conditions"
            description="Long-term health conditions relevant to ongoing treatment and safety."
            editing={isEditing}
            actionLabel="Add"
            onAction={() => setIsAddConditionModalOpen(true)}
          >

            {conditionsLoading ? (
              <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
            ) : conditions.length === 0 ? (
              <div className="rounded-xl bg-card border border-border/60 p-6 text-center">
                <HeartPulse size={24} className="mx-auto text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground mt-3">No chronic conditions recorded</p>
                <p className="text-xs text-muted-foreground mt-1">Conditions you add will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map(condition => (
                  <div
                    key={condition.id}
                    className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${condition.is_priority ? 'border-destructive/20 bg-destructive/5' : 'border-border/60 bg-card'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{condition.condition}</p>
                        {condition.is_priority && <SeverityBadge severity="priority" />}
                      </div>

                      {condition.diagnosed_at && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Diagnosed {formatDate(condition.diagnosed_at)}
                        </p>
                      )}

                      {condition.notes && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{condition.notes}</p>
                      )}
                    </div>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => promptDeleteCondition(condition)}
                        className="p-2 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove condition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

          </SectionPanel>

          <SectionPanel
            title="Known Allergies"
            description="Important allergy information used during medication and treatment decisions."
            editing={isEditing}
            actionLabel="Add"
            onAction={() => {
              setAllergySuggestions(searchAllergens(''));
              setIsAddAllergyModalOpen(true);
            }}
          >

            {allergiesLoading ? (
              <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
            ) : allergies.length === 0 ? (
              <div className="rounded-xl bg-card border border-border/60 p-6 text-center">
                <Shield size={24} className="mx-auto text-success" />
                <p className="text-sm font-semibold text-foreground mt-3">No allergies recorded</p>
                <p className="text-xs text-muted-foreground mt-1">Your active allergy list will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedAllergies.map(allergy => (
                  <div
                    key={allergy.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{allergy.allergen}</p>
                        <SeverityBadge severity={allergy.severity} />
                      </div>

                      {allergy.notes && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{allergy.notes}</p>
                      )}
                    </div>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => promptDeleteAllergy(allergy)}
                        className="p-2 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove allergy"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

          </SectionPanel>

        </div>

        {/* ===================================================
            MEDICAL DEVICES
        ==================================================== */}
        <SectionPanel
          title="Medical Devices & Implants"
          description="Implants and medical equipment that may affect routine or emergency care."
          editing={isEditing}
          actionLabel="Add Device"
          onAction={() => {
            setDeviceNameInput('');
            setDeviceTypeInput('');
            setImplantedAtInput('');
            setDeviceNotesInput('');
            setIsEmergencyRelevantInput(true);
            setIsAddDeviceModalOpen(true);
          }}
        >

          <div className="flex items-start gap-3 rounded-xl bg-module-soft/60 p-4 mb-4">
            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Emergency readiness information</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Devices marked as emergency relevant may appear during authorized and audited Break-Glass access.
              </p>
            </div>
          </div>

          {medicalDevicesLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
          ) : medicalDevices.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-7 text-center">
              <HeartPulse size={26} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground mt-3">No medical devices or implants recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Examples include pacemakers, insulin pumps, ICDs, cochlear implants, and dialysis access.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalDevices.map(device => (
                <div key={device.id} className="relative rounded-xl border border-border/60 bg-card p-4">
                  <div className="pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{device.device_name}</p>
                      {device.is_emergency_relevant && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                          <Shield size={10} /> Emergency
                        </span>
                      )}
                    </div>

                    {device.device_type && (
                      <p className="text-xs font-semibold text-primary mt-1.5">{device.device_type}</p>
                    )}

                    {device.implanted_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Implanted / Started <span className="font-medium text-foreground">{formatDate(device.implanted_at)}</span>
                      </p>
                    )}

                    {device.notes && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{device.notes}</p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => promptDeleteMedicalDevice(device)}
                      className="absolute right-3 top-3 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove medical device"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </SectionPanel>

        {/* ===================================================
            IMPORTANT MEDICAL BACKGROUND
        ==================================================== */}
        <SectionPanel
          title="Important Medical Background"
          description="Major surgeries, procedures, transplants, hospitalizations, and serious past health events that remain clinically relevant."
          editing={isEditing}
          actionLabel="Add Record"
          onAction={() => {
            setBackgroundTypeInput('major_surgery');
            setBackgroundTitleInput('');
            setBackgroundEventDateInput('');
            setBackgroundNotesInput('');
            setIsBackgroundEmergencyRelevantInput(false);
            setIsAddBackgroundModalOpen(true);
          }}
        >

          {healthBackgroundLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
          ) : healthBackground.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-7 text-center">
              <History size={26} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground mt-3">No important medical background recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Major past health events you add will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthBackground.map(background => (
                <div key={background.id} className="relative rounded-xl border border-border/60 bg-card p-4">
                  <div className="pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{background.title}</p>
                      {background.is_emergency_relevant && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                          <Shield size={10} /> Emergency
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-primary mt-1.5">
                      {getHealthBackgroundTypeLabel(background.background_type)}
                    </p>

                    {background.event_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Event Date <span className="font-medium text-foreground">{formatDate(background.event_date)}</span>
                      </p>
                    )}

                    {background.notes && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{background.notes}</p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => promptDeleteHealthBackground(background)}
                      className="absolute right-3 top-3 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove medical background"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </SectionPanel>

        {/* ===================================================
            FAMILY HISTORY
        ==================================================== */}
        <SectionPanel
          title="Family Medical History"
          description="Clinically relevant conditions in close family members that may help doctors understand familial health risks."
          editing={isEditing}
          actionLabel="Add History"
          onAction={() => {
            setFamilyRelationInput('mother');
            setFamilyConditionInput('');
            setFamilyHistoryNotesInput('');
            setIsFamilyHistoryEmergencyRelevantInput(false);
            setIsAddFamilyHistoryModalOpen(true);
          }}
        >

          {familyHistoryLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
          ) : familyHistory.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-7 text-center">
              <Users size={26} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground mt-3">No family medical history recorded</p>
              <p className="text-xs text-muted-foreground mt-1">You do not need to enter relatives&apos; names.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyHistory.map(history => (
                <div key={history.id} className="relative rounded-xl border border-border/60 bg-card p-4">
                  <div className="pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{history.condition}</p>
                      {history.is_emergency_relevant && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                          <Shield size={10} /> Emergency
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-primary mt-1.5">
                      {getFamilyRelationLabel(history.relation)}
                    </p>

                    {history.notes && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{history.notes}</p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => promptDeleteFamilyHistory(history)}
                      className="absolute right-3 top-3 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove family medical history"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </SectionPanel>

        {/* ===================================================
            VACCINATIONS
        ==================================================== */}
        <SectionPanel
          title="Vaccination Records"
          description="Your recorded immunisation history, including manually entered and AI-assisted card records."
          editing={isEditing}
          actionLabel="Add Vaccination"
          onAction={() => {
            setBulkVaccines([
              {
                id: 'initial-row',
                vaccineName: '',
                dateAdministered: '',
                doseNumber: '',
                notes: ''
              }
            ]);
            setIsAddVaccinationModalOpen(true);
          }}
        >

          {vaccinationsLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
          ) : vaccinations.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-7 text-center">
              <Syringe size={26} className="mx-auto text-muted-foreground" />
              <p className="text-sm font-bold text-foreground mt-3">No vaccination records found</p>
              <p className="text-xs text-muted-foreground mt-1">Vaccination history you add will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vaccinations.map(vaccine => (
                <div key={vaccine.id} className="relative rounded-xl border border-border/60 bg-card p-4">
                  <div className="pr-9">
                    <p className="text-sm font-bold text-foreground">{vaccine.vaccine_name}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Given <span className="font-medium text-foreground">{formatDate(vaccine.date_administered)}</span>
                    </p>

                    {vaccine.dose_number && (
                      <p className="text-xs text-muted-foreground mt-1">Dose: {vaccine.dose_number}</p>
                    )}

                    {vaccine.notes && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{vaccine.notes}</p>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => promptDeleteVaccination(vaccine)}
                      className="absolute right-3 top-3 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove vaccination"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </SectionPanel>

        {/* ===================================================
            PRIVACY & CONSENT
        ==================================================== */}
        <SectionPanel
          title="Privacy & Consent"
          description="Choose category locks for the record text filter. An assigned doctor needs a patient code to unlock matching records for 15 minutes. Matching is not automatic clinical classification."
        >

          {!isEditing && (
            <div className="flex items-start gap-2 rounded-xl bg-secondary/70 px-4 py-3 mb-4">
              <Lock size={15} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter Edit Mode to change privacy locks. Each switch saves separately; cancelling profile edits does not undo saved privacy changes.
              </p>
            </div>
          )}

          {consentFailed ? <Alert type="error" message="Privacy settings could not be loaded. Reload before changing locks." /> : consentLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="sm" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SENSITIVE_CATEGORIES.map(category => {
                const isLocked = lockedCategories.includes(category);

                return (
                  <div
                    key={category}
                    className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${isLocked ? 'border-destructive/20 bg-destructive/5' : 'border-border/60 bg-card'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLocked ? 'bg-destructive/10 text-destructive' : 'bg-module-soft text-primary'}`}>
                        {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{category}</p>
                        <p className={`text-xs mt-1 font-medium ${isLocked ? 'text-destructive' : 'text-primary'}`}>
                          {isLocked ? 'Matching records need a consent code' : 'No category lock selected'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleConsent(category)}
                      disabled={consentMutation.isPending || !isEditing || consentFailed}
                      role="switch" aria-checked={isLocked}
                      aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${category}`}
                      className={`relative inline-flex h-11 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${!isEditing ? 'opacity-45 cursor-not-allowed' : 'hover:opacity-90'} ${isLocked ? 'bg-destructive' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${isLocked ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </SectionPanel>

        {/* ===================================================
            GLOBAL EDIT ACTIONS
        ==================================================== */}
        {isEditing && (
          <div className="sticky bottom-4 z-30 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-[0_16px_48px_rgba(15,23,42,0.16)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield size={15} className="shrink-0 mt-0.5" />
                <span>Save changes to your editable profile fields before leaving Edit Mode.</span>
              </div>

              <div className="flex gap-2 sm:shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  <X size={15} />
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={updateMutation.isPending}
                >
                  <Save size={15} />
                  Save Changes
                </Button>
              </div>

            </div>
          </div>
        )}

      </form>

      <div className="flex items-center justify-center gap-2 px-4 text-xs text-muted-foreground">
        <Shield size={15} />
        <span>Your profile and clinical safety information are protected by Care4U access controls. Category locks use record text matching; they may not identify every sensitive record.</span>
      </div>

      {/* ── Add Allergy Modal ── */}
      {isAddAllergyModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddAllergyModalOpen
          }
          onClose={() =>
            setIsAddAllergyModalOpen(
              false
            )
          }
          title="Add New Allergy"
        >

          <form
            onSubmit={
              submitAddAllergy
            }
            className="space-y-5 p-1"
          >

            <div
              className="flex flex-col gap-1 relative"
              ref={
                allergyDropdownRef
              }
            >

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Allergen Name{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                placeholder="Start typing to search..."
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  allergenInput
                }
                onChange={
                  handleAllergenInputChange
                }
                onFocus={() => {
                  setAllergySuggestions(
                    searchAllergens(
                      allergenInput
                    )
                  );

                  setShowAllergySuggestions(
                    true
                  );
                }}
                autoComplete="off"
              />

              {showAllergySuggestions &&
                allergySuggestions.length >
                  0 && (

                <div className="absolute top-15 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">

                  {allergySuggestions.map(
                    (
                      sugg,
                      index
                    ) => (

                      <div
                        key={
                          index
                        }
                        onClick={() =>
                          handleSelectAllergySuggestion(
                            sugg
                          )
                        }
                        className="px-4 py-2.5 hover:bg-secondary cursor-pointer flex justify-between items-center border-b border-border last:border-0"
                      >

                        <span className="text-sm font-medium text-foreground">
                          {
                            sugg.name
                          }
                        </span>

                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {
                            sugg.category
                          }
                        </span>

                      </div>

                    )
                  )}

                </div>
              )}

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Severity{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <select
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  selectedSeverity
                }
                onChange={
                  (
                    e
                  ) =>
                    setSelectedSeverity(
                      e.target.value
                    )
                }
              >
                <option value="mild">
                  Mild
                </option>

                <option value="moderate">
                  Moderate
                </option>

                <option value="severe">
                  Severe
                </option>
              </select>

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes (Optional)
              </label>

              <textarea
                placeholder="E.g. Triggers mild rhinitis"
                rows={2}
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={
                  allergyNotes
                }
                onChange={
                  (
                    e
                  ) =>
                    setAllergyNotes(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddAllergyModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  addAllergyMutation.isPending
                }
              >
                Save Allergy
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ── Add Condition Modal ── */}
      {isAddConditionModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddConditionModalOpen
          }
          onClose={() =>
            setIsAddConditionModalOpen(
              false
            )
          }
          title="Add Chronic Condition"
        >

          <form
            onSubmit={
              submitAddCondition
            }
            className="space-y-5 p-1"
          >

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Condition Name{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                placeholder="E.g. Type 2 Diabetes"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  conditionInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setConditionInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Diagnosed Date (Optional)
              </label>

              <input
                type="date"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  diagnosedAtInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setDiagnosedAtInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes (Optional)
              </label>

              <textarea
                placeholder="E.g. Managed with Metformin"
                rows={2}
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={
                  conditionNotes
                }
                onChange={
                  (
                    e
                  ) =>
                    setConditionNotes(
                      e.target.value
                    )
                }
              />

            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-destructive/5 border border-destructive/20 rounded-lg">

              <input
                type="checkbox"
                className="w-4 h-4 text-destructive rounded border-border focus:ring-destructive"
                checked={
                  isPriorityInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setIsPriorityInput(
                      e.target.checked
                    )
                }
              />

              <div>

                <span className="text-sm font-semibold text-destructive block">
                  Mark as Priority/Severe
                </span>

                <span className="text-xs text-destructive/80 block">
                  Alerts doctors immediately when they scan your profile.
                </span>

              </div>

            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddConditionModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  addConditionMutation.isPending
                }
              >
                Save Condition
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ── Add Medical Device Modal ── */}
      {isAddDeviceModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddDeviceModalOpen
          }
          onClose={() =>
            setIsAddDeviceModalOpen(
              false
            )
          }
          title="Add Medical Device or Implant"
        >

          <form
            onSubmit={
              submitAddMedicalDevice
            }
            className="space-y-5 p-1"
          >

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Device / Implant Name{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                maxLength={150}
                placeholder="E.g. Pacemaker"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  deviceNameInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setDeviceNameInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Device Type (Optional)
              </label>

              <input
                type="text"
                maxLength={100}
                placeholder="E.g. Cardiac Device"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  deviceTypeInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setDeviceTypeInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Implanted / Started Date (Optional)
              </label>

              <input
                type="date"
                max={
                  new Date()
                    .toISOString()
                    .split('T')[0]
                }
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  implantedAtInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setImplantedAtInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes (Optional)
              </label>

              <textarea
                placeholder="E.g. Permanent implanted cardiac pacemaker"
                rows={3}
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={
                  deviceNotesInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setDeviceNotesInput(
                      e.target.value
                    )
                }
              />

            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 bg-destructive/5 border border-destructive/20 rounded-xl">

              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-destructive rounded border-border focus:ring-destructive"
                checked={
                  isEmergencyRelevantInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setIsEmergencyRelevantInput(
                      e.target.checked
                    )
                }
              />

              <div>

                <span className="text-sm font-semibold text-foreground block">
                  Emergency Relevant
                </span>

                <span className="text-xs text-muted-foreground block mt-1 leading-relaxed">
                  Allow this device to appear in the minimal
                  Break-Glass emergency snapshot for authorized
                  hospital staff.
                </span>

              </div>

            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddDeviceModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  addMedicalDeviceMutation.isPending
                }
              >
                Save Medical Device
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ── Add Important Medical Background Modal ── */}
      {isAddBackgroundModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddBackgroundModalOpen
          }
          onClose={() =>
            setIsAddBackgroundModalOpen(
              false
            )
          }
          title="Add Important Medical Background"
        >

          <form
            onSubmit={
              submitAddHealthBackground
            }
            className="space-y-5 p-1"
          >

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Background Type{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <select
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  backgroundTypeInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setBackgroundTypeInput(
                      e.target.value
                    )
                }
              >
                {HEALTH_BACKGROUND_TYPES.map(
                  (
                    type
                  ) => (
                    <option
                      key={
                        type.value
                      }
                      value={
                        type.value
                      }
                    >
                      {
                        type.label
                      }
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Title{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                maxLength={200}
                placeholder="E.g. Coronary Artery Bypass Surgery"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  backgroundTitleInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setBackgroundTitleInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Event Date (Optional)
              </label>

              <input
                type="date"
                max={
                  new Date()
                    .toISOString()
                    .split('T')[0]
                }
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  backgroundEventDateInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setBackgroundEventDateInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes (Optional)
              </label>

              <textarea
                placeholder="Add only useful details about this past health event"
                rows={3}
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={
                  backgroundNotesInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setBackgroundNotesInput(
                      e.target.value
                    )
                }
              />

            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 bg-destructive/5 border border-destructive/20 rounded-xl">

              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-destructive rounded border-border focus:ring-destructive"
                checked={
                  isBackgroundEmergencyRelevantInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setIsBackgroundEmergencyRelevantInput(
                      e.target.checked
                    )
                }
              />

              <div>

                <span className="text-sm font-semibold text-foreground block">
                  Emergency Relevant
                </span>

                <span className="text-xs text-muted-foreground block mt-1 leading-relaxed">
                  Mark this only when the past event is important
                  for authorized hospital staff to know during
                  audited Break-Glass emergency access.
                </span>

              </div>

            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddBackgroundModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  addHealthBackgroundMutation.isPending
                }
              >
                Save Medical Background
              </Button>

            </div>

          </form>

        </Modal>
      )}


      {/* ── Add Family Medical History Modal ── */}
      {isAddFamilyHistoryModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddFamilyHistoryModalOpen
          }
          onClose={() =>
            setIsAddFamilyHistoryModalOpen(
              false
            )
          }
          title="Add Family Medical History"
        >

          <form
            onSubmit={
              submitAddFamilyHistory
            }
            className="space-y-5 p-1"
          >

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Relationship{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <select
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  familyRelationInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setFamilyRelationInput(
                      e.target.value
                    )
                }
              >
                {FAMILY_RELATIONS.map(
                  (
                    relation
                  ) => (
                    <option
                      key={
                        relation.value
                      }
                      value={
                        relation.value
                      }
                    >
                      {
                        relation.label
                      }
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Medical Condition{' '}
                <span className="text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                maxLength={200}
                placeholder="E.g. Premature coronary artery disease"
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  familyConditionInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setFamilyConditionInput(
                      e.target.value
                    )
                }
              />

            </div>

            <div className="flex flex-col gap-1">

              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes (Optional)
              </label>

              <textarea
                placeholder="E.g. Heart attack at age 42"
                rows={3}
                className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={
                  familyHistoryNotesInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setFamilyHistoryNotesInput(
                      e.target.value
                    )
                }
              />

            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 bg-destructive/5 border border-destructive/20 rounded-xl">

              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-destructive rounded border-border focus:ring-destructive"
                checked={
                  isFamilyHistoryEmergencyRelevantInput
                }
                onChange={
                  (
                    e
                  ) =>
                    setIsFamilyHistoryEmergencyRelevantInput(
                      e.target.checked
                    )
                }
              />

              <div>

                <span className="text-sm font-semibold text-foreground block">
                  Emergency Relevant
                </span>

                <span className="text-xs text-muted-foreground block mt-1 leading-relaxed">
                  Mark this only when the family history could materially
                  affect urgent treatment. Marked records may appear during
                  audited Break-Glass emergency access.
                </span>

              </div>

            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddFamilyHistoryModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                loading={
                  addFamilyHistoryMutation.isPending
                }
              >
                Save Family History
              </Button>

            </div>

          </form>

        </Modal>
      )}

      {/* ── Add Bulk Vaccination Modal ── */}
      {isAddVaccinationModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isAddVaccinationModalOpen
          }
          onClose={() =>
            setIsAddVaccinationModalOpen(
              false
            )
          }
          title="Add Vaccination Record(s)"
        >

          <div className="flex flex-col h-full max-h-[80vh]">
            
            <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex flex-col gap-2 shrink-0">

              <div className="flex items-center gap-2 text-primary font-semibold">

                <ScanLine
                  size={18}
                />

                <span>
                  Smart AI Scan
                </span>

              </div>

              <p className="text-xs text-foreground">
                Save time! Upload a photo of the CHDR/vaccination card to automatically extract multiple entries at once.
              </p>

              <Button
                type="button"
                variant="secondary"
                onClick={
                  handleScanVaccineClick
                }
                disabled={
                  scanVaccinationMutation.isPending
                }
                className="w-full mt-2 bg-card"
              >

                {scanVaccinationMutation.isPending ? (
                  <>
                    <Spinner
                      size="sm"
                      className="mr-2"
                    />
                    Scanning Card...
                  </>
                ) : (
                  <>
                    <Camera
                      size={16}
                      className="mr-2"
                    />
                    Select Photo
                  </>
                )}

              </Button>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                ref={
                  scanVaccineInputRef
                }
                onChange={
                  handleScanVaccineChange
                }
              />

            </div>

            <div className="overflow-y-auto pr-2 space-y-4 pb-4">

              {bulkVaccines.map(
                (
                  row
                ) => (

                  <div
                    key={
                      row.id
                    }
                    className="p-4 bg-secondary border border-border rounded-lg relative"
                  >
                  
                    {bulkVaccines.length >
                      1 && (

                      <button
                        type="button"
                        onClick={() =>
                          removeVaccineRow(
                            row.id
                          )
                        }
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-full shadow-sm z-10"
                        title="Remove Row"
                      >
                        <X
                          size={14}
                          strokeWidth={3}
                        />
                      </button>

                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div className="flex flex-col gap-1 relative vaccine-autocomplete-container">

                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Vaccine Name{' '}
                          <span className="text-destructive">
                            *
                          </span>
                        </label>

                        <input 
                          type="text" 
                          placeholder="E.g. BCG" 
                          className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                          value={
                            row.vaccineName
                          } 
                          onChange={
                            (
                              e
                            ) =>
                              updateVaccineRow(
                                row.id,
                                'vaccineName',
                                e.target.value
                              )
                          } 
                          onFocus={() => {
                            setVaccineSuggestions(
                              searchVaccines(
                                row.vaccineName
                              )
                            );

                            setActiveVaccineRowId(
                              row.id
                            );
                          }} 
                          autoComplete="off" 
                        />

                        {activeVaccineRowId ===
                          row.id &&
                          vaccineSuggestions.length >
                            0 && (

                          <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1">

                            {vaccineSuggestions.map(
                              (
                                sugg,
                                i
                              ) => (

                                <div
                                  key={
                                    i
                                  }
                                  onClick={() => {
                                    updateVaccineRow(
                                      row.id,
                                      'vaccineName',
                                      sugg.name
                                    );

                                    setActiveVaccineRowId(
                                      null
                                    );
                                  }}
                                  className="px-4 py-2.5 hover:bg-secondary cursor-pointer flex justify-between items-center border-b border-border last:border-0"
                                >

                                  <span className="text-sm font-medium text-foreground">
                                    {
                                      sugg.name
                                    }
                                  </span>

                                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                    {
                                      sugg.category
                                    }
                                  </span>

                                </div>

                              )
                            )}

                          </div>
                        )}

                      </div>

                      <div className="flex flex-col gap-1">

                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Date Administered{' '}
                          <span className="text-destructive">
                            *
                          </span>
                        </label>

                        <input 
                          type="date" 
                          className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" 
                          value={
                            row.dateAdministered
                          } 
                          onChange={
                            (
                              e
                            ) =>
                              updateVaccineRow(
                                row.id,
                                'dateAdministered',
                                e.target.value
                              )
                          } 
                        />

                      </div>

                      <div className="flex flex-col gap-1">

                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Dose (Optional)
                        </label>

                        <input
                          type="text"
                          placeholder="E.g. Birth, 6 Weeks"
                          className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={
                            row.doseNumber
                          }
                          onChange={
                            (
                              e
                            ) =>
                              updateVaccineRow(
                                row.id,
                                'doseNumber',
                                e.target.value
                              )
                          }
                        />

                      </div>

                      <div className="flex flex-col gap-1">

                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Notes (Optional)
                        </label>

                        <input
                          type="text"
                          placeholder="E.g. Given at GH"
                          className="w-full px-3 py-2 text-sm text-foreground bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={
                            row.notes
                          }
                          onChange={
                            (
                              e
                            ) =>
                              updateVaccineRow(
                                row.id,
                                'notes',
                                e.target.value
                              )
                          }
                        />

                      </div>

                    </div>

                  </div>

                )
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={
                  addVaccineRow
                }
                className="w-full text-muted-foreground border-border border-dashed hover:bg-secondary py-3"
              >
                <Plus
                  size={16}
                  className="mr-2"
                />
                Add Another Row
              </Button>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0 mt-auto">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsAddVaccinationModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={
                  submitBulkVaccination
                }
                variant="primary"
                loading={
                  addBulkVaccinationMutation.isPending
                }
              >
                Save All Records
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {/* ── Delete Confirmation Modals ── */}
      {isDeleteModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteModalOpen
          }
          onClose={() =>
            setIsDeleteModalOpen(
              false
            )
          }
          title="Remove Allergy"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Are you sure?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove{' '}
                  <strong>
                    {
                      allergyToDelete?.allergen
                    }
                  </strong>.
                  {' '}
                  This action cannot be undone.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={
                  confirmDeleteAllergy
                }
                loading={
                  deleteAllergyMutation.isPending
                }
              >
                Yes, Remove It
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {isDeleteConditionModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteConditionModalOpen
          }
          onClose={() =>
            setIsDeleteConditionModalOpen(
              false
            )
          }
          title="Remove Condition"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Are you sure?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove{' '}
                  <strong>
                    {
                      conditionToDelete?.condition
                    }
                  </strong>.
                  {' '}
                  This action cannot be undone.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteConditionModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={() =>
                  deleteConditionMutation.mutate(
                    conditionToDelete.id
                  )
                }
                loading={
                  deleteConditionMutation.isPending
                }
              >
                Yes, Remove It
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {isDeleteDeviceModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteDeviceModalOpen
          }
          onClose={() =>
            setIsDeleteDeviceModalOpen(
              false
            )
          }
          title="Remove Medical Device"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full shrink-0">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Remove this device from your active profile?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove{' '}
                  <strong>
                    {
                      deviceToDelete?.device_name
                    }
                  </strong>
                  {' '}
                  from your active medical device list.
                </p>

                <p className="text-xs text-muted-foreground mt-2">
                  Care4U will preserve the historical database record,
                  but it will no longer appear as an active device or
                  in future emergency snapshots.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteDeviceModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={() =>
                  deleteMedicalDeviceMutation.mutate(
                    deviceToDelete.id
                  )
                }
                loading={
                  deleteMedicalDeviceMutation.isPending
                }
              >
                Yes, Remove Device
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {isDeleteBackgroundModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteBackgroundModalOpen
          }
          onClose={() =>
            setIsDeleteBackgroundModalOpen(
              false
            )
          }
          title="Remove Medical Background"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full shrink-0">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Remove this record from your active profile?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove{' '}
                  <strong>
                    {
                      backgroundToDelete?.title
                    }
                  </strong>
                  {' '}
                  from your important medical background.
                </p>

                <p className="text-xs text-muted-foreground mt-2">
                  Care4U will preserve the historical database record,
                  but it will no longer appear as active background
                  information or in future emergency snapshots.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteBackgroundModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={() =>
                  deleteHealthBackgroundMutation.mutate(
                    backgroundToDelete.id
                  )
                }
                loading={
                  deleteHealthBackgroundMutation.isPending
                }
              >
                Yes, Remove Record
              </Button>

            </div>

          </div>

        </Modal>
      )}


      {isDeleteFamilyHistoryModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteFamilyHistoryModalOpen
          }
          onClose={() =>
            setIsDeleteFamilyHistoryModalOpen(
              false
            )
          }
          title="Remove Family Medical History"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full shrink-0">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Remove this record from your active profile?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove{' '}
                  <strong>
                    {
                      familyHistoryToDelete?.condition
                    }
                  </strong>
                  {' '}
                  from your family medical history.
                </p>

                <p className="text-xs text-muted-foreground mt-2">
                  Care4U will preserve the historical database record,
                  but it will no longer appear as active family history
                  or in future emergency snapshots.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteFamilyHistoryModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={() =>
                  deleteFamilyHistoryMutation.mutate(
                    familyHistoryToDelete.id
                  )
                }
                loading={
                  deleteFamilyHistoryMutation.isPending
                }
              >
                Yes, Remove Record
              </Button>

            </div>

          </div>

        </Modal>
      )}

      {isDeleteVaccinationModalOpen && (

        <Modal
        manageFocus
          isOpen={
            isDeleteVaccinationModalOpen
          }
          onClose={() =>
            setIsDeleteVaccinationModalOpen(
              false
            )
          }
          title="Remove Vaccination"
        >

          <div className="p-1 space-y-4">

            <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">

              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>

              <div>

                <h4 className="font-semibold text-foreground">
                  Are you sure?
                </h4>

                <p className="text-sm text-foreground mt-1">
                  You are about to remove the record for{' '}
                  <strong>
                    {
                      vaccinationToDelete?.vaccine_name
                    }
                  </strong>.
                  {' '}
                  This action cannot be undone.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setIsDeleteVaccinationModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                className="bg-destructive! hover:bg-destructive/90! border-destructive! hover:border-destructive/90!"
                onClick={() =>
                  deleteVaccinationMutation.mutate(
                    vaccinationToDelete.id
                  )
                }
                loading={
                  deleteVaccinationMutation.isPending
                }
              >
                Yes, Remove It
              </Button>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
};

export default PatientProfilePage;
