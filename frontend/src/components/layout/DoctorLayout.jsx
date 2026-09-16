/**
 * @file    DoctorLayout.jsx
 * @desc    Layout wrapper for the Doctor module.
 *          Applies the Doctor module theme, renders DoctorNavbar,
 *          and injects the selected clinical page below.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  Outlet,
} from 'react-router-dom';

import DoctorNavbar from './DoctorNavbar';

const DoctorLayout = () => {
  return (
    <div
      data-module="doctor"
      className="min-h-screen bg-muted/30 flex flex-col"
    >

      <DoctorNavbar />

      <div className="flex-1">
        <Outlet />
      </div>

    </div>
  );
};

export default DoctorLayout;