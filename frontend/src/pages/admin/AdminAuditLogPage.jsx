/**
 * @file    AdminAuditLogPage.jsx
 * @module  Admin
 * @desc    Paginated, filterable view over the audit_logs table.
 */

import { API_BASE_URL } from '../../services/api';

import { useEffect, useState } from 'react';

import {
  ClipboardList,
  Filter,
  ShieldCheck,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;
const PAGE_SIZE = 15;

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/admin/audit-logs/actions`,
          {
            credentials: 'include',
          }
        );

        const data =
          await res.json();

        if (data.success) {
          setActions(
            data.data
          );
        }
      } catch (err) {
        console.error(
          'Fetch actions error:',
          err
        );
      }
    };

    fetchActions();
  }, []);

  const fetchLogs = async (
    targetPage = page
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params =
        new URLSearchParams();

      if (emailFilter) {
        params.append(
          'email',
          emailFilter
        );
      }

      if (actionFilter) {
        params.append(
          'action',
          actionFilter
        );
      }

      if (startDate) {
        params.append(
          'startDate',
          startDate
        );
      }

      if (endDate) {
        params.append(
          'endDate',
          endDate
        );
      }

      params.append(
        'page',
        targetPage
      );

      params.append(
        'pageSize',
        PAGE_SIZE
      );

      const res = await fetch(
        `${API_URL}/api/admin/audit-logs?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Failed to load audit logs'
        );

        return;
      }

      setLogs(
        data.data
      );

      setTotalCount(
        data.pagination.totalCount
      );

      setPage(
        targetPage
      );
    } catch (err) {
      console.error(
        'Fetch audit logs error:',
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
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (
    e
  ) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
        PAGE_SIZE
      )
    );

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (val) => (
        <span className="whitespace-nowrap">
          {new Date(
            val
          ).toLocaleString()}
        </span>
      )
    },
    {
      key: 'email',
      label: 'User',
      render: (val) =>
        val || (
          <span className="text-muted-foreground italic">
            (unauthenticated)
          </span>
        )
    },
    {
      key: 'action',
      label: 'Action',
      render: (val) => (
        <Badge
          status="normal"
          label={
            val
          }
        />
      )
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (
        _,
        log
      ) => (
        <span className="text-xs">
          {
            log.entity_type
          }

          {log.entity_id
            ? ` (${log.entity_id.slice(
                0,
                8
              )}...)`
            : ''}
        </span>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (val) => (
        <span className="text-xs font-mono text-muted-foreground">
          {
            val
          }
        </span>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (val) => (
        <div
          className="max-w-[200px] sm:max-w-xs truncate text-xs text-muted-foreground"
          title={
            JSON.stringify(
              val
            )
          }
        >
          {JSON.stringify(
            val
          )}
        </div>
      )
    }
  ];

  if (
    loading &&
    logs.length === 0
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading audit activity...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={ClipboardList}
        title="System Activity & Audit Log"
        description="Review recorded system actions, trace administrative activity, and filter events by user, action, or date."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Total Entries
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  totalCount.toLocaleString()
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Page
              </p>

              <p className="text-sm font-bold text-foreground mt-1">
                {page} / {totalPages}
              </p>

            </div>

          </div>
        }
      />

      {/* Filters */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <Filter
              size={18}
              className="text-primary"
            />
            Audit Filters
          </span>
        }
      >

        <form
          onSubmit={
            handleFilter
          }
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_170px_170px_auto] gap-4 items-end"
        >

          <div className="w-full">

            <Input
              label="User Email"
              name="emailFilter"
              value={
                emailFilter
              }
              onChange={(e) =>
                setEmailFilter(
                  e.target.value
                )
              }
              placeholder="Search email..."
            />

          </div>

          <div className="w-full flex flex-col gap-1.5">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Action
            </label>

            <select
              value={
                actionFilter
              }
              onChange={(e) =>
                setActionFilter(
                  e.target.value
                )
              }
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">
                All actions
              </option>

              {actions.map(
                (
                  action
                ) => (
                  <option
                    key={
                      action
                    }
                    value={
                      action
                    }
                  >
                    {
                      action
                    }
                  </option>
                )
              )}

            </select>

          </div>

          <div className="w-full flex flex-col gap-1.5">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              From
            </label>

            <input
              type="date"
              value={
                startDate
              }
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
            />

          </div>

          <div className="w-full flex flex-col gap-1.5">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              To
            </label>

            <input
              type="date"
              value={
                endDate
              }
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
            />

          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full xl:w-auto"
          >
            Apply Filters
          </Button>

        </form>

      </Card>

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      {/* Log Table */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <ShieldCheck
              size={18}
              className="text-primary"
            />
            Audit Entries
          </span>
        }
      >

        <DataTable
          columns={
            columns
          }
          data={
            logs
          }
          emptyMessage="No audit logs match the selected filters."
        />

      </Card>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              fetchLogs(
                page - 1
              )
            }
            disabled={
              page <= 1 ||
              loading
            }
            className="w-full sm:w-auto"
          >
            Previous
          </Button>

          <div className="rounded-xl bg-secondary/45 px-4 py-2 text-center">

            <span className="text-sm font-semibold text-muted-foreground">
              Page{' '}
              <span className="text-foreground">
                {page}
              </span>
              {' '}of{' '}
              <span className="text-foreground">
                {totalPages}
              </span>
            </span>

          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              fetchLogs(
                page + 1
              )
            }
            disabled={
              page >= totalPages ||
              loading
            }
            className="w-full sm:w-auto"
          >
            Next
          </Button>

        </div>
      )}

    </div>
  );
};

export default AdminAuditLogPage;
