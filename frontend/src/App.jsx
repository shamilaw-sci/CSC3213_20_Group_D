/**
 * @file    App.jsx
 * @module  Web Routing
 * @desc    Chooses which pages each user can open and restores login sessions.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { API_BASE_URL } from './services/api';

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import PatientLayout          from './components/layout/PatientLayout';
import AdminLayout            from './components/layout/AdminLayout';
import HospitalLayout         from './components/layout/HospitalLayout';
import DoctorLayout from './components/layout/DoctorLayout';
import PharmacyLayout from './components/layout/PharmacyLayout';
import LabLayout from './components/layout/LabLayout';

import PatientProfilePage     from './pages/patient/PatientProfilePage';
import MedicalRecordsPage     from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage      from './pages/patient/PrescriptionsPage';
import PatientLookupPage      from './pages/patient/PatientLookupPage';

import LoginPage              from './pages/auth/LoginPage';
import RegisterPage           from './pages/auth/RegisterPage';
import ForgotPasswordPage     from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage      from './pages/auth/ResetPasswordPage';
import OtpVerificationPage    from './pages/auth/OtpVerificationPage';

import DoctorDashboard        from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage   from './pages/doctor/AppointmentQueuePage';
import DoctorProfilePage      from './pages/doctor/DoctorProfilePage';
import ConsultationPage from './pages/doctor/ConsultationPage';

import PharmacyLookupPage     from './pages/pharmacy/PharmacyLookupPage';
import PharmacyRegisterPage   from './pages/pharmacy/PharmacyRegisterPage';
import PharmacyDashboard      from './pages/pharmacy/PharmacyDashboard';
import PatientQRLookupPage    from './pages/pharmacy/PatientQRLookupPage';
import PharmacyProfilePage    from './pages/pharmacy/PharmacyProfilePage';
import PharmacyDispensingHistoryPage
  from './pages/pharmacy/PharmacyDispensingHistoryPage';

import LabDashboard from './pages/laboratory/LabDashboard';
import LabQueuePage from './pages/laboratory/LabQueuePage';
import LabReportUploadPage from './pages/laboratory/LabReportUploadPage';
import LabRegisterPage from './pages/laboratory/LabRegisterPage';

import PaymentHistoryPage     from './pages/patient/PaymentHistoryPage';
import OrderTrackerPage       from './pages/patient/OrderTrackerPage';
import LabReportsPage         from './pages/patient/LabReportsPage';
import DoctorSearchPage       from './pages/patient/DoctorSearchPage';
import BookAppointmentPage    from './pages/patient/BookAppointmentPage';
import MyAppointmentsPage     from './pages/patient/MyAppointmentsPage';

import AIChatWidget           from './components/chat/AIChatWidget';

import HospitalHomePage from './pages/hospital/HospitalHomePage';
import HospitalEmergencyPage from './pages/hospital/HospitalEmergencyPage';
import HospitalOPDPage from './pages/hospital/HospitalOPDPage';

import EmergencySnapshotPage from './pages/emergency/EmergencySnapshotPage';

import AdminApprovalsPage from './pages/admin/AdminApprovalsPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminAccountManagementPage from './pages/admin/AdminAccountManagementPage';
import AdminRbacPanelPage from './pages/admin/AdminRbacPanelPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import AdminHealthContentPage from './pages/admin/AdminHealthContentPage';
import AdminEmergencyOversightPage from './pages/admin/AdminEmergencyOversightPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminQrReissuePage from './pages/admin/AdminQrReissuePage';
import AdminSystemSettingsPage from './pages/admin/AdminSystemSettingsPage';

/**
 * FEATURE: Protect pages by user role.
 * LOGIC: No login or wrong role → Send user to Login Page.
 * A wrong role also clears the saved user; the backend checks real permissions.
 */
const ProtectedRoute = ({
  children,
  allowedRoles
}) => {
  const user =
    useAuthStore(
      state => state.user
    );

  const clearUser =
    useAuthStore(
      state => state.clearUser
    );

  const roleMismatch = Boolean(user && allowedRoles && !allowedRoles.includes(user.role));
  // Clear an incorrect saved role after rendering, not while rendering the page.
  useEffect(() => { if (roleMismatch) clearUser(); }, [roleMismatch, clearUser]);

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    // Return to Login Page rather than opening another role's dashboard.
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

/**
 * FEATURE: Restore login and open the correct Care4U screens.
 * LOGIC: Check the saved login with the backend before showing any page.
 * Then choose the screen and layout using the page address and user role.
 * Visible buttons and form fields are inside their page/layout files, not here.
 */
function App() {
  const {
    user,
    setUser,
    clearUser
  } = useAuthStore();

  const [
    isInitializing,
    setIsInitializing
  ] = useState(true);

  // FEATURE: Keep users signed in after a refresh when their server session is valid.
  useEffect(() => {
    // LOGIC: Valid session → restore user; invalid session or error → clear user.
    const checkSession = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            credentials: 'include'
          }
        );

        const data =
          await response.json();

        if (
          data.success &&
          data.data
        ) {
          setUser(data.data);

        } else {
          clearUser();
        }

      } catch (error) {
        console.error(
          'Auth initialization failed:',
          error
        );

        clearUser();

      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();

  }, [
    setUser,
    clearUser
  ]);

  // Show the "Loading Care4U..." screen until the login check finishes.
  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          color: '#1E3A5F',
          fontFamily: 'sans-serif'
        }}
      >
        <h2>
          Loading Care4U...
        </h2>
      </div>
    );
  }

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* Login Page — logged-in users go to their own role dashboard. */}
        <Route
          path="/login"
          element={
            user ? (
              user.role === 'patient' ? (
                <Navigate
                  to="/patient/profile"
                  replace
                />
              ) :
              user.role === 'doctor' ? (
                <Navigate
                  to="/doctor/dashboard"
                  replace
                />
              ) :
              user.role === 'admin' ? (
                <Navigate
                  to="/admin"
                  replace
                />
              ) :
              user.role === 'pharmacist' ? (
                <Navigate
                  to="/pharmacy/dashboard"
                  replace
                />
              ) :
              user.role === 'hospital_staff' ? (
                <Navigate
                  to="/hospital/dashboard"
                  replace
                />
              ) :
              user.role === 'lab_technician' ? (
                <Navigate
                  to="/laboratory/dashboard"
                  replace
                />
              ) :
              (
                <LoginPage />
              )
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/register"
          element={
            <RegisterPage />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPasswordPage />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage />
          }
        />

        <Route
          path="/verify-otp"
          element={
            <OtpVerificationPage />
          }
        />

        <Route
          path="/pharmacy/register"
          element={
            <PharmacyRegisterPage />
          }
        />

        {/* Patient QR Lookup Page — the backend decides who can view patient data. */}
        <Route
          path="/lookup/:qrCodeId"
          element={
            <PatientLookupPage />
          }
        />


        {/* Patient pages — Profile, Medical Records, Prescriptions, Appointments, and more.
            These pages share PatientLayout; AIChatWidget appears in the patient area. */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute
              allowedRoles={[
                'patient'
              ]}
            >
              <>
                <PatientLayout />
                <AIChatWidget />
              </>
            </ProtectedRoute>
          }
        >
          <Route
            path="profile"
            element={
              <PatientProfilePage />
            }
          />

          <Route
            path="medical-records"
            element={
              <MedicalRecordsPage />
            }
          />

          <Route
            path="prescriptions"
            element={
              <PrescriptionsPage />
            }
          />

          <Route
            path="lab-reports"
            element={
              <LabReportsPage />
            }
          />

          <Route
            path="doctors"
            element={
              <DoctorSearchPage />
            }
          />

          <Route
            path="appointments"
            element={
              <MyAppointmentsPage />
            }
          />

          <Route
            path="book-appointment/:doctorId"
            element={
              <BookAppointmentPage />
            }
          />

          <Route
            path="orders"
            element={
              <OrderTrackerPage />
            }
          />

          <Route
            path="payments"
            element={
              <PaymentHistoryPage />
            }
          />
        </Route>

        {/* Doctor pages — Dashboard, Appointment Queue, Consultation, and Profile. */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          {/* Opening /doctor takes the doctor to their Dashboard. */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="queue" element={<AppointmentQueuePage />} />
          <Route path="consultation/:appointmentId" element={<ConsultationPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
        </Route>

        {/* Pharmacy pages — Dashboard, Patient QR Lookup, Dispensing History, Profile, and Prescription Lookup. */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacyLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <PharmacyDashboard />
            }
          />

          <Route
            path="patient-lookup"
            element={
              <PatientQRLookupPage />
            }
          />

          <Route
            path="history"
            element={
              <PharmacyDispensingHistoryPage />
            }
          />

          <Route
            path="profile"
            element={
              <PharmacyProfilePage />
            }
          />

          <Route
            path=":qrValue"
            element={
              <PharmacyLookupPage />
            }
          />
        </Route>

        {/* Laboratory registration — public, with admin approval before login */}
        <Route
          path="/laboratory/register"
          element={<LabRegisterPage />}
        />

        {/* Laboratory pages — Dashboard, Test Queue, and Report Upload. */}
        <Route
          path="/laboratory"
          element={
            <ProtectedRoute allowedRoles={['lab_technician']}>
              <LabLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/laboratory/dashboard" replace />}
          />
          <Route path="dashboard" element={<LabDashboard />} />
          <Route path="queue" element={<LabQueuePage />} />
          <Route path="report/:requestId" element={<LabReportUploadPage />} />
        </Route>

        {/* Hospital pages — Dashboard, OPD Queue, and Emergency alerts. */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute
              allowedRoles={[
                'hospital_staff'
              ]}
            >
              <HospitalLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <Navigate
                to="/hospital/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <HospitalHomePage />
            }
          />

          <Route
            path="opd"
            element={
              <HospitalOPDPage />
            }
          />

          <Route
            path="emergency"
            element={
              <HospitalEmergencyPage />
            }
          />

        </Route>

        {/* Emergency Snapshot Page — standalone hospital staff screen for emergency patient details. */}
        <Route
          path="/hospital/emergency/snapshot/:patientId"
          element={
            <ProtectedRoute
              allowedRoles={[
                'hospital_staff'
              ]}
            >
              <EmergencySnapshotPage />
            </ProtectedRoute>
          }
        />


        {/* Admin pages — Accounts, Approvals, Audit Log, Health Content, Emergency Oversight, and Settings. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                'admin'
              ]}
            >
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <AdminOverviewPage />
            }
          />

          <Route
            path="approvals"
            element={
              <AdminApprovalsPage />
            }
          />

          <Route
            path="accounts"
            element={
              <AdminAccountManagementPage />
            }
          />

          <Route
            path="rbac"
            element={
              <AdminRbacPanelPage />
            }
          />

          <Route
            path="audit-log"
            element={
              <AdminAuditLogPage />
            }
          />

          <Route
            path="health-content"
            element={
              <AdminHealthContentPage />
            }
          />

          <Route
            path="emergency-oversight"
            element={
              <AdminEmergencyOversightPage />
            }
          />

          <Route
            path="analytics"
            element={
              <AdminAnalyticsPage />
            }
          />

          <Route
            path="qr-reissue"
            element={
              <AdminQrReissuePage />
            }
          />

          <Route
            path="settings"
            element={
              <AdminSystemSettingsPage />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;
