/**
 * @file    AdminAuditLogPage.jsx
 * @module  Admin
 * @desc    Paginated, filterable view over the audit_logs table.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

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

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Activity & Audit Log</h1>
        <p className="text-sm text-slate-500">{totalCount} total entries</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-500 mb-1">User email</label>
          <input
            type="text"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Search email..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#1E3A5F] text-white text-sm rounded-lg hover:bg-[#16293f]"
        >
          Apply Filters
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">User</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Entity</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">IP Address</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-700">{log.email || '(unauthenticated)'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {log.entity_type}
                  {log.entity_id ? ` (${log.entity_id.slice(0, 8)}...)` : ''}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{log.ip_address}</td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate" title={JSON.stringify(log.details)}>
                  {JSON.stringify(log.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => fetchLogs(page - 1)}
          disabled={page <= 1 || loading}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => fetchLogs(page + 1)}
          disabled={page >= totalPages || loading}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;