/**
 * @file    App.js
 * @module  Root
 * @desc    Root component for the Care4U mobile app.
 *          Provides shared authentication, premium patient navigation,
 *          persistent bottom tabs, overlay workflows, and logout.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import React, {
  useState,
  useRef,
} from 'react';

import {
  View,
  Alert,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';

import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Home,
  LogOut,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react-native';

import {
  StatusBar,
} from 'expo-status-bar';

import api from './src/services/api';

import useAuthStore from './src/store/authStore';

// AUTH SCREENS
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// DOCTOR
import DoctorProfileScreen from './src/screens/DoctorProfileScreen';

// PATIENT
import PatientHomeScreen from './src/screens/PatientHomeScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import PatientQRCardScreen from './src/screens/PatientQRCardScreen';
import PrescriptionsScreen from './src/screens/PrescriptionsScreen';
import MedicalRecordsScreen from './src/screens/MedicalRecordsScreen';
import LabReportsScreen from './src/screens/LabReportsScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import DoctorSearchScreen from './src/screens/DoctorSearchScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import MyAppointmentsScreen from './src/screens/MyAppointmentsScreen';

// EMERGENCY
import EmergencySOS from './src/components/EmergencySOS';

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

  teal: '#0F8B83',
  tealDark: '#0B6F69',
  tealSoft: '#E7F7F5',

  danger: '#C94C4C',
  dangerSoft: '#FFF1F1',
};

/* =========================================================
   NAVIGATION CONFIGURATION
========================================================= */

const TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
  },
  {
    key: 'search',
    label: 'Doctors',
    icon: Search,
  },
  {
    key: 'appointments',
    label: 'Visits',
    icon: CalendarDays,
  },
  {
    key: 'records',
    label: 'Records',
    icon: FileText,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: UserRound,
  },
];

const TAB_TITLES = {
  home: 'Patient Portal',
  search: 'Find a Doctor',
  appointments: 'My Appointments',
  records: 'Medical Records',
  profile: 'My Profile',
};

const OVERLAY_TITLES = {
  BookAppointment: 'Book Appointment',
  prescriptions: 'Prescriptions',
  labreports: 'Lab Reports',
  qrcard: 'My QR Card',
  aichat: 'AI Health Assistant',
};

/* =========================================================
   SHARED HEADER
========================================================= */

/**
 * @component MobileHeader
 * @desc      Premium shared authenticated header using the Care4U logo.
 */
const MobileHeader = ({
  title,
  canGoBack = false,
  onBack,
  onLogout,
}) => {
  return (
    <View style={styles.header}>

      <View style={styles.headerLeft}>

        {canGoBack ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft
              size={19}
              color={COLORS.navy}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandMark}>

            <Image
              source={
                require('./assets/logo.png')
              }
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Care4U logo"
            />

          </View>
        )}

        <View style={styles.headerTextBlock}>

          <Text style={styles.brandName}>
            Care4U
          </Text>

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {title}
          </Text>

        </View>

      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <LogOut
          size={18}
          color={COLORS.danger}
          strokeWidth={2.2}
        />
      </TouchableOpacity>

    </View>
  );
};

/* =========================================================
   PREMIUM TAB BAR
========================================================= */

/**
 * @component PatientTabBar
 * @desc      Premium persistent patient bottom navigation.
 */
const PatientTabBar = ({
  activeTab,
  onSelect,
}) => {
  return (
    <View style={styles.tabDock}>

      <View style={styles.tabBar}>

        {TABS.map(
          (
            tab
          ) => {
            const isActive =
              activeTab ===
              tab.key;

            const Icon =
              tab.icon;

            return (
              <TouchableOpacity
                key={
                  tab.key
                }
                style={styles.tabItem}
                activeOpacity={0.72}
                onPress={() =>
                  onSelect(
                    tab.key
                  )
                }
                accessibilityRole="button"
                accessibilityState={{
                  selected:
                    isActive,
                }}
                accessibilityLabel={
                  tab.label
                }
              >

                <View
                  style={[
                    styles.tabIconContainer,

                    isActive &&
                      styles.tabIconContainerActive,
                  ]}
                >
                  <Icon
                    size={20}
                    color={
                      isActive
                        ? COLORS.teal
                        : COLORS.subtle
                    }
                    strokeWidth={
                      isActive
                        ? 2.5
                        : 2
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.tabLabel,

                    isActive &&
                      styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>

              </TouchableOpacity>
            );
          }
        )}

      </View>

    </View>
  );
};

/* =========================================================
   ROOT APPLICATION
========================================================= */

/** @component App @returns {JSX.Element} Existing app/navigation shell; Stage 3A review covers auth screens, public identity and logout only. */
export default function App() {
  const logoutInFlight = useRef(false);
  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const setUser =
    useAuthStore(
      (state) =>
        state.setUser
    );

  const clearUser =
    useAuthStore(
      (state) =>
        state.clearUser
    );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'home'
  );

  const [
    authScreen,
    setAuthScreen,
  ] = useState(
    'login'
  );

  const [
    pendingEmail,
    setPendingEmail,
  ] = useState(
    ''
  );

  const [
    overlayScreen,
    setOverlayScreen,
  ] = useState(
    null
  );

  const [
    bookingParams,
    setBookingParams,
  ] = useState(
    {}
  );

  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  /** @returns {Promise<void>} Clear local identity only after acknowledged server logout; failure keeps a retry path. */
  const handleLogout = async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    try {
      const response = await api.post('/api/auth/logout', {}, { timeout: 15000 });
      if (response.data?.success !== true) throw new Error('Logout not acknowledged');
      clearUser();
      setAuthScreen('login');
      setActiveTab('home');
      setOverlayScreen(null);
      setBookingParams({});
    } catch {
      Alert.alert('Sign-out not confirmed', 'Your session may still be active. Check your connection and try signing out again.');
    } finally {
      logoutInFlight.current = false;
    }
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const manualNavigate = (
    screenName,
    params = {}
  ) => {
    const targetTab =
      TABS.find(
        (
          tab
        ) =>
          tab.key ===
          screenName
      );

    if (targetTab) {
      setOverlayScreen(
        null
      );

      setBookingParams(
        {}
      );

      setActiveTab(
        screenName
      );

      return;
    }

    if (
      screenName ===
      'BookAppointment'
    ) {
      setBookingParams(
        params
      );

      setOverlayScreen(
        'BookAppointment'
      );

      return;
    }

    setOverlayScreen(
      screenName
    );
  };

  const closeOverlay =
    () => {
      setOverlayScreen(
        null
      );

      setBookingParams(
        {}
      );
    };

  /* =======================================================
     AUTH SCREENS
  ======================================================= */

  // Auth callbacks carry pending email to OTP, return pending professionals to sign-in,
  // and admit acknowledged public identities. Screen selection changes UI state only;
  // it does not restore native cookies or grant backend permissions.
  if (!user) {
    if (
      authScreen ===
      'register'
    ) {
      return (
        <>
          <StatusBar
            style="dark"
            backgroundColor={
              COLORS.background
            }
          />

          <RegisterScreen
            onRegisterSuccess={({
              email,
            }) => {
              setPendingEmail(
                email
              );

              setAuthScreen(
                'verify-otp'
              );
            }}
            onBackToLogin={() =>
              setAuthScreen(
                'login'
              )
            }
          />
        </>
      );
    }

    if (
      authScreen ===
      'verify-otp'
    ) {
      return (
        <>
          <StatusBar
            style="dark"
            backgroundColor={
              COLORS.background
            }
          />

          <OtpVerificationScreen
            email={
              pendingEmail
            }
            onVerifySuccess={({ user: verifiedUser, approvalPending }) => {
              if (approvalPending) {
                setPendingEmail('');
                setAuthScreen('login');
                return;
              }

              setUser(verifiedUser);
              setActiveTab('home');
            }}
            onBackToRegister={() =>
              setAuthScreen(
                'register'
              )
            }
          />
        </>
      );
    }

    if (
      authScreen ===
      'forgot-password'
    ) {
      return (
        <>
          <StatusBar
            style="dark"
            backgroundColor={
              COLORS.background
            }
          />

          <ForgotPasswordScreen
            onBackToLogin={() =>
              setAuthScreen(
                'login'
              )
            }
            onResetPassword={() =>
              setAuthScreen(
                'reset-password'
              )
            }
          />
        </>
      );
    }

    if (
      authScreen ===
      'reset-password'
    ) {
      return (
        <>
          <StatusBar
            style="dark"
            backgroundColor={
              COLORS.background
            }
          />

          <ResetPasswordScreen
            onBackToLogin={() =>
              setAuthScreen(
                'login'
              )
            }
          />
        </>
      );
    }

    return (
      <>
        <StatusBar
          style="dark"
          backgroundColor={
            COLORS.background
          }
        />

        <LoginScreen
          onLoginSuccess={(
            userData
          ) => {
            setUser(
              userData
            );

            setActiveTab(
              'home'
            );

            setOverlayScreen(
              null
            );
          }}
          onForgotPassword={() =>
            setAuthScreen(
              'forgot-password'
            )
          }
          onRegister={() =>
            setAuthScreen(
              'register'
            )
          }
        />
      </>
    );
  }

  /* =======================================================
     DOCTOR MOBILE FALLBACK
  ======================================================= */

  if (
    user.role ===
    'doctor'
  ) {
    return (
      <View style={styles.root}>

        <StatusBar
          style="dark"
          backgroundColor={
            COLORS.surface
          }
        />

        <MobileHeader
          title="Doctor Profile"
          onLogout={
            handleLogout
          }
        />

        <View style={styles.screen}>

          <DoctorProfileScreen
            doctorId={
              user.profile_id
            }
          />

        </View>

      </View>
    );
  }

  /* =======================================================
     UNSUPPORTED MOBILE ROLES
  ======================================================= */

  if (
    user.role !==
    'patient'
  ) {
    return (
      <View style={styles.root}>

        <StatusBar
          style="dark"
          backgroundColor={
            COLORS.surface
          }
        />

        <MobileHeader
          title="Mobile Access"
          onLogout={
            handleLogout
          }
        />

        <View
          style={[
            styles.screen,
            styles.centeredMessage,
          ]}
        >

          <View style={styles.placeholderIcon}>

            <Stethoscope
              size={28}
              color={COLORS.teal}
            />

          </View>

          <Text style={styles.placeholderTitle}>
            Web workspace required
          </Text>

          <Text style={styles.placeholderText}>
            The Care4U mobile app does not currently provide a dedicated workspace for the {user.role} role. Please use the web application for this account.
          </Text>

        </View>

      </View>
    );
  }

  /* =======================================================
     PATIENT APPLICATION
  ======================================================= */

  const currentTitle =
    overlayScreen
      ? (
          OVERLAY_TITLES[
            overlayScreen
          ] ||
          'Care4U'
        )
      : (
          TAB_TITLES[
            activeTab
          ] ||
          'Patient Portal'
        );

  return (
    <View style={styles.root}>

      <StatusBar
        style="dark"
        backgroundColor={
          COLORS.surface
        }
      />

      <MobileHeader
        title={
          currentTitle
        }
        canGoBack={
          Boolean(
            overlayScreen
          )
        }
        onBack={
          closeOverlay
        }
        onLogout={
          handleLogout
        }
      />

      <View style={styles.screen}>

        {/* =================================================
            SECONDARY PATIENT WORKFLOWS
        ================================================= */}

        {overlayScreen ===
          'BookAppointment' && (
          <BookAppointmentScreen
            doctorId={
              bookingParams
                .doctorId
            }
            rescheduleId={
              bookingParams
                .rescheduleId
            }
            navigate={
              manualNavigate
            }
          />
        )}

        {overlayScreen ===
          'prescriptions' && (
          <PrescriptionsScreen />
        )}

        {overlayScreen ===
          'labreports' && (
          <LabReportsScreen />
        )}

        {overlayScreen ===
          'qrcard' && (
          <PatientQRCardScreen />
        )}

        {overlayScreen ===
          'aichat' && (
          <AIChatScreen
            patientId={
              user.profile_id
            }
          />
        )}

        {/* =================================================
            MAIN PATIENT TABS
        ================================================= */}

        {!overlayScreen && (
          <>
            {activeTab ===
              'home' && (
              <PatientHomeScreen
                navigate={
                  manualNavigate
                }
              />
            )}

            {activeTab ===
              'search' && (
              <DoctorSearchScreen
                navigate={
                  manualNavigate
                }
              />
            )}

            {activeTab ===
              'appointments' && (
              <MyAppointmentsScreen
                navigate={
                  manualNavigate
                }
              />
            )}

            {activeTab ===
              'records' && (
              <MedicalRecordsScreen />
            )}

            {activeTab ===
              'profile' && (
              <PatientProfileScreen
                patientId={
                  user.profile_id
                }
              />
            )}
          </>
        )}

        <EmergencySOS />

      </View>

      <PatientTabBar
        activeTab={
          activeTab
        }
        onSelect={
          manualNavigate
        }
      />

    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    root: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    /* =====================================================
       HEADER
    ====================================================== */

    header: {
      paddingTop:
        Platform.OS ===
        'ios'
          ? 52
          : (
              RNStatusBar
                .currentHeight ||
              24
            ) + 7,

      paddingBottom: 12,

      paddingHorizontal: 18,

      flexDirection: 'row',

      alignItems: 'flex-end',

      justifyContent:
        'space-between',

      backgroundColor:
        COLORS.surface,

      borderBottomWidth: 1,

      borderBottomColor:
        COLORS.border,
    },

    headerLeft: {
      flex: 1,

      minWidth: 0,

      flexDirection: 'row',

      alignItems: 'center',

      paddingRight: 12,
    },

    brandMark: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.08,

      shadowRadius: 8,

      elevation: 2,
    },

    brandLogo: {
      width: 34,
      height: 34,
    },

    headerButton: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        '#F4F7F8',

      borderWidth: 1,

      borderColor:
        COLORS.border,
    },

    headerTextBlock: {
      flex: 1,

      minWidth: 0,

      marginLeft: 11,
    },

    brandName: {
      color:
        COLORS.teal,

      fontSize: 10,

      fontWeight: '800',

      letterSpacing: 1,

      textTransform:
        'uppercase',
    },

    headerTitle: {
      color:
        COLORS.text,

      fontSize: 16,

      lineHeight: 21,

      fontWeight: '800',

      marginTop: 1,
    },

    logoutButton: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.dangerSoft,

      borderWidth: 1,

      borderColor:
        '#F2D4D4',
    },

    /* =====================================================
       TAB DOCK
    ====================================================== */

    tabDock: {
      backgroundColor:
        COLORS.background,

      paddingHorizontal: 12,

      paddingTop: 7,

      paddingBottom:
        Platform.OS ===
        'ios'
          ? 22
          : 9,
    },

    tabBar: {
      minHeight: 68,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.surface,

      borderRadius: 22,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      paddingHorizontal: 6,

      paddingVertical: 7,

      shadowColor:
        '#0F172A',

      shadowOffset: {
        width: 0,
        height: -1,
      },

      shadowOpacity: 0.08,

      shadowRadius: 14,

      elevation: 7,
    },

    tabItem: {
      flex: 1,

      minWidth: 0,

      alignItems: 'center',

      justifyContent:
        'center',

      paddingHorizontal: 2,
    },

    tabIconContainer: {
      width: 38,
      height: 32,

      borderRadius: 12,

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 2,
    },

    tabIconContainerActive: {
      backgroundColor:
        COLORS.tealSoft,
    },

    tabLabel: {
      color:
        COLORS.subtle,

      fontSize: 9,

      lineHeight: 12,

      fontWeight: '600',

      textAlign: 'center',
    },

    tabLabelActive: {
      color:
        COLORS.tealDark,

      fontWeight: '800',
    },

    /* =====================================================
       UNSUPPORTED ROLE PLACEHOLDER
    ====================================================== */

    centeredMessage: {
      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 30,

      paddingBottom: 40,
    },

    placeholderIcon: {
      width: 58,
      height: 58,

      borderRadius: 18,

      alignItems: 'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.tealSoft,

      marginBottom: 18,
    },

    placeholderTitle: {
      color:
        COLORS.text,

      fontSize: 18,

      fontWeight: '800',

      textAlign: 'center',

      marginBottom: 8,
    },

    placeholderText: {
      color:
        COLORS.muted,

      fontSize: 13,

      lineHeight: 20,

      textAlign: 'center',

      maxWidth: 340,
    },
  });
