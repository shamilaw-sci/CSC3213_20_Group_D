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
import { Search, AlertTriangle, CheckCircle, QrCode, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

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
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="px-6 py-8 sm:px-8 bg-brand-deep">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
            Pharmacy Staff — Patient Lookup
          </p>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">No-Smartphone Patient Flow</h1>
          <p className="text-sm mt-1 text-brand-deep-foreground/80">
            Scan or enter patient QR card ID to view their prescriptions
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* QR Search */}
        <Card title="Enter Patient QR Code ID" icon={<QrCode size={18} />}>
          <form onSubmit={handleSearch} className="flex items-start gap-3 mt-1">
            <Input
              name="qrInput"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="e.g. PAT-123456"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              icon={<Search size={16} />}
              className="mt-0.5"
            >
              Look Up
            </Button>
          </form>
        </Card>

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
            <Card title="Patient Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{patientData.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Blood Group</p>
                  <p className="mt-1">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
                      {patientData.blood_group || '—'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">NIC</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{patientData.nic || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Date of Birth</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {formatDate(patientData.date_of_birth)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Consent Step */}
            {!consentGiven && (
              <div className="bg-urgent/10 border border-urgent/20 rounded-xl p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-urgent-foreground mb-2">
                  <AlertTriangle size={18} />
                  Staff Verification Required
                </h2>
                <p className="text-sm text-urgent-foreground/80 mb-5">
                  Before viewing prescriptions, confirm that you have verified
                  the patient's identity in person and they have consented to
                  staff-assisted dispensing.
                </p>
                <Button
                  variant="urgent"
                  onClick={() => setConsentGiven(true)}
                  icon={<CheckCircle size={16} />}
                >
                  I confirm — Show Prescriptions
                </Button>
              </div>
            )}

            {/* Prescriptions List */}
            {consentGiven && (
              <Card title={`Active Prescriptions (${activePrescriptions.length})`}>
                {prescriptionsLoading && <div className="py-4 flex justify-center"><Spinner size="md" /></div>}

                {!prescriptionsLoading && activePrescriptions.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
                    <QrCode className="w-8 h-8 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No active prescriptions found for this patient.
                    </p>
                  </div>
                )}

                {activePrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    onClick={() => navigate(`/pharmacy/${rx.qr_code_value}`)}
                    className="group border border-border rounded-lg p-4 mb-3 last:mb-0 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-mono font-semibold text-foreground">
                          {rx.qr_code_value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued: {formatDate(rx.created_at)} · Expires: {formatDate(rx.expires_at)}
                        </p>
                        {rx.notes && (
                          <p className="text-xs text-muted-foreground/70 mt-1">{rx.notes}</p>
                        )}
                      </div>
                      <Badge status={rx.status} />
                    </div>
                    <p className="flex items-center gap-1 text-xs text-primary mt-3 font-semibold group-hover:text-primary/80 transition-colors">
                      Tap to dispense <ArrowRight size={14} />
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default PatientQRLookupPage;