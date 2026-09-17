/**
 * @file    LabQueuePage.jsx
 * @desc    Searchable laboratory request queue with status progression
 *          and report-upload actions for assigned tests.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  ClipboardList,
  FileUp,
  FlaskConical,
  Search,
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

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  sample_collected: 'bg-sky-50 text-sky-700 border-sky-200',
  in_progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PRIORITY_STYLES = {
  routine: 'bg-slate-50 text-slate-600 border-slate-200',
  urgent: 'bg-orange-50 text-orange-700 border-orange-200',
  stat: 'bg-rose-50 text-rose-700 border-rose-200',
};

const NEXT_STATUS = {
  pending: {
    value: 'sample_collected',
    label: 'Mark sample collected',
  },
  sample_collected: {
    value: 'in_progress',
    label: 'Begin testing',
  },
  in_progress: {
    value: 'completed',
    label: 'Mark completed',
  },
};

const VALID_STATUS_FILTERS = [
  'all',
  'pending',
  'sample_collected',
  'in_progress',
  'completed',
  'cancelled',
];

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

const LabQueuePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status') || 'all';
  const statusFilter = VALID_STATUS_FILTERS.includes(requestedStatus)
    ? requestedStatus
    : 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const labId = useAuthStore((state) => state.user?.profile_id);

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

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'all'
        || request.status === statusFilter;
      const matchesPriority = priorityFilter === 'all'
        || request.priority === priorityFilter;
      const searchableText = [
        request.test_type,
        request.patient_name,
        request.doctor_name,
        request.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus
        && matchesPriority
        && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [priorityFilter, requests, searchTerm, statusFilter]);

  const handleStatusChange = (value) => {
    if (value === 'all') {
      setSearchParams({});
      return;
    }

    setSearchParams({ status: value });
  };

  const handleStatusUpdate = async (requestId, nextStatus) => {
    setUpdatingId(requestId);

    try {
      await api.put(`/api/laboratories/requests/${requestId}/status`, {
        status: nextStatus,
      });
      await queryClient.invalidateQueries({ queryKey: ['lab-requests', labId] });
      toast.success(`Request updated to ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to update the request status.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (requestsQuery.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const errorMessage = requestsQuery.error?.response?.data?.message
    || requestsQuery.error?.message
    || 'Unable to load laboratory requests.';

  return (
    <main className="bg-muted/30 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Queue identity */}
        <PageHeader
          eyebrow="Diagnostic workflow"
          title="Test request queue"
          description="Review assigned tests, track sample progress, and publish completed findings from one workspace."
          icon={ClipboardList}
          meta={(
            <div>
              <p className="text-3xl font-extrabold text-foreground">
                {requests.length}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">
                Total requests
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

        {requestsQuery.error && <Alert type="error" message={errorMessage} />}

        {/* Search and filters */}
        <Card>
          <div className="grid md:grid-cols-[minmax(0,1fr)_220px_180px] gap-3">
            <label className="relative block">
              <span className="sr-only">Search test requests</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient, doctor, test, or request ID"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label>
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="sample_collected">Sample collected</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label>
              <span className="sr-only">Filter by priority</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All priorities</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">Stat</option>
              </select>
            </label>
          </div>
        </Card>

        {/* Request results */}
        <section aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Requests</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredRequests.length} of {requests.length} requests
              </p>
            </div>
            {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('all');
                  setSearchParams({});
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {filteredRequests.length === 0 ? (
            <Card>
              <div className="py-10 text-center">
                <span className="w-16 h-16 rounded-2xl bg-module-soft text-primary inline-flex items-center justify-center">
                  <FlaskConical className="w-8 h-8" />
                </span>
                <h3 className="font-bold text-foreground mt-4">
                  {requests.length ? 'No matching requests' : 'No test requests yet'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  {requests.length
                    ? 'Try changing the search text or filters.'
                    : 'Requests assigned by doctors will appear in this queue.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const nextStatus = NEXT_STATUS[request.status];
                const canUpload = ['in_progress', 'completed'].includes(request.status);

                return (
                  <Card key={request.id}>
                    <article>
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-extrabold text-foreground">
                              {request.test_type}
                            </h3>
                            <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.routine}`}>
                              {request.priority || 'routine'} priority
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-2 break-all">
                            Request {request.id}
                          </p>
                        </div>

                        <span className={`inline-flex self-start px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                          {STATUS_LABELS[request.status] || request.status}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3 mt-5">
                        <div className="rounded-xl bg-muted/60 p-3 flex items-start gap-3">
                          <UserRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Patient</p>
                            <p className="text-sm font-semibold text-foreground mt-1 truncate">
                              {request.patient_name || 'Unavailable'}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3 flex items-start gap-3">
                          <Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Requested by</p>
                            <p className="text-sm font-semibold text-foreground mt-1 truncate">
                              {request.doctor_name ? `Dr. ${request.doctor_name}` : 'Unavailable'}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3 flex items-start gap-3">
                          <CalendarClock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Received</p>
                            <p className="text-sm font-semibold text-foreground mt-1">
                              {formatDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-4 p-4 rounded-xl border border-border bg-card">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Clinical notes
                          </p>
                          <p className="text-sm text-foreground leading-relaxed mt-2 whitespace-pre-wrap">
                            {request.notes}
                          </p>
                        </div>
                      )}

                      {(nextStatus || canUpload) && (
                        <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-border">
                          {nextStatus && (
                            <Button
                              loading={updatingId === request.id}
                              disabled={Boolean(updatingId) && updatingId !== request.id}
                              onClick={() => handleStatusUpdate(request.id, nextStatus.value)}
                            >
                              {nextStatus.label}
                            </Button>
                          )}
                          {canUpload && (
                            <Button
                              variant={request.status === 'in_progress' ? 'secondary' : 'ghost'}
                              icon={<FileUp className="w-4 h-4" />}
                              onClick={() => navigate(`/laboratory/report/${request.id}`)}
                            >
                              Upload report
                            </Button>
                          )}
                        </div>
                      )}
                    </article>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default LabQueuePage;
