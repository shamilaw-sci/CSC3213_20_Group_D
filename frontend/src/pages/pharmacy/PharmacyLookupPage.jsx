/**
 * @component PharmacyLookupPage
 * @desc      Read-only prescription lookup page for pharmacists.
 *            Fetches and displays full prescription details using a QR code value.
 *            URL pattern: /pharmacy/:qrValue
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyPrescriptionByQR } from '../../services/prescription.service';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const resolveBadgeStatus = (status, expiresAt) => {
  if (isExpired(expiresAt)) return 'expired';
  return status || 'active';
};

// ─── Sub-component: MedicineRow ───────────────────────────────────────────────

const MedicineRow = ({ item, index }) => (
  <div className="border border-slate-200 rounded-lg p-4 mb-3 last:mb-0">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800">
          {index + 1}. {item.medicine_name}
        </p>
        <p className="text-sm text-slate-600 mt-1">
          {item.dosage} · {item.frequency} · {item.duration_days} days
        </p>
        {item.special_notes && (
          <p className="text-xs text-blue-600 italic mt-1">{item.special_notes}</p>
        )}
      </div>
      <div className="text-right ml-4 shrink-0">
        <p className="text-xs text-slate-500">Qty prescribed</p>
        <p className="text-lg font-bold text-slate-800">{item.quantity_prescribed}</p>
        {item.quantity_dispensed > 0 && (
          <p className="text-xs text-green-600 font-semibold">
            {item.quantity_dispensed} dispensed
          </p>
        )}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PharmacyLookupPage = () => {
  const { qrValue } = useParams();

  const {
    data: prescriptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pharmacy-lookup', qrValue],
    queryFn: () => verifyPrescriptionByQR(qrValue),
    retry: false,
  });

  const prescription = prescriptionData?.data;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Verifying prescription...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Alert
            type="error"
            message={`No prescription found for QR code: ${qrValue}`}
          />
        </div>
      </div>
    );
  }

  const badgeStatus = resolveBadgeStatus(prescription.status, prescription.expires_at);
  const expired = isExpired(prescription.expires_at);
  const validItems = (prescription.items || []).filter(i => i && i.medicine_name);

  // ── Success ──
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: '#006B6B' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: '#99E6E6' }}>
            Pharmacy View — Prescription Verification
          </p>
          <h1 className="text-2xl font-bold text-white">Prescription Details</h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            QR Code:{' '}
            <span className="font-mono font-semibold text-white">{qrValue}</span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Expired Warning */}
        {expired && (
          <Alert type="error" message="⚠️ This prescription has EXPIRED and cannot be dispensed." />
        )}

        {/* Prescription Summary */}
        <Card title="Prescription Summary">
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
              <div className="mt-1">
                <Badge status={badgeStatus} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Issued</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {formatDate(prescription.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Expires</p>
              <p className="text-sm font-medium mt-1"
                style={{ color: expired ? '#C00000' : '#1F7A1F' }}>
                {formatDate(prescription.expires_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Doctor</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {prescription.doctor_name ? `Dr. ${prescription.doctor_name}` : '—'}
              </p>
            </div>
          </div>

          {prescription.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                Doctor's Notes
              </p>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-700">{prescription.notes}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Medicines */}
        <Card title={`Medicines (${validItems.length})`}>
          {validItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No medicines found.</p>
          ) : (
            validItems.map((item, index) => (
              <MedicineRow key={item.id} item={item} index={index} />
            ))
          )}
        </Card>

      </div>
    </div>
  );
};

export default PharmacyLookupPage;