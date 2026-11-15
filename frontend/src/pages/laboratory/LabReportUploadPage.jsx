/**
 * @file    LabReportUploadPage.jsx
 * @desc    Final laboratory findings form for an assigned test request.
 *          Uses the existing report URL contract; no file storage is added.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileUp,
  FlaskConical,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const STATUS_LABELS = {
  pending: 'Pending',
  sample_collected: 'Sample collected',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Allow a blank optional link; if supplied, accept only an HTTP or HTTPS report URL.
 */
const isValidReportUrl = (value) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

/**
 * Finalize findings for a selected laboratory request using its request ID.
 * This form saves text findings and an optional report URL, not a PDF file upload.
 */
const LabReportUploadPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const labId = useAuthStore((state) => state.user?.profile_id);
  const [findings, setFindings] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Load the laboratory request list using the authenticated laboratory profile ID.
  const requestsQuery = useQuery({
    queryKey: ['lab-requests', labId],
    queryFn: async () => {
      const response = await api.get(`/api/laboratories/${labId}/requests`);
      return response.data.data;
    },
    enabled: Boolean(labId),
  });

  // Find the requested test in the laboratory queue before allowing the report form.
  const request = useMemo(
    () => (requestsQuery.data || []).find((item) => item.id === requestId),
    [requestId, requestsQuery.data]
  );

  // Enable finalization only for requests marked in progress or completed.
  const canUpload = request
    && ['in_progress', 'completed'].includes(request.status);

  /**
   * Require nonempty clinical findings and check the optional report link before submission.
   */
  const validate = () => {
    const errors = {};

    // A report without findings cannot be finalized even when a link is provided.
    if (!findings.trim()) {
      errors.findings = 'Enter the test findings before finalizing the report.';
    }

    // Reject non-web schemes and malformed report URLs; the link is optional.
    if (!isValidReportUrl(reportUrl)) {
      errors.reportUrl = 'Enter a valid HTTP or HTTPS report URL.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate the form and request status, then submit findings and an optional URL.
   * On success refresh the request list and show confirmation; display API errors without clearing the form.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Stop submission if the form is invalid or this request is not in an allowed status.
    if (!validate() || !canUpload) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await api.post(`/api/laboratories/requests/${requestId}/report`, {
        findings: findings.trim(),
        report_url: reportUrl.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['lab-requests', labId] });
      setIsComplete(true);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || 'Unable to upload the report. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestsQuery.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <main className="bg-muted/30 min-h-full">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Card>
            <div className="text-center py-6 sm:py-10">
              <span className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-6">
                Report finalized
              </h1>
              <p className="text-muted-foreground leading-relaxed mt-3 max-w-md mx-auto">
                The findings were saved successfully and the request is now marked as completed.
              </p>
              <Button
                className="mt-7"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/laboratory/queue')}
              >
                Return to request queue
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const loadError = requestsQuery.error?.response?.data?.message
    || requestsQuery.error?.message;

  return (
    <main className="bg-muted/30 min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Report identity */}
        <PageHeader
          eyebrow="Diagnostic reporting"
          title="Finalize lab report"
          description="Record verified findings and optionally attach a secure report link. Finalized reports cannot be edited in this workflow."
          icon={FileCheck2}
          actions={(
            <Button
              variant="secondary"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/laboratory/queue')}
            >
              Back to queue
            </Button>
          )}
        />

        {loadError && <Alert type="error" message={loadError} />}

        {!labId && (
          <Alert
            type="error"
            message="Your laboratory profile is not linked to this session. Please sign out and contact an administrator."
          />
        )}

        {!requestsQuery.error && labId && !request && (
          <Alert
            type="error"
            message="This request was not found in your laboratory queue. It may have been removed or belong to another laboratory."
          />
        )}

        {request && !canUpload && (
          <Alert
            type="warning"
            message={`Reports can only be uploaded for in-progress or completed tests. This request is currently ${STATUS_LABELS[request.status]?.toLowerCase() || request.status}.`}
          />
        )}

        {submitError && <Alert type="error" message={submitError} />}

        {request && (
          <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-6 items-start">
            {/* Request summary */}
            <Card title="Request summary">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-module-soft">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Test ordered
                  </p>
                  <p className="text-lg font-extrabold text-foreground mt-1">
                    {request.test_type}
                  </p>
                </div>

                <dl className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserRound className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Patient</dt>
                      <dd className="text-sm font-semibold text-foreground mt-1">
                        {request.patient_name || 'Unavailable'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Stethoscope className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Requesting doctor</dt>
                      <dd className="text-sm font-semibold text-foreground mt-1">
                        {request.doctor_name ? `Dr. ${request.doctor_name}` : 'Unavailable'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FlaskConical className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current status</dt>
                      <dd className="text-sm font-semibold text-foreground mt-1">
                        {STATUS_LABELS[request.status] || request.status}
                      </dd>
                    </div>
                  </div>
                </dl>

                {request.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Clinical notes
                    </p>
                    <p className="text-sm text-foreground leading-relaxed mt-2 whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Findings form */}
            <Card title="Report findings">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="findings"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
                  >
                    Findings / results <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="findings"
                    value={findings}
                    onChange={(event) => {
                      setFindings(event.target.value);
                      setFieldErrors((current) => ({ ...current, findings: '' }));
                    }}
                    rows={9}
                    placeholder="Enter verified results, reference observations, and relevant diagnostic findings..."
                    aria-invalid={Boolean(fieldErrors.findings)}
                    aria-describedby={fieldErrors.findings ? 'findings-error' : undefined}
                    className={`w-full px-3.5 py-3 text-sm text-foreground bg-white border rounded-lg resize-y min-h-48 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.findings ? 'border-destructive' : 'border-input'}`}
                  />
                  {fieldErrors.findings && (
                    <p id="findings-error" className="text-xs text-destructive mt-1.5">
                      {fieldErrors.findings}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="report-url"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5"
                  >
                    Report URL (optional)
                  </label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="report-url"
                      type="url"
                      value={reportUrl}
                      onChange={(event) => {
                        setReportUrl(event.target.value);
                        setFieldErrors((current) => ({ ...current, reportUrl: '' }));
                      }}
                      placeholder="https://secure.example.com/report.pdf"
                      aria-invalid={Boolean(fieldErrors.reportUrl)}
                      aria-describedby={fieldErrors.reportUrl ? 'report-url-error' : 'report-url-help'}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm text-foreground bg-white border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.reportUrl ? 'border-destructive' : 'border-input'}`}
                    />
                  </div>
                  {fieldErrors.reportUrl ? (
                    <p id="report-url-error" className="text-xs text-destructive mt-1.5">
                      {fieldErrors.reportUrl}
                    </p>
                  ) : (
                    <p id="report-url-help" className="text-xs text-muted-foreground mt-1.5">
                      Paste an existing HTTPS link to a PDF or secure digital report.
                    </p>
                  )}
                </div>

                <Alert
                  type="warning"
                  message="Review all values carefully. This workflow finalizes the report and does not support editing after submission."
                />

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/laboratory/queue')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!canUpload}
                    icon={<FileUp className="w-4 h-4" />}
                  >
                    Finalize report
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
};

export default LabReportUploadPage;
