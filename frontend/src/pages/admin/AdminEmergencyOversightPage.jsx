/**
 * @file    AdminEmergencyOversightPage.jsx
 * @module  Admin
 * @desc    Read-only view of Break-the-Glass emergency access events —
 *          staff, patient, reason, and timestamp for each event.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';

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

  const columns = [
    { 
      key: 'created_at', 
      label: 'Timestamp', 
      render: (val) => <span className="whitespace-nowrap font-medium text-foreground">{new Date(val).toLocaleString()}</span> 
    },
    { 
      key: 'staff_email', 
      label: 'Staff', 
      render: (val) => val || <span className="italic text-muted-foreground">(unknown)</span> 
    },
    { 
      key: 'user_role', 
      label: 'Role', 
      // Utilizing the 'confidential' status to correctly map to the amber/urgent token natively
      render: (val) => <Badge status="confidential" label={val} /> 
    },
    { 
      key: 'patient_name', 
      label: 'Patient', 
      render: (val) => val || <span className="italic text-muted-foreground">(unknown)</span> 
    },
    { 
      key: 'reason', 
      label: 'Reason',
      render: (val) => <span className="text-muted-foreground">{val}</span>
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
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Emergency Access Oversight</h1>
        <p className="text-sm font-medium text-muted-foreground">
          {logs.length} Break-the-Glass event(s) — a required safeguard against emergency-access misuse.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={logs} 
        emptyMessage="No emergency access events recorded." 
      />
    </div>
  );
};

export default AdminEmergencyOversightPage;