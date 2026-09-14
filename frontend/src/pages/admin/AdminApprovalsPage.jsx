/**
 * @file    AdminApprovalsPage.jsx
 * @module  Admin
 * @desc    Lists pending user registrations (pharmacist, lab_technician,
 *          hospital_staff) awaiting admin approval, with approve/reject actions.
 */

import { useEffect, useState } from 'react';

import {
  CheckCircle,
  Clock,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';

const API_URL = 'http://localhost:5000';

const formatRole = (role) => {
  if (!role) return 'Unknown role';

  return role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (date) => {
  if (!date) return '—';

  return new Date(
    date
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

const AdminApprovalsPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_URL}/api/admin/pending-users`,
        {
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Failed to load pending users'
        );
        return;
      }

      setPendingUsers(
        data.data
      );
    } catch (err) {
      console.error(
        'Fetch pending users error:',
        err
      );

      setError(
        'Could not connect to the server.'
      );
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
      const res = await fetch(
        `${API_URL}/api/admin/users/${userId}/approve`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Approval failed'
        );
        return;
      }

      await fetchPendingUsers();
    } catch (err) {
      console.error(
        'Approve error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt(
      'Reason for rejection (this will be emailed to the applicant):'
    );

    if (!reason) return; // cancelled or empty — do nothing

    setActioningId(userId);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/users/${userId}/reject`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Rejection failed'
        );
        return;
      }

      await fetchPendingUsers();
    } catch (err) {
      console.error(
        'Reject error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading pending approvals...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={ShieldCheck}
        title="Pending Registration Approvals"
        description="Review Care4U staff registration requests before granting access to protected healthcare workflows."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
              <Clock
                size={18}
              />
            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Awaiting Review
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {pendingUsers.length}
              </p>

            </div>

          </div>
        }
      />

      {error && (
        <Alert
          type="error"
          message={error}
        />
      )}

      {pendingUsers.length === 0 ? (
        <Card>

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <CheckCircle
                className="w-7 h-7"
                strokeWidth={1.8}
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No pending approvals
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              All user registration requests have been processed. New requests will appear here when they need administrator review.
            </p>

          </div>

        </Card>
      ) : (
        <Card
          title="Registration Requests"
        >

          <div className="space-y-3">

            {pendingUsers.map((user) => {
              const isActioning =
                actioningId === user.id;

              return (
                <div
                  key={user.id}
                  className="rounded-2xl bg-secondary/45 p-4 sm:p-5 transition-colors hover:bg-secondary/65"
                >

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div className="flex items-start gap-4 min-w-0">

                      <div className="w-11 h-11 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

                        <UserRoundCheck
                          size={20}
                        />

                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-sm sm:text-base font-bold text-foreground break-all">
                            {user.email}
                          </h3>

                          <Badge
                            status="pending"
                            label="Pending Review"
                          />

                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2 text-xs text-muted-foreground">

                          <span className="font-semibold text-primary">
                            {formatRole(
                              user.role
                            )}
                          </span>

                          {user.phone && (
                            <>
                              <span className="text-border">
                                •
                              </span>

                              <span>
                                {user.phone}
                              </span>
                            </>
                          )}

                          <span className="text-border">
                            •
                          </span>

                          <span>
                            Applied{' '}
                            {formatDate(
                              user.created_at
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleReject(
                            user.id
                          )
                        }
                        disabled={isActioning}
                        className="w-full sm:w-auto"
                      >
                        {isActioning
                          ? 'Working...'
                          : 'Reject'}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleApprove(
                            user.id
                          )
                        }
                        disabled={isActioning}
                        loading={isActioning}
                        className="w-full sm:w-auto"
                      >
                        Approve
                      </Button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </Card>
      )}

    </div>
  );
};

export default AdminApprovalsPage;