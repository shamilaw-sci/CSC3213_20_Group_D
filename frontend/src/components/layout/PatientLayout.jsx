/**
 * @component PatientLayout
 * @desc      Layout wrapper for all patient portal pages.
 *            Renders the Sidebar on the left and the page content on the right.
 * @author    Wasana Karunanayaka (S/21/081)
 */
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const PatientLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;