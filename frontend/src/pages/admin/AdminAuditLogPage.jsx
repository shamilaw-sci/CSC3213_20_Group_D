/**
 * @file    AdminAuditLogPage.jsx
 * @module  Admin
 * @desc    Paginated, filterable view over the audit_logs table.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';

const API_URL = 'http://localhost:5000';
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
        const res = await fetch(`${API_URL}/api/admin/audit-logs/actions`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) setActions(data.data);
      } catch (err) {
        console.error('Fetch actions error:', err);
      }
    };
    fetchActions();
  }, []);

  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (emailFilter) params.append('email', emailFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', targetPage);
      params.append('pageSize', PAGE_SIZE);

      const res = await fetch(`${API_URL}/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load audit logs');
        return;
      }

      setLogs(data.data);
      setTotalCount(data.pagination.totalCount);
      setPage(targetPage);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns = [
    { 
      key: 'created_at', 
      label: 'Timestamp', 
      render: (val) => <span className="whitespace-nowrap">{new Date(val).toLocaleString()}</span> 
    },
    { 
      key: 'email', 
      label: 'User', 
      render: (val) => val || <span className="text-muted-foreground italic">(unauthenticated)</span> 
    },
    { 
      key: 'action', 
      label: 'Action', 
      render: (val) => <Badge status="normal" label={val} /> 
    },
    { 
      key: 'entity', 
      label: 'Entity', 
      render: (_, log) => (
        <span className="text-xs">
          {log.entity_type}
          {log.entity_id ? ` (${log.entity_id.slice(0, 8)}...)` : ''}
        </span>
      ) 
    },
    { 
      key: 'ip_address', 
      label: 'IP Address', 
      render: (val) => <span className="text-xs">{val}</span> 
    },
    { 
      key: 'details', 
      label: 'Details', 
      render: (val) => (
        <div className="max-w-[200px] sm:max-w-xs truncate text-xs text-muted-foreground" title={JSON.stringify(val)}>
          {JSON.stringify(val)}
        </div>
      ) 
    }
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">System Activity & Audit Log</h1>
        <p className="text-sm font-medium text-muted-foreground">{totalCount} total entries</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full min-w-[200px]">
            <Input
              label="User Email"
              name="emailFilter"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder="Search email..."
            />
          </div>
          <div className="w-full sm:w-40 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            />
          </div>
          <div className="w-full sm:w-40 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            />
          </div>
          <Button type="submit" variant="brand" className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Log Table */}
      <DataTable 
        columns={columns} 
        data={logs} 
        emptyMessage="No audit logs match the selected filters." 
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(page - 1)}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchLogs(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;