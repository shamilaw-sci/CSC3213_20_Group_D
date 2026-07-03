/**
 * @file      PrescriptionsPage.jsx
 * @component PrescriptionsPage
 * @desc      Displays all prescriptions for a patient as expandable cards.
 *            Each card shows prescription details, medicine items, and a QR code.
 *            Fetches from GET /api/patients/:id/prescriptions via React Query.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  ChevronDown, ChevronUp, Pill, Calendar,
  Stethoscope, ClipboardList, QrCode
} from 'lucide-react';

import { getPatientPrescriptions } from '../../services/patient.service';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

// ─── TEMPORARY: hardcoded test patient UUID until auth is integrated ──────────
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// ─── Format date helper ───────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ─── Check if prescription is expired ────────────────────────────────────────
const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

// ─── Days remaining until expiry ──────────────────────────────────────────────
const daysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ─── Resolve badge status ─────────────────────────────────────────────────────
const resolveBadgeStatus = (status, expiresAt) => {
  if (isExpired(expiresAt)) return 'expired';
  return status || 'active';
};

// ─── Check if QR should be shown (active or partially filled only) ────────────
const canShowQR = (status, expiresAt) => {
  if (isExpired(expiresAt)) return false;
  if (status === 'completed') return false;
  if (status === 'expired') return false;
  return true; // active and partially_filled both get QR
};

// ─── Single Medicine Item Row ─────────────────────────────────────────────────
const MedicineRow = ({ item }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
    <div className="mt-0.5 p-1.5 bg-[#EBF3FB] rounded-lg">
      <Pill size={14} className="text-[#2E75B6]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800">{item.medicine_name}</p>
      <p className="text-xs text-slate-500 mt-0.5">
        {item.dosage} &nbsp;·&nbsp; {item.frequency} &nbsp;·&nbsp; {item.duration_days} days
      </p>
      {item.special_notes && (
        <p className="text-xs text-[#2E75B6] mt-0.5 italic">{item.special_notes}</p>
      )}
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs text-slate-500">Qty prescribed</p>
      <p className="text-sm font-semibold text-slate-700">{item.quantity_prescribed}</p>
      {item.quantity_dispensed > 0 && (
        <p className="text-xs text-green-600">{item.quantity_dispensed} dispensed</p>
      )}
    </div>
  </div>
);

// ─── Single Prescription Card ─────────────────────────────────────────────────
const PrescriptionCard = ({ prescription }) => {
  const [expanded, setExpanded] = useState(false);
  const [showQR,   setShowQR]   = useState(false);

  const expired  = isExpired(prescription.expires_at);
  const days     = daysRemaining(prescription.expires_at);
  const badgeSt  = resolveBadgeStatus(prescription.status, prescription.expires_at);
  const showQRButton = canShowQR(prescription.status, prescription.expires_at);
  const items    = prescription.items || [];
  const validItems = items.filter(i => i && i.medicine_name);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">

      {/* ── Card Header ── */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-[#EBF3FB] rounded-lg">
            <ClipboardList size={16} className="text-[#1E3A5F]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {prescription.doctor_name
                ? `Dr. ${prescription.doctor_name}`
                : 'Prescription'}
              {prescription.doctor_specialization && (
                <span className="ml-2 text-xs font-normal text-[#2E75B6]">
                  ({prescription.doctor_specialization})
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar size={11} />
                Issued: {formatDate(prescription.created_at)}
              </span>
              <span className={`flex items-center gap-1 text-xs ${
                expired ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-slate-500'
              }`}>
                <Calendar size={11} />
                Expires: {formatDate(prescription.expires_at)}
                {!expired && days !== null && days <= 7 && (
                  <span className="font-medium">({days}d left)</span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {validItems.length} medicine{validItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge status={badgeSt} />
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="border-t border-slate-100">

          {/* Notes */}
          {prescription.notes && (
            <div className="px-6 pt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Doctor's Notes
              </p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Medicine list */}
          <div className="px-6 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Medicines
            </p>
            {validItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No medicines listed.</p>
            ) : (
              <div>
                {validItems.map((item, idx) => (
                  <MedicineRow key={item.id || idx} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* QR Code section — only for active and partially filled */}
          {showQRButton && (
            <div className="px-6 py-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-2 text-xs font-medium text-[#2E75B6] hover:text-[#1E3A5F] transition-colors"
              >
                <QrCode size={14} />
                {showQR ? 'Hide QR Code' : 'Show QR Code for Pharmacy'}
              </button>

              {showQR && prescription.qr_code_value && (
                <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <QRCodeSVG
                    value={`http://localhost:5173/pharmacy/${prescription.qr_code_value}`}
                    size={180}
                    bgColor="#FFFFFF"
                    fgColor="#1E3A5F"
                    level="M"
                  />
                  <p className="text-xs font-mono text-slate-500">
                    {prescription.qr_code_value}
                  </p>
                  <p className="text-xs text-slate-400 text-center">
                    Show this QR code to the pharmacist for dispensing
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────
const PrescriptionsPage = () => {

  const {
    data: prescriptions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prescriptions', TEST_PATIENT_ID],
    queryFn: () => getPatientPrescriptions(TEST_PATIENT_ID),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert type="error" message={error?.message || 'Failed to load prescriptions.'} />
        </div>
      </div>
    );
  }

  const active = prescriptions.filter(p => !isExpired(p.expires_at) && p.status !== 'completed');
  const others = prescriptions.filter(p =>  isExpired(p.expires_at) || p.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="bg-[#1E3A5F] text-white px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Prescriptions</h1>
              <p className="text-blue-200 text-sm mt-1">
                Click any prescription to view medicines and QR code
              </p>
            </div>
            <div className="hidden sm:flex gap-4">
              <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                <p className="text-xl font-bold">{active.length}</p>
                <p className="text-xs text-blue-200">Active</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                <p className="text-xl font-bold">{others.length}</p>
                <p className="text-xs text-blue-200">Past</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {prescriptions.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <Stethoscope size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">
                No prescriptions found. Prescriptions issued by your doctor will appear here.
              </p>
            </div>
          </Card>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Active Prescriptions
            </h2>
            <div className="space-y-4">
              {active.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Past Prescriptions
            </h2>
            <div className="space-y-4">
              {others.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PrescriptionsPage;