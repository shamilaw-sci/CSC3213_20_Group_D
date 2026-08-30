/**
 * @file    AdminEmergencyOversightPage.jsx
 * @module  Admin
 * @desc    Read-only view of Break-the-Glass emergency access events —
 *          staff, patient, reason, and timestamp for each event.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const AdminEmergencyOversightPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/admin/emergency-access-logs`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Failed to load emergency access logs');
          return;
        }

        setLogs(data.data);
      } catch (err) {
        console.error('Fetch emergency access logs error:', err);
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Emergency Access Oversight</h1>
        <p className="text-sm text-slate-500">
          {logs.length} Break-the-Glass event(s) — a required safeguard against emergency-access misuse.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 font-medium">No emergency access events recorded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Staff</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Patient</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.staff_email || '(unknown)'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.patient_name || '(unknown)'}</td>
                  <td className="px-4 py-3 text-slate-600">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEmergencyOversightPage;