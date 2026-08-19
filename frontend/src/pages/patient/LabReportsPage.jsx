/**
 * @file      LabReportsPage.jsx
 * @component LabReportsPage
 * @desc      Displays a chronological list of completed lab reports for a patient.
 *            Allows viewing/downloading the report PDF.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useQuery } from '@tanstack/react-query';
import { FlaskConical, FileText, Download, CheckCircle2 } from 'lucide-react';

import { getLabReports } from '../../services/patient.service';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

// TEMPORARY: hardcoded test patient UUID until auth is integrated
const TEST_PATIENT_ID = '006761d1-8279-440e-a786-a492df7abd53';

// ─── Format date helper ───────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const LabReportsPage = () => {
  // ── Fetch lab reports ──────────────────────────────────────────────────────
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['labReports', TEST_PATIENT_ID],
    queryFn: () => getLabReports(TEST_PATIENT_ID),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleViewReport = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Table column definitions ───────────────────────────────────────────────
  const columns = [
    {
      key: 'created_at',
      label: 'Completed On',
      render: (value) => (
        <span className="text-slate-600 font-medium">
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'test_type',
      label: 'Test Type',
      render: (value) => (
        <span className="flex items-center gap-2 text-slate-800 font-semibold">
          <FlaskConical size={16} className="text-indigo-500" />
          {value || 'Unknown Test'}
        </span>
      ),
    },
    {
      key: 'lab_name',
      label: 'Laboratory',
      render: (value) => <span className="text-slate-600">{value}</span>,
    },
    {
      key: 'doctor_name',
      label: 'Requested By',
      render: (value) => <span className="text-slate-500">{value ? `Dr. ${value}` : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full w-fit">
          <CheckCircle2 size={12} />
          {value === 'completed' ? 'Ready' : value}
        </span>
      ),
    },
    {
      key: 'report_url',
      label: 'Action',
      render: (url) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewReport(url);
          }}
          disabled={!url}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={16} />
          View PDF
        </button>
      ),
    },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading lab reports...</p>
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
            message={error?.message || 'Failed to load lab reports.'}
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
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FlaskConical className="text-blue-300" />
            Laboratory Reports
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            View and download your completed diagnostic test results
          </p>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary strip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            <p className="text-sm text-slate-500">
              {reports.length === 0
                ? 'No completed lab reports found'
                : `${reports.length} report${reports.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          
          {reports.length > 0 && (
             <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                New Results Ready
             </span>
          )}
        </div>

        {/* Records Table */}
        <Card>
          <DataTable
            columns={columns}
            data={reports}
            onRowClick={(record) => handleViewReport(record.report_url)}
            emptyMessage="No lab reports found. When a doctor orders a test and the lab completes it, the report will appear here."
          />
        </Card>
      </div>
    </div>
  );
};

export default LabReportsPage;