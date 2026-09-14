/**
 * @component AdminLayout
 * @desc      Layout wrapper for all admin panel pages.
 *            Applies the Admin module theme, renders AdminNavbar,
 *            and displays the selected administration page.
 */

import {
  Outlet,
} from 'react-router-dom';

import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
  return (
    <div
      data-module="admin"
      className="min-h-screen bg-secondary/30"
    >

      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;