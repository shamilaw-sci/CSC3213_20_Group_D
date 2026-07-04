/**
 * @component PatientLookupPage
 * @desc      Read-only patient lookup page for doctors.
 * Fetches and displays full patient details using a QR code ID.
 * URL pattern: /lookup/:qrCodeId
 * Reachable after a doctor scans a patient QR code via qr-scanner.app.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import {
  getPatientByQrCode,
  getMedicalRecords,
  getAllergies,
  getPatientHistorySummary
} from '../../services/patient.service';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';

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

const severityColor = (severity) => {
  if (!severity) return '#64748B';
  if (severity === 'severe')   return '#C00000';
  if (severity === 'moderate') return '#E67E22';
  return '#1F7A1F';
};

// ─── AI Text Formatter (Hardened for Tables & Superscripts) ────────────────
const formatAiText = (text) => {
  if (!text) return null;

  // Helper to turn ^9 into proper <sup>9</sup> HTML
  const renderTextWithSuperscript = (str) => {
    const parts = str.split(/\^(\d+)/);
    return parts.map((part, i) => 
      i % 2 === 1 ? <sup key={i} className="text-[10px] text-indigo-700 font-bold">{part}</sup> : part
    );
  };

  let normalizedText = text
    .replace(/^\s*[*-+]\s+\*/gm, '* ')
    .replace(/^\s*[*-+]\s+\*\*/gm, '* **');

  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  return lines.map((line, index) => {
    // 1. Handle Markdown Tables (| Test | Result |)
    if (line.startsWith('|')) {
      if (line.includes('---')) return null; // Skip the markdown divider row
      
      const cells = line.split('|').filter(c => c.trim());
      // Detect if this is the header row by checking if the next line is the divider
      const isHeader = index + 1 < lines.length && lines[index + 1].includes('---');

      return (
        <div key={index} className={`flex gap-4 py-2 border-b border-indigo-50/50 ${isHeader ? 'bg-indigo-50/80 font-bold text-indigo-900 rounded-t-md px-3 mt-3' : 'px-3 hover:bg-slate-50 transition-colors'}`}>
          {cells.map((cell, i) => (
            <div key={i} className={`flex-1 text-sm ${isHeader ? 'uppercase tracking-wider text-xs' : (i === 0 ? 'font-semibold text-slate-700' : 'text-slate-600')}`}>
              {renderTextWithSuperscript(cell.trim())}
            </div>
          ))}
        </div>
      );
    }

    // 2. Handle Headers (###)
    if (line.match(/^#+\s/)) {
      return (
        <h4 key={index} className="text-xs font-bold text-indigo-900 mt-6 mb-2 uppercase tracking-widest border-b border-indigo-100 pb-1">
          {line.replace(/^#+\s*/, '').replace(/\*/g, '')}
        </h4>
      );
    }

    // 3. Handle Bullets & Bolding
    const isBullet = /^[*\-+•]\s*/.test(line);
    let cleanLine = line.replace(/^[*\-+•]\s*/, '');
    
    cleanLine = cleanLine.replace(/(^\*.*?\*\*)|(^\*\*.*?\*)/g, (match) => {
      return '**' + match.replace(/\*/g, '') + '**';
    });

    const parts = cleanLine.split(/\*\*(.*?)\*\*/g);
    
    return (
      <div key={index} className={`flex items-start gap-3 ${isBullet ? 'mb-2' : 'mb-3 mt-3'}`}>
        {isBullet && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 shadow-sm" />}
        <p className="text-sm text-slate-700 leading-relaxed flex-1">
          {parts.map((part, i) => 
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-indigo-950">
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

const ProfileField = ({ label, value, valueStyle }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-slate-800" style={valueStyle}>
      {value || '—'}
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PatientLookupPage = () => {
  const { qrCodeId } = useParams();
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // AI Summary States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // Fetch patient by QR code ID
  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useQuery({
    queryKey: ['patient-qr', qrCodeId],
    queryFn: () => getPatientByQrCode(qrCodeId),
    retry: false,
  });

  // Fetch allergies
  const { data: allergies = [] } = useQuery({
    queryKey: ['allergies', patient?.id],
    queryFn: () => getAllergies(patient.id),
    enabled: !!patient?.id,
  });

  // Fetch medical records
  const { data: records = [] } = useQuery({
    queryKey: ['medical-records', patient?.id],
    queryFn: () => getMedicalRecords(patient.id),
    enabled: !!patient?.id,
  });

  // ── AI Summary Handler ──
  const handleGenerateSummary = async () => {
    if (!patient?.id) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const data = await getPatientHistorySummary(patient.id);
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummaryError('Failed to generate summary. The AI service might be temporarily unavailable.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ── Loading state ──
  if (patientLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Looking up patient...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (patientError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
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

  // ── Medical records table columns ──
  const recordColumns = [
    { key: 'created_at', label: 'Date', render: (value) => formatDate(value) },
    { key: 'record_type', label: 'Type', render: (value) => capitalise(value) },
    { key: 'title', label: 'Title' },
    { key: 'doctor_name', label: 'Doctor', render: (value) => (value ? `Dr. ${value}` : '—') },
    { key: 'is_confidential', label: 'Status', render: (value) => <Badge status={value ? 'confidential' : 'normal'} /> },
  ];

  // ── Success state ──
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header Banner ── */}
      <div className="px-8 py-6" style={{ backgroundColor: '#1E3A5F' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#93C5FD' }}>
            Doctor View — Read Only
          </p>
          <h1 className="text-2xl font-bold text-white">Patient Lookup</h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            Scanned via QR code — <span className="font-mono font-semibold text-white">{qrCodeId}</span>
          </p>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Row 1: Patient Info + Emergency Contact ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Patient Information">
            <ProfileField label="Full Name" value={patient.full_name} />
            <ProfileField label="Blood Group" value={patient.blood_group} valueStyle={{ color: '#C00000', fontWeight: '700' }} />
            <ProfileField label="Date of Birth" value={formatDate(patient.date_of_birth)} />
            <ProfileField label="Gender" value={capitalise(patient.gender)} />
            <ProfileField label="NIC" value={patient.nic} />
            <ProfileField label="QR ID" value={patient.qr_code_id} />
          </Card>

          <Card title="Emergency Contact">
            <ProfileField label="Contact Name" value={patient.emergency_contact_name} />
            <ProfileField label="Contact Phone" value={patient.emergency_contact_phone} />
            <ProfileField label="Relationship" value={capitalise(patient.emergency_contact_relationship)} />
          </Card>
        </div>

        {/* ── Row 2: Known Allergies ── */}
        <Card title={`Known Allergies (${allergies.length})`}>
          {allergies.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No allergies recorded.</p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {allergies.map((allergy) => (
                <div key={allergy.id} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{allergy.allergen}</p>
                    {allergy.notes && <p className="text-xs text-slate-500 mt-0.5">{allergy.notes}</p>}
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white ml-4 shrink-0"
                    style={{ backgroundColor: severityColor(allergy.severity) }}
                  >
                    {capitalise(allergy.severity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Row 3: Medical Records with AI Integration ── */}
        <Card title={`Medical Records (${records.length})`}>
          
          {/* AI Action Button */}
          {records.length > 0 && !aiSummary && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGeneratingSummary ? (
                  <>
                    <Spinner size="sm" color="text-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate AI Summary
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Summary Display Panel */}
          {aiSummary && (
            <div className="mb-6 p-6 bg-linear-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5 text-indigo-900 font-bold text-base">
                  <Sparkles size={18} className="text-indigo-600" />
                  AI Clinical Timeline
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100/80 rounded-full border border-amber-200">
                  <AlertTriangle size={12} strokeWidth={2.5} />
                  AI-Generated • Verify Manually
                </div>
              </div>
              
              <div className="mt-2">
                {formatAiText(aiSummary)}
              </div>
            </div>
          )}

          {/* Error Message for AI */}
          {summaryError && (
            <div className="mb-6">
               <Alert type="error" message={summaryError} />
            </div>
          )}

          {/* Standard Data Table */}
          <DataTable
            columns={recordColumns}
            data={records}
            onRowClick={(record) => setSelectedRecord(record)}
            emptyMessage="No medical records found for this patient."
          />
        </Card>

      </div>

      {/* ── Medical Record Detail Modal ── */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.title || 'Record Details'}
      >
        {selectedRecord && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span><span className="font-semibold">Type: </span>{capitalise(selectedRecord.record_type)}</span>
              <span><span className="font-semibold">Date: </span>{formatDate(selectedRecord.created_at)}</span>
              {selectedRecord.doctor_name && (
                <span>
                  <span className="font-semibold">Doctor: </span>
                  Dr. {selectedRecord.doctor_name}
                  {selectedRecord.doctor_specialization && ` — ${selectedRecord.doctor_specialization}`}
                </span>
              )}
            </div>

            {selectedRecord.is_confidential && (
              <Alert type="warning" message="This record is marked confidential." />
            )}

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
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