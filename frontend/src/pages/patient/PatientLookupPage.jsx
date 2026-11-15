/**
 * @file    PatientLookupPage.jsx
 * @module  Patient / Doctor
 * @desc    Looks up patient QR identity, shows permitted health data and opens doctor visits.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { API_BASE_URL } from '../../services/api';

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

// Helpers

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Show a readable label or a dash for an absent field.
 */
const capitalise = (str) => {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Treat an absent expiry date as not expired; compare supplied dates with the present time.
 */
const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

/**
 * Calculate the rounded-up number of calendar days left before prescription expiry.
 */
const daysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Show the saved patient photo, otherwise generate a safe name-based placeholder image.
 */
const getAvatarSrc = (patient) => {
  if (patient?.photo_url) return patient.photo_url;
  // Match the dark brand theme for fallback avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(patient?.full_name || 'Patient')}&background=F1F5F9&color=0f172a&size=120&bold=true&rounded=true`;
};

// Severity Badge
const SEVERITY_STYLES = {
  priority: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Priority' },
  severe:   { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Severe' },
  moderate: { bg: 'bg-orange-100',     text: 'text-orange-700',  label: 'Moderate' },
  mild:     { bg: 'bg-green-100',      text: 'text-green-700',   label: 'Mild' },
};

/**
 * Highlight allergy priority using the saved severity; default unknown values to mild styling.
 */
const SeverityBadge = ({ severity }) => {
  const style = SEVERITY_STYLES[severity?.toLowerCase()] || SEVERITY_STYLES.mild;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

// AI Text Formatter
const formatAiText = (text) => {
  if (!text) return null;

  /**
   * Render citation markers such as ^1 as superscripts inside an AI summary.
   */
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

// Sub-component: ProfileField
const ProfileField = ({ label, value, className = '' }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    <span className={`text-sm font-medium text-foreground ${className}`}>
      {value || '—'}
    </span>
  </div>
);

// Sub-component: Active Prescription Row
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

// Banner Load Animations
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

// Main Component
const PatientLookupPage = () => {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);

  // CARE4U-71: Session Recovery for public route
  useEffect(() => {
    /**
     * Attempt to restore a signed-in user for this QR route; a failed request leaves the page unauthenticated.
     */
    const recoverSession = async () => {
      if (!user) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
  // Showing doctor-only buttons is a UI choice; backend permission checks still decide access.
  const isDoctor = user?.role?.toLowerCase() === 'doctor';

  // AI Summary States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // Start Visit State (CARE4U-72)
  const [isStartingVisit, setIsStartingVisit] = useState(false);

  // Look up the QR reference through the API; QR identity alone does not authorize medical-record access.
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

  // Clinical records may be denied unless the backend receives the required consultation context.
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['medical-records', patient?.id],
    // The role argument is retained for compatibility; backend access needs an active appointment ID, omitted here.
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

  const sortedAllergies = [...allergies].sort((a, b) => {
    if (a.severity?.toLowerCase() === 'severe' && b.severity?.toLowerCase() !== 'severe') return -1;
    if (a.severity?.toLowerCase() !== 'severe' && b.severity?.toLowerCase() === 'severe') return 1;
    return 0;
  });

  // Exclude completed and expired prescriptions from the quick list shown on this page.
  const activePrescriptions = prescriptions.filter(
    (p) => !isExpired(p.expires_at) && p.status !== 'completed'
  );

  const mostRecentVisit = records.length > 0 ? records[0] : null;

  /**
   * FEATURE: Generate AI medical-history summary
   * LOGIC: Request a summary for the loaded patient and show a retryable error if it fails.
   * The role argument does not grant access; consultation context is required by the backend.
   */
  const handleGenerateSummary = async () => {
    if (!patient?.id) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      // Backend authorization controls summary access; this call does not supply a consultation appointment ID.
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
  /**
   * FEATURE: Start Visit
   * LOGIC: Send an immediate OPD booking for the scanned patient, require an appointment ID,
   * then open its consultation page. Failed requests show the server message and release loading.
   * The doctor-only button is a UI gate; backend session checks authorize the booking.
   */
  const handleStartVisit = async () => {
    if (!patient?.id || !user?.id) return;

    setIsStartingVisit(true);

    try {
      const appointment = await bookAppointment({
        patientId: patient.id,
        doctorId: user.id,
        scheduledAt: new Date().toISOString(),
        type: 'opd'
      });

      if (!appointment?.id) {
        throw new Error('Appointment was created but no appointment ID was returned.');
      }

      toast.success('Visit started! Opening consultation.');

      navigate(
        `/doctor/consultation/${appointment.id}`
      );

    } catch (err) {
      console.error('Start visit error:', err);

      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Failed to start visit'
      );

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

      {/* Header Banner (Responsive) */}
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
              {/* Patient QR Lookup Heading */}
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

      {/* Gated Doctor Actions Panel (CARE4U-71 & CARE4U-72) */}
      {isDoctor && (
        <div className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
              <Lock size={16} />
              <span>Verified Doctor Access</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Start Visit Button */}
              <Button
                variant="primary"
                onClick={handleStartVisit}
                loading={isStartingVisit}
                icon={<Stethoscope size={16} />}
              >
                Start Visit
              </Button>
              {/* Doctor consultation opens from Start Visit. */}
            </div>
          </div>
        </div>
      )}

      {/* Page Body (Responsive) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">

        {/* Most Recent Visit Strip */}
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
          <div className="pt-3">
            {conditions.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex p-3 rounded-full bg-secondary mb-2">
                  <AlertTriangle className="text-muted-foreground" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">No conditions recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                {conditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="flex items-start justify-between p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {condition.condition}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Diagnosed: {formatDate(condition.diagnosed_at)}
                      </p>
                      {condition.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">{condition.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {condition.is_priority && <SeverityBadge severity="priority" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div className="pt-3">
            {allergiesLoading ? (
               <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
            ) : allergies.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex p-3 rounded-full bg-secondary mb-2">
                  <AlertTriangle className="text-muted-foreground" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">No allergies recorded.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                {sortedAllergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="flex items-start justify-between p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{allergy.allergen}</p>
                      {allergy.notes && <p className="text-xs text-muted-foreground mt-1">{allergy.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <SeverityBadge severity={allergy.severity} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  {/* Generate AI Summary Button */}
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
                {/* Patient Medical Records Table */}
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

        {/* Row 5: Emergency Contact */}
        <div className="border border-border rounded-lg bg-card">
          {/* Emergency Contact Expand or Collapse Button */}
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

      {/* Patient Record Details Modal */}
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