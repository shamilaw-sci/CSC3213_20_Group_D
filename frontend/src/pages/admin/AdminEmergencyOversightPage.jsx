/**
 * @file    AdminEmergencyOversightPage.jsx
 * @module  Admin
 * @desc    Read-only view of Break-the-Glass emergency access events —
 *          staff, patient, reason, and timestamp for each event.
 */

import { useEffect, useState } from 'react';

import {
  AlertTriangle,
  Eye,
  ShieldCheck,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';

const API_URL = 'http://localhost:5000';

const AdminEmergencyOversightPage = () => {
  const [
    logs,
    setLogs
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/admin/emergency-access-logs`,
          {
            credentials: 'include',
          }
        );

        const data =
          await res.json();

        if (!data.success) {
          setError(
            data.message ||
            'Failed to load emergency access logs'
          );

          return;
        }

        setLogs(
          data.data
        );
      } catch (err) {
        console.error(
          'Fetch emergency access logs error:',
          err
        );

        setError(
          'Could not connect to the server.'
        );
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
      render: (val) => (
        <span className="whitespace-nowrap font-medium text-foreground">
          {new Date(
            val
          ).toLocaleString()}
        </span>
      )
    },
    {
      key: 'staff_email',
      label: 'Staff',
      render: (val) =>
        val || (
          <span className="italic text-muted-foreground">
            (unknown)
          </span>
        )
    },
    {
      key: 'user_role',
      label: 'Role',
      // Utilizing the 'confidential' status to correctly map to the amber/urgent token natively
      render: (val) => (
        <Badge
          status="confidential"
          label={
            val
          }
        />
      )
    },
    {
      key: 'patient_name',
      label: 'Patient',
      render: (val) =>
        val || (
          <span className="italic text-muted-foreground">
            (unknown)
          </span>
        )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => (
        <span className="text-muted-foreground">
          {
            val
          }
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading emergency access events...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={ShieldCheck}
        title="Emergency Access Oversight"
        description="Review audited Break-the-Glass access events and monitor emergency access for appropriate use."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Total Events
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  logs.length
                }
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div className="flex items-center gap-2">

              <Eye
                size={16}
                className="text-muted-foreground"
              />

              <div>

                <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                  Access
                </p>

                <p className="text-sm font-bold text-foreground mt-0.5">
                  Read Only
                </p>

              </div>

            </div>

          </div>
        }
      />

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      <Card
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle
              size={18}
              className="text-urgent-foreground"
            />
            Break-the-Glass Events
          </span>
        }
      >

        <div className="mb-4 rounded-xl bg-urgent/10 p-4">

          <div className="flex items-start gap-3">

            <AlertTriangle
              size={18}
              className="text-urgent-foreground shrink-0 mt-0.5"
            />

            <div>

              <p className="text-sm font-semibold text-foreground">
                Emergency access is fully auditable
              </p>

              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Every Break-the-Glass access event should have a clear staff identity, patient, reason, and timestamp so emergency access can be reviewed for misuse.
              </p>

            </div>

          </div>

        </div>

        <DataTable
          columns={
            columns
          }
          data={
            logs
          }
          emptyMessage="No emergency access events recorded."
        />

      </Card>

    </div>
  );
};

export default AdminEmergencyOversightPage;
