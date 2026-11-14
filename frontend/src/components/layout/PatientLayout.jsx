/**
 * @file    PatientLayout.jsx
 * @module  Patient
 * @desc    Wraps patient pages with their shared layout and navigation.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  Outlet,
} from 'react-router-dom';

import PatientNavbar from './PatientNavbar';

/**
 * FEATURE: Shared patient layout
 * LOGIC: Show the patient navigation and the selected page inside the same layout.
 */
const PatientLayout = () => {
  return (
    <div
      data-module="patient"
      className="min-h-screen bg-secondary/30"
    >

      {/* Patient Portal Navigation */}
      <PatientNavbar />

      {/* Patient Page Content and Spacing */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

    </div>
  );
};

export default PatientLayout;
