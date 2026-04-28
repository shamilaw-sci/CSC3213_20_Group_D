import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage from './pages/doctor/AppointmentQueuePage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/queue" element={<AppointmentQueuePage />} />
        <Route path="/doctor/profile" element={<DoctorProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;