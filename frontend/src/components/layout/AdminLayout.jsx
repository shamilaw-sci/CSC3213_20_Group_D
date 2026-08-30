/**
 * @component AdminLayout
 * @desc      Layout wrapper for all admin panel pages.
 *            Renders the AdminSidebar on the left and the page content
 *            on the right, matching PatientLayout's structure.
 */
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;