/**
 * @file    PharmacyLayout.jsx
 * @desc    Layout wrapper for the Pharmacy module.
 *          Applies the Pharmacy module theme, renders PharmacyNavbar,
 *          and injects the selected pharmacy page below.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  Outlet,
} from 'react-router-dom';

import PharmacyNavbar from './PharmacyNavbar';

const PharmacyLayout = () => {
  return (
    <div
      data-module="pharmacy"
      className="min-h-screen bg-background flex flex-col"
    >

      <PharmacyNavbar />

      <div className="flex-1">
        <Outlet />
      </div>

    </div>
  );
};

export default PharmacyLayout;