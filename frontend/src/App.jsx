/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PatientLayout         from './components/layout/PatientLayout';
import IssuePrescriptionPage from './pages/doctor/IssuePrescriptionPage';
import DoctorDashboard       from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage  from './pages/doctor/AppointmentQueuePage';
import DoctorProfilePage     from './pages/doctor/DoctorProfilePage';
import PatientProfilePage    from './pages/patient/PatientProfilePage';
import LoginPage from './pages/auth/LoginPage';
import MedicalRecordsPage    from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage     from './pages/patient/PrescriptionsPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Default redirect to patient profile for testing */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Patient routes */}
        <Route path="/patient/profile"         element={<PatientProfilePage />} />
        <Route path="/patient/medical-records" element={<MedicalRecordsPage />} />
        <Route path="/patient/prescriptions"   element={<PrescriptionsPage />} />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard"          element={<DoctorDashboard />} />
        <Route path="/doctor/queue"              element={<AppointmentQueuePage />} />
        <Route path="/doctor/profile"            element={<DoctorProfilePage />} />
        <Route path="/doctor/issue-prescription" element={<IssuePrescriptionPage />} />

        {/* Other members will add their routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;