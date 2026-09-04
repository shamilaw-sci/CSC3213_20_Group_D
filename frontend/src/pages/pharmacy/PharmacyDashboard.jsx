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
import { Search, QrCode, UserSearch, ShieldCheck, ShieldAlert, ArrowRight, ClipboardList } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../store/authStore';

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
  const user = useAuthStore((state) => state.user);
  const TEST_PHARMACY_ID = user?.profile_id || user?.id || '';
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
    enabled: !!TEST_PHARMACY_ID,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-sm text-destructive font-medium">Failed to load dashboard. Please try again.</p>
      </div>
    );
  }

  const pharmacy           = data?.pharmacy;
  const stats              = data?.stats;
  const recentPrescriptions = stats?.recentPrescriptions || [];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="px-6 py-8 sm:px-8 bg-brand-deep">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
            Pharmacy Portal
          </p>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">
            {pharmacy?.name || 'Pharmacy Dashboard'}
          </h1>
          <p className="text-sm mt-1 text-brand-deep-foreground/80">
            {pharmacy?.address}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Today Dispensed */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Dispensed Today
            </p>
            <p className="text-4xl font-bold text-primary">
              {stats?.todayDispensed ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">prescriptions fulfilled</p>
          </Card>

          {/* Verification Status */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Account Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              {pharmacy?.is_verified ? (
                <ShieldCheck className="w-5 h-5 text-success" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-urgent-foreground" />
              )}
              <p className="text-lg font-semibold text-foreground">
                {pharmacy?.is_verified ? 'Verified & Active' : 'Pending Approval'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              License: <span className="font-medium text-foreground">{pharmacy?.license_number}</span>
            </p>
          </Card>
        </div>

        {/* ── QR Scan Entry ── */}
        <Card title="Verify Prescription by QR Code" icon={<QrCode size={18} />}>
          <p className="text-xs text-muted-foreground mb-4">
            Enter the QR code value from the patient's prescription to verify and dispense.
          </p>
          <form onSubmit={handleQrSearch} className="flex gap-3">
            <Input
              name="qrInput"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="e.g. RX-550e8400-e29b-41d4-..."
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              icon={<Search size={16} />}
            >
              Look Up
            </Button>
          </form>
          
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
              Patient without smartphone?
            </p>
            <Button
              variant="secondary"
              className="w-full"
              icon={<UserSearch size={16} />}
              onClick={() => navigate('/pharmacy/patient-lookup')}
            >
              Look Up Patient by QR Card
            </Button>
          </div>
        </Card>

        {/* ── Recent Prescriptions ── */}
        <Card title="Recent Prescriptions" icon={<ClipboardList size={18} />}>
          {recentPrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
              <ClipboardList className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No prescriptions dispensed yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  onClick={() => navigate(`/pharmacy/${rx.qr_code_value}`)}
                  className="group flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all bg-card"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground font-mono">
                      {rx.qr_code_value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Issued: {formatDate(rx.created_at)} · Expires: {formatDate(rx.expires_at)}
                    </p>
                    {rx.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate max-w-sm">
                        {rx.notes}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 flex flex-col items-end gap-2">
                    <Badge status={rx.status} />
                    <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default PharmacyDashboard;