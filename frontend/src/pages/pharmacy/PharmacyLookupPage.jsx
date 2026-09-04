/**
 * @component PharmacyLookupPage
 * @desc      Prescription lookup and dispensing page for pharmacists.
 * @author    Wasana Karunanayaka (S/21/081) — original
 * @author    Pamudika Abayarathna (S/21/001) — dispensing upgrade
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pill, ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import { verifyPrescriptionByQR } from '../../services/prescription.service';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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

const MedicineRow = ({ item, dispenseQty, onQtyChange, canDispense }) => {
  const remaining = item.quantity_prescribed - item.quantity_dispensed;
  return (
    <div className="border border-border rounded-xl p-4 mb-3 last:mb-0 bg-card transition-colors hover:border-primary/30">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5 p-1.5 bg-primary/10 rounded-lg shrink-0">
            <Pill size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {item.medicine_name}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {item.dosage} · {item.frequency} · {item.duration_days} days
            </p>
            {item.special_notes && (
              <p className="text-xs text-primary italic mt-1">{item.special_notes}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Prescribed</p>
          <p className="text-lg font-bold text-foreground">{item.quantity_prescribed}</p>
          {item.quantity_dispensed > 0 && (
            <p className="text-xs text-success font-semibold mt-0.5">
              {item.quantity_dispensed} dispensed
            </p>
          )}
          {remaining > 0 && (
            <p className="text-xs text-urgent-foreground font-semibold mt-0.5">
              {remaining} remaining
            </p>
          )}
        </div>
      </div>

      {canDispense && remaining > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Qty to dispense now:
          </label>
          <div className="w-24">
            <Input
              type="number"
              min="0"
              max={remaining}
              value={dispenseQty}
              onChange={(e) => onQtyChange(item.id, parseInt(e.target.value) || 0)}
            />
          </div>
          <span className="text-xs text-muted-foreground">max: {remaining}</span>
        </div>
      )}

      {remaining === 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-success font-semibold flex items-center gap-1.5">
            <CheckCircle size={14} /> Fully dispensed
          </p>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Verifying prescription...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-background">

      <div className="px-6 py-8 sm:px-8 bg-brand-deep">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
            Pharmacy View — Prescription Verification
          </p>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">Prescription Details</h1>
          <p className="text-sm mt-1 text-brand-deep-foreground/80">
            QR Code: <span className="font-mono font-semibold text-brand-deep-foreground">{qrValue}</span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {expired && (
          <Alert type="error" message="This prescription has EXPIRED and cannot be dispensed." />
        )}

        {dispenseSuccess && (
          <Alert type="success" message="Medicines dispensed successfully! Prescription status updated." />
        )}

        <Card title="Prescription Summary">
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
              <div className="mt-1"><Badge status={badgeStatus} /></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Issued</p>
              <p className="text-sm font-medium text-foreground mt-1">{formatDate(prescription.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Expires</p>
              <p className={`text-sm font-medium mt-1 ${expired ? 'text-destructive font-bold' : 'text-success'}`}>
                {formatDate(prescription.expires_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Doctor</p>
              <p className="text-sm font-medium text-foreground mt-1">
                {prescription.doctor_name ? `Dr. ${prescription.doctor_name}` : '-'}
              </p>
            </div>
          </div>
          {prescription.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Doctor's Notes</p>
              <div className="bg-secondary/50 border border-border rounded-lg p-3">
                <p className="text-sm text-foreground">{prescription.notes}</p>
              </div>
            </div>
          )}
        </Card>

        <Card title={`Medicines (${validItems.length})`}>
          {validItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No medicines found.</p>
            </div>
          ) : (
            <div className="pt-2">
              {validItems.map((item, index) => (
                <MedicineRow
                  key={item.id}
                  item={item}
                  index={index}
                  dispenseQty={dispenseQtys[item.id] || 0}
                  onQtyChange={handleQtyChange}
                  canDispense={dispensing}
                />
              ))}
            </div>
          )}

          {dispenseError && (
            <div className="mt-3">
              <Alert type="error" message={dispenseError} />
            </div>
          )}

          {canDispense && (
            <div className="mt-4 pt-4 border-t border-border">
              {!dispensing ? (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={<ClipboardCheck size={16} />}
                  onClick={() => { setDispensing(true); setDispenseSuccess(false); }}
                >
                  Dispense Medicines
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={submitting}
                    icon={<CheckCircle size={16} />}
                    onClick={handleDispenseSubmit}
                  >
                    Confirm Dispense
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    icon={<XCircle size={16} />}
                    onClick={() => { setDispensing(false); setDispenseQtys({}); setDispenseError(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {prescription.status === 'completed' && (
            <div className="mt-4 pt-4 border-t border-border text-center flex items-center justify-center gap-2">
              <CheckCircle size={18} className="text-success" />
              <p className="text-sm text-success font-semibold">
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