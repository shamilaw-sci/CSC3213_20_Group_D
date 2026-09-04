/**
 * @component PatientLookupPage
 * @desc      Read-only patient lookup page for doctors.
 * Fetches and displays full patient details using a QR code ID.
 * URL pattern: /lookup/:qrCodeId
 * Reachable after a doctor scans a patient QR code via qr-scanner.app.
 * Header banner redesigned for at-a-glance clinical identity (CARE4U-59/66/69):
 * photo, name, age/gender, blood group, and priority condition surface
 * immediately, with an ECG-trace signature animation on load. Avatar sized
 * up to 96px for reliable visual identification.
 * Known Allergies card splits severe allergies into a static red alert
 * strip above the regular list, so a severe allergy can't be scanned past
 * (CARE4U-61).
 * Emergency Contact demoted from a top-level Row 1 card into a closed-by-
 * default collapsible section near the bottom of the page — it's rarely
 * needed mid-lookup and previously competed for visual weight with
 * safety-critical info (CARE4U-62). Patient Information now takes the
 * full Row 1 width on its own.
 * Active Prescriptions section added between Known Allergies and Medical
 * Records — flat, non-expandable list of currently active prescriptions
 * (medicine, dosage, prescribing doctor, expiry) so a doctor can see what
 * a patient is already on before prescribing something new. Reuses the
 * existing getPatientPrescriptions endpoint/data shape from the patient's
 * own Prescriptions page (CARE4U-67).
 * Most Recent Visit Summary added below the banner to give instant context 
 * on the patient's last interaction without scrolling (CARE4U-68).
 * Thorough loading states and responsive scaling applied for mobile viewing (CARE4U-63/64).
 * Actions panel added and strictly gated behind doctor authentication (CARE4U-71).
 * "Start Visit" action button creates a walk-in consultation (CARE4U-72).
 * Doctor Privacy Enforcements successfully integrated (CARE4U-284).
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ChevronDown, Phone, Pill, Calendar, Clock, Lock, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getPatientByQrCode,
  getMedicalRecords,
  getAllergies,
  getPatientHistorySummary,
  getPatientPrescriptions
} from '../../services/patient.service';
import { bookAppointment } from '../../services/appointment.service';
import useAuthStore from '../../store/authStore';
import { formatAge } from '../../utils/dateUtils';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const capitalise = (str) => {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const daysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getAvatarSrc = (patient) => {
  if (patient?.photo_url) return patient.photo_url;
  // Match the dark brand theme for fallback avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=F1F5F9&color=0f172a&size=120&bold=true&rounded=true`;
};

// ─── AI Text Formatter ──────────────────────────────────────────────────────
const formatAiText = (text) => {
  if (!text) return null;

  const renderTextWithSuperscript = (str) => {
    const parts = str.split(/\^(\d+)/);
    return parts.map((part, i) => 
      i % 2 === 1 ? <sup key={i} className="text-[10px] text-primary font-bold">{part}</sup> : part
    );
  };

  let normalizedText = text
    .replace(/^\s*[*-+]\s+\*/gm, '* ')
    .replace(/^\s*[*-+]\s+\*\*/gm, '* **');

  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  return lines.map((line, index) => {
    if (line.startsWith('|')) {
      if (line.includes('---')) return null;
      
      const cells = line.split('|').filter(c => c.trim());
      const isHeader = index + 1 < lines.length && lines[index + 1].includes('---');

      return (
        <div key={index} className={`flex gap-4 py-2 border-b border-border ${isHeader ? 'bg-primary/5 font-bold text-foreground rounded-t-md px-3 mt-3' : 'px-3 hover:bg-secondary/50 transition-colors'}`}>
          {cells.map((cell, i) => (
            <div key={i} className={`flex-1 text-sm ${isHeader ? 'uppercase tracking-wider text-xs' : (i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}`}>
              {renderTextWithSuperscript(cell.trim())}
            </div>
          ))}
        </div>
      );
    }

    if (line.match(/^#+\s/)) {
      return (
        <h4 key={index} className="text-xs font-bold text-foreground mt-6 mb-2 uppercase tracking-widest border-b border-border pb-1">
          {line.replace(/^#+\s*/, '').replace(/\*/g, '')}
        </h4>
      );
    }

    const isBullet = /^[*\-+•]\s*/.test(line);
    let cleanLine = line.replace(/^[*\-+•]\s*/, '');
    
    cleanLine = cleanLine.replace(/(^\*.*?\*\*)|(^\*\*.*?\*)/g, (match) => {
      return '**' + match.replace(/\*/g, '') + '**';
    });

    const parts = cleanLine.split(/\*\*(.*?)\*\*/g);
    
    return (
      <div key={index} className={`flex items-start gap-3 ${isBullet ? 'mb-2' : 'mb-3 mt-3'}`}>
        {isBullet && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 shadow-sm" />}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {parts.map((part, i) => 
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-foreground">
                {renderTextWithSuperscript(part)}
              </strong>
            ) : (
              renderTextWithSuperscript(part.replace(/\*/g, ''))
            )
          )}
        </p>
      </div>
    );
  });
};

// ─── Sub-component: ProfileField ─────────────────────────────────────────────
const ProfileField = ({ label, value, className = '' }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    <span className={`text-sm font-medium text-foreground ${className}`}>
      {value || '—'}
    </span>
  </div>
);

// ─── Sub-component: Active Prescription Row ───────────────────────────────────
const ActivePrescriptionRow = ({ prescription }) => {
  const days = daysRemaining(prescription.expires_at);
  const items = (prescription.items || []).filter((i) => i && i.medicine_name);

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {prescription.doctor_name ? `Dr. ${prescription.doctor_name}` : 'Prescribing doctor unknown'}
        </span>
        <span className={`flex items-center gap-1 text-xs ${days !== null && days <= 7 ? 'text-urgent-foreground font-medium' : 'text-muted-foreground'}`}>
          <Calendar size={11} />
          Expires {formatDate(prescription.expires_at)}
          {days !== null && days <= 7 && ` (${days}d left)`}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No medicines listed.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center gap-2">
              <Pill size={12} className="text-primary shrink-0" />
              <span className="text-sm text-foreground font-medium">{item.medicine_name}</span>
              <span className="text-xs text-muted-foreground">
                {item.dosage}{item.frequency ? ` · ${item.frequency}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Banner Load Animations ───────────────────────────────────────────────────
const BannerAnimationStyles = () => (
  <style>{`
    @keyframes cuAvatarPop {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes cuFadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cuEcgDraw {
      from { stroke-dashoffset: 1600; }
      to   { stroke-dashoffset: 0; }
    }
    .cu-avatar-pop { animation: cuAvatarPop 450ms ease-out both; }
    .cu-fade-slide-up { animation: cuFadeSlideUp 450ms ease-out both; }
    .cu-ecg-draw {
      stroke-dasharray: 1600;
      stroke-dashoffset: 1600;
      animation: cuEcgDraw 900ms ease-out 100ms both;
    }
    @media (prefers-reduced-motion: reduce) {
      .cu-avatar-pop, .cu-fade-slide-up, .cu-ecg-draw {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        stroke-dashoffset: 0 !important;
      }
    }
  `}</style>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientLookupPage = () => {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  // CARE4U-71: Session Recovery for public route
  useEffect(() => {
    const recoverSession = async () => {
      if (!user) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/me', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          const result = await response.json();
          if (result.success && result.data) {
            setUser(result.data);
          }
        } catch (error) {
          console.log("No active doctor session found.", error.message);
        }
      }
    };
    recoverSession();
  }, [user, setUser]);

  // Gating flag for Doctor Actions (CARE4U-71)
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  // AI Summary States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // Start Visit State (CARE4U-72)
  const [isStartingVisit, setIsStartingVisit] = useState(false);

  const { data: patient, isLoading: patientLoading, error: patientError } = useQuery({
    queryKey: ['patient-qr', qrCodeId],
    queryFn: () => getPatientByQrCode(qrCodeId),
    retry: false,
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery({
    queryKey: ['allergies', patient?.id],
    queryFn: () => getAllergies(patient.id),
    enabled: !!patient?.id,
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['medical-records', patient?.id],
    // Pass the doctor's role from the auth store to enforce privacy locks
    queryFn: () => getMedicalRecords(patient.id, user?.role),
    enabled: !!patient?.id,
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions', patient?.id],
    queryFn: () => getPatientPrescriptions(patient.id),
    enabled: !!patient?.id,
  });

  const conditions = patient?.conditions || [];
  const priorityCondition = conditions.find((c) => c.is_priority);
  const severeAllergies = allergies.filter((a) => a.severity?.toLowerCase() === 'severe');
  const otherAllergies = allergies.filter((a) => a.severity?.toLowerCase() !== 'severe');

  const activePrescriptions = prescriptions.filter(
    (p) => !isExpired(p.expires_at) && p.status !== 'completed'
  );

  const mostRecentVisit = records.length > 0 ? records[0] : null;

  const handleGenerateSummary = async () => {
    if (!patient?.id) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      // Pass the doctor's role to the AI generator to ensure privacy!
      const data = await getPatientHistorySummary(patient.id, user?.role);
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummaryError('Failed to generate summary. The AI service might be temporarily unavailable.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // CARE4U-72: Start Visit Handler
  const handleStartVisit = async () => {
    if (!patient?.id || !user?.id) return;
    setIsStartingVisit(true);
    try {
      await bookAppointment({
        patientId: patient.id,
        doctorId: user.id,
        scheduledAt: new Date().toISOString(),
        type: 'opd' // Fix: Updated to match DB check constraint!
      });
      toast.success("Visit started! Added to your queue.");
      navigate('/doctor/dashboard'); // Route doctor back to their hub
    } catch (err) {
      toast.error(err.message || "Failed to start visit");
    } finally {
      setIsStartingVisit(false);
    }
  };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Looking up patient...</p>
        </div>
      </div>
    );
  }

  if (patientError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert
            type="error"
            message={
              patientError?.response?.status === 404
                ? `No patient found for QR code: ${qrCodeId}`
                : 'Failed to load patient. Please try again.'
            }
          />
        </div>
      </div>
    );
  }

  const recordColumns = [
    { key: 'created_at', label: 'Date', render: (value) => formatDate(value) },
    { key: 'record_type', label: 'Type', render: (value) => capitalise(value) },
    { key: 'title', label: 'Title' },
    { key: 'doctor_name', label: 'Doctor', render: (value) => (value ? `Dr. ${value}` : '—') },
    { key: 'is_confidential', label: 'Status', render: (value) => <Badge status={value ? 'confidential' : 'normal'} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <BannerAnimationStyles />

      {/* ── Header Banner (Responsive) ── */}
      <div className="relative overflow-hidden px-4 py-6 sm:px-8 sm:py-7 bg-brand-deep">
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="cu-ecg-draw text-primary"
            d="M0,30 L140,30 L160,8 L180,52 L200,4 L220,56 L240,30 L420,30 L440,18 L460,42 L480,30 L1200,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src={getAvatarSrc(patient)}
              alt="Patient"
              className="cu-avatar-pop w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/20 shadow-md object-cover shrink-0"
            />
            <div>
              <p className="cu-fade-slide-up text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
                Doctor View — Read Only
              </p>
              <h1 className="cu-fade-slide-up text-xl sm:text-2xl font-bold text-brand-deep-foreground leading-tight" style={{ animationDelay: '80ms' }}>
                {patient?.full_name || 'Patient Lookup'}
              </h1>
              <div
                className="cu-fade-slide-up flex flex-wrap items-center gap-2 mt-2"
                style={{ animationDelay: '150ms' }}
              >
                <span className="text-xs sm:text-sm text-brand-deep-foreground/80">
                  {formatAge(patient.date_of_birth)} · {capitalise(patient.gender)}
                </span>
                {patient.blood_group && (
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    {patient.blood_group}
                  </span>
                )}
                {priorityCondition && (
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-urgent text-urgent-foreground">
                    <AlertTriangle size={11} strokeWidth={2.5} />
                    {priorityCondition.condition}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="cu-fade-slide-up hidden sm:block bg-white/10 rounded-xl px-4 py-2 text-right backdrop-blur-sm"
            style={{ animationDelay: '250ms' }}
          >
            <p className="text-xs uppercase tracking-wide text-brand-deep-foreground/70">Patient ID</p>
            <p className="text-sm font-mono font-semibold text-brand-deep-foreground">{qrCodeId}</p>
          </div>
        </div>
      </div>

      {/* ── Gated Doctor Actions Panel (CARE4U-71 & CARE4U-72) ── */}
      {isDoctor && (
        <div className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <Lock size={16} />
              <span>Verified Doctor Access</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleStartVisit}
                loading={isStartingVisit}
                icon={<Stethoscope size={16} />}
              >
                Start Visit
              </Button>
              {/* Ready for CARE4U-73, 74 integration */}
            </div>
          </div>
        </div>
      )}

      {/* ── Page Body (Responsive) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">

        {/* ── Most Recent Visit Strip ── */}
        {!recordsLoading && mostRecentVisit && (
          <div className="bg-secondary/50 border border-border rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 mb-1 sm:mb-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Clock size={16} className="text-primary" />
              Most Recent Visit
            </div>
            <div className="hidden sm:block w-px h-4 bg-border"></div>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3">
              <span className="font-medium text-foreground">{formatDate(mostRecentVisit.created_at)}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{mostRecentVisit.title || capitalise(mostRecentVisit.record_type)}</span>
              {mostRecentVisit.doctor_name && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span>Dr. {mostRecentVisit.doctor_name}</span>
                </>
              )}
            </div>
          </div>
        )}

        <Card title="Patient Information">
          <ProfileField label="Full Name" value={patient.full_name} />
          <ProfileField label="Blood Group" value={patient.blood_group} className="text-destructive font-bold" />
          <ProfileField label="Date of Birth" value={formatDate(patient.date_of_birth)} />
          <ProfileField label="Age" value={formatAge(patient.date_of_birth)} />
          <ProfileField label="NIC" value={patient.nic} />
          <ProfileField label="QR ID" value={patient.qr_code_id} />
        </Card>

        <Card title={`Chronic Conditions (${conditions.length})`}>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No chronic conditions recorded.</p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between py-2.5 px-3 rounded-md border-b border-border last:border-0 gap-2 ${
                    condition.is_priority ? 'bg-destructive/5 border border-destructive/20' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {condition.is_priority && (
                        <AlertTriangle size={14} className="text-destructive shrink-0" strokeWidth={2.5} />
                      )}
                      <p className={`text-sm font-semibold ${condition.is_priority ? 'text-destructive' : 'text-foreground'}`}>
                        {condition.condition}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Diagnosed: {formatDate(condition.diagnosed_at)}
                    </p>
                    {condition.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{condition.notes}</p>
                    )}
                  </div>
                  {condition.is_priority && (
                    <span className="self-start sm:self-auto text-xs font-semibold px-2 py-0.5 rounded-full text-destructive-foreground bg-destructive">
                      Priority
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              {`Known Allergies (${allergies.length})`}
              {!allergiesLoading && severeAllergies.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-destructive-foreground bg-destructive">
                  <AlertTriangle size={11} strokeWidth={2.5} />
                  {severeAllergies.length} Severe
                </span>
              )}
            </span>
          }
        >
          {allergiesLoading ? (
             <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
          ) : allergies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No allergies recorded.</p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {severeAllergies.length > 0 && (
                <div className="flex flex-col gap-2 mb-1">
                  {severeAllergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 py-3 px-4 rounded-md bg-destructive text-destructive-foreground"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                        <div>
                          <p className="text-sm font-bold">{allergy.allergen}</p>
                          {allergy.notes && (
                            <p className="text-xs text-destructive-foreground/80 mt-0.5">{allergy.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full text-destructive bg-white shrink-0">
                        Severe
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {otherAllergies.map((allergy) => (
                <div key={allergy.id} className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{allergy.allergen}</p>
                    {allergy.notes && <p className="text-xs text-muted-foreground mt-0.5">{allergy.notes}</p>}
                  </div>
                  <Badge severity={allergy.severity} className="shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={`Active Prescriptions (${activePrescriptions.length})`}>
          {prescriptionsLoading ? (
            <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
          ) : activePrescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active prescriptions.</p>
          ) : (
            <div className="flex flex-col">
              {activePrescriptions.map((prescription) => (
                <ActivePrescriptionRow key={prescription.id} prescription={prescription} />
              ))}
            </div>
          )}
        </Card>

        <Card title={`Medical Records (${records.length})`}>
          {recordsLoading ? (
             <div className="py-8 flex justify-center"><Spinner size="md" /></div>
          ) : (
            <>
              {records.length > 0 && !aiSummary && (
                <div className="flex justify-end mb-4">
                  <Button
                    variant="primary"
                    onClick={handleGenerateSummary}
                    loading={isGeneratingSummary}
                    icon={<Sparkles size={16} />}
                    className="w-full sm:w-auto"
                  >
                    Generate AI Summary
                  </Button>
                </div>
              )}

              {aiSummary && (
                <div className="mb-6 p-4 sm:p-6 bg-secondary/30 border border-border rounded-xl shadow-sm overflow-x-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2.5 text-foreground font-bold text-sm sm:text-base">
                      <Sparkles size={18} className="text-primary" />
                      AI Clinical Timeline
                    </div>
                    <div className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-urgent-foreground bg-urgent/10 rounded-full border border-urgent/20">
                      <AlertTriangle size={12} strokeWidth={2.5} />
                      Verify Manually
                    </div>
                  </div>
                  <div className="mt-2">
                    {formatAiText(aiSummary)}
                  </div>
                </div>
              )}

              {summaryError && (
                <div className="mb-6">
                  <Alert type="error" message={summaryError} />
                </div>
              )}

              <div className="overflow-x-auto">
                <DataTable
                  columns={recordColumns}
                  data={records}
                  onRowClick={(record) => setSelectedRecord(record)}
                  emptyMessage="No medical records found for this patient."
                />
              </div>
            </>
          )}
        </Card>

        {/* ── Row 5: Emergency Contact ── */}
        <div className="border border-border rounded-lg bg-card">
          <button
            onClick={() => setShowEmergencyContact((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            aria-expanded={showEmergencyContact}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone size={14} className="text-muted-foreground" />
              Emergency Contact
            </span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform ${showEmergencyContact ? 'rotate-180' : ''}`}
            />
          </button>

          {showEmergencyContact && (
            <div className="px-4 pb-4 pt-1 border-t border-border">
              <ProfileField label="Contact Name" value={patient.emergency_contact_name} />
              <ProfileField label="Contact Phone" value={patient.emergency_contact_phone} />
              <ProfileField label="Relationship" value={capitalise(patient.emergency_contact_relationship)} />
            </div>
          )}
        </div>

      </div>

      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.title || 'Record Details'}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground">
              <span><span className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Type: </span>{capitalise(selectedRecord.record_type)}</span>
              <span><span className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Date: </span>{formatDate(selectedRecord.created_at)}</span>
              {selectedRecord.doctor_name && (
                <span>
                  <span className="font-semibold text-muted-foreground uppercase tracking-wide text-xs">Doctor: </span>
                  Dr. {selectedRecord.doctor_name}
                  {selectedRecord.doctor_specialization && ` — ${selectedRecord.doctor_specialization}`}
                </span>
              )}
            </div>

            {selectedRecord.is_confidential && (
              <Alert type="warning" message="This record is marked confidential." />
            )}

            <div className="bg-secondary/50 rounded-lg p-3 sm:p-4 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {selectedRecord.description || 'No description provided.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientLookupPage;