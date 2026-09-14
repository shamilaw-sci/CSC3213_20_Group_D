/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes with Zustand Auth and Session Hydration.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

import PatientLayout          from './components/layout/PatientLayout';
import AdminLayout            from './components/layout/AdminLayout';
import HospitalLayout         from './components/layout/HospitalLayout';
import DoctorLayout from './components/layout/DoctorLayout';
import PharmacyLayout from './components/layout/PharmacyLayout';

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

// Simple Route Guard using Zustand
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
    // Don't guess another destination - that role may not have a
    // dedicated route (e.g. lab_technician, hospital_staff have none
    // yet), and guessing wrong here creates a redirect loop with
    // /login's own role-based redirect. Clear the mismatched session
    // and go to login cleanly instead.
    clearUser();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

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

  // Check backend for active session cookie on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/auth/me',
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

  // Prevent routing until we know if the user is actually logged in
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

      <Toaster position="top-right" />

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

        {/* Public Routes */}
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
              (
                <LoginPage />
              )
              // unrecognized role (e.g. lab_technician, hospital_staff)
              // - no dedicated destination yet, just show login
              // rather than guessing
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

        {/* Staff/Public Lookup routes (Backend handles exact permissions) */}
        <Route
          path="/lookup/:qrCodeId"
          element={
            <PatientLookupPage />
          }
        />

        <Route
          path="/pharmacy/:qrValue"
          element={
            <ProtectedRoute
              allowedRoles={[
                'pharmacist'
              ]}
            >
              <PharmacyLookupPage />
            </ProtectedRoute>
          }
        />

        {/* Patient pages — restricted to 'patient' */}
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

        {/* --- DOCTOR ROUTES --- */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to dashboard if they just go to /doctor */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="queue" element={<AppointmentQueuePage />} />
          <Route path="consultation/:appointmentId" element={<ConsultationPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
        </Route>

        {/* --- PHARMACY ROUTES --- */}
        <Route
          path="/pharmacy"
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PharmacyDashboard />} />
          <Route path="patient-lookup" element={<PatientQRLookupPage />} />
          <Route path="profile" element={<PharmacyProfilePage />} />
          <Route path="history" element={<PharmacyDispensingHistoryPage />} />
        </Route>

        {/* Hospital pages — restricted to 'hospital_staff' */}
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

        {/* Hospital Break-Glass snapshot — standalone crisis screen */}
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

        {/* Admin pages — restricted to 'admin' */}
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
