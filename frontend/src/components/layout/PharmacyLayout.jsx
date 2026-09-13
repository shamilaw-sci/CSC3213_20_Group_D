/**
 * @file    PharmacyLayout.jsx
 * @desc    Layout wrapper for the Pharmacy module. 
 *          Renders the configured PharmacyNavbar at the top and 
 *          injects page content below.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { Outlet } from 'react-router-dom';
import PharmacyNavbar from './PharmacyNavbar';

const PharmacyLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Centralized Navbar pre-configured with Pharmacy links */}
      <PharmacyNavbar />
      
      {/* Main Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default PharmacyLayout;