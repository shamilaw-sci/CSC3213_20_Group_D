/**
 * @file    AdminQrReissuePage.jsx
 * @module  Admin
 * @desc    Search for a patient and reissue their QR code — the old
 *          code is instantly deactivated, a fresh one is assigned.
 */

import { useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const AdminQrReissuePage = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reissuingId, setReissuingId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/patients/search?search=${encodeURIComponent(search)}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Search failed');
        return;
      }

      setPatients(data.data);
    } catch (err) {
      console.error('Search patients error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async (patientId) => {
    if (!window.confirm('Reissue this patient\'s QR code? The old code will stop working immediately.')) return;

    setReissuingId(patientId);
    try {
      const res = await fetch(`${API_URL}/api/admin/patients/${patientId}/reissue-qr`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Reissue failed');
        return;
      }

      // Update the patient's qr_code_id in the current list
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, qr_code_id: data.data.qr_code_id } : p))
      );
      alert('QR code reissued successfully.');
    } catch (err) {
      console.error('Reissue QR error:', err);
      alert('Could not connect to the server.');
    } finally {
      setReissuingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">QR Code Deactivation & Reissue</h1>
        <p className="text-sm text-slate-500">
          Search for a patient to reissue a lost or compromised QR code. The old code fails instantly.
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name or NIC..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#1E3A5F] text-white text-sm rounded-lg hover:bg-[#16293f]"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && hasSearched && patients.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 font-medium">No patients found.</p>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="space-y-4">
          {patients.map((patient) => {
            const isReissuing = reissuingId === patient.id;
            return (
              <div key={patient.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{patient.full_name}</h3>
                  <p className="text-sm text-slate-500">NIC: {patient.nic}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{patient.qr_code_id}</p>
                </div>
                <button
                  onClick={() => handleReissue(patient.id)}
                  disabled={isReissuing}
                  className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReissuing ? 'Reissuing...' : 'Reissue QR Code'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminQrReissuePage;