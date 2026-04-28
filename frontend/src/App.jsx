import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AppointmentQueuePage from './pages/doctor/AppointmentQueuePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/queue" element={<AppointmentQueuePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;