/**
 * @file    DoctorDashboard.jsx
 * @module  Doctor
 * @desc    Doctor dashboard page showing summary stats and quick links.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';

const DOCTOR_ID = 'd04b8bcf-fe8a-4d3b-affc-5ab87e78cfc3';
const API_URL = 'http://localhost:5000';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, apptRes] = await Promise.all([
          fetch(`${API_URL}/api/doctors/${DOCTOR_ID}`),
          fetch(`${API_URL}/api/doctors/${DOCTOR_ID}/appointments/today`),
        ]);
        const docData = await docRes.json();
        const apptData = await apptRes.json();
        setDoctor(docData.data);
        setAppointments(apptData.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome, {doctor?.full_name || 'Doctor'}
        </h1>
        <p className="text-sm text-slate-500">
          {doctor?.specialization} — {doctor?.hospital_name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Today's Appointments</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Specialization</p>
          <p className="text-xl font-semibold text-slate-800 mt-1">
            {doctor?.specialization || 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-slate-500">Experience</p>
          <p className="text-xl font-semibold text-slate-800 mt-1">
            {doctor?.years_experience} Years
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate('/doctor/queue')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">
            Appointment Queue
          </p>
          <p className="text-sm text-slate-500 mt-1">
            View today's patients
          </p>
        </button>
        <button
          onClick={() => navigate('/doctor/profile')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">
            My Profile
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Update your details
          </p>
        </button>
        <button
          onClick={() => navigate('/doctor/issue-prescription')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-lg font-semibold text-slate-800">
            Issue Prescription
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Create digital prescription
          </p>
        </button>
      </div>
    </div>
  );
};

export default DoctorDashboard;