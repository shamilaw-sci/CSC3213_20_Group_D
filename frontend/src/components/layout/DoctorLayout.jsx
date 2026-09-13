/**
 * @file    DoctorLayout.jsx
 * @desc    Layout wrapper for the Doctor module. 
 *          Renders the configured DoctorNavbar at the top and 
 *          injects page content below.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { Outlet } from 'react-router-dom';
import DoctorNavbar from './DoctorNavbar';

const DoctorLayout = () => {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Centralized Navbar pre-configured with Doctor links */}
      <DoctorNavbar />
      
      {/* Main Content Area */}
      {/* Note: We do not restrict max-width here so the clinical dashboard can span wide */}
      <div className="flex-1">
        <Outlet /> 
      </div>
    </div>
  );
};

export default DoctorLayout;