/**
 * @component LabQueuePage
 * @desc      Lab staff view of incoming test requests.
 *            Shows all requests with status update controls
 *            and links to upload reports.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';

const TEST_LAB_ID = 'd7d01020-b5ca-41d1-9f8a-3cb5424ab4c7';

const STATUS_COLORS = {
  pending:          'bg-orange-100 text-orange-700',
  sample_collected: 'bg-blue-100 text-blue-700',
  in_progress:      'bg-purple-100 text-purple-700',
  completed:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
};

const NEXT_STATUS = {
  pending:          'sample_collected',
  sample_collected: 'in_progress',
  in_progress:      'completed',
};

const STATUS_LABELS = {
  pending:          'Mark Sample Collected',
  sample_collected: 'Mark In Progress',
  in_progress:      'Mark Completed',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const LabQueuePage = () => {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const [updating, setUpdating] = useState(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['lab-requests', TEST_LAB_ID],
    queryFn: async () => {
      const res = await api.get(`/api/laboratories/${TEST_LAB_ID}/requests`);
      return res.data.data;
    },
  });

  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdating(requestId);
    try {
      await api.put(`/api/laboratories/requests/${requestId}/status`, { status: newStatus });
      queryClient.invalidateQueries(['lab-requests', TEST_LAB_ID]);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: '#1E3A5F' }}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
              Laboratory Portal
            </p>
            <h1 className="text-2xl font-bold text-white">Test Request Queue</h1>
          </div>
          <button
            onClick={() => navigate('/laboratory/dashboard')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white border border-white/30 hover:bg-white/10"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!requests || requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-4xl mb-3">🧪</p>
            <p className="text-slate-500 text-sm">No test requests yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map(request => (
              <div key={request.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-800">{request.test_type}</h3>
                      {request.priority === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          🚨 URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      Patient: <span className="font-semibold">{request.patient_name || '—'}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Doctor: <span className="font-semibold">Dr. {request.doctor_name || '—'}</span>
                    </p>
                    {request.notes && (
                      <p className="text-xs text-slate-400 mt-1 italic">{request.notes}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Requested: {formatDate(request.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[request.status] || ''}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex gap-3">
                  {NEXT_STATUS[request.status] && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, NEXT_STATUS[request.status])}
                      disabled={updating === request.id}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: '#1E3A5F' }}
                    >
                      {updating === request.id ? 'Updating...' : STATUS_LABELS[request.status]}
                    </button>
                  )}

                  {request.status === 'completed' ? (
                    <button
                      onClick={() => navigate(`/laboratory/report/${request.id}`)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: '#1F7A1F' }}
                    >
                      ✅ View/Upload Report
                    </button>
                  ) : request.status === 'in_progress' && (
                    <button
                      onClick={() => navigate(`/laboratory/report/${request.id}`)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 text-slate-700"
                      style={{ borderColor: '#1E3A5F' }}
                    >
                      📤 Upload Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabQueuePage;