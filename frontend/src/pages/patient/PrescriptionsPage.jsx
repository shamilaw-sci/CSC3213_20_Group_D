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
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

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
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
    <div className="mt-0.5 p-1.5 bg-primary/10 rounded-lg shrink-0">
      <Pill size={14} className="text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{item.medicine_name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {item.dosage} &nbsp;·&nbsp; {item.frequency} &nbsp;·&nbsp; {item.duration_days} days
      </p>
      {item.special_notes && (
        <p className="text-xs text-primary mt-0.5 italic">{item.special_notes}</p>
      )}
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs text-muted-foreground">Qty prescribed</p>
      <p className="text-sm font-semibold text-foreground">{item.quantity_prescribed}</p>
      {item.quantity_dispensed > 0 && (
        <p className="text-xs text-success font-medium">{item.quantity_dispensed} dispensed</p>
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
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">

      {/* ── Card Header ── */}
      <div
        className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary/10 rounded-lg shrink-0">
            <ClipboardList size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {prescription.doctor_name
                ? `Dr. ${prescription.doctor_name}`
                : 'Prescription'}
              {prescription.doctor_specialization && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({prescription.doctor_specialization})
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={11} />
                Issued: {formatDate(prescription.created_at)}
              </span>
              <span className={`flex items-center gap-1 text-xs ${
                expired ? 'text-destructive font-medium' : days !== null && days <= 7 ? 'text-urgent-foreground font-medium' : 'text-muted-foreground'
              }`}>
                <Calendar size={11} />
                Expires: {formatDate(prescription.expires_at)}
                {!expired && days !== null && days <= 7 && (
                  <span className="font-bold">({days}d left)</span>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {validItems.length} medicine{validItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block">
            <Badge status={badgeSt} />
          </div>
          <div className="p-1 rounded-full bg-secondary text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="border-t border-border">
          
          {/* Mobile Badge Fallback */}
          <div className="sm:hidden px-5 pt-4 pb-1">
            <Badge status={badgeSt} />
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div className="px-5 sm:px-6 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Doctor's Notes
              </p>
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg px-4 py-3 border border-border">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Medicine list */}
          <div className="px-5 sm:px-6 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Medicines
            </p>
            {validItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No medicines listed.</p>
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
            <div className="px-5 sm:px-6 py-5">
              <Button
                variant={showQR ? "secondary" : "ghost"}
                size="sm"
                icon={<QrCode size={16} />}
                onClick={() => setShowQR(!showQR)}
              >
                {showQR ? 'Hide QR Code' : 'Show QR Code for Pharmacy'}
              </Button>

              {showQR && prescription.qr_code_value && (
                <div className="mt-4 flex flex-col items-center gap-3 p-5 bg-secondary/50 rounded-xl border border-border">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={`http://localhost:5173/pharmacy/${prescription.qr_code_value}`}
                      size={180}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <p className="text-xs font-mono font-bold text-foreground bg-white px-3 py-1 rounded-md border border-border shadow-sm">
                    {prescription.qr_code_value}
                  </p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
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
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';

  const {
    data: prescriptions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prescriptions', TEST_PATIENT_ID],
    queryFn: () => getPatientPrescriptions(TEST_PATIENT_ID),
    enabled: !!TEST_PATIENT_ID,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert type="error" message={error?.message || 'Failed to load prescriptions.'} />
        </div>
      </div>
    );
  }

  const active = prescriptions.filter(p => !isExpired(p.expires_at) && p.status !== 'completed');
  const others = prescriptions.filter(p =>  isExpired(p.expires_at) || p.status === 'completed');

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page Header ── */}
      <div className="bg-brand-deep px-6 py-8 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
              Patient Portal
            </p>
            <h1 className="text-2xl font-bold text-brand-deep-foreground">My Prescriptions</h1>
            <p className="text-brand-deep-foreground/80 text-sm mt-1">
              Click any prescription to view medicines and QR code
            </p>
          </div>
          <div className="hidden sm:flex gap-3">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-white/5">
              <p className="text-xl font-bold text-brand-deep-foreground">{active.length}</p>
              <p className="text-xs font-medium text-brand-deep-foreground/70 uppercase tracking-wide">Active</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-5 py-2.5 border border-white/5">
              <p className="text-xl font-bold text-brand-deep-foreground">{others.length}</p>
              <p className="text-xs font-medium text-brand-deep-foreground/70 uppercase tracking-wide">Past</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {prescriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
            <Stethoscope size={36} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No prescriptions found. Prescriptions issued by your doctor will appear here.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              Active Prescriptions
            </h2>
            <div className="space-y-4">
              {active.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
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