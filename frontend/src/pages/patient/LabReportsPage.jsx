/**
 * @file      LabReportsPage.jsx
 * @component LabReportsPage
 * @desc      Displays a chronological list of completed lab reports for a patient.
 *            Allows viewing/downloading the report PDF and marks it as read.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, FileText, CheckCircle2 } from 'lucide-react';

import { getLabReports, markLabReportAsRead } from '../../services/patient.service';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

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
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  const queryClient = useQueryClient();

  // ── Fetch lab reports ──────────────────────────────────────────────────────
  const {
    data: reports = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['labReports', TEST_PATIENT_ID],
    queryFn: () => getLabReports(TEST_PATIENT_ID),
    enabled: !!TEST_PATIENT_ID,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleViewReport = async (report) => {
    if (!report.report_url) return;
    
    // 1. Open the PDF in a new tab immediately for a fast UX
    window.open(report.report_url, '_blank', 'noopener,noreferrer');

    // 2. Mark as read in the background if it's currently unread
    if (!report.is_read) {
      try {
        await markLabReportAsRead(TEST_PATIENT_ID, report.id);
        // 3. Invalidate React Query to automatically refresh the Sidebar badge and table
        queryClient.invalidateQueries({ queryKey: ['labReports', TEST_PATIENT_ID] });
      } catch (err) {
        console.error('Failed to mark report as read:', err);
      }
    }
  };

  // ── Table column definitions ───────────────────────────────────────────────
  const columns = [
    {
      key: 'created_at',
      label: 'Completed On',
      render: (value) => (
        <span className="text-foreground font-medium">
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'test_type',
      label: 'Test Type',
      render: (value) => (
        <span className="flex items-center gap-2 text-foreground font-semibold">
          <FlaskConical size={16} className="text-primary" />
          {value || 'Unknown Test'}
        </span>
      ),
    },
    {
      key: 'lab_name',
      label: 'Laboratory',
      render: (value) => <span className="text-foreground">{value}</span>,
    },
    {
      key: 'doctor_name',
      label: 'Requested By',
      render: (value) => <span className="text-muted-foreground">{value ? `Dr. ${value}` : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, record) => (
        <Badge
          status={record.is_read ? 'completed' : 'pending'}
          label={record.is_read ? 'Viewed' : 'New Results'}
        />
      ),
    },
    {
      key: 'report_url',
      label: 'Action',
      render: (url, record) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<FileText size={16} />}
          disabled={!url}
          onClick={(e) => {
            e.stopPropagation();
            handleViewReport(record);
          }}
        >
          View PDF
        </Button>
      ),
    },
  ];

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/40 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">Loading lab reports...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-secondary/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert
            type="error"
            message={error?.message || 'Failed to load lab reports.'}
          />
        </div>
      </div>
    );
  }

  const unreadCount = reports.filter(r => r.status === 'completed' && !r.is_read).length;

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-secondary/40">
      {/* ── Page Header ── */}
      <div className="bg-brand-deep text-brand-deep-foreground px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FlaskConical className="text-brand-deep-foreground/70" />
            Laboratory Reports
          </h1>
          <p className="text-brand-deep-foreground/70 text-sm mt-1">
            View and download your completed diagnostic test results
          </p>
        </div>
      </div>

      {/* ── Page Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary strip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {reports.length === 0
                ? 'No completed lab reports found'
                : `${reports.length} report${reports.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          
          {unreadCount > 0 && (
             <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {unreadCount} New Result{unreadCount !== 1 ? 's' : ''} Ready
             </span>
          )}
        </div>

        {/* Records Table */}
        <Card>
          <DataTable
            columns={columns}
            data={reports}
            onRowClick={(record) => handleViewReport(record)}
            emptyMessage="No lab reports found. When a doctor orders a test and the lab completes it, the report will appear here."
          />
        </Card>
      </div>
    </div>
  );
};

export default LabReportsPage;