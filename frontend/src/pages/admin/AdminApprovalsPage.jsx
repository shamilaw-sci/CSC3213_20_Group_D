/**
 * @file    AdminApprovalsPage.jsx
 * @module  Admin
 * @desc    Lists pending user registrations (pharmacist, lab_technician,
 *          hospital_staff) awaiting admin approval, with approve/reject actions.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const AdminApprovalsPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/pending-users`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load pending users');
        return;
      }

      setPendingUsers(data.data);
    } catch (err) {
      console.error('Fetch pending users error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    setActioningId(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Approval failed');
        return;
      }

      await fetchPendingUsers();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Could not connect to the server.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Reason for rejection (this will be emailed to the applicant):');
    if (!reason) return; // cancelled or empty — do nothing

    setActioningId(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Rejection failed');
        return;
      }

      await fetchPendingUsers();
    } catch (err) {
      console.error('Reject error:', err);
      alert('Could not connect to the server.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Pending Registration Approvals
        </h1>
        <p className="text-sm text-slate-500">
          {pendingUsers.length} account(s) awaiting approval
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 font-medium">No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => {
            const isActioning = actioningId === user.id;
            return (
              <div key={user.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {user.email}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {user.role} &middot; {user.phone} &middot; Registered{' '}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={isActioning}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActioning ? 'Working...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={isActioning}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActioning ? 'Working...' : 'Reject'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminApprovalsPage;