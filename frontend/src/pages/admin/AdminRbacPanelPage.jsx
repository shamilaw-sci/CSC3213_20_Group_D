/**
 * @file    AdminRbacPanelPage.jsx
 * @module  Admin
 * @desc    Read-only matrix showing which roles can access which API
 *          resource groups, sourced from the codebase's authorize() calls.
 */

import { API_BASE_URL } from '../../services/api';

import { useEffect, useState } from 'react';

import {
  Eye,
  Shield,
  ShieldCheck,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;

const AdminRbacPanelPage = () => {
  const [
    matrix,
    setMatrix
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
    const fetchMatrix = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/admin/rbac-matrix`,
          {
            credentials: 'include',
          }
        );

        const data =
          await res.json();

        if (!data.success) {
          setError(
            data.message ||
            'Failed to load RBAC matrix'
          );

          return;
        }

        setMatrix(
          data.data
        );
      } catch (err) {
        console.error(
          'Fetch RBAC matrix error:',
          err
        );

        setError(
          'Could not connect to the server.'
        );
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
      render: (val) => (
        <span className="font-bold text-foreground">
          {
            val
          }
        </span>
      )
    },
    {
      key: 'allowedRoles',
      label: 'Allowed Roles',
      render: (roles) => (
        <div className="flex flex-wrap gap-2">
          {roles.map(
            (
              role
            ) => (
              <Badge
                key={
                  role
                }
                status="normal"
                label={
                  role
                }
              />
            )
          )}
        </div>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (val) => (
        <span className="text-xs text-muted-foreground leading-relaxed">
          {
            val ||
            '—'
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
          Loading access-control matrix...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={Shield}
        title="RBAC Visibility Panel"
        description="Review which Care4U roles can access each protected resource group based on the application's current authorization rules."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Resource Groups
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {
                  matrix.length
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
            <ShieldCheck
              size={18}
              className="text-primary"
            />
            Role Access Matrix
          </span>
        }
      >

        <div className="mb-4 rounded-xl bg-secondary/45 px-4 py-3">

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            This panel is informational only. It reflects the access rules defined by the codebase&apos;s existing <span className="font-mono text-foreground">authorize()</span> middleware and does not modify permissions.
          </p>

        </div>

        <DataTable
          columns={
            columns
          }
          data={
            matrix
          }
          emptyMessage="No RBAC rules found."
        />

      </Card>

    </div>
  );
};

export default AdminRbacPanelPage;