/**
 * @component PharmacyLookupPage
 * @desc      Prescription lookup and dispensing page for pharmacists.
 * @author    Wasana Karunanayaka (S/21/081) — original
 * @author    Pamudika Abayarathna (S/21/001) — dispensing upgrade
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { verifyPrescriptionByQR } from '../../services/prescription.service';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const formatDate = (iso) => {
  if (!iso) return '-';
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

const MedicineRow = ({ item, index, dispenseQty, onQtyChange, canDispense }) => {
  const remaining = item.quantity_prescribed - item.quantity_dispensed;
  return (
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
          <p className="text-xs text-slate-500">Prescribed</p>
          <p className="text-lg font-bold text-slate-800">{item.quantity_prescribed}</p>
          {item.quantity_dispensed > 0 && (
            <p className="text-xs text-green-600 font-semibold">
              {item.quantity_dispensed} dispensed
            </p>
          )}
          {remaining > 0 && (
            <p className="text-xs text-orange-500 font-semibold">
              {remaining} remaining
            </p>
          )}
        </div>
      </div>
      {canDispense && remaining > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Qty to dispense now:
          </label>
          <input
            type="number"
            min="0"
            max={remaining}
            value={dispenseQty}
            onChange={(e) => onQtyChange(item.id, parseInt(e.target.value) || 0)}
            className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-xs text-slate-400">max: {remaining}</span>
        </div>
      )}
      {remaining === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-green-600 font-semibold">Fully dispensed</p>
        </div>
      )}
    </div>
  );
};

const PharmacyLookupPage = () => {
  const { qrValue }   = useParams();
  const queryClient   = useQueryClient();
  const [dispensing, setDispensing]           = useState(false);
  const [dispenseQtys, setDispenseQtys]       = useState({});
  const [dispenseError, setDispenseError]     = useState(null);
  const [dispenseSuccess, setDispenseSuccess] = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  const { data: prescriptionData, isLoading, error } = useQuery({
    queryKey: ['pharmacy-lookup', qrValue],
    queryFn: () => verifyPrescriptionByQR(qrValue),
    retry: false,
  });

  const prescription = prescriptionData?.data;

  const handleQtyChange = (itemId, qty) => {
    setDispenseQtys((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleDispenseSubmit = async () => {
    setDispenseError(null);
    setSubmitting(true);
    try {
      const dispenseItems = Object.entries(dispenseQtys)
        .filter(([, qty]) => qty > 0)
        .map(([prescriptionItemId, quantityDispensed]) => ({
          prescriptionItemId,
          quantityDispensed,
        }));
      if (dispenseItems.length === 0) {
        setDispenseError('Please enter a quantity for at least one medicine.');
        setSubmitting(false);
        return;
      }
      await api.post(`/api/prescriptions/${prescription.id}/dispense`, { dispenseItems });
      setDispenseSuccess(true);
      setDispensing(false);
      setDispenseQtys({});
      queryClient.invalidateQueries(['pharmacy-lookup', qrValue]);
    } catch (err) {
      setDispenseError(err.response?.data?.message || 'Dispensing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Alert type="error" message={`No prescription found for QR code: ${qrValue}`} />
        </div>
      </div>
    );
  }

  const badgeStatus = resolveBadgeStatus(prescription.status, prescription.expires_at);
  const expired     = isExpired(prescription.expires_at);
  const validItems  = (prescription.items || []).filter(i => i && i.medicine_name);
  const canDispense = !expired && prescription.status !== 'completed';

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="px-8 py-6" style={{ backgroundColor: '#006B6B' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: '#99E6E6' }}>
            Pharmacy View — Prescription Verification
          </p>
          <h1 className="text-2xl font-bold text-white">Prescription Details</h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            QR Code: <span className="font-mono font-semibold text-white">{qrValue}</span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">

        {expired && (
          <Alert type="error" message="This prescription has EXPIRED and cannot be dispensed." />
        )}

        {dispenseSuccess && (
          <Alert type="success" message="Medicines dispensed successfully! Prescription status updated." />
        )}

        <Card title="Prescription Summary">
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
              <div className="mt-1"><Badge status={badgeStatus} /></div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Issued</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{formatDate(prescription.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Expires</p>
              <p className="text-sm font-medium mt-1" style={{ color: expired ? '#C00000' : '#1F7A1F' }}>
                {formatDate(prescription.expires_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Doctor</p>
              <p className="text-sm font-medium text-slate-800 mt-1">
                {prescription.doctor_name ? `Dr. ${prescription.doctor_name}` : '-'}
              </p>
            </div>
          </div>
          {prescription.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Doctor's Notes</p>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-700">{prescription.notes}</p>
              </div>
            </div>
          )}
        </Card>

        <Card title={`Medicines (${validItems.length})`}>
          {validItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No medicines found.</p>
          ) : (
            validItems.map((item, index) => (
              <MedicineRow
                key={item.id}
                item={item}
                index={index}
                dispenseQty={dispenseQtys[item.id] || 0}
                onQtyChange={handleQtyChange}
                canDispense={dispensing}
              />
            ))
          )}

          {dispenseError && (
            <div className="mt-3">
              <Alert type="error" message={dispenseError} />
            </div>
          )}

          {canDispense && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {!dispensing ? (
                <button
                  onClick={() => { setDispensing(true); setDispenseSuccess(false); }}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#006B6B' }}
                >
                  Dispense Medicines
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleDispenseSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#006B6B' }}
                  >
                    {submitting ? 'Processing...' : 'Confirm Dispense'}
                  </button>
                  <button
                    onClick={() => { setDispensing(false); setDispenseQtys({}); setDispenseError(null); }}
                    className="flex-1 py-3 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {prescription.status === 'completed' && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-sm text-green-600 font-semibold">
                All medicines have been fully dispensed
              </p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default PharmacyLookupPage;