/**
 * @file    HospitalLayout.jsx
 * @module  Hospital
 * @desc    Shared layout for authenticated hospital portal pages.
 *          Applies the Hospital module theme and provides navigation
 *          for OPD and Emergency workflows.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  Outlet,
} from 'react-router-dom';

import HospitalNavbar from './HospitalNavbar';

/**
 * @component HospitalLayout
 * @desc      Shared portal layout used by Hospital Dashboard,
 *            OPD Queue, and Emergency pages.
 */
const HospitalLayout = () => {
  return (
    <div
      data-module="hospital"
      className="min-h-screen bg-muted/30"
    >

      <HospitalNavbar />

      <main>
        <Outlet />
      </main>

    </div>
  );
};

export default HospitalLayout;