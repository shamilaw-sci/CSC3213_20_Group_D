/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PatientLayout         from './components/layout/PatientLayout';
import PatientProfilePage    from './pages/patient/PatientProfilePage';
import MedicalRecordsPage    from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage     from './pages/patient/PrescriptionsPage';
import LoginPage             from './pages/auth/LoginPage';
import RegisterPage          from './pages/auth/RegisterPage';
import IssuePrescriptionPage from './pages/doctor/IssuePrescriptionPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth pages — no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Patient pages — all share the sidebar layout */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route path="profile"         element={<PatientProfilePage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
          <Route path="prescriptions"   element={<PrescriptionsPage />} />
        </Route>

        {/* Doctor routes */}
        <Route path="/doctor/issue-prescription" element={<IssuePrescriptionPage />} />

        {/* Other members will add their routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;