/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import PatientProfilePage    from './pages/patient/PatientProfilePage';
import IssuePrescriptionPage from './pages/doctor/IssuePrescriptionPage';
import LoginPage from './pages/auth/LoginPage';
import MedicalRecordsPage    from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage     from './pages/patient/PrescriptionsPage';
=======
import { Toaster } from 'react-hot-toast';

import PatientLayout      from './components/layout/PatientLayout';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import MedicalRecordsPage from './pages/patient/MedicalRecordsPage';
import PrescriptionsPage  from './pages/patient/PrescriptionsPage';
import LoginPage          from './pages/auth/LoginPage';
>>>>>>> 8c3c3943253bd186d9fffe5fc8c1b58b10e3f82c

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth pages — no sidebar */}
        <Route path="/login" element={<LoginPage />} />

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