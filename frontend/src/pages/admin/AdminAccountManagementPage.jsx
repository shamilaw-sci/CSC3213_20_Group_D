/**
 * @file    AdminAccountManagementPage.jsx
 * @module  Admin
 * @desc    Searchable/filterable table of all users with an
 *          activate/deactivate toggle.
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const API_URL = 'http://localhost:5000';

const AdminAccountManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`${API_URL}/api/admin/users?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load users');
        return;
      }

      setUsers(data.data);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleActive = async (userId) => {
    setActioningId(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-active`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Action failed');
        return;
      }

      await fetchUsers();
    } catch (err) {
      console.error('Toggle active error:', err);
      alert('Could not connect to the server.');
    } finally {
      setActioningId(null);
    }
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role', 
      render: (val) => <span className="capitalize">{val?.replace('_', ' ')}</span> 
    },
    { 
      key: 'verification_status', 
      label: 'Verification', 
      render: (val) => (
        <Badge 
          status={val === 'verified' ? 'active' : 'pending'} 
          label={val} 
        />
      ) 
    },
    { 
      key: 'is_active', 
      label: 'Status', 
      render: (val) => (
        <Badge 
          status={val ? 'active' : 'cancelled'} 
          label={val ? 'Active' : 'Inactive'} 
        />
      ) 
    },
    { 
      key: 'created_at', 
      label: 'Registered', 
      render: (val) => new Date(val).toLocaleDateString() 
    },
    { 
      key: 'actions', 
      label: 'Action', 
      render: (_, user) => {
        const isActioning = actioningId === user.id;
        return (
          <Button
            size="sm"
            variant={user.is_active ? 'danger' : 'primary'}
            disabled={isActioning}
            loading={isActioning}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(user.id);
            }}
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        );
      }
    }
  ];

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Management</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {users.length} account(s) found
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input
              label="Search (email or phone)"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <div className="w-full sm:w-48 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-white border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">All roles</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="hospital_staff">Hospital Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="w-full sm:w-48 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-white border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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

      {/* User Table */}
      <DataTable 
        columns={columns} 
        data={users} 
        emptyMessage="No users found matching your filters." 
      />
    </div>
  );
};

export default AdminAccountManagementPage;