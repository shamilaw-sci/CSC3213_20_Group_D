/**
 * @component PatientQRLookupPage
 * @desc      Pharmacy staff scans patient identity QR card
 *            to view all active prescriptions and dispense medicines
 *            for patients without smartphones.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const PatientQRLookupPage = () => {
  const navigate                  = useNavigate();
  const [qrInput, setQrInput]         = useState('');
  const [patientQR, setPatientQR]     = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Fetch patient by QR code ID
  const {
    data: patientData,
    isLoading,
  } = useQuery({
    queryKey: ['patient-qr-lookup', patientQR],
    queryFn: async () => {
      const res = await api.get(`/api/patients/qr/${patientQR}`);
      return res.data.data;
    },
    enabled: !!patientQR,
    retry: false,
  });

  // Fetch patient prescriptions
  const {
    data: prescriptions,
    isLoading: prescriptionsLoading,
  } = useQuery({
    queryKey: ['patient-prescriptions-staff', patientData?.id],
    queryFn: async () => {
      const res = await api.get(`/api/patients/${patientData.id}/prescriptions`);
      return res.data.data;
    },
    enabled: !!patientData?.id && consentGiven,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setConsentGiven(false);
    if (qrInput.trim()) {
      setPatientQR(qrInput.trim());
    }
  };

  const activePrescriptions = (prescriptions || []).filter(
    p => p.status === 'active' || p.status === 'partially_filled'
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: '#006B6B' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: '#99E6E6' }}>
            Pharmacy Staff — Patient Lookup
          </p>
          <h1 className="text-2xl font-bold text-white">No-Smartphone Patient Flow</h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            Scan or enter patient QR card ID to view their prescriptions
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* QR Search */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            🔍 Enter Patient QR Code ID
          </h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Enter patient QR code ID..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#006B6B' }}
            >
              Look Up
            </button>
          </form>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {/* Patient Found */}
        {patientData && (
          <>
            {/* Patient Info Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Patient Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{patientData.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Blood Group</p>
                  <p className="text-sm font-bold mt-1" style={{ color: '#C00000' }}>
                    {patientData.blood_group || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">NIC</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{patientData.nic || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {formatDate(patientData.date_of_birth)}
                  </p>
                </div>
              </div>
            </div>

            {/* Consent Step */}
            {!consentGiven && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h2 className="text-base font-semibold text-orange-800 mb-2">
                  ⚠️ Staff Verification Required
                </h2>
                <p className="text-sm text-orange-700 mb-4">
                  Before viewing prescriptions, confirm that you have verified
                  the patient's identity in person and they have consented to
                  staff-assisted dispensing.
                </p>
                <button
                  onClick={() => setConsentGiven(true)}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#006B6B' }}
                >
                  ✅ I confirm — Show Prescriptions
                </button>
              </div>
            )}

            {/* Prescriptions List */}
            {consentGiven && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-4">
                  Active Prescriptions ({activePrescriptions.length})
                </h2>

                {prescriptionsLoading && <Spinner size="md" />}

                {!prescriptionsLoading && activePrescriptions.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No active prescriptions found for this patient.
                  </p>
                )}

                {activePrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => navigate(`/pharmacy/${rx.qr_code_value}`)}
                    className="border border-slate-200 rounded-lg p-4 mb-3 last:mb-0 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-mono font-semibold text-slate-800">
                          {rx.qr_code_value}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Issued: {formatDate(rx.created_at)} · Expires: {formatDate(rx.expires_at)}
                        </p>
                        {rx.notes && (
                          <p className="text-xs text-slate-400 mt-1">{rx.notes}</p>
                        )}
                      </div>
                      <Badge status={rx.status} />
                    </div>
                    <p className="text-xs text-teal-600 mt-2 font-semibold">
                      Tap to dispense →
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default PatientQRLookupPage;