/**
 * @file      MedicalRecordsPage.jsx
 * @component MedicalRecordsPage
 * @desc      Displays all medical records for a patient in a table.
 *            Clicking a row opens a modal with the full record details.
 *            Fetches from GET /api/patients/:id/medical-records via React Query.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Stethoscope, FlaskConical, Eye } from 'lucide-react';

import { getMedicalRecords } from '../../services/patient.service';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import useAuthStore from '../../store/authStore';

// ─── Format date helper ───────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Record type icon ─────────────────────────────────────────────────────────
const RecordTypeIcon = ({ type }) => {
  const icons = {
    consultation: <Stethoscope size={14} />,
    lab_result:   <FlaskConical size={14} />,
    imaging:      <Eye size={14} />,
  };
  return icons[type] || <FileText size={14} />;
};

// ─── Record type label ────────────────────────────────────────────────────────
const formatRecordType = (type) => {
  const labels = {
    consultation: 'Consultation',
    lab_result:   'Lab Result',
    imaging:      'Imaging',
  };
  return labels[type] || type;
};

// ─── Main Page Component ──────────────────────────────────────────────────────
const MedicalRecordsPage = () => {
  const user = useAuthStore((state) => state.user);
  const PATIENT_ID = user?.profile_id || user?.id || '';
  const [selectedRecord, setSelectedRecord] = useState(null);

  // ── Fetch medical records ──────────────────────────────────────────────────
  const {
    data: records = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['medicalRecords', PATIENT_ID],
    queryFn: () => getMedicalRecords(PATIENT_ID),
    enabled: !!PATIENT_ID, // Only fetch when ID exists
  });

  // ── Table column definitions ───────────────────────────────────────────────
  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'record_type',
      label: 'Type',
      render: (value) => (
        <span className="flex items-center gap-1.5 text-slate-600">
          <RecordTypeIcon type={value} />
          {formatRecordType(value)}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: (value) => value ? `Dr. ${value}` : '—',
    },
    {
      key: 'is_confidential',
      label: 'Confidential',
      render: (value) => (
        <Badge status={value ? 'confidential' : 'normal'} />
      ),
    },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading medical records...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert
            type="error"
            message={error?.message || 'Failed to load medical records.'}
          />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="bg-[#1E3A5F] text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-blue-200 text-sm mt-1">
            Your complete health history — click any record to view details
          </p>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Summary strip */}
        <div className="flex items-center gap-2 mb-6">
          <FileText size={16} className="text-slate-400" />
          <p className="text-sm text-slate-500">
            {records.length === 0
              ? 'No medical records found'
              : `${records.length} record${records.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Records Table */}
        <Card>
          <DataTable
            columns={columns}
            data={records}
            onRowClick={(record) => setSelectedRecord(record)}
            emptyMessage="No medical records found. Records will appear here after consultations."
          />
        </Card>
      </div>

      {/* ── Record Detail Modal ── */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord?.title || 'Record Details'}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <RecordTypeIcon type={selectedRecord.record_type} />
                {formatRecordType(selectedRecord.record_type)}
              </span>
              <span>•</span>
              <span>{formatDate(selectedRecord.created_at)}</span>
              {selectedRecord.doctor_name && (
                <>
                  <span>•</span>
                  <span>Dr. {selectedRecord.doctor_name}</span>
                </>
              )}
              {selectedRecord.doctor_specialization && (
                <span className="text-[#2E75B6]">
                  ({selectedRecord.doctor_specialization})
                </span>
              )}
            </div>

            {/* Confidential warning */}
            {selectedRecord.is_confidential && (
              <Alert
                type="warning"
                message="This record is marked confidential."
              />
            )}

            {/* Structured Consultation Notes */}
            {selectedRecord.record_type === 'consultation' && (
              <>
                {selectedRecord.chief_complaint && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Chief Complaint</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{selectedRecord.chief_complaint}</p>
                  </div>
                )}
                {selectedRecord.diagnosis && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Diagnosis</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{selectedRecord.diagnosis}</p>
                  </div>
                )}
                {selectedRecord.treatment_plan && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Treatment Plan</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{selectedRecord.treatment_plan}</p>
                  </div>
                )}
                {selectedRecord.follow_up_needed && (
                  <Alert type="info" message="Follow-up recommended by doctor." />
                )}
              </>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Notes
              </p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">
                {selectedRecord.description || 'No additional notes.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicalRecordsPage;