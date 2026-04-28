/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PatientProfilePage    from './pages/patient/PatientProfilePage';
import IssuePrescriptionPage from './pages/doctor/IssuePrescriptionPage';
import LoginPage from './pages/auth/LoginPage';
import MedicalRecordsPage    from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage     from './pages/patient/PrescriptionsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to patient profile for testing */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Patient routes */}
        <Route path="/patient/profile"         element={<PatientProfilePage />} />
        <Route path="/patient/medical-records" element={<MedicalRecordsPage />} />
        <Route path="/patient/prescriptions"   element={<PrescriptionsPage />} />

        {/* Doctor routes */}
        <Route path="/doctor/issue-prescription" element={<IssuePrescriptionPage />} />
        
        {/* Other members will add their routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;