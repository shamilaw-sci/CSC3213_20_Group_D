/**
 * @file    AdminRbacPanelPage.jsx
 * @module  Admin
 * @desc    Read-only matrix showing which roles can access which API
 *          resource groups, sourced from the codebase's authorize() calls.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const AdminRbacPanelPage = () => {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/admin/rbac-matrix`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message || 'Failed to load RBAC matrix');
          return;
        }

        setMatrix(data.data);
      } catch (err) {
        console.error('Fetch RBAC matrix error:', err);
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();
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
        <h1 className="text-2xl font-bold text-slate-800">RBAC Visibility Panel</h1>
        <p className="text-sm text-slate-500">
          Read-only view of which roles can access which resource groups,
          based on the codebase's actual access control rules.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-medium w-1/3">Resource Group</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Allowed Roles</th>
              <th className="text-left px-4 py-3 text-slate-600 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-800 font-medium">{row.resourceGroup}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {row.allowedRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{row.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRbacPanelPage;