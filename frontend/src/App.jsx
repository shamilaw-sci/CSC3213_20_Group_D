/**
 * @file    App.jsx
 * @desc    Root application component. Defines all client-side routes.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import MedicalRecordsPage from './pages/patient/MedicalRecordsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to patient profile for testing */}
        <Route path="/" element={<Navigate to="/patient/profile" replace />} />

        {/* Patient routes */}
        <Route path="/patient/profile" element={<PatientProfilePage />} />
        <Route path="/patient/medical-records" element={<MedicalRecordsPage />} />

        {/* Other members will add their routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;