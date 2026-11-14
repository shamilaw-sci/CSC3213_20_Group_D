/**
 * @file    PatientProfileScreen.js
 * @module  Patient
 * @desc    Premium patient profile and clinical-safety workspace.
 *          Supports unified Edit Mode, profile photo updates,
 *          allergies, chronic conditions, medical devices,
 *          important medical background, family history,
 *          vaccinations, AI vaccination-card scanning,
 *          and privacy/consent controls.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  Switch,
  RefreshControl,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import {
  AlertCircle,
  AlertTriangle,
  BriefcaseMedical,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  HeartPulse,
  History,
  Image as ImageIcon,
  LockKeyhole,
  Pencil,
  Phone,
  Plus,
  Save,
  ScanLine,
  Shield,
  ShieldCheck,
  Syringe,
  Trash2,
  Unlock,
  UserRound,
  Users,
  X,
} from 'lucide-react-native';

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
  updateConsentSettings,
} from '../services/patient.service';

import {
  searchAllergens,
} from '../utils/allergenSearch';

import {
  searchVaccines,
} from '../utils/vaccineSearch';

import useAuthStore from '../store/authStore';

/* =========================================================
   DESIGN TOKENS
========================================================= */

const COLORS = {
  background: '#F6F8FA',
  surface: '#FFFFFF',

  text: '#102331',
  textSoft: '#334155',
  muted: '#718096',
  subtle: '#9AA8B6',

  border: '#E8EDF1',

  navy: '#12344D',
  navySoft: '#EAF1F5',

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  blue: '#3973A7',
  blueSoft: '#EEF5FB',

  green: '#2F855A',
  greenSoft: '#EDF9F2',

  amber: '#B7791F',
  amberSoft: '#FFF8E7',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',

  violet: '#7656A8',
  violetSoft: '#F4F0FA',
};

/* =========================================================
   OPTIONS
========================================================= */

const BLOOD_GROUP_OPTIONS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
];

const RELATIONSHIP_OPTIONS = [
  'spouse',
  'parent',
  'sibling',
  'child',
  'friend',
  'other',
];

const SEVERITY_OPTIONS = [
  'mild',
  'moderate',
  'severe',
];

const SENSITIVE_CATEGORIES = [
  'Mental Health',
  'Reproductive Health',
  'Substance Abuse',
  'STD/STI Records',
];

const HEALTH_BACKGROUND_TYPES = [
  {
    value: 'major_surgery',
    label: 'Major Surgery',
  },
  {
    value: 'major_procedure',
    label: 'Major Procedure',
  },
  {
    value: 'organ_transplant',
    label: 'Organ Transplant',
  },
  {
    value: 'major_hospitalization',
    label: 'Major Hospitalization',
  },
  {
    value: 'serious_past_condition',
    label: 'Serious Past Condition',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const FAMILY_RELATIONS = [
  {
    value: 'mother',
    label: 'Mother',
  },
  {
    value: 'father',
    label: 'Father',
  },
  {
    value: 'sister',
    label: 'Sister',
  },
  {
    value: 'brother',
    label: 'Brother',
  },
  {
    value: 'daughter',
    label: 'Daughter',
  },
  {
    value: 'son',
    label: 'Son',
  },
  {
    value: 'maternal_grandmother',
    label: 'Maternal Grandmother',
  },
  {
    value: 'maternal_grandfather',
    label: 'Maternal Grandfather',
  },
  {
    value: 'paternal_grandmother',
    label: 'Paternal Grandmother',
  },
  {
    value: 'paternal_grandfather',
    label: 'Paternal Grandfather',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (dateStr) => {
  if (!dateStr) {
    return '—';
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
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

const formatAge = (dob) => {
  if (!dob) {
    return '—';
  }

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return '—';
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

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

const capitalise = (value) => {
  if (!value) {
    return '—';
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

const getInitials = (name) => {
  if (!name) {
    return 'PT';
  }

  const parts = name
    .trim()
    .split(' ')
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

const getBackgroundTypeLabel = (type) => {
  const match = HEALTH_BACKGROUND_TYPES.find(
    item => item.value === type
  );

  return (
    match?.label ||
    capitalise(
      type?.replaceAll(
        '_',
        ' '
      )
    )
  );
};

const getFamilyRelationLabel = (relation) => {
  const match = FAMILY_RELATIONS.find(
    item => item.value === relation
  );

  return (
    match?.label ||
    capitalise(
      relation?.replaceAll(
        '_',
        ' '
      )
    )
  );
};

const severityMeta = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return {
        color: COLORS.danger,
        background: COLORS.dangerSoft,
      };

    case 'moderate':
      return {
        color: COLORS.amber,
        background: COLORS.amberSoft,
      };

    default:
      return {
        color: COLORS.green,
        background: COLORS.greenSoft,
      };
  }
};

/* =========================================================
   OPTION SELECTOR
========================================================= */

const OptionSelector = ({
  label,
  value,
  options,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  const getOptionLabel = (option) => {
    if (typeof option === 'object') {
      return option.label;
    }

    return capitalise(option);
  };

  const getOptionValue = (option) => {
    if (typeof option === 'object') {
      return option.value;
    }

    return option;
  };

  const selectedOption = options.find(
    option =>
      getOptionValue(option) === value
  );

  return (
    <View style={styles.formField}>

      <Text style={styles.formLabel}>
        {label}
      </Text>

      <TouchableOpacity
        style={[
          styles.selectorButton,
          open && styles.selectorButtonOpen,
        ]}
        activeOpacity={0.75}
        onPress={() =>
          setOpen(
            previous => !previous
          )
        }
      >

        <Text
          style={
            value
              ? styles.selectorValue
              : styles.selectorPlaceholder
          }
        >
          {selectedOption
            ? getOptionLabel(
                selectedOption
              )
            : `Select ${label}`}
        </Text>

        {open ? (
          <ChevronUp
            size={17}
            color={COLORS.muted}
          />
        ) : (
          <ChevronDown
            size={17}
            color={COLORS.muted}
          />
        )}

      </TouchableOpacity>

      {open ? (
        <View style={styles.optionsList}>

          {options.map(
            option => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const selected = optionValue === value;

              return (
                <TouchableOpacity
                  key={optionValue}
                  style={[
                    styles.optionItem,
                    selected &&
                      styles.optionItemSelected,
                  ]}
                  activeOpacity={0.72}
                  onPress={() => {
                    onSelect(optionValue);
                    setOpen(false);
                  }}
                >

                  <Text
                    style={[
                      styles.optionText,
                      selected &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {optionLabel}
                  </Text>

                  {selected ? (
                    <CheckCircle2
                      size={15}
                      color={COLORS.teal}
                    />
                  ) : null}

                </TouchableOpacity>
              );
            }
          )}

        </View>
      ) : null}

    </View>
  );
};

/* =========================================================
   MODAL SHELL
========================================================= */

const ModalShell = ({
  visible,
  title,
  icon: Icon,
  onClose,
  children,
  maxHeight = '88%',
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >

      <View style={styles.modalOverlay}>

        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
          style={[
            styles.modalContent,
            {
              maxHeight,
            },
          ]}
        >

          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>

            <View style={styles.modalHeaderLeft}>

              <View style={styles.modalHeaderIcon}>

                <Icon
                  size={18}
                  color={COLORS.teal}
                />

              </View>

              <Text style={styles.modalTitle}>
                {title}
              </Text>

            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              activeOpacity={0.75}
              onPress={onClose}
            >

              <X
                size={18}
                color={COLORS.text}
              />

            </TouchableOpacity>

          </View>

          {children}

        </KeyboardAvoidingView>

      </View>

    </Modal>
  );
};

/* =========================================================
   SECTION CARD
========================================================= */

const SectionCard = ({
  title,
  description,
  editing = false,
  actionLabel,
  onAction,
  children,
}) => {
  return (
    <View style={styles.sectionCard}>

      <View style={styles.sectionHeader}>

        <View style={styles.sectionHeadingText}>

          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          {description ? (
            <Text style={styles.sectionDescription}>
              {description}
            </Text>
          ) : null}

        </View>

        {editing && onAction ? (
          <TouchableOpacity
            style={styles.sectionAddButton}
            activeOpacity={0.75}
            onPress={onAction}
          >

            <Plus
              size={14}
              color={COLORS.teal}
            />

            <Text style={styles.sectionAddText}>
              {actionLabel || 'Add'}
            </Text>

          </TouchableOpacity>
        ) : null}

      </View>

      <View style={styles.sectionBody}>
        {children}
      </View>

    </View>
  );
};

/* =========================================================
   INFORMATION ROW
========================================================= */

const InformationRow = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <View style={styles.infoRow}>

      <View style={styles.infoIcon}>

        <Icon
          size={15}
          color={COLORS.teal}
        />

      </View>

      <View style={styles.infoText}>

        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value || '—'}
        </Text>

      </View>

    </View>
  );
};

/* =========================================================
   EMPTY SECTION
========================================================= */

const EmptySection = ({
  icon: Icon,
  text,
}) => {
  return (
    <View style={styles.emptySection}>

      <Icon
        size={18}
        color={COLORS.subtle}
      />

      <Text style={styles.emptySectionText}>
        {text}
      </Text>

    </View>
  );
};

/* =========================================================
   MAIN SCREEN
========================================================= */

/** Coordinate owned profile and privacy controls from patientId prop/session profile_id. Mutations require acknowledgement; privacy uses a separate serialized save. Other clinical CRUD/AI remains partial scope.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const PatientProfileScreen = ({
  patientId,
}) => {
  const user = useAuthStore(
    state => state.user
  );

  const activePatientId =
    patientId ||
    user?.profile_id ||
    '';

  /* =======================================================
     MAIN DATA
  ======================================================= */

  const [patient, setPatient] = useState(null);

  const [allergies, setAllergies] = useState([]);

  const [conditions, setConditions] = useState([]);

  const [medicalDevices, setMedicalDevices] = useState([]);

  const [healthBackground, setHealthBackground] = useState([]);

  const [familyHistory, setFamilyHistory] = useState([]);

  const [vaccinations, setVaccinations] = useState([]);

  const [lockedCategories, setLockedCategories] = useState([]);
  const consentInFlight = useRef(false);
  const saveInFlight = useRef(false);
  const [consentSaving, setConsentSaving] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /* =======================================================
     EDIT MODE
  ======================================================= */

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({});

  const [saving, setSaving] = useState(false);

  const [saveError, setSaveError] = useState(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);

  /* =======================================================
     ALLERGY STATE
  ======================================================= */

  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);

  const [allergenInput, setAllergenInput] = useState('');

  const [allergySuggestions, setAllergySuggestions] = useState([]);

  const [selectedSeverity, setSelectedSeverity] = useState('mild');

  const [allergyNotes, setAllergyNotes] = useState('');

  const [addingAllergy, setAddingAllergy] = useState(false);

  /* =======================================================
     CONDITION STATE
  ======================================================= */

  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);

  const [conditionInput, setConditionInput] = useState('');

  const [diagnosedAtInput, setDiagnosedAtInput] = useState('');

  const [conditionNotes, setConditionNotes] = useState('');

  const [isPriorityInput, setIsPriorityInput] = useState(false);

  const [addingCondition, setAddingCondition] = useState(false);

  /* =======================================================
     MEDICAL DEVICE STATE
  ======================================================= */

  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);

  const [deviceNameInput, setDeviceNameInput] = useState('');

  const [deviceTypeInput, setDeviceTypeInput] = useState('');

  const [implantedAtInput, setImplantedAtInput] = useState('');

  const [deviceNotesInput, setDeviceNotesInput] = useState('');

  const [isEmergencyRelevantInput, setIsEmergencyRelevantInput] = useState(true);

  const [addingDevice, setAddingDevice] = useState(false);

  /* =======================================================
     MEDICAL BACKGROUND STATE
  ======================================================= */

  const [isAddBackgroundModalOpen, setIsAddBackgroundModalOpen] = useState(false);

  const [backgroundTypeInput, setBackgroundTypeInput] = useState('major_surgery');

  const [backgroundTitleInput, setBackgroundTitleInput] = useState('');

  const [backgroundDateInput, setBackgroundDateInput] = useState('');

  const [backgroundNotesInput, setBackgroundNotesInput] = useState('');

  const [backgroundEmergencyInput, setBackgroundEmergencyInput] = useState(false);

  const [addingBackground, setAddingBackground] = useState(false);

  /* =======================================================
     FAMILY HISTORY STATE
  ======================================================= */

  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);

  const [familyRelationInput, setFamilyRelationInput] = useState('mother');

  const [familyConditionInput, setFamilyConditionInput] = useState('');

  const [familyNotesInput, setFamilyNotesInput] = useState('');

  const [familyEmergencyInput, setFamilyEmergencyInput] = useState(false);

  const [addingFamily, setAddingFamily] = useState(false);

  /* =======================================================
     VACCINATION STATE
  ======================================================= */

  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);

  const [bulkVaccines, setBulkVaccines] = useState([
    {
      id: 'initial',
      vaccineName: '',
      dateAdministered: '',
      doseNumber: '',
      notes: '',
    },
  ]);

  const [activeVaccineRow, setActiveVaccineRow] = useState(null);

  const [vaccineSuggestions, setVaccineSuggestions] = useState([]);

  const [addingVaccinations, setAddingVaccinations] = useState(false);

  const [scanningCard, setScanningCard] = useState(false);

  /* =======================================================
     FETCH ALL PROFILE DATA
  ======================================================= */

  const fetchData = useCallback(
    async (
      background = false
    ) => {
      if (!activePatientId) {
        setLoading(false);

        setError(
          'Patient account information is unavailable. Please sign in again.'
        );

        return;
      }

      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          profileData,
          allergyData,
          conditionData,
          deviceData,
          backgroundData,
          familyData,
          vaccinationData,
          consentData,
        ] = await Promise.all([
          getPatientProfile(
            activePatientId
          ),

          getAllergies(
            activePatientId
          ),

          getConditions(
            activePatientId
          ),

          getMedicalDevices(
            activePatientId
          ),

          getHealthBackground(
            activePatientId
          ),

          getFamilyHistory(
            activePatientId
          ),

          getVaccinations(
            activePatientId
          ),

          getConsentSettings(
            activePatientId
          ),
        ]);

        setPatient(
          profileData
        );

        setAllergies(
          allergyData || []
        );

        setConditions(
          conditionData || []
        );

        setMedicalDevices(
          deviceData || []
        );

        setHealthBackground(
          backgroundData || []
        );

        setFamilyHistory(
          familyData || []
        );

        setVaccinations(
          vaccinationData || []
        );

        setLockedCategories(
          consentData || []
        );

      } catch (err) {
        console.error(
          'Profile load error:',
          err
        );

        setError(
          'Failed to load your profile. Please try again.'
        );

      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      activePatientId,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [
    fetchData,
  ]);

  /* =======================================================
     GLOBAL EDIT MODE
  ======================================================= */

  /** Copy confirmed editable profile values into formData and clear old save feedback. No backend write occurs until saveProfile.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const startEditing = () => {
    setFormData({
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

    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  /** Update one local editable form field. Inputs are field name/value; the backend still applies its fixed allow-list.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const updateField = (
    field,
    value
  ) => {
    setFormData(
      previous => ({
        ...previous,
        [field]: value,
      })
    );
  };

  /** Validate nonempty name, exclude repeated taps, await the confirmed profile, then replace patient state and exit edit mode. Failure preserves the form and restores retry.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const saveProfile = async () => {
    if (saveInFlight.current) return;
    if (
      !formData
        .full_name
        ?.trim()
    ) {
      setSaveError(
        'Full name is required.'
      );

      return;
    }

    saveInFlight.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const updated =
        await updatePatientProfile(
          activePatientId,
          formData
        );

      setPatient(
        updated
      );

      setIsEditing(false);
      setSaveSuccess(true);

      setTimeout(
        () =>
          setSaveSuccess(
            false
          ),
        3000
      );

    } catch (err) {
      console.error(
        'Profile update error:',
        err
      );

      setSaveError(
        'Failed to save profile changes. Please try again.'
      );

    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  /* =======================================================
     PROFILE PHOTO
  ======================================================= */

  const uploadSelectedPhoto = async (
    asset
  ) => {
    if (
      asset.fileSize &&
      asset.fileSize >
        MAX_PHOTO_SIZE_BYTES
    ) {
      Alert.alert(
        'Image too large',
        'Please choose an image that is 2 MB or smaller.'
      );

      return;
    }

    setPhotoUploading(true);

    try {
      const updated =
        await uploadPatientPhoto(
          activePatientId,
          asset.uri,
          asset.mimeType ||
            'image/jpeg'
        );

      setPatient(
        updated
      );

      Alert.alert(
        'Photo updated',
        'Your profile photo was updated successfully.'
      );

    } catch (err) {
      console.error(
        'Profile photo upload error:',
        err
      );

      Alert.alert(
        'Upload failed',
        'Your profile photo could not be updated.'
      );

    } finally {
      setPhotoUploading(false);
    }
  };

  const chooseProfilePhoto = async () => {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        'Permission required',
        'Allow photo-library access to change your profile photo.'
      );

      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          quality: 0.8,
        });

    if (
      !result.canceled
    ) {
      await uploadSelectedPhoto(
        result.assets[0]
      );
    }
  };

  const takeProfilePhoto = async () => {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        'Permission required',
        'Allow camera access to take a new profile photo.'
      );

      return;
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          quality: 0.8,
        });

    if (
      !result.canceled
    ) {
      await uploadSelectedPhoto(
        result.assets[0]
      );
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose how you want to update your photo.',
      [
        {
          text: 'Take Photo',
          onPress: takeProfilePhoto,
        },

        {
          text: 'Choose from Gallery',
          onPress: chooseProfilePhoto,
        },

        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /* =======================================================
     PRIVACY
  ======================================================= */

  /** Save privacy independently of profile edits; never show an unacknowledged lock.
   * @param {string} category Existing display label. @returns {Promise<void>} Confirmed list or retry alert.
   */
  /** Serialize a complete privacy-list save; update the visible list only after acknowledgement. Failure keeps the confirmed state.
 * @returns {*} UI element, local transition or acknowledged async completion as described above.
 */
const toggleConsent = async category => {
    if (!isEditing || consentInFlight.current) return;
    consentInFlight.current = true;
    setConsentSaving(true);
    const next = lockedCategories.includes(category)
      ? lockedCategories.filter(item => item !== category) : [...lockedCategories, category];
    try {
      const result = await updateConsentSettings(activePatientId, next);
      if (!Array.isArray(result?.locked_categories)) throw new Error('Unconfirmed privacy settings');
      setLockedCategories(result.locked_categories);
    } catch {
      Alert.alert('Privacy setting not saved', 'Please try again. The last confirmed settings are still shown.');
    } finally {
      consentInFlight.current = false;
      setConsentSaving(false);
    }
  };

  /* =======================================================
     ALLERGIES
  ======================================================= */

  const addAllergyRecord = async () => {
    if (
      !allergenInput
        .trim()
    ) {
      Alert.alert(
        'Allergen required',
        'Enter an allergen name.'
      );

      return;
    }

    setAddingAllergy(true);

    try {
      await addAllergy(
        activePatientId,
        allergenInput.trim(),
        selectedSeverity,
        allergyNotes.trim()
      );

      setAllergies(
        await getAllergies(
          activePatientId
        )
      );

      setIsAddAllergyModalOpen(false);

      setAllergenInput('');
      setAllergySuggestions([]);
      setSelectedSeverity('mild');
      setAllergyNotes('');

    } catch (err) {
      Alert.alert(
        'Unable to add allergy',
        'Please try again.'
      );

    } finally {
      setAddingAllergy(false);
    }
  };

  const removeAllergy = (
    allergy
  ) => {
    Alert.alert(
      'Remove Allergy',
      `Remove ${allergy.allergen} from your active allergy list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteAllergy(
                  activePatientId,
                  allergy.id
                );

                setAllergies(
                  await getAllergies(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove allergy',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     CONDITIONS
  ======================================================= */

  const addConditionRecord = async () => {
    if (
      !conditionInput
        .trim()
    ) {
      Alert.alert(
        'Condition required',
        'Enter a condition name.'
      );

      return;
    }

    setAddingCondition(true);

    try {
      await addCondition(
        activePatientId,
        conditionInput.trim(),
        diagnosedAtInput.trim(),
        conditionNotes.trim(),
        isPriorityInput
      );

      setConditions(
        await getConditions(
          activePatientId
        )
      );

      setIsAddConditionModalOpen(false);

      setConditionInput('');
      setDiagnosedAtInput('');
      setConditionNotes('');
      setIsPriorityInput(false);

    } catch (err) {
      Alert.alert(
        'Unable to add condition',
        'Please try again.'
      );

    } finally {
      setAddingCondition(false);
    }
  };

  const removeCondition = (
    condition
  ) => {
    Alert.alert(
      'Remove Condition',
      `Remove ${condition.condition} from your active profile?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteCondition(
                  activePatientId,
                  condition.id
                );

                setConditions(
                  await getConditions(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove condition',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     MEDICAL DEVICES
  ======================================================= */

  const addDeviceRecord = async () => {
    if (
      !deviceNameInput
        .trim()
    ) {
      Alert.alert(
        'Device required',
        'Enter the device or implant name.'
      );

      return;
    }

    setAddingDevice(true);

    try {
      await addMedicalDevice(
        activePatientId,
        {
          deviceName:
            deviceNameInput.trim(),

          deviceType:
            deviceTypeInput.trim(),

          implantedAt:
            implantedAtInput,

          notes:
            deviceNotesInput.trim(),

          isEmergencyRelevant:
            isEmergencyRelevantInput,
        }
      );

      setMedicalDevices(
        await getMedicalDevices(
          activePatientId
        )
      );

      setIsAddDeviceModalOpen(false);

      setDeviceNameInput('');
      setDeviceTypeInput('');
      setImplantedAtInput('');
      setDeviceNotesInput('');
      setIsEmergencyRelevantInput(true);

    } catch (err) {
      Alert.alert(
        'Unable to add device',
        'Please try again.'
      );

    } finally {
      setAddingDevice(false);
    }
  };

  const removeDevice = (
    device
  ) => {
    Alert.alert(
      'Remove Medical Device',
      `Remove ${device.device_name} from your active profile?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteMedicalDevice(
                  activePatientId,
                  device.id
                );

                setMedicalDevices(
                  await getMedicalDevices(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove device',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     MEDICAL BACKGROUND
  ======================================================= */

  const addBackgroundRecord = async () => {
    if (
      !backgroundTitleInput
        .trim()
    ) {
      Alert.alert(
        'Title required',
        'Enter a title for the medical background record.'
      );

      return;
    }

    setAddingBackground(true);

    try {
      await addHealthBackground(
        activePatientId,
        {
          backgroundType:
            backgroundTypeInput,

          title:
            backgroundTitleInput.trim(),

          eventDate:
            backgroundDateInput,

          notes:
            backgroundNotesInput.trim(),

          isEmergencyRelevant:
            backgroundEmergencyInput,
        }
      );

      setHealthBackground(
        await getHealthBackground(
          activePatientId
        )
      );

      setIsAddBackgroundModalOpen(false);

      setBackgroundTypeInput('major_surgery');
      setBackgroundTitleInput('');
      setBackgroundDateInput('');
      setBackgroundNotesInput('');
      setBackgroundEmergencyInput(false);

    } catch (err) {
      Alert.alert(
        'Unable to add medical background',
        'Please try again.'
      );

    } finally {
      setAddingBackground(false);
    }
  };

  const removeBackground = (
    record
  ) => {
    Alert.alert(
      'Remove Medical Background',
      `Remove ${record.title} from your active profile?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteHealthBackground(
                  activePatientId,
                  record.id
                );

                setHealthBackground(
                  await getHealthBackground(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove record',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     FAMILY HISTORY
  ======================================================= */

  const addFamilyRecord = async () => {
    if (
      !familyConditionInput
        .trim()
    ) {
      Alert.alert(
        'Condition required',
        'Enter the family medical condition.'
      );

      return;
    }

    setAddingFamily(true);

    try {
      await addFamilyHistory(
        activePatientId,
        {
          relation:
            familyRelationInput,

          condition:
            familyConditionInput.trim(),

          notes:
            familyNotesInput.trim(),

          isEmergencyRelevant:
            familyEmergencyInput,
        }
      );

      setFamilyHistory(
        await getFamilyHistory(
          activePatientId
        )
      );

      setIsAddFamilyModalOpen(false);

      setFamilyRelationInput('mother');
      setFamilyConditionInput('');
      setFamilyNotesInput('');
      setFamilyEmergencyInput(false);

    } catch (err) {
      Alert.alert(
        'Unable to add family history',
        'Please try again.'
      );

    } finally {
      setAddingFamily(false);
    }
  };

  const removeFamilyRecord = (
    record
  ) => {
    Alert.alert(
      'Remove Family History',
      `Remove ${record.condition} from your active family history?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteFamilyHistory(
                  activePatientId,
                  record.id
                );

                setFamilyHistory(
                  await getFamilyHistory(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove record',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     VACCINATIONS
  ======================================================= */

  const resetVaccines = () => {
    setBulkVaccines([
      {
        id: 'initial',
        vaccineName: '',
        dateAdministered: '',
        doseNumber: '',
        notes: '',
      },
    ]);

    setActiveVaccineRow(null);
    setVaccineSuggestions([]);
  };

  const addVaccineRow = () => {
    setBulkVaccines(
      previous => [
        ...previous,

        {
          id: `${Date.now()}`,
          vaccineName: '',
          dateAdministered: '',
          doseNumber: '',
          notes: '',
        },
      ]
    );
  };

  const updateVaccineRow = (
    id,
    field,
    value
  ) => {
    setBulkVaccines(
      previous =>
        previous.map(
          row =>
            row.id === id
              ? {
                  ...row,
                  [field]: value,
                }
              : row
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

      setActiveVaccineRow(
        id
      );
    }
  };

  const saveVaccinations = async () => {
    const activeRows =
      bulkVaccines.filter(
        row =>
          row.vaccineName.trim() ||
          row.dateAdministered.trim()
      );

    if (
      activeRows.length ===
      0
    ) {
      Alert.alert(
        'Vaccination required',
        'Complete at least one vaccination record.'
      );

      return;
    }

    if (
      activeRows.some(
        row =>
          !row.vaccineName.trim() ||
          !row.dateAdministered.trim()
      )
    ) {
      Alert.alert(
        'Incomplete record',
        'Vaccine Name and Date are required for every active row.'
      );

      return;
    }

    setAddingVaccinations(true);

    try {
      await addBulkVaccinations(
        activePatientId,
        activeRows
      );

      setVaccinations(
        await getVaccinations(
          activePatientId
        )
      );

      setIsVaccinationModalOpen(false);

      resetVaccines();

    } catch (err) {
      Alert.alert(
        'Unable to save vaccinations',
        'Please try again.'
      );

    } finally {
      setAddingVaccinations(false);
    }
  };

  const removeVaccination = (
    vaccination
  ) => {
    Alert.alert(
      'Remove Vaccination',
      `Remove ${vaccination.vaccine_name} from your vaccination history?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteVaccination(
                  activePatientId,
                  vaccination.id
                );

                setVaccinations(
                  await getVaccinations(
                    activePatientId
                  )
                );

              } catch (err) {
                Alert.alert(
                  'Unable to remove vaccination',
                  'Please try again.'
                );
              }
            },
        },
      ]
    );
  };

  /* =======================================================
     AI VACCINATION CARD SCAN
  ======================================================= */

  const processVaccineImage = async (
    asset
  ) => {
    setScanningCard(true);

    try {
      const data =
        await scanVaccinationCard(
          activePatientId,
          asset.uri,
          asset.mimeType ||
            'image/jpeg'
        );

      const extracted =
        Array.isArray(data)
          ? data
          : [
              data,
            ];

      const rows =
        extracted
          .filter(Boolean)
          .map(
            (
              item,
              index
            ) => ({
              id:
                `${Date.now()}-${index}`,

              vaccineName:
                item.vaccineName ||
                '',

              dateAdministered:
                item.dateAdministered ||
                '',

              doseNumber:
                item.doseNumber ||
                '',

              notes:
                '',
            })
          );

      if (
        rows.length >
        0
      ) {
        setBulkVaccines(
          rows
        );

        Alert.alert(
          'Card scanned',
          'AI-extracted vaccination records are ready. Please review every field before saving.'
        );
      }

    } catch (err) {
      Alert.alert(
        'Scan failed',
        'The vaccination card could not be read. Try another image or enter the records manually.'
      );

    } finally {
      setScanningCard(false);
    }
  };

  const takeVaccinePhoto = async () => {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        'Permission required',
        'Allow camera access to scan a vaccination card.'
      );

      return;
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          quality: 0.8,
        });

    if (
      !result.canceled
    ) {
      await processVaccineImage(
        result.assets[0]
      );
    }
  };

  const chooseVaccinePhoto = async () => {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (
      !permission.granted
    ) {
      Alert.alert(
        'Permission required',
        'Allow photo access to select a vaccination card.'
      );

      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            ImagePicker
              .MediaTypeOptions
              .Images,

          quality: 0.8,
        });

    if (
      !result.canceled
    ) {
      await processVaccineImage(
        result.assets[0]
      );
    }
  };

  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  if (
    loading
  ) {
    return (
      <View style={styles.centerScreen}>

        <View style={styles.centerIcon}>

          <UserRound
            size={28}
            color={COLORS.teal}
          />

        </View>

        <ActivityIndicator
          color={COLORS.teal}
        />

        <Text style={styles.centerTitle}>
          Loading your profile
        </Text>

        <Text style={styles.centerDescription}>
          Preparing your Care4U health information
        </Text>

      </View>
    );
  }

  if (
    error &&
    !patient
  ) {
    return (
      <View style={styles.centerScreen}>

        <View
          style={[
            styles.centerIcon,
            {
              backgroundColor:
                COLORS.dangerSoft,
            },
          ]}
        >

          <AlertCircle
            size={28}
            color={COLORS.danger}
          />

        </View>

        <Text style={styles.centerTitle}>
          Profile unavailable
        </Text>

        <Text style={styles.centerDescription}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            fetchData()
          }
        >

          <Text style={styles.retryButtonText}>
            Try again
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>

      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                fetchData(
                  true
                )
              }
              tintColor={COLORS.teal}
            />
          }
        >

          {/* =================================================
              PROFILE HERO
          ================================================== */}

          <View style={styles.heroCard}>

            <View style={styles.heroBackground}>

              <View style={styles.heroCircleOne} />
              <View style={styles.heroCircleTwo} />

            </View>

            <View style={styles.avatarPosition}>

              <View style={styles.avatarOuter}>

                <View style={styles.avatarInner}>

                  {patient?.photo_url ? (

                    <Image
                      source={{
                        uri:
                          patient.photo_url,
                      }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />

                  ) : (

                    <View style={styles.avatarFallback}>

                      <UserRound
                        size={34}
                        color="rgba(255,255,255,0.72)"
                      />

                      <Text style={styles.avatarInitials}>
                        {getInitials(
                          patient?.full_name
                        )}
                      </Text>

                    </View>

                  )}

                </View>

                {isEditing ? (
                  <TouchableOpacity
                    style={styles.photoButton}
                    activeOpacity={0.8}
                    disabled={photoUploading}
                    onPress={handleChangePhoto}
                  >

                    {photoUploading ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <Camera
                        size={16}
                        color="#FFFFFF"
                      />
                    )}

                  </TouchableOpacity>
                ) : null}

              </View>

            </View>

            <View style={styles.heroContent}>

              <Text style={styles.heroEyebrow}>
                CARE4U PATIENT
              </Text>

              <Text style={styles.heroName}>
                {patient?.full_name ||
                  'Patient'}
              </Text>

              <View style={styles.heroMeta}>

                <Text style={styles.heroMetaText}>
                  {formatAge(
                    patient?.date_of_birth
                  )}
                </Text>

                <View style={styles.heroMetaDot} />

                <Text style={styles.heroMetaText}>
                  {capitalise(
                    patient?.gender
                  )}
                </Text>

                {patient?.blood_group ? (
                  <>
                    <View style={styles.heroMetaDot} />

                    <View style={styles.bloodBadge}>

                      <Droplets
                        size={11}
                        color="#FFFFFF"
                      />

                      <Text style={styles.bloodBadgeText}>
                        {
                          patient.blood_group
                        }
                      </Text>

                    </View>
                  </>
                ) : null}

              </View>

              {!isEditing ? (
                <TouchableOpacity
                  style={styles.primaryEditButton}
                  activeOpacity={0.8}
                  onPress={startEditing}
                >

                  <Pencil
                    size={16}
                    color="#FFFFFF"
                  />

                  <Text style={styles.primaryEditButtonText}>
                    Edit Profile
                  </Text>

                </TouchableOpacity>
              ) : (

                <View style={styles.editingBanner}>

                  <Pencil
                    size={15}
                    color={COLORS.teal}
                  />

                  <Text style={styles.editingBannerText}>
                    Edit Mode Active
                  </Text>

                </View>

              )}

            </View>

          </View>

          {/* =================================================
              SUCCESS
          ================================================== */}

          {saveSuccess ? (
            <View style={styles.successBanner}>

              <CheckCircle2
                size={17}
                color={COLORS.green}
              />

              <Text style={styles.successText}>
                Profile updated successfully
              </Text>

            </View>
          ) : null}

          {/* =================================================
              HEALTH SNAPSHOT
          ================================================== */}

          <View style={styles.summaryGrid}>

            <View style={styles.summaryCard}>

              <Droplets
                size={18}
                color={COLORS.danger}
              />

              <Text style={styles.summaryValue}>
                {patient?.blood_group ||
                  '—'}
              </Text>

              <Text style={styles.summaryLabel}>
                Blood Group
              </Text>

            </View>

            <View style={styles.summaryCard}>

              <AlertTriangle
                size={18}
                color={COLORS.amber}
              />

              <Text style={styles.summaryValue}>
                {allergies.length}
              </Text>

              <Text style={styles.summaryLabel}>
                Allergies
              </Text>

            </View>

            <View style={styles.summaryCard}>

              <HeartPulse
                size={18}
                color={COLORS.blue}
              />

              <Text style={styles.summaryValue}>
                {conditions.length}
              </Text>

              <Text style={styles.summaryLabel}>
                Conditions
              </Text>

            </View>

            <View style={styles.summaryCard}>

              <Syringe
                size={18}
                color={COLORS.teal}
              />

              <Text style={styles.summaryValue}>
                {vaccinations.length}
              </Text>

              <Text style={styles.summaryLabel}>
                Vaccinations
              </Text>

            </View>

          </View>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================== */}

          <SectionCard
            title="Personal Information"
            description="Your core identity and demographic information."
          >

            {isEditing ? (
              <>

                <View style={styles.formField}>

                  <Text style={styles.formLabel}>
                    Full Name
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    value={formData.full_name}
                    onChangeText={
                      value =>
                        updateField(
                          'full_name',
                          value
                        )
                    }
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.subtle}
                  />

                </View>

                <OptionSelector
                  label="Blood Group"
                  value={formData.blood_group}
                  options={BLOOD_GROUP_OPTIONS}
                  onSelect={
                    value =>
                      updateField(
                        'blood_group',
                        value
                      )
                  }
                />

                <View style={styles.readOnlyNotice}>

                  <ShieldCheck
                    size={14}
                    color={COLORS.subtle}
                  />

                  <Text style={styles.readOnlyNoticeText}>
                    Date of birth, gender and NIC are protected identity fields.
                  </Text>

                </View>

              </>
            ) : (
              <>

                <InformationRow
                  icon={UserRound}
                  label="Full Name"
                  value={patient?.full_name}
                />

                <InformationRow
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={
                    formatDate(
                      patient?.date_of_birth
                    )
                  }
                />

                <InformationRow
                  icon={UserRound}
                  label="Gender"
                  value={
                    capitalise(
                      patient?.gender
                    )
                  }
                />

                <InformationRow
                  icon={Droplets}
                  label="Blood Group"
                  value={patient?.blood_group}
                />

                <InformationRow
                  icon={ShieldCheck}
                  label="NIC"
                  value={patient?.nic}
                />

              </>
            )}

          </SectionCard>

          {/* =================================================
              EMERGENCY CONTACT
          ================================================== */}

          <SectionCard
            title="Emergency Contact"
            description="Keep this information current for urgent care."
          >

            {isEditing ? (
              <>

                <View style={styles.formField}>

                  <Text style={styles.formLabel}>
                    Contact Name
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    value={formData.emergency_contact_name}
                    onChangeText={
                      value =>
                        updateField(
                          'emergency_contact_name',
                          value
                        )
                    }
                    placeholder="Enter contact name"
                    placeholderTextColor={COLORS.subtle}
                  />

                </View>

                <View style={styles.formField}>

                  <Text style={styles.formLabel}>
                    Contact Phone
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    value={formData.emergency_contact_phone}
                    onChangeText={
                      value =>
                        updateField(
                          'emergency_contact_phone',
                          value
                        )
                    }
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor={COLORS.subtle}
                  />

                </View>

                <OptionSelector
                  label="Relationship"
                  value={formData.emergency_contact_relationship}
                  options={RELATIONSHIP_OPTIONS}
                  onSelect={
                    value =>
                      updateField(
                        'emergency_contact_relationship',
                        value
                      )
                  }
                />

              </>
            ) : (
              <>

                <InformationRow
                  icon={UserRound}
                  label="Contact Name"
                  value={patient?.emergency_contact_name}
                />

                <InformationRow
                  icon={Phone}
                  label="Phone"
                  value={patient?.emergency_contact_phone}
                />

                <InformationRow
                  icon={Users}
                  label="Relationship"
                  value={
                    capitalise(
                      patient?.emergency_contact_relationship
                    )
                  }
                />

              </>
            )}

          </SectionCard>

          {/* =================================================
              CONDITIONS
          ================================================== */}

          <SectionCard
            title="Chronic Conditions"
            description="Long-term health conditions relevant to clinical care."
            editing={isEditing}
            onAction={() =>
              setIsAddConditionModalOpen(
                true
              )
            }
          >

            {conditions.length === 0 ? (

              <EmptySection
                icon={HeartPulse}
                text="No chronic conditions recorded."
              />

            ) : (

              conditions.map(
                condition => (
                  <View
                    key={condition.id}
                    style={[
                      styles.recordItem,
                      condition.is_priority &&
                        styles.priorityRecord,
                    ]}
                  >

                    <View style={styles.recordMain}>

                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              condition.is_priority
                                ? COLORS.dangerSoft
                                : COLORS.blueSoft,
                          },
                        ]}
                      >

                        {condition.is_priority ? (
                          <AlertTriangle
                            size={17}
                            color={COLORS.danger}
                          />
                        ) : (
                          <HeartPulse
                            size={17}
                            color={COLORS.blue}
                          />
                        )}

                      </View>

                      <View style={styles.recordText}>

                        <View style={styles.recordTitleRow}>

                          <Text style={styles.recordTitle}>
                            {
                              condition.condition
                            }
                          </Text>

                          {condition.is_priority ? (
                            <View style={styles.emergencyBadge}>

                              <Text style={styles.emergencyBadgeText}>
                                PRIORITY
                              </Text>

                            </View>
                          ) : null}

                        </View>

                        {condition.diagnosed_at ? (
                          <Text style={styles.recordMeta}>
                            Diagnosed {
                              formatDate(
                                condition.diagnosed_at
                              )
                            }
                          </Text>
                        ) : null}

                        {condition.notes ? (
                          <Text style={styles.recordNotes}>
                            {
                              condition.notes
                            }
                          </Text>
                        ) : null}

                      </View>

                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          removeCondition(
                            condition
                          )
                        }
                      >

                        <Trash2
                          size={15}
                          color={COLORS.danger}
                        />

                      </TouchableOpacity>
                    ) : null}

                  </View>
                )
              )

            )}

          </SectionCard>

          {/* =================================================
              ALLERGIES
          ================================================== */}

          <SectionCard
            title="Known Allergies"
            description="Important allergy information used during treatment."
            editing={isEditing}
            onAction={() => {
              setAllergenInput('');
              setAllergySuggestions([]);
              setIsAddAllergyModalOpen(true);
            }}
          >

            {allergies.length === 0 ? (

              <EmptySection
                icon={ShieldCheck}
                text="No allergies recorded."
              />

            ) : (

              [
                ...allergies,
              ]
                .sort(
                  (
                    first,
                    second
                  ) => {
                    const order = {
                      severe: 0,
                      moderate: 1,
                      mild: 2,
                    };

                    return (
                      (
                        order[
                          first.severity
                        ] ??
                        3
                      ) -
                      (
                        order[
                          second.severity
                        ] ??
                        3
                      )
                    );
                  }
                )
                .map(
                  allergy => {
                    const meta =
                      severityMeta(
                        allergy.severity
                      );

                    return (
                      <View
                        key={allergy.id}
                        style={styles.recordItem}
                      >

                        <View style={styles.recordMain}>

                          <View
                            style={[
                              styles.recordIcon,
                              {
                                backgroundColor:
                                  meta.background,
                              },
                            ]}
                          >

                            <AlertTriangle
                              size={17}
                              color={meta.color}
                            />

                          </View>

                          <View style={styles.recordText}>

                            <View style={styles.recordTitleRow}>

                              <Text style={styles.recordTitle}>
                                {
                                  allergy.allergen
                                }
                              </Text>

                              <View
                                style={[
                                  styles.severityBadge,
                                  {
                                    backgroundColor:
                                      meta.background,
                                  },
                                ]}
                              >

                                <Text
                                  style={[
                                    styles.severityBadgeText,
                                    {
                                      color:
                                        meta.color,
                                    },
                                  ]}
                                >
                                  {capitalise(
                                    allergy.severity
                                  )}
                                </Text>

                              </View>

                            </View>

                            {allergy.notes ? (
                              <Text style={styles.recordNotes}>
                                {
                                  allergy.notes
                                }
                              </Text>
                            ) : null}

                          </View>

                        </View>

                        {isEditing ? (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() =>
                              removeAllergy(
                                allergy
                              )
                            }
                          >

                            <Trash2
                              size={15}
                              color={COLORS.danger}
                            />

                          </TouchableOpacity>
                        ) : null}

                      </View>
                    );
                  }
                )

            )}

          </SectionCard>

          {/* =================================================
              MEDICAL DEVICES
          ================================================== */}

          <SectionCard
            title="Medical Devices & Implants"
            description="Implants and medical equipment important to your care."
            editing={isEditing}
            onAction={() =>
              setIsAddDeviceModalOpen(
                true
              )
            }
          >

            <View style={styles.clinicalNotice}>

              <Shield
                size={15}
                color={COLORS.teal}
              />

              <Text style={styles.clinicalNoticeText}>
                Emergency-relevant devices may be included in authorized Break-Glass access.
              </Text>

            </View>

            {medicalDevices.length === 0 ? (

              <EmptySection
                icon={BriefcaseMedical}
                text="No medical devices or implants recorded."
              />

            ) : (

              medicalDevices.map(
                device => (
                  <View
                    key={device.id}
                    style={styles.recordItem}
                  >

                    <View style={styles.recordMain}>

                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              COLORS.tealSoft,
                          },
                        ]}
                      >

                        <HeartPulse
                          size={17}
                          color={COLORS.teal}
                        />

                      </View>

                      <View style={styles.recordText}>

                        <View style={styles.recordTitleRow}>

                          <Text style={styles.recordTitle}>
                            {
                              device.device_name
                            }
                          </Text>

                          {device.is_emergency_relevant ? (
                            <View style={styles.emergencyBadge}>

                              <Shield
                                size={9}
                                color={COLORS.danger}
                              />

                              <Text style={styles.emergencyBadgeText}>
                                EMERGENCY
                              </Text>

                            </View>
                          ) : null}

                        </View>

                        {device.device_type ? (
                          <Text style={styles.recordAccent}>
                            {
                              device.device_type
                            }
                          </Text>
                        ) : null}

                        {device.implanted_at ? (
                          <Text style={styles.recordMeta}>
                            Implanted / Started {
                              formatDate(
                                device.implanted_at
                              )
                            }
                          </Text>
                        ) : null}

                        {device.notes ? (
                          <Text style={styles.recordNotes}>
                            {
                              device.notes
                            }
                          </Text>
                        ) : null}

                      </View>

                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          removeDevice(
                            device
                          )
                        }
                      >

                        <Trash2
                          size={15}
                          color={COLORS.danger}
                        />

                      </TouchableOpacity>
                    ) : null}

                  </View>
                )
              )

            )}

          </SectionCard>

          {/* =================================================
              IMPORTANT MEDICAL BACKGROUND
          ================================================== */}

          <SectionCard
            title="Important Medical Background"
            description="Major surgeries, procedures and serious past health events."
            editing={isEditing}
            onAction={() =>
              setIsAddBackgroundModalOpen(
                true
              )
            }
          >

            {healthBackground.length === 0 ? (

              <EmptySection
                icon={History}
                text="No important medical background recorded."
              />

            ) : (

              healthBackground.map(
                record => (
                  <View
                    key={record.id}
                    style={styles.recordItem}
                  >

                    <View style={styles.recordMain}>

                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              COLORS.violetSoft,
                          },
                        ]}
                      >

                        <History
                          size={17}
                          color={COLORS.violet}
                        />

                      </View>

                      <View style={styles.recordText}>

                        <View style={styles.recordTitleRow}>

                          <Text style={styles.recordTitle}>
                            {
                              record.title
                            }
                          </Text>

                          {record.is_emergency_relevant ? (
                            <View style={styles.emergencyBadge}>

                              <Shield
                                size={9}
                                color={COLORS.danger}
                              />

                              <Text style={styles.emergencyBadgeText}>
                                EMERGENCY
                              </Text>

                            </View>
                          ) : null}

                        </View>

                        <Text style={styles.recordAccent}>
                          {getBackgroundTypeLabel(
                            record.background_type
                          )}
                        </Text>

                        {record.event_date ? (
                          <Text style={styles.recordMeta}>
                            Event Date {
                              formatDate(
                                record.event_date
                              )
                            }
                          </Text>
                        ) : null}

                        {record.notes ? (
                          <Text style={styles.recordNotes}>
                            {
                              record.notes
                            }
                          </Text>
                        ) : null}

                      </View>

                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          removeBackground(
                            record
                          )
                        }
                      >

                        <Trash2
                          size={15}
                          color={COLORS.danger}
                        />

                      </TouchableOpacity>
                    ) : null}

                  </View>
                )
              )

            )}

          </SectionCard>

          {/* =================================================
              FAMILY HISTORY
          ================================================== */}

          <SectionCard
            title="Family Medical History"
            description="Clinically relevant conditions affecting close family members."
            editing={isEditing}
            onAction={() =>
              setIsAddFamilyModalOpen(
                true
              )
            }
          >

            {familyHistory.length === 0 ? (

              <EmptySection
                icon={Users}
                text="No family medical history recorded."
              />

            ) : (

              familyHistory.map(
                record => (
                  <View
                    key={record.id}
                    style={styles.recordItem}
                  >

                    <View style={styles.recordMain}>

                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              COLORS.blueSoft,
                          },
                        ]}
                      >

                        <Users
                          size={17}
                          color={COLORS.blue}
                        />

                      </View>

                      <View style={styles.recordText}>

                        <View style={styles.recordTitleRow}>

                          <Text style={styles.recordTitle}>
                            {
                              record.condition
                            }
                          </Text>

                          {record.is_emergency_relevant ? (
                            <View style={styles.emergencyBadge}>

                              <Shield
                                size={9}
                                color={COLORS.danger}
                              />

                              <Text style={styles.emergencyBadgeText}>
                                EMERGENCY
                              </Text>

                            </View>
                          ) : null}

                        </View>

                        <Text style={styles.recordAccent}>
                          {getFamilyRelationLabel(
                            record.relation
                          )}
                        </Text>

                        {record.notes ? (
                          <Text style={styles.recordNotes}>
                            {
                              record.notes
                            }
                          </Text>
                        ) : null}

                      </View>

                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          removeFamilyRecord(
                            record
                          )
                        }
                      >

                        <Trash2
                          size={15}
                          color={COLORS.danger}
                        />

                      </TouchableOpacity>
                    ) : null}

                  </View>
                )
              )

            )}

          </SectionCard>

          {/* =================================================
              VACCINATIONS
          ================================================== */}

          <SectionCard
            title="Vaccination Records"
            description="Your recorded immunisation history."
            editing={isEditing}
            onAction={() => {
              resetVaccines();

              setIsVaccinationModalOpen(
                true
              );
            }}
          >

            {vaccinations.length === 0 ? (

              <EmptySection
                icon={Syringe}
                text="No vaccination records found."
              />

            ) : (

              vaccinations.map(
                vaccination => (
                  <View
                    key={vaccination.id}
                    style={styles.recordItem}
                  >

                    <View style={styles.recordMain}>

                      <View
                        style={[
                          styles.recordIcon,
                          {
                            backgroundColor:
                              COLORS.tealSoft,
                          },
                        ]}
                      >

                        <Syringe
                          size={17}
                          color={COLORS.teal}
                        />

                      </View>

                      <View style={styles.recordText}>

                        <Text style={styles.recordTitle}>
                          {
                            vaccination.vaccine_name
                          }
                        </Text>

                        <Text style={styles.recordMeta}>
                          Given {
                            formatDate(
                              vaccination.date_administered
                            )
                          }
                        </Text>

                        {vaccination.dose_number ? (
                          <Text style={styles.recordMeta}>
                            Dose: {
                              vaccination.dose_number
                            }
                          </Text>
                        ) : null}

                        {vaccination.notes ? (
                          <Text style={styles.recordNotes}>
                            {
                              vaccination.notes
                            }
                          </Text>
                        ) : null}

                      </View>

                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() =>
                          removeVaccination(
                            vaccination
                          )
                        }
                      >

                        <Trash2
                          size={15}
                          color={COLORS.danger}
                        />

                      </TouchableOpacity>
                    ) : null}

                  </View>
                )
              )

            )}

          </SectionCard>

          {/* =================================================
              PRIVACY
          ================================================== */}

          <SectionCard
            title="Privacy & Consent"
            description="Control access to sensitive medical-record categories."
          >

            {!isEditing ? (
              <View style={styles.privacyReadOnlyNotice}>

                <LockKeyhole
                  size={14}
                  color={COLORS.muted}
                />

                <Text style={styles.privacyReadOnlyText}>
                  Enter Edit Mode to change privacy controls.
                </Text>

              </View>
            ) : null}

            <Text style={styles.privacyStatus}>Each switch saves separately. Profile cancel does not undo saved locks. Matching record text can be unlocked for 15 minutes by an assigned doctor using a patient code; matching may miss sensitive records.</Text>

            {SENSITIVE_CATEGORIES.map(
              category => {
                const locked =
                  lockedCategories.includes(
                    category
                  );

                return (
                  <View
                    key={category}
                    style={[
                      styles.privacyItem,
                      locked &&
                        styles.privacyItemLocked,
                    ]}
                  >

                    <View
                      style={[
                        styles.privacyIcon,
                        {
                          backgroundColor:
                            locked
                              ? COLORS.dangerSoft
                              : COLORS.tealSoft,
                        },
                      ]}
                    >

                      {locked ? (
                        <LockKeyhole
                          size={17}
                          color={COLORS.danger}
                        />
                      ) : (
                        <Unlock
                          size={17}
                          color={COLORS.teal}
                        />
                      )}

                    </View>

                    <View style={styles.privacyText}>

                      <Text style={styles.privacyTitle}>
                        {category}
                      </Text>

                      <Text
                        style={[
                          styles.privacyStatus,
                          {
                            color:
                              locked
                                ? COLORS.danger
                                : COLORS.teal,
                          },
                        ]}
                      >
                        {locked
                          ? 'Matching records need a consent code'
                          : 'No category lock selected'}
                      </Text>

                    </View>

                    <Switch
                      value={locked}
                      disabled={!isEditing || consentSaving}
                      accessibilityLabel={category}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: locked, disabled: !isEditing || consentSaving }}
                      onValueChange={() =>
                        toggleConsent(
                          category
                        )
                      }
                      trackColor={{
                        false:
                          '#DDE5E9',
                        true:
                          '#F3B6B6',
                      }}
                      thumbColor={
                        locked
                          ? COLORS.danger
                          : '#FFFFFF'
                      }
                    />

                  </View>
                );
              }
            )}

          </SectionCard>

          {/* =================================================
              GLOBAL EDIT ACTIONS
          ================================================== */}

          {isEditing ? (
            <View style={styles.editActions}>

              {saveError ? (
                <View style={styles.editError}>

                  <AlertCircle
                    size={15}
                    color={COLORS.danger}
                  />

                  <Text style={styles.editErrorText}>
                    {saveError}
                  </Text>

                </View>
              ) : null}

              <View style={styles.editActionButtons}>

                <TouchableOpacity
                  style={styles.cancelButton}
                  disabled={saving}
                  onPress={() =>
                    setIsEditing(
                      false
                    )
                  }
                >

                  <X
                    size={16}
                    color={COLORS.muted}
                  />

                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>

                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  disabled={saving}
                  onPress={saveProfile}
                >

                  {saving ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Save
                      size={16}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.saveButtonText}>
                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}
                  </Text>

                </TouchableOpacity>

              </View>

            </View>
          ) : null}

          <View style={styles.securityFooter}>

            <ShieldCheck
              size={14}
              color={COLORS.subtle}
            />

            <Text style={styles.securityFooterText}>
              Your profile and clinical safety information are protected by Care4U access controls.
            </Text>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

      {/* =====================================================
          ALLERGY MODAL
      ====================================================== */}

      <ModalShell
        visible={isAddAllergyModalOpen}
        title="Add Allergy"
        icon={AlertTriangle}
        onClose={() =>
          setIsAddAllergyModalOpen(
            false
          )
        }
      >

        <ScrollView
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Allergen Name *
            </Text>

            <TextInput
              style={styles.textInput}
              value={allergenInput}
              onChangeText={
                value => {
                  setAllergenInput(
                    value
                  );

                  setAllergySuggestions(
                    searchAllergens(
                      value
                    )
                  );
                }
              }
              placeholder="Start typing..."
              placeholderTextColor={COLORS.subtle}
            />

            {allergySuggestions.length > 0 &&
            allergenInput.length > 0 ? (
              <View style={styles.suggestions}>

                {allergySuggestions.map(
                  (
                    suggestion,
                    index
                  ) => (
                    <TouchableOpacity
                      key={`${suggestion.name}-${index}`}
                      style={styles.suggestionRow}
                      onPress={() => {
                        setAllergenInput(
                          suggestion.name
                        );

                        setAllergySuggestions(
                          []
                        );
                      }}
                    >

                      <Text style={styles.suggestionName}>
                        {
                          suggestion.name
                        }
                      </Text>

                      <Text style={styles.suggestionCategory}>
                        {
                          suggestion.category
                        }
                      </Text>

                    </TouchableOpacity>
                  )
                )}

              </View>
            ) : null}

          </View>

          <OptionSelector
            label="Severity"
            value={selectedSeverity}
            options={SEVERITY_OPTIONS}
            onSelect={setSelectedSeverity}
          />

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
              value={allergyNotes}
              onChangeText={setAllergyNotes}
              placeholder="Optional clinical notes"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingAllergy}
            onPress={addAllergyRecord}
          >

            {addingAllergy ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Plus
                size={16}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.modalSaveText}>
              Save Allergy
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

      {/* =====================================================
          CONDITION MODAL
      ====================================================== */}

      <ModalShell
        visible={isAddConditionModalOpen}
        title="Add Chronic Condition"
        icon={HeartPulse}
        onClose={() =>
          setIsAddConditionModalOpen(
            false
          )
        }
      >

        <ScrollView>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Condition Name *
            </Text>

            <TextInput
              style={styles.textInput}
              value={conditionInput}
              onChangeText={setConditionInput}
              placeholder="e.g. Type 2 Diabetes"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Diagnosed Date
            </Text>

            <TextInput
              style={styles.textInput}
              value={diagnosedAtInput}
              onChangeText={setDiagnosedAtInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
              value={conditionNotes}
              onChangeText={setConditionNotes}
              placeholder="Optional notes"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.switchCard}>

            <View style={styles.switchText}>

              <Text style={styles.switchTitle}>
                Priority condition
              </Text>

              <Text style={styles.switchDescription}>
                Highlight this condition as important clinical safety information.
              </Text>

            </View>

            <Switch
              value={isPriorityInput}
              onValueChange={setIsPriorityInput}
              trackColor={{
                false:
                  '#DDE5E9',
                true:
                  '#F3B6B6',
              }}
              thumbColor={
                isPriorityInput
                  ? COLORS.danger
                  : '#FFFFFF'
              }
            />

          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingCondition}
            onPress={addConditionRecord}
          >

            {addingCondition ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : null}

            <Text style={styles.modalSaveText}>
              {addingCondition
                ? 'Saving...'
                : 'Save Condition'}
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

      {/* =====================================================
          DEVICE MODAL
      ====================================================== */}

      <ModalShell
        visible={isAddDeviceModalOpen}
        title="Add Medical Device"
        icon={BriefcaseMedical}
        onClose={() =>
          setIsAddDeviceModalOpen(
            false
          )
        }
      >

        <ScrollView>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Device / Implant Name *
            </Text>

            <TextInput
              style={styles.textInput}
              value={deviceNameInput}
              onChangeText={setDeviceNameInput}
              placeholder="e.g. Pacemaker"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Device Type
            </Text>

            <TextInput
              style={styles.textInput}
              value={deviceTypeInput}
              onChangeText={setDeviceTypeInput}
              placeholder="e.g. Cardiac Device"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Implanted / Started Date
            </Text>

            <TextInput
              style={styles.textInput}
              value={implantedAtInput}
              onChangeText={setImplantedAtInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
              value={deviceNotesInput}
              onChangeText={setDeviceNotesInput}
              placeholder="Optional details"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.switchCard}>

            <View style={styles.switchText}>

              <Text style={styles.switchTitle}>
                Emergency Relevant
              </Text>

              <Text style={styles.switchDescription}>
                Allow this device to appear during authorized emergency access.
              </Text>

            </View>

            <Switch
              value={isEmergencyRelevantInput}
              onValueChange={setIsEmergencyRelevantInput}
              trackColor={{
                false:
                  '#DDE5E9',
                true:
                  '#A7DDD8',
              }}
              thumbColor="#FFFFFF"
            />

          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingDevice}
            onPress={addDeviceRecord}
          >

            {addingDevice ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : null}

            <Text style={styles.modalSaveText}>
              {addingDevice
                ? 'Saving...'
                : 'Save Medical Device'}
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

      {/* =====================================================
          MEDICAL BACKGROUND MODAL
      ====================================================== */}

      <ModalShell
        visible={isAddBackgroundModalOpen}
        title="Add Medical Background"
        icon={History}
        onClose={() =>
          setIsAddBackgroundModalOpen(
            false
          )
        }
      >

        <ScrollView>

          <OptionSelector
            label="Background Type"
            value={backgroundTypeInput}
            options={HEALTH_BACKGROUND_TYPES}
            onSelect={setBackgroundTypeInput}
          />

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Title *
            </Text>

            <TextInput
              style={styles.textInput}
              value={backgroundTitleInput}
              onChangeText={setBackgroundTitleInput}
              placeholder="e.g. Coronary Artery Bypass Surgery"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Event Date
            </Text>

            <TextInput
              style={styles.textInput}
              value={backgroundDateInput}
              onChangeText={setBackgroundDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
              value={backgroundNotesInput}
              onChangeText={setBackgroundNotesInput}
              placeholder="Important details"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.switchCard}>

            <View style={styles.switchText}>

              <Text style={styles.switchTitle}>
                Emergency Relevant
              </Text>

              <Text style={styles.switchDescription}>
                Include this event in authorized emergency access.
              </Text>

            </View>

            <Switch
              value={backgroundEmergencyInput}
              onValueChange={setBackgroundEmergencyInput}
              trackColor={{
                false:
                  '#DDE5E9',
                true:
                  '#A7DDD8',
              }}
              thumbColor="#FFFFFF"
            />

          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingBackground}
            onPress={addBackgroundRecord}
          >

            {addingBackground ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : null}

            <Text style={styles.modalSaveText}>
              {addingBackground
                ? 'Saving...'
                : 'Save Medical Background'}
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

      {/* =====================================================
          FAMILY HISTORY MODAL
      ====================================================== */}

      <ModalShell
        visible={isAddFamilyModalOpen}
        title="Add Family Medical History"
        icon={Users}
        onClose={() =>
          setIsAddFamilyModalOpen(
            false
          )
        }
      >

        <ScrollView>

          <OptionSelector
            label="Relationship"
            value={familyRelationInput}
            options={FAMILY_RELATIONS}
            onSelect={setFamilyRelationInput}
          />

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Medical Condition *
            </Text>

            <TextInput
              style={styles.textInput}
              value={familyConditionInput}
              onChangeText={setFamilyConditionInput}
              placeholder="e.g. Premature coronary artery disease"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.formField}>

            <Text style={styles.formLabel}>
              Notes
            </Text>

            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
              ]}
              multiline
              textAlignVertical="top"
              value={familyNotesInput}
              onChangeText={setFamilyNotesInput}
              placeholder="e.g. Heart attack at age 42"
              placeholderTextColor={COLORS.subtle}
            />

          </View>

          <View style={styles.switchCard}>

            <View style={styles.switchText}>

              <Text style={styles.switchTitle}>
                Emergency Relevant
              </Text>

              <Text style={styles.switchDescription}>
                Mark only if this history may materially affect urgent treatment.
              </Text>

            </View>

            <Switch
              value={familyEmergencyInput}
              onValueChange={setFamilyEmergencyInput}
              trackColor={{
                false:
                  '#DDE5E9',
                true:
                  '#A7DDD8',
              }}
              thumbColor="#FFFFFF"
            />

          </View>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingFamily}
            onPress={addFamilyRecord}
          >

            {addingFamily ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : null}

            <Text style={styles.modalSaveText}>
              {addingFamily
                ? 'Saving...'
                : 'Save Family History'}
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

      {/* =====================================================
          VACCINATION MODAL
      ====================================================== */}

      <ModalShell
        visible={isVaccinationModalOpen}
        title="Add Vaccinations"
        icon={Syringe}
        maxHeight="93%"
        onClose={() =>
          setIsVaccinationModalOpen(
            false
          )
        }
      >

        <View style={styles.aiScanCard}>

          <View style={styles.aiScanTitleRow}>

            <ScanLine
              size={20}
              color={COLORS.teal}
            />

            <View style={styles.aiScanTitleText}>

              <Text style={styles.aiScanTitle}>
                Smart Card Scan
              </Text>

              <Text style={styles.aiScanBadge}>
                AI ASSISTED
              </Text>

            </View>

          </View>

          <Text style={styles.aiScanDescription}>
            Scan a vaccination card to extract multiple records. AI-generated values must be reviewed before saving.
          </Text>

          <View style={styles.aiScanButtons}>

            <TouchableOpacity
              style={styles.aiScanButton}
              disabled={scanningCard}
              onPress={takeVaccinePhoto}
            >

              {scanningCard ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.teal}
                />
              ) : (
                <Camera
                  size={16}
                  color={COLORS.teal}
                />
              )}

              <Text style={styles.aiScanButtonText}>
                Camera
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiScanButton}
              disabled={scanningCard}
              onPress={chooseVaccinePhoto}
            >

              {scanningCard ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.teal}
                />
              ) : (
                <ImageIcon
                  size={16}
                  color={COLORS.teal}
                />
              )}

              <Text style={styles.aiScanButtonText}>
                Gallery
              </Text>

            </TouchableOpacity>

          </View>

        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
        >

          {bulkVaccines.map(
            (
              row,
              index
            ) => (
              <View
                key={row.id}
                style={styles.vaccineRow}
              >

                <View style={styles.vaccineRowHeader}>

                  <View style={styles.vaccineNumber}>

                    <Text style={styles.vaccineNumberText}>
                      {index + 1}
                    </Text>

                  </View>

                  <Text style={styles.vaccineRowTitle}>
                    Vaccination Record
                  </Text>

                  {bulkVaccines.length > 1 ? (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        setBulkVaccines(
                          previous =>
                            previous.filter(
                              item =>
                                item.id !==
                                row.id
                            )
                        )
                      }
                    >

                      <Trash2
                        size={14}
                        color={COLORS.danger}
                      />

                    </TouchableOpacity>
                  ) : null}

                </View>

                <View style={styles.formField}>

                  <Text style={styles.formLabel}>
                    Vaccine Name *
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    value={row.vaccineName}
                    onFocus={() => {
                      setActiveVaccineRow(
                        row.id
                      );

                      setVaccineSuggestions(
                        searchVaccines(
                          row.vaccineName
                        )
                      );
                    }}
                    onChangeText={
                      value =>
                        updateVaccineRow(
                          row.id,
                          'vaccineName',
                          value
                        )
                    }
                    placeholder="e.g. BCG"
                    placeholderTextColor={COLORS.subtle}
                  />

                  {activeVaccineRow === row.id &&
                  vaccineSuggestions.length > 0 &&
                  row.vaccineName ? (
                    <View style={styles.suggestions}>

                      {vaccineSuggestions.map(
                        (
                          suggestion,
                          suggestionIndex
                        ) => (
                          <TouchableOpacity
                            key={`${suggestion.name}-${suggestionIndex}`}
                            style={styles.suggestionRow}
                            onPress={() => {
                              updateVaccineRow(
                                row.id,
                                'vaccineName',
                                suggestion.name
                              );

                              setActiveVaccineRow(
                                null
                              );
                            }}
                          >

                            <Text style={styles.suggestionName}>
                              {
                                suggestion.name
                              }
                            </Text>

                            <Text style={styles.suggestionCategory}>
                              {
                                suggestion.category
                              }
                            </Text>

                          </TouchableOpacity>
                        )
                      )}

                    </View>
                  ) : null}

                </View>

                <View style={styles.formField}>

                  <Text style={styles.formLabel}>
                    Date Administered *
                  </Text>

                  <TextInput
                    style={styles.textInput}
                    value={row.dateAdministered}
                    onChangeText={
                      value =>
                        updateVaccineRow(
                          row.id,
                          'dateAdministered',
                          value
                        )
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.subtle}
                  />

                </View>

                <View style={styles.splitFields}>

                  <View style={styles.splitField}>

                    <Text style={styles.formLabel}>
                      Dose
                    </Text>

                    <TextInput
                      style={styles.textInput}
                      value={row.doseNumber}
                      onChangeText={
                        value =>
                          updateVaccineRow(
                            row.id,
                            'doseNumber',
                            value
                          )
                      }
                      placeholder="Optional"
                      placeholderTextColor={COLORS.subtle}
                    />

                  </View>

                  <View style={styles.splitField}>

                    <Text style={styles.formLabel}>
                      Notes
                    </Text>

                    <TextInput
                      style={styles.textInput}
                      value={row.notes}
                      onChangeText={
                        value =>
                          updateVaccineRow(
                            row.id,
                            'notes',
                            value
                          )
                      }
                      placeholder="Optional"
                      placeholderTextColor={COLORS.subtle}
                    />

                  </View>

                </View>

              </View>
            )
          )}

          <TouchableOpacity
            style={styles.addAnotherButton}
            onPress={addVaccineRow}
          >

            <Plus
              size={16}
              color={COLORS.teal}
            />

            <Text style={styles.addAnotherText}>
              Add Another Record
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalSaveButton}
            disabled={addingVaccinations}
            onPress={saveVaccinations}
          >

            {addingVaccinations ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : null}

            <Text style={styles.modalSaveText}>
              {addingVaccinations
                ? 'Saving...'
                : 'Save All Records'}
            </Text>

          </TouchableOpacity>

        </ScrollView>

      </ModalShell>

    </SafeAreaView>
  );
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  /* =====================================================
     PROFILE HERO
  ====================================================== */

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
    marginBottom: 15,

    shadowColor:
      '#0F172A',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  heroBackground: {
    height: 115,
    backgroundColor:
      COLORS.navy,
    overflow: 'hidden',
  },

  heroCircleOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -65,
    top: -95,
    backgroundColor:
      'rgba(15,139,131,0.42)',
  },

  heroCircleTwo: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    left: 20,
    top: -25,
    backgroundColor:
      'rgba(255,255,255,0.07)',
  },

  avatarPosition: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },

  avatarOuter: {
    width: 130,
    height: 130,
    padding: 5,
    borderRadius: 65,
    backgroundColor:
      COLORS.surface,

    shadowColor:
      '#0F172A',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },

  avatarInner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 60,
    backgroundColor:
      COLORS.navy,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      COLORS.navy,
  },

  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },

  photoButton: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor:
      COLORS.surface,
    backgroundColor:
      COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroContent: {
    paddingTop: 76,
    paddingHorizontal: 17,
    paddingBottom: 17,
    alignItems: 'center',
  },

  heroEyebrow: {
    color:
      COLORS.teal,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroName: {
    color:
      COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },

  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },

  heroMetaText: {
    color:
      COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },

  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      COLORS.subtle,
  },

  bloodBadge: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor:
      COLORS.danger,
  },

  bloodBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  primaryEditButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      COLORS.teal,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 15,
  },

  primaryEditButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  editingBanner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor:
      COLORS.tealSoft,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 14,
  },

  editingBannerText: {
    color:
      COLORS.tealDark,
    fontSize: 9,
    fontWeight: '800',
  },

  /* =====================================================
     SUMMARY
  ====================================================== */

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 15,
  },

  summaryCard: {
    width: '48%',
    minHeight: 105,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.surface,
    padding: 13,

    shadowColor:
      '#0F172A',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  summaryValue: {
    color:
      COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },

  summaryLabel: {
    color:
      COLORS.muted,
    fontSize: 8,
    marginTop: 2,
    fontWeight: '600',
  },

  /* =====================================================
     SECTION CARDS
  ====================================================== */

  sectionCard: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 21,
    backgroundColor:
      COLORS.surface,
    overflow: 'hidden',
    marginBottom: 14,

    shadowColor:
      '#0F172A',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    gap: 10,

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    color:
      COLORS.navy,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  sectionDescription: {
    color:
      COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
    maxWidth: 290,
  },

  sectionAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    borderRadius: 10,

    paddingHorizontal: 10,
    paddingVertical: 7,

    backgroundColor:
      COLORS.tealSoft,
  },

  sectionAddText: {
    color:
      COLORS.tealDark,
    fontSize: 9,
    fontWeight: '800',
  },

  sectionBody: {
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor:
      '#FBFCFD',
  },

  /* =====================================================
     INFORMATION ROWS
  ====================================================== */

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF2F4',
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor:
      COLORS.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoText: {
    flex: 1,
  },

  infoLabel: {
    color:
      COLORS.subtle,
    fontSize: 7,
    fontWeight: '800',
    textTransform:
      'uppercase',
    letterSpacing: 0.6,
  },

  infoValue: {
    color:
      COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  /* =====================================================
     RECORDS
  ====================================================== */

  recordItem: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    gap: 8,

    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF2F4',
  },

  priorityRecord: {
    borderRadius: 14,
    borderBottomWidth: 0,

    backgroundColor:
      COLORS.dangerSoft,

    paddingHorizontal: 10,
    marginTop: 7,
    marginBottom: 4,
  },

  recordMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems:
      'flex-start',
  },

  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  recordText: {
    flex: 1,
    minWidth: 0,
  },

  recordTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },

  recordTitle: {
    flexShrink: 1,
    color:
      COLORS.text,
    fontSize: 11,
    fontWeight: '800',
  },

  recordMeta: {
    color:
      COLORS.muted,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
  },

  recordAccent: {
    color:
      COLORS.tealDark,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 4,
  },

  recordNotes: {
    color:
      COLORS.textSoft,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
  },

  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor:
      COLORS.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  severityBadge: {
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  severityBadgeText: {
    fontSize: 7,
    fontWeight: '800',
  },

  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor:
      COLORS.dangerSoft,
  },

  emergencyBadgeText: {
    color:
      COLORS.danger,
    fontSize: 6,
    fontWeight: '800',
  },

  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    borderRadius: 13,

    backgroundColor:
      COLORS.background,

    padding: 12,
    marginTop: 9,
  },

  emptySectionText: {
    flex: 1,
    color:
      COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
  },

  clinicalNotice: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 7,

    borderRadius: 13,

    backgroundColor:
      COLORS.tealSoft,

    padding: 10,
    marginTop: 8,
    marginBottom: 2,
  },

  clinicalNoticeText: {
    flex: 1,
    color:
      COLORS.tealDark,
    fontSize: 8,
    lineHeight: 13,
  },

  /* =====================================================
     PRIVACY
  ====================================================== */

  privacyReadOnlyNotice: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',

    borderRadius: 11,

    backgroundColor:
      COLORS.background,

    padding: 10,
    marginTop: 8,
  },

  privacyReadOnlyText: {
    color:
      COLORS.muted,
    fontSize: 8,
  },

  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 15,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,

    padding: 11,
    marginTop: 9,
  },

  privacyItemLocked: {
    borderColor:
      '#F0CCCC',

    backgroundColor:
      COLORS.dangerSoft,
  },

  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  privacyText: {
    flex: 1,
    marginRight: 6,
  },

  privacyTitle: {
    color:
      COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },

  privacyStatus: {
    fontSize: 7,
    marginTop: 3,
    fontWeight: '700',
  },

  /* =====================================================
     FORMS
  ====================================================== */

  formField: {
    marginTop: 13,
    position: 'relative',
  },

  formLabel: {
    color:
      COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    textTransform:
      'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  textInput: {
    minHeight: 45,

    borderRadius: 13,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,

    color:
      COLORS.text,

    fontSize: 11,

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  multilineInput: {
    minHeight: 82,
    textAlignVertical:
      'top',
  },

  selectorButton: {
    minHeight: 45,

    borderRadius: 13,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal: 12,
  },

  selectorButtonOpen: {
    borderColor:
      COLORS.teal,

    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  selectorValue: {
    color:
      COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },

  selectorPlaceholder: {
    color:
      COLORS.subtle,
    fontSize: 11,
  },

  optionsList: {
    borderWidth: 1,
    borderTopWidth: 0,

    borderColor:
      COLORS.teal,

    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,

    overflow: 'hidden',

    backgroundColor:
      COLORS.surface,
  },

  optionItem: {
    minHeight: 42,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingHorizontal: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  optionItemSelected: {
    backgroundColor:
      COLORS.tealSoft,
  },

  optionText: {
    color:
      COLORS.textSoft,
    fontSize: 11,
  },

  optionTextSelected: {
    color:
      COLORS.tealDark,
    fontWeight: '800',
  },

  readOnlyNotice: {
    flexDirection: 'row',
    gap: 6,

    alignItems:
      'flex-start',

    borderRadius: 12,

    backgroundColor:
      COLORS.background,

    padding: 10,
    marginTop: 13,
  },

  readOnlyNoticeText: {
    flex: 1,

    color:
      COLORS.muted,

    fontSize: 8,
    lineHeight: 13,
  },

  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor:
      COLORS.border,

    borderRadius: 14,

    padding: 12,
    marginTop: 14,

    backgroundColor:
      COLORS.background,
  },

  switchText: {
    flex: 1,
    marginRight: 10,
  },

  switchTitle: {
    color:
      COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },

  switchDescription: {
    color:
      COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  /* =====================================================
     MODALS
  ====================================================== */

  modalOverlay: {
    flex: 1,

    justifyContent:
      'flex-end',

    backgroundColor:
      'rgba(15,23,42,0.55)',
  },

  modalContent: {
    backgroundColor:
      COLORS.surface,

    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,

    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 22,
  },

  modalHandle: {
    alignSelf: 'center',

    width: 42,
    height: 4,

    borderRadius: 99,

    backgroundColor:
      '#D6DEE3',

    marginBottom: 11,
  },

  modalHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    paddingBottom: 12,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  modalHeaderLeft: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',
  },

  modalHeaderIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor:
      COLORS.tealSoft,

    marginRight: 9,
  },

  modalTitle: {
    flex: 1,

    color:
      COLORS.text,

    fontSize: 14,

    fontWeight: '800',
  },

  modalCloseButton: {
    width: 38,
    height: 38,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor:
      COLORS.background,
  },

  modalSaveButton: {
    minHeight: 49,

    borderRadius: 14,

    backgroundColor:
      COLORS.teal,

    flexDirection: 'row',

    justifyContent: 'center',
    alignItems: 'center',

    gap: 7,

    marginTop: 16,
  },

  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  suggestions: {
    borderWidth: 1,
    borderTopWidth: 0,

    borderColor:
      COLORS.border,

    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,

    overflow: 'hidden',

    backgroundColor:
      COLORS.surface,
  },

  suggestionRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    gap: 8,

    padding: 11,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  suggestionName: {
    flex: 1,

    color:
      COLORS.text,

    fontSize: 10,

    fontWeight: '700',
  },

  suggestionCategory: {
    color:
      COLORS.subtle,

    fontSize: 7,

    textTransform:
      'uppercase',
  },

  /* =====================================================
     VACCINATION MODAL
  ====================================================== */

  aiScanCard: {
    borderRadius: 17,

    borderWidth: 1,
    borderColor:
      '#CAE7E4',

    backgroundColor:
      COLORS.tealSoft,

    padding: 13,

    marginTop: 13,
    marginBottom: 9,
  },

  aiScanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiScanTitleText: {
    marginLeft: 8,
  },

  aiScanTitle: {
    color:
      COLORS.tealDark,

    fontSize: 11,

    fontWeight: '800',
  },

  aiScanBadge: {
    color:
      COLORS.teal,

    fontSize: 6,

    fontWeight: '800',

    letterSpacing: 0.7,

    marginTop: 2,
  },

  aiScanDescription: {
    color:
      COLORS.tealDark,

    fontSize: 8,

    lineHeight: 13,

    opacity: 0.8,

    marginTop: 8,
  },

  aiScanButtons: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 10,
  },

  aiScanButton: {
    flex: 1,

    minHeight: 40,

    borderRadius: 12,

    borderWidth: 1,
    borderColor:
      '#C9E8E5',

    backgroundColor:
      COLORS.surface,

    flexDirection: 'row',

    gap: 6,

    alignItems: 'center',

    justifyContent: 'center',
  },

  aiScanButtonText: {
    color:
      COLORS.tealDark,

    fontSize: 9,

    fontWeight: '800',
  },

  vaccineRow: {
    borderRadius: 15,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    padding: 12,

    backgroundColor:
      COLORS.background,

    marginBottom: 10,
  },

  vaccineRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  vaccineNumber: {
    width: 28,
    height: 28,

    borderRadius: 9,

    backgroundColor:
      COLORS.navy,

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 7,
  },

  vaccineNumberText: {
    color: '#FFFFFF',

    fontSize: 8,

    fontWeight: '800',
  },

  vaccineRowTitle: {
    flex: 1,

    color:
      COLORS.text,

    fontSize: 10,

    fontWeight: '800',
  },

  splitFields: {
    flexDirection: 'row',
    gap: 8,
  },

  splitField: {
    flex: 1,
  },

  addAnotherButton: {
    minHeight: 44,

    borderRadius: 13,

    borderWidth: 1,

    borderStyle: 'dashed',

    borderColor:
      '#B7D9D5',

    backgroundColor:
      COLORS.tealSoft,

    flexDirection: 'row',

    gap: 6,

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 3,
  },

  addAnotherText: {
    color:
      COLORS.tealDark,

    fontSize: 9,

    fontWeight: '800',
  },

  /* =====================================================
     GLOBAL EDIT ACTIONS
  ====================================================== */

  editActions: {
    borderRadius: 20,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,

    padding: 14,

    marginBottom: 13,
  },

  editError: {
    flexDirection: 'row',

    alignItems:
      'flex-start',

    gap: 7,

    borderRadius: 12,

    backgroundColor:
      COLORS.dangerSoft,

    padding: 10,

    marginBottom: 10,
  },

  editErrorText: {
    flex: 1,

    color:
      COLORS.danger,

    fontSize: 8,

    lineHeight: 13,
  },

  editActionButtons: {
    flexDirection: 'row',

    gap: 9,
  },

  cancelButton: {
    flex: 1,

    minHeight: 48,

    borderRadius: 14,

    borderWidth: 1,

    borderColor:
      COLORS.border,

    backgroundColor:
      COLORS.surface,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,
  },

  cancelButtonText: {
    color:
      COLORS.muted,

    fontSize: 10,

    fontWeight: '800',
  },

  saveButton: {
    flex: 2,

    minHeight: 48,

    borderRadius: 14,

    backgroundColor:
      COLORS.teal,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,
  },

  saveButtonText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',
  },

  successBanner: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 7,

    borderRadius: 14,

    backgroundColor:
      COLORS.greenSoft,

    padding: 11,

    marginBottom: 13,
  },

  successText: {
    color:
      COLORS.green,

    fontSize: 9,

    fontWeight: '800',
  },

  /* =====================================================
     GENERAL STATES
  ====================================================== */

  securityFooter: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'center',

    gap: 6,

    paddingHorizontal: 16,

    marginTop: 3,
  },

  securityFooterText: {
    flex: 1,

    color:
      COLORS.subtle,

    fontSize: 8,

    lineHeight: 13,

    textAlign: 'center',
  },

  centerScreen: {
    flex: 1,

    backgroundColor:
      COLORS.background,

    justifyContent: 'center',

    alignItems: 'center',

    paddingHorizontal: 28,
  },

  centerIcon: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor:
      COLORS.tealSoft,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 14,
  },

  centerTitle: {
    color:
      COLORS.text,

    fontSize: 16,

    fontWeight: '800',

    marginTop: 11,
  },

  centerDescription: {
    color:
      COLORS.muted,

    fontSize: 10,

    lineHeight: 16,

    textAlign: 'center',

    maxWidth: 280,

    marginTop: 5,
  },

  retryButton: {
    borderRadius: 13,

    paddingHorizontal: 15,

    paddingVertical: 11,

    backgroundColor:
      COLORS.teal,

    marginTop: 15,
  },

  retryButtonText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',
  },
});

export default PatientProfileScreen;