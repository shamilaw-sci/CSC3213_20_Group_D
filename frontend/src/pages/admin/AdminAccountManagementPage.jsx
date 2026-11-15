/**
 * @file    AdminAccountManagementPage.jsx
 * @module  Admin
 * @desc    Searchable/filterable table of all users with an
 *          activate/deactivate toggle.
 */

import { API_BASE_URL } from '../../services/api';

import { useEffect, useState } from 'react';

import {
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;

/**
 * Show searchable administrator account controls, including activate/deactivate actions.
 * Role and status changes must be enforced by the backend, not by this table.
 */
const AdminAccountManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  /**
   * Build search, role and status filters and request the matching account list.
   * Send the session cookie and handle API or network errors before updating the table.
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use URL query parameters rather than assembling an unsafe search string.
      const params =
        new URLSearchParams();

      if (search) {
        params.append(
          'search',
          search
        );
      }

      if (roleFilter) {
        params.append(
          'role',
          roleFilter
        );
      }

      if (statusFilter) {
        params.append(
          'status',
          statusFilter
        );
      }

      const res = await fetch(
        `${API_URL}/api/admin/users?${params.toString()}`,
        {
          credentials: 'include',
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Failed to load users'
        );

        return;
      }

      setUsers(
        data.data
      );
    } catch (err) {
      console.error(
        'Fetch users error:',
        err
      );

      setError(
        'Could not connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load all users on initial page entry; later searches use the form submit handler.
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Apply the entered filters only when the administrator submits the search form.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  /**
   * Activate or deactivate the chosen account through the admin endpoint.
   * Reload the list after success so the displayed account status matches the database.
   */
  const handleToggleActive = async (
    userId
  ) => {
    // Remember which account is being changed so its action button can show progress.
    setActioningId(
      userId
    );

    try {
      const res = await fetch(
        `${API_URL}/api/admin/users/${userId}/toggle-active`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Action failed'
        );

        return;
      }

      // Refresh the table only after the backend confirms the activation change.
      await fetchUsers();
    } catch (err) {
      console.error(
        'Toggle active error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setActioningId(
        null
      );
    }
  };

  // Build display columns for role, verification, active status and available account actions.
  const columns = [
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className="capitalize">
          {val?.replace(
            '_',
            ' '
          )}
        </span>
      )
    },
    {
      key: 'verification_status',
      label: 'Verification',
      render: (val) => (
        <Badge
          status={
            val === 'verified'
              ? 'active'
              : 'pending'
          }
          label={
            val
          }
        />
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => (
        <Badge
          status={
            val
              ? 'active'
              : 'cancelled'
          }
          label={
            val
              ? 'Active'
              : 'Inactive'
          }
        />
      )
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (val) =>
        new Date(
          val
        ).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Action',
      render: (
        _,
        user
      ) => {
        const isActioning =
          actioningId ===
          user.id;

        return (
          <Button
            size="sm"
            variant={
              user.is_active
                ? 'danger'
                : 'primary'
            }
            disabled={
              isActioning
            }
            loading={
              isActioning
            }
            onClick={(e) => {
              e.stopPropagation();

              handleToggleActive(
                user.id
              );
            }}
          >
            {user.is_active
              ? 'Deactivate'
              : 'Activate'}
          </Button>
        );
      }
    }
  ];

  if (
    loading &&
    users.length === 0
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading user accounts...
        </p>

      </div>
    );
  }

  const activeCount =
    users.filter(
      user =>
        user.is_active
    ).length;

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={ShieldCheck}
        title="Account Management"
        description="Search, filter, and manage Care4U user accounts while keeping activation controls centralized."
        meta={
          <div className="flex items-center gap-5">

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Results
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {users.length}
              </p>

            </div>

            <div className="w-px h-10 bg-border" />

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Active
              </p>

              <p className="text-xl font-extrabold text-foreground mt-0.5">
                {activeCount}
              </p>

            </div>

          </div>
        }
      />

      {/* Search & Filters */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal
              size={18}
              className="text-primary"
            />
            Search & Filters
          </span>
        }
      >

        <form
          onSubmit={
            handleSearch
          }
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto] gap-4 items-end"
        >

          <div className="w-full">

            <Input
              label="Search (email or phone)"
              name="search"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by email or phone..."
            />

          </div>

          <div className="w-full flex flex-col gap-1.5">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Role
            </label>

            <select
              value={
                roleFilter
              }
              onChange={(e) =>
                setRoleFilter(
                  e.target.value
                )
              }
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">
                All roles
              </option>

              <option value="patient">
                Patient
              </option>

              <option value="doctor">
                Doctor
              </option>

              <option value="pharmacist">
                Pharmacist
              </option>

              <option value="lab_technician">
                Lab Technician
              </option>

              <option value="hospital_staff">
                Hospital Staff
              </option>

              <option value="admin">
                Admin
              </option>

            </select>

          </div>

          <div className="w-full flex flex-col gap-1.5">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-card border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>

          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full lg:w-auto"
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

      {/* User Table */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <Users
              size={18}
              className="text-primary"
            />
            User Accounts
          </span>
        }
      >

        <DataTable
          columns={
            columns
          }
          data={
            users
          }
          emptyMessage="No users found matching your filters."
        />

      </Card>

    </div>
  );
};

export default AdminAccountManagementPage;