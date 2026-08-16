/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import PatientLayout          from './components/layout/PatientLayout';
import PatientProfilePage     from './pages/patient/PatientProfilePage';
import MedicalRecordsPage     from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage      from './pages/patient/PrescriptionsPage';
import PatientLookupPage      from './pages/patient/PatientLookupPage';
import LoginPage              from './pages/auth/LoginPage';
import RegisterPage           from './pages/auth/RegisterPage';
import ForgotPasswordPage     from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage      from './pages/auth/ResetPasswordPage';
import IssuePrescriptionPage  from './pages/doctor/IssuePrescriptionPage';
import DoctorDashboard        from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage   from './pages/doctor/AppointmentQueuePage';
import DoctorProfilePage      from './pages/doctor/DoctorProfilePage';
import PharmacyLookupPage from './pages/pharmacy/PharmacyLookupPage';
import PharmacyRegisterPage from './pages/pharmacy/PharmacyRegisterPage';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PaymentHistoryPage from './pages/patient/PaymentHistoryPage';
import HospitalDashboardPage from './pages/hospital/HospitalDashboardPage';

// NEW: Import the Emergency Snapshot Page
import EmergencySnapshotPage from './pages/emergency/EmergencySnapshotPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth pages — no sidebar */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Patient QR lookup — no sidebar, doctor-facing read-only view */}
        <Route path="/lookup/:qrCodeId" element={<PatientLookupPage />} />

        {/* NEW: Emergency Break-Glass Snapshot — no sidebar, specialized crisis UI */}
        <Route path="/emergency/snapshot/:patientId" element={<EmergencySnapshotPage />} />

        {/* NEW: Live Hospital Dashboard for dispatchers */}
        <Route path="/emergency/dashboard" element={<HospitalDashboardPage />} />

        {/* Patient pages — all share the sidebar layout */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route path="profile"         element={<PatientProfilePage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
          <Route path="prescriptions"   element={<PrescriptionsPage />} />
        </Route>

        {/* Doctor routes */}
        <Route path="/doctor/dashboard"          element={<DoctorDashboard />} />
        <Route path="/doctor/queue"              element={<AppointmentQueuePage />} />
        <Route path="/doctor/profile"            element={<DoctorProfilePage />} />
        <Route path="/doctor/issue-prescription" element={<IssuePrescriptionPage />} />

        {/* Pharmacy routes */}
        <Route path="/pharmacy/:qrValue" element={<PharmacyLookupPage />} />
        <Route path="/pharmacy/register" element={<PharmacyRegisterPage />} />
        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />

        <Route path="/patient/payments" element={<PaymentHistoryPage />} />
        {/* Other members will add their routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;