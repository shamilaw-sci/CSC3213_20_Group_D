/**
 * @component PatientLookupPage
 * @desc      Read-only patient lookup page for doctors.
 *            Fetches and displays full patient details using a QR code ID.
 *            URL pattern: /lookup/:qrCodeId
 *            Reachable after a doctor scans a patient QR code via qr-scanner.app.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getPatientByQrCode,
  getMedicalRecords,
  getAllergies,
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

  // Fetch allergies — only runs after patient is loaded
  const { data: allergies = [] } = useQuery({
    queryKey: ['allergies', patient?.id],
    queryFn: () => getAllergies(patient.id),
    enabled: !!patient?.id,
  });

  // Fetch medical records — only runs after patient is loaded
  const { data: records = [] } = useQuery({
    queryKey: ['medical-records', patient?.id],
    queryFn: () => getMedicalRecords(patient.id),
    enabled: !!patient?.id,
  });

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
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'record_type',
      label: 'Type',
      render: (value) => capitalise(value),
    },
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: (value) => (value ? `Dr. ${value}` : '—'),
    },
    {
      key: 'is_confidential',
      label: 'Status',
      render: (value) => (
        <Badge status={value ? 'confidential' : 'normal'} />
      ),
    },
  ];

  // ── Success state ──
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header Banner ── */}
      <div
        className="px-8 py-6"
        style={{ backgroundColor: '#1E3A5F' }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: '#93C5FD' }}>
            Doctor View — Read Only
          </p>
          <h1 className="text-2xl font-bold text-white">Patient Lookup</h1>
          <p className="text-sm mt-1" style={{ color: '#CBD5E1' }}>
            Scanned via QR code —{' '}
            <span className="font-mono font-semibold text-white">{qrCodeId}</span>
          </p>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Row 1: Patient Info + Emergency Contact ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Patient Info */}
          <Card title="Patient Information">
            <ProfileField label="Full Name"    value={patient.full_name} />
            <ProfileField
              label="Blood Group"
              value={patient.blood_group}
              valueStyle={{ color: '#C00000', fontWeight: '700' }}
            />
            <ProfileField label="Date of Birth" value={formatDate(patient.date_of_birth)} />
            <ProfileField label="Gender"        value={capitalise(patient.gender)} />
            <ProfileField label="NIC"           value={patient.nic} />
            <ProfileField label="QR ID"         value={patient.qr_code_id} />
          </Card>

          {/* Emergency Contact */}
          <Card title="Emergency Contact">
            <ProfileField label="Contact Name"  value={patient.emergency_contact_name} />
            <ProfileField label="Contact Phone" value={patient.emergency_contact_phone} />
            <ProfileField label="Relationship"  value={capitalise(patient.emergency_contact_relationship)} />
          </Card>
        </div>

        {/* ── Row 2: Known Allergies ── */}
        <Card title={`Known Allergies (${allergies.length})`}>
          {allergies.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No allergies recorded.</p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {allergy.allergen}
                    </p>
                    {allergy.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{allergy.notes}</p>
                    )}
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

        {/* ── Row 3: Medical Records ── */}
        <Card title={`Medical Records (${records.length})`}>
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
            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>
                <span className="font-semibold">Type: </span>
                {capitalise(selectedRecord.record_type)}
              </span>
              <span>
                <span className="font-semibold">Date: </span>
                {formatDate(selectedRecord.created_at)}
              </span>
              {selectedRecord.doctor_name && (
                <span>
                  <span className="font-semibold">Doctor: </span>
                  Dr. {selectedRecord.doctor_name}
                  {selectedRecord.doctor_specialization &&
                    ` — ${selectedRecord.doctor_specialization}`}
                </span>
              )}
            </div>

            {/* Confidential warning */}
            {selectedRecord.is_confidential && (
              <Alert type="warning" message="This record is marked confidential." />
            )}

            {/* Description */}
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