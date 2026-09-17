/**
 * @file    LabLayout.jsx
 * @desc    Shared layout for authenticated laboratory workflows.
 *          Applies the laboratory theme and persistent navigation.
 */

import { Outlet } from 'react-router-dom';

import LabNavbar from './LabNavbar';

const LabLayout = () => (
  <div
    data-module="laboratory"
    className="min-h-screen bg-background flex flex-col"
  >
    <LabNavbar />

    <div className="flex-1">
      <Outlet />
    </div>
  </div>
);

export default LabLayout;
