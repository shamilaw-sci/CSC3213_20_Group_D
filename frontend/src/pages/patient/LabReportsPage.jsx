/**
 * @file      LabReportsPage.jsx
 * @component LabReportsPage
 * @desc      Displays a chronological list of completed lab reports for a patient.
 *            Allows viewing/downloading the report PDF and marks it as read.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  CheckCircle2,
  FileText,
  FlaskConical,
  MapPin,
  Stethoscope,
} from 'lucide-react';

import {
  getLabReports,
  markLabReportAsRead,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

/**
 * Formats report timestamps for display.
 */
const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return '—';
  }

  return new Date(
    dateStr
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

/**
 * Patient-facing laboratory reports page.
 */
const LabReportsPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const queryClient =
    useQueryClient();

  const {
    data:
      reports = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'labReports',
      patientId,
    ],

    queryFn: () =>
      getLabReports(
        patientId
      ),

    enabled:
      !!patientId,
  });

  /**
   * Opens the completed report and marks it as read
   * in the background when required.
   */
  const handleViewReport =
    async (
      report
    ) => {
      if (
        !report.report_url
      ) {
        return;
      }

      window.open(
        report.report_url,
        '_blank',
        'noopener,noreferrer'
      );

      if (
        !report.is_read
      ) {
        try {

          await markLabReportAsRead(
            patientId,
            report.id
          );

          await queryClient
            .invalidateQueries({
              queryKey: [
                'labReports',
                patientId,
              ],
            });

        } catch (
          err
        ) {

          console.error(
            'Failed to mark report as read:',
            err
          );
        }
      }
    };

  const columns = [
    {
      key: 'created_at',
      label: 'Completed On',

      render:
        value => (
          <span className="text-foreground font-medium whitespace-nowrap">
            {
              formatDate(
                value
              )
            }
          </span>
        ),
    },
    {
      key: 'test_type',
      label: 'Test Type',

      render:
        value => (
          <span className="flex items-center gap-2 text-foreground font-semibold">

            <FlaskConical
              size={16}
              className="text-primary shrink-0"
            />

            {
              value ||
              'Unknown Test'
            }

          </span>
        ),
    },
    {
      key: 'lab_name',
      label: 'Laboratory',

      render:
        value => (
          <span className="text-foreground">
            {
              value ||
              '—'
            }
          </span>
        ),
    },
    {
      key: 'doctor_name',
      label: 'Requested By',

      render:
        value => (
          <span className="text-muted-foreground">
            {value
              ? `Dr. ${value}`
              : '—'}
          </span>
        ),
    },
    {
      key: 'status',
      label: 'Status',

      render:
        (
          value,
          record
        ) => (
          <Badge
            status={
              record.is_read
                ? 'completed'
                : 'pending'
            }
            label={
              record.is_read
                ? 'Viewed'
                : 'New Results'
            }
          />
        ),
    },
    {
      key: 'report_url',
      label: 'Action',

      render:
        (
          url,
          record
        ) => (
          <Button
            variant="ghost"
            size="sm"
            icon={
              <FileText
                size={16}
              />
            }
            disabled={
              !url
            }
            onClick={
              event => {
                event.stopPropagation();

                handleViewReport(
                  record
                );
              }
            }
          >
            View PDF
          </Button>
        ),
    },
  ];

  if (
    isLoading
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading lab reports...
        </p>

      </div>
    );
  }

  if (
    isError
  ) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message={
              error?.message ||
              'Failed to load lab reports.'
            }
          />

        </div>

      </div>
    );
  }

  const unreadCount =
    reports.filter(
      report =>
        report.status ===
          'completed' &&
        !report.is_read
    ).length;

  return (
    <div className="space-y-7">

      {/* =========================================
          PAGE HERO
      ========================================= */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          FlaskConical
        }
        title="Laboratory Reports"
        description="Review completed diagnostic test results and securely open your laboratory reports."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              {unreadCount >
              0 ? (

                <FileText
                  size={19}
                />

              ) : (

                <CheckCircle2
                  size={19}
                />

              )}

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Report Status
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {reports.length ===
                0
                  ? 'No reports available'
                  : `${reports.length} report${
                      reports.length ===
                      1
                        ? ''
                        : 's'
                    } available`}
              </p>

              {unreadCount >
                0 && (
                <p className="text-[11px] font-semibold text-primary mt-0.5">
                  {unreadCount}{' '}
                  new result
                  {unreadCount ===
                  1
                    ? ''
                    : 's'}{' '}
                  ready
                </p>
              )}

            </div>

          </div>
        }
      />

      {/* =========================================
          REPORTS
      ========================================= */}
      <Card
        title="Completed Reports"
      >

        {reports.length ===
        0 ? (

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <FlaskConical
                className="w-7 h-7"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No laboratory reports yet
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              When a doctor requests a laboratory test and the laboratory
              completes it, the final report will appear here.
            </p>

          </div>

        ) : (
          <>

            {/* =====================================
                MOBILE REPORT LIST
            ===================================== */}
            <div className="md:hidden space-y-3">

              {reports.map(
                report => (

                  <article
                    key={
                      report.id
                    }
                    className={`
                      rounded-xl
                      p-4
                      transition-colors
                      ${
                        report.is_read
                          ? 'bg-secondary/45'
                          : 'bg-module-soft/70'
                      }
                    `}
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-3 min-w-0">

                        <div
                          className={`
                            w-10 h-10
                            rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${
                              report.is_read
                                ? 'bg-card text-muted-foreground'
                                : 'bg-primary text-primary-foreground'
                            }
                          `}
                        >

                          <FlaskConical
                            size={18}
                          />

                        </div>

                        <div className="min-w-0">

                          <h3 className="text-sm font-bold text-foreground leading-snug">
                            {report.test_type ||
                              'Unknown Test'}
                          </h3>

                          <p className="text-xs text-muted-foreground mt-1">
                            {
                              formatDate(
                                report.created_at
                              )
                            }
                          </p>

                        </div>

                      </div>

                      <Badge
                        status={
                          report.is_read
                            ? 'completed'
                            : 'pending'
                        }
                        label={
                          report.is_read
                            ? 'Viewed'
                            : 'New'
                        }
                      />

                    </div>

                    <div className="mt-4 space-y-3">

                      <div className="flex items-start gap-3">

                        <MapPin
                          size={16}
                          className="text-primary shrink-0 mt-0.5"
                        />

                        <div className="min-w-0">

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                            Laboratory
                          </p>

                          <p className="text-sm font-medium text-foreground mt-0.5 break-words">
                            {report.lab_name ||
                              '—'}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-start gap-3">

                        <Stethoscope
                          size={16}
                          className="text-primary shrink-0 mt-0.5"
                        />

                        <div>

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                            Requested By
                          </p>

                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {report.doctor_name
                              ? `Dr. ${report.doctor_name}`
                              : '—'}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="mt-4">

                      <Button
                        variant={
                          report.is_read
                            ? 'secondary'
                            : 'primary'
                        }
                        size="sm"
                        icon={
                          <FileText
                            size={15}
                          />
                        }
                        disabled={
                          !report.report_url
                        }
                        onClick={() =>
                          handleViewReport(
                            report
                          )
                        }
                        className="w-full"
                      >
                        {report.report_url
                          ? 'View Report PDF'
                          : 'Report Unavailable'}
                      </Button>

                    </div>

                  </article>

                )
              )}

            </div>

            {/* =====================================
                DESKTOP TABLE
            ===================================== */}
            <div className="hidden md:block">

              <DataTable
                columns={
                  columns
                }
                data={
                  reports
                }
                onRowClick={
                  record =>
                    handleViewReport(
                      record
                    )
                }
                emptyMessage="No lab reports found."
              />

            </div>

          </>
        )}

      </Card>

    </div>
  );
};

export default LabReportsPage;