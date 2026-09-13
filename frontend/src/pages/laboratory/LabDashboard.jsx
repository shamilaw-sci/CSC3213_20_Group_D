/**
 * @component LabDashboard
 * @desc      Landing page for lab staff after login.
 *            Shows pending requests count and quick actions.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';

const TEST_LAB_ID = 'd7d01020-b5ca-41d1-9f8a-3cb5424ab4c7';

const LabDashboard = () => {
  const navigate = useNavigate();

  const { data: lab, isLoading: labLoading } = useQuery({
    queryKey: ['lab-profile', TEST_LAB_ID],
    queryFn: async () => {
      const res = await api.get(`/api/laboratories/${TEST_LAB_ID}`);
      return res.data.data;
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['lab-requests', TEST_LAB_ID],
    queryFn: async () => {
      const res = await api.get(`/api/laboratories/${TEST_LAB_ID}/requests`);
      return res.data.data;
    },
  });

  const pending   = (requests || []).filter(r => r.status === 'pending').length;
  const urgent    = (requests || []).filter(r => r.priority === 'urgent' && r.status !== 'completed').length;
  const completed = (requests || []).filter(r => r.status === 'completed').length;

  if (labLoading || requestsLoading) return (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: '#1E3A5F' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
            Laboratory Portal
          </p>
          <h1 className="text-2xl font-bold text-white">{lab?.name || 'Lab Dashboard'}</h1>
          <p className="text-sm mt-1 text-slate-300">{lab?.address}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Requests', value: pending, color: '#E67E22' },
            { label: 'Urgent', value: urgent, color: '#C00000' },
            { label: 'Completed Today', value: completed, color: '#1F7A1F' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                {stat.label}
              </p>
              <p className="text-4xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/laboratory/queue')}
              className="py-3 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#1E3A5F' }}
            >
              📋 View Test Queue
            </button>
            <button
              onClick={() => navigate('/laboratory/queue')}
              className="py-3 rounded-lg text-sm font-semibold border-2 text-slate-700"
              style={{ borderColor: '#1E3A5F' }}
            >
              📤 Upload Report
            </button>
          </div>
        </div>

        {/* Available Tests */}
        {lab?.available_tests?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-3">Available Tests</h2>
            <div className="flex flex-wrap gap-2">
              {lab.available_tests.map(test => (
                <span key={test}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: '#1E3A5F' }}>
                  {test}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LabDashboard;