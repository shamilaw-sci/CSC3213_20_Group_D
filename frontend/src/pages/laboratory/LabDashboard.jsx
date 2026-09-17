/**
 * @file    LabDashboard.jsx
 * @desc    Laboratory operations overview with live request metrics,
 *          quick actions, and the current diagnostic workload.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FlaskConical,
  MapPin,
  Microscope,
  TestTube2,
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

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  sample_collected: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const LabDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const labId = user?.profile_id;

  const labQuery = useQuery({
    queryKey: ['lab-profile', labId],
    queryFn: async () => {
      const response = await api.get(`/api/laboratories/${labId}`);
      return response.data.data;
    },
    enabled: Boolean(labId),
  });

  const requestsQuery = useQuery({
    queryKey: ['lab-requests', labId],
    queryFn: async () => {
      const response = await api.get(`/api/laboratories/${labId}/requests`);
      return response.data.data;
    },
    enabled: Boolean(labId),
  });

  const requests = useMemo(
    () => requestsQuery.data || [],
    [requestsQuery.data]
  );

  const metrics = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    sampleCollected: requests.filter(
      (request) => request.status === 'sample_collected'
    ).length,
    inProgress: requests.filter(
      (request) => request.status === 'in_progress'
    ).length,
    completed: requests.filter(
      (request) => request.status === 'completed'
    ).length,
  }), [requests]);

  const currentRequests = useMemo(
    () => requests
      .filter((request) => !['completed', 'cancelled'].includes(request.status))
      .slice(0, 5),
    [requests]
  );

  if (labQuery.isLoading || requestsQuery.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const queryError = labQuery.error || requestsQuery.error;
  const errorMessage = queryError?.response?.data?.message
    || queryError?.message
    || 'Unable to load the laboratory dashboard.';

  const statCards = [
    { label: 'Total requests', value: metrics.total, icon: ClipboardList },
    { label: 'Pending', value: metrics.pending, icon: Clock3 },
    { label: 'Sample collected', value: metrics.sampleCollected, icon: TestTube2 },
    { label: 'In progress', value: metrics.inProgress, icon: Activity },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle2 },
  ];

  return (
    <main className="bg-muted/30 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Laboratory identity */}
        <PageHeader
          eyebrow="Laboratory operations"
          title={labQuery.data?.name || 'Laboratory dashboard'}
          description="Monitor diagnostic requests, move samples through the testing workflow, and finalize patient reports."
          icon={Microscope}
          meta={(
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <UserRound className="w-4 h-4 text-primary" />
                {user?.full_name || user?.email || 'Lab technician'}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{labQuery.data?.address || 'Address not available'}</span>
              </p>
            </div>
          )}
        />

        {!labId && (
          <Alert
            type="error"
            message="Your laboratory profile is not linked to this session. Please sign out and contact an administrator."
          />
        )}

        {queryError && <Alert type="error" message={errorMessage} />}

        {/* Live request totals */}
        <section aria-labelledby="request-overview-heading">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 id="request-overview-heading" className="text-xl font-bold text-foreground">
                Request overview
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current totals from your laboratory queue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {statCards.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-3xl font-extrabold text-foreground mt-2">
                      {value}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.65fr_1fr] gap-6 items-start">
          {/* Current request list */}
          <Card title="Current requests">
            {currentRequests.length === 0 ? (
              <div className="py-8 text-center">
                <span className="w-14 h-14 rounded-2xl bg-module-soft text-primary inline-flex items-center justify-center">
                  <FlaskConical className="w-7 h-7" />
                </span>
                <h3 className="font-bold text-foreground mt-4">Queue is up to date</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  New diagnostic requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {currentRequests.map((request) => (
                  <article
                    key={request.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground truncate">
                          {request.test_type}
                        </h3>
                        {request.priority && request.priority !== 'routine' && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                            {request.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.patient_name || 'Patient unavailable'} · {formatDate(request.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex self-start sm:self-center px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                      {STATUS_LABELS[request.status] || request.status}
                    </span>
                  </article>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full mt-6"
              icon={<ClipboardList className="w-4 h-4" />}
              onClick={() => navigate('/laboratory/queue')}
            >
              Open full request queue
            </Button>
          </Card>

          <div className="space-y-6">
            {/* Workflow shortcuts */}
            <Card title="Quick actions">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/laboratory/queue')}
                  className="w-full text-left p-4 rounded-xl bg-module-soft border border-primary/10 hover:border-primary/30 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  <span className="block font-bold text-foreground mt-3 group-hover:text-primary">
                    Process test requests
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    Search the queue and advance sample statuses.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/laboratory/queue?status=in_progress')}
                  className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-module-soft/50 transition-colors group"
                >
                  <span className="w-10 h-10 rounded-xl bg-module-soft text-primary inline-flex items-center justify-center">
                    <FlaskConical className="w-5 h-5" />
                  </span>
                  <span className="block font-bold text-foreground mt-3 group-hover:text-primary">
                    Finalize reports
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    Review in-progress tests and upload findings.
                  </span>
                </button>
              </div>
            </Card>

            {/* Registered services */}
            <Card title="Available tests">
              {labQuery.data?.available_tests?.length ? (
                <div className="flex flex-wrap gap-2">
                  {labQuery.data.available_tests.map((test) => (
                    <span
                      key={test}
                      className="px-3 py-1.5 rounded-full bg-module-soft text-module-soft-foreground text-xs font-semibold"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No test catalogue is recorded for this laboratory.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LabDashboard;
