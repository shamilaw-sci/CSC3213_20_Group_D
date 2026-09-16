/**
 * @component PatientLayout
 * @desc      Layout wrapper for all patient portal pages.
 *            Applies the Patient module theme, renders PatientNavbar,
 *            and displays the selected patient page.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  Outlet,
} from 'react-router-dom';

import PatientNavbar from './PatientNavbar';

const PatientLayout = () => {
  return (
    <div
      data-module="patient"
      className="min-h-screen bg-secondary/30"
    >

      <PatientNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

    </div>
  );
};

export default PatientLayout;