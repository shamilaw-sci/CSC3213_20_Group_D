/**
 * @component AdminLayout
 * @desc      Layout wrapper for all admin panel pages.
 *            Renders AdminNavbar at the top and page content below,
 *            matching PatientLayout's structure.
 */
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;