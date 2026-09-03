/**
 * @file    AdminRbacPanelPage.jsx
 * @module  Admin
 * @desc    Read-only matrix showing which roles can access which API
 *          resource groups, sourced from the codebase's authorize() calls.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';

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

  const columns = [
    { 
      key: 'resourceGroup', 
      label: 'Resource Group', 
      render: (val) => <span className="font-bold text-foreground">{val}</span> 
    },
    { 
      key: 'allowedRoles', 
      label: 'Allowed Roles', 
      render: (roles) => (
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role} status="normal" label={role} />
          ))}
        </div>
      ) 
    },
    { 
      key: 'notes', 
      label: 'Notes', 
      render: (val) => <span className="text-xs text-muted-foreground">{val || '—'}</span> 
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">RBAC Visibility Panel</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1 max-w-2xl">
          Read-only view of which roles can access which resource groups,
          based on the codebase's actual access control rules.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={matrix} 
        emptyMessage="No RBAC rules found." 
      />
    </div>
  );
};

export default AdminRbacPanelPage;