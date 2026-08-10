/**
 * @component PharmacyDashboard
 * @desc      Landing page for pharmacists after login.
 *            Shows today's stats, recent prescriptions,
 *            and a quick QR scan entry point.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';

// ── Temporary pharmacy ID for testing ─────────────────────────────────────
// Replace with session user when auth is integrated
const TEST_PHARMACY_ID = '357f43da-ac3d-4fe4-9bfb-7f7a8cf22844';

/**
 * Formats an ISO date string to readable format.
 * @param {string} iso - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const PharmacyDashboard = () => {
  const navigate    = useNavigate();
  const [qrInput, setQrInput] = useState('');

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['pharmacy-dashboard', TEST_PHARMACY_ID],
    queryFn:  async () => {
      const res = await api.get(`/api/pharmacies/${TEST_PHARMACY_ID}/dashboard`);
      return res.data.data;
    },
  });

  // ── Handle QR input search ──
  const handleQrSearch = (e) => {
    e.preventDefault();
    if (qrInput.trim()) {
      navigate(`/pharmacy/${qrInput.trim()}`);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-sm text-red-500">Failed to load dashboard. Please try again.</p>
      </div>
    );
  }

  const pharmacy           = data?.pharmacy;
  const stats              = data?.stats;
  const recentPrescriptions = stats?.recentPrescriptions || [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="px-8 py-6" style={{ backgroundColor: '#006B6B' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: '#99E6E6' }}>
            Pharmacy Portal
          </p>
          <h1 className="text-2xl font-bold text-white">
            {pharmacy?.name || 'Pharmacy Dashboard'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            {pharmacy?.address}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Today Dispensed */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Dispensed Today
            </p>
            <p className="text-4xl font-bold" style={{ color: '#006B6B' }}>
              {stats?.todayDispensed ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">prescriptions fulfilled</p>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              Account Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: pharmacy?.is_verified ? '#1F7A1F' : '#E67E22' }}
              />
              <p className="text-lg font-semibold text-slate-800">
                {pharmacy?.is_verified ? 'Verified & Active' : 'Pending Approval'}
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              License: {pharmacy?.license_number}
            </p>
          </div>
        </div>

        {/* ── QR Scan Entry ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            🔍 Verify Prescription by QR Code
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Enter the QR code value from the patient's prescription to verify and dispense.
          </p>
          <form onSubmit={handleQrSearch} className="flex gap-3">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="e.g. RX-550e8400-e29b-41d4-..."
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

        {/* ── Recent Prescriptions ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Recent Prescriptions
          </h2>

          {recentPrescriptions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No prescriptions dispensed yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  onClick={() => navigate(`/pharmacy/${rx.qr_code_value}`)}
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 font-mono">
                      {rx.qr_code_value}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued: {formatDate(rx.created_at)} · Expires: {formatDate(rx.expires_at)}
                    </p>
                    {rx.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
                        {rx.notes}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0">
                    <Badge status={rx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PharmacyDashboard;