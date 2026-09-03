/**
 * @file    AdminApprovalsPage.jsx
 * @module  Admin
 * @desc    Lists pending user registrations (pharmacist, lab_technician,
 *          hospital_staff) awaiting admin approval, with approve/reject actions.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Clock } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Pending Registration Approvals
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          {pendingUsers.length} account(s) awaiting admin review
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
          <Clock className="w-10 h-10 text-muted-foreground mb-4 opacity-50" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-foreground">No pending approvals</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1 max-w-sm mx-auto">
            All user registration requests have been processed. New requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingUsers.map((user) => {
            const isActioning = actioningId === user.id;
            return (
              <Card key={user.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-shadow hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-foreground">
                      {user.email}
                    </h3>
                    <Badge status="pending" label="Pending Review" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-muted-foreground mt-2">
                    <span className="capitalize">{user.role?.replace('_', ' ')}</span>
                    <span className="text-border">•</span>
                    <span>{user.phone}</span>
                    <span className="text-border">•</span>
                    <span>Applied {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-border pt-4 sm:pt-0 mt-2 sm:mt-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(user.id)}
                    disabled={isActioning}
                    className="flex-1 sm:flex-none"
                  >
                    {isActioning ? 'Working...' : 'Reject'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={isActioning}
                    className="flex-1 sm:flex-none"
                  >
                    {isActioning ? 'Working...' : 'Approve'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminApprovalsPage;