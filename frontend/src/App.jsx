/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import PatientLayout          from './components/layout/PatientLayout';
import AdminLayout            from './components/layout/AdminLayout';
import PatientProfilePage     from './pages/patient/PatientProfilePage';
import MedicalRecordsPage     from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage      from './pages/patient/PrescriptionsPage';
import PatientLookupPage      from './pages/patient/PatientLookupPage';
import LoginPage              from './pages/auth/LoginPage';
import RegisterPage           from './pages/auth/RegisterPage';
import ForgotPasswordPage     from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage      from './pages/auth/ResetPasswordPage';
import OtpVerificationPage    from './pages/auth/OtpVerificationPage';
import IssuePrescriptionPage  from './pages/doctor/IssuePrescriptionPage';
import DoctorDashboard        from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage   from './pages/doctor/AppointmentQueuePage';
import DoctorProfilePage      from './pages/doctor/DoctorProfilePage';
import PharmacyLookupPage     from './pages/pharmacy/PharmacyLookupPage';
import PharmacyRegisterPage   from './pages/pharmacy/PharmacyRegisterPage';
import PharmacyDashboard      from './pages/pharmacy/PharmacyDashboard';
import PaymentHistoryPage     from './pages/patient/PaymentHistoryPage';
import PatientQRLookupPage    from './pages/pharmacy/PatientQRLookupPage';
import OrderTrackerPage       from './pages/patient/OrderTrackerPage';
import LabReportsPage         from './pages/patient/LabReportsPage';
import DoctorSearchPage       from './pages/patient/DoctorSearchPage';
import BookAppointmentPage    from './pages/patient/BookAppointmentPage';
import MyAppointmentsPage     from './pages/patient/MyAppointmentsPage';

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

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-otp"      element={<OtpVerificationPage />} />

        <Route path="/lookup/:qrCodeId" element={<PatientLookupPage />} />

        {/* Patient pages — all share the sidebar layout */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route path="profile"         element={<PatientProfilePage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
          <Route path="prescriptions"   element={<PrescriptionsPage />} />
          <Route path="lab-reports"     element={<LabReportsPage />} />
          <Route path="doctors"         element={<DoctorSearchPage />} />
          <Route path="appointments"    element={<MyAppointmentsPage />} /> 
          <Route path="book-appointment/:doctorId" element={<BookAppointmentPage />} />
        </Route>

        <Route path="/doctor/dashboard"          element={<DoctorDashboard />} />
        <Route path="/doctor/queue"              element={<AppointmentQueuePage />} />
        <Route path="/doctor/profile"            element={<DoctorProfilePage />} />
        <Route path="/doctor/issue-prescription" element={<IssuePrescriptionPage />} />

        <Route path="/pharmacy/:qrValue" element={<PharmacyLookupPage />} />
        <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
        <Route path="/pharmacy/patient-lookup" element={<PatientQRLookupPage />} />
        
        <Route path="/patient/orders"   element={<OrderTrackerPage />} /> 
        <Route path="/patient/payments" element={<PaymentHistoryPage />} />

        {/* Admin pages — all share the AdminSidebar layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="approvals" element={<AdminApprovalsPage />} />
          <Route path="accounts" element={<AdminAccountManagementPage />} />
          <Route path="rbac" element={<AdminRbacPanelPage />} />
          <Route path="audit-log" element={<AdminAuditLogPage />} />
          <Route path="health-content" element={<AdminHealthContentPage />} />
          <Route path="emergency-oversight" element={<AdminEmergencyOversightPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="qr-reissue" element={<AdminQrReissuePage />} />
          <Route path="settings" element={<AdminSystemSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;