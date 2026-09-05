/**
 * @component PharmacyProfilePage
 * @desc      Pharmacy profile page for pharmacists.
 *            Allows viewing and updating editable pharmacy details.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  BadgeCheck,
  ShieldCheck,
  ShieldAlert,
  Save,
  Pencil,
  X,
  LogOut,
} from 'lucide-react';

import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';

import useAuthStore from '../../store/authStore';

const PharmacyProfilePage = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const user = useAuthStore((state) => state.user);

  const clearUser = useAuthStore(
    (state) => state.clearUser
  );

  const PHARMACY_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const [isEditing, setIsEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saveSuccess, setSaveSuccess] =
    useState(false);

  const [saveError, setSaveError] =
    useState(null);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const [formData, setFormData] =
    useState({
      name: '',
      address: '',
      phone: '',
    });

  /**
   * Loads pharmacy profile information.
   */
  const {
    data: pharmacy,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'pharmacy-profile',
      PHARMACY_ID,
    ],

    queryFn: async () => {
      const res = await api.get(
        `/api/pharmacies/${PHARMACY_ID}`
      );

      return res.data.data;
    },

    enabled: !!PHARMACY_ID,
  });

  /**
   * Keep edit form synchronized with
   * the loaded pharmacy profile.
   */
  useEffect(() => {
    if (pharmacy) {
      setFormData({
        name: pharmacy.name || '',
        address: pharmacy.address || '',
        phone: pharmacy.phone || '',
      });
    }
  }, [pharmacy]);

  /**
   * Updates local form state.
   */
  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaveError(null);
    setSaveSuccess(false);
  };

  /**
   * Cancels profile editing and restores
   * the original values.
   */
  const handleCancel = () => {
    setFormData({
      name: pharmacy?.name || '',
      address: pharmacy?.address || '',
      phone: pharmacy?.phone || '',
    });

    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  /**
   * Saves editable pharmacy profile fields.
   */
  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await api.put(
        `/api/pharmacies/${PHARMACY_ID}`,
        {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
        }
      );

      const updatedPharmacy =
        res.data.data;

      queryClient.setQueryData(
        [
          'pharmacy-profile',
          PHARMACY_ID,
        ],
        updatedPharmacy
      );

      /**
       * The dashboard also contains pharmacy
       * profile information, so invalidate it
       * so it receives the latest name/address.
       */
      queryClient.invalidateQueries({
        queryKey: [
          'pharmacy-dashboard',
          PHARMACY_ID,
        ],
      });

      setSaveSuccess(true);
      setIsEditing(false);

    } catch (error) {
      console.error(
        'Update pharmacy profile error:',
        error
      );

      setSaveError(
        error.response?.data?.message ||
        'Failed to update pharmacy profile. Please try again.'
      );

    } finally {
      setSaving(false);
    }
  };

  /**
   * Logs the pharmacist out.
   */
  const handleLogout = async () => {
    setLogoutLoading(true);

    try {
      await api.post(
        '/api/auth/logout'
      );

      clearUser();

      navigate('/login');

    } catch (error) {
      console.error(
        'Pharmacy logout error:',
        error
      );

      setSaveError(
        error.response?.data?.message ||
        'Logout failed. Please try again.'
      );

    } finally {
      setLogoutLoading(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />

          <p className="text-sm text-muted-foreground">
            Loading pharmacy profile...
          </p>
        </div>

      </div>
    );
  }

  // ── Error ──
  if (isError || !pharmacy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">

        <div className="text-center">

          <p className="text-sm text-destructive font-medium mb-4">
            Failed to load pharmacy profile.
          </p>

          <Button
            variant="primary"
            onClick={() => refetch()}
          >
            Try Again
          </Button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ─────────────────────────────────────────────
          Header
      ───────────────────────────────────────────── */}
      <div className="bg-brand-deep px-6 py-7 sm:px-8">

        <div className="max-w-5xl mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-2 mb-2">

                <Building2
                  size={18}
                  className="text-brand-deep-foreground/70"
                />

                <p className="text-xs font-semibold uppercase tracking-widest text-brand-deep-foreground/70">
                  Pharmacy Portal
                </p>

              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-brand-deep-foreground">
                Pharmacy Profile
              </h1>

              <p className="text-sm mt-1 text-brand-deep-foreground/80">
                View and manage pharmacy information
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <Button
                variant="secondary"
                icon={
                  <ArrowLeft size={16} />
                }
                onClick={() =>
                  navigate(
                    '/pharmacy/dashboard'
                  )
                }
              >
                Dashboard
              </Button>

              <Button
                variant="secondary"
                icon={
                  <LogOut size={16} />
                }
                loading={logoutLoading}
                onClick={handleLogout}
              >
                Logout
              </Button>

            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ─────────────────────────────────────────
            Status Card
        ───────────────────────────────────────── */}
        <Card>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">

                <Building2 size={28} />

              </div>

              <div>

                <h2 className="text-xl font-bold text-foreground">
                  {pharmacy.name}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  License: {pharmacy.license_number}
                </p>

              </div>

            </div>

            <div>

              {pharmacy.is_verified ? (

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success font-semibold text-sm">

                  <ShieldCheck size={18} />

                  Verified Pharmacy

                </div>

              ) : (

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-urgent/10 text-urgent-foreground font-semibold text-sm">

                  <ShieldAlert size={18} />

                  Pending Approval

                </div>

              )}

            </div>

          </div>

        </Card>

        {/* Success Message */}
        {saveSuccess && (
          <Alert
            type="success"
            message="Pharmacy profile updated successfully."
          />
        )}

        {/* Error Message */}
        {saveError && (
          <Alert
            type="error"
            message={saveError}
          />
        )}

        {/* ─────────────────────────────────────────
            Pharmacy Profile
        ───────────────────────────────────────── */}
        <Card
          title="Pharmacy Information"
          icon={<Building2 size={18} />}
        >

          {!isEditing ? (

            <div className="flex flex-col gap-6">

              {/* Pharmacy Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 pb-5 border-b border-border">

                <div className="flex items-center gap-2 text-muted-foreground">

                  <Building2 size={16} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Pharmacy Name
                  </p>

                </div>

                <p className="sm:col-span-2 text-sm font-semibold text-foreground">
                  {pharmacy.name || '—'}
                </p>

              </div>

              {/* License Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 pb-5 border-b border-border">

                <div className="flex items-center gap-2 text-muted-foreground">

                  <BadgeCheck size={16} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    License Number
                  </p>

                </div>

                <div className="sm:col-span-2">

                  <p className="text-sm font-semibold text-foreground">
                    {pharmacy.license_number || '—'}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    License number cannot be changed from the pharmacy portal.
                  </p>

                </div>

              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 pb-5 border-b border-border">

                <div className="flex items-center gap-2 text-muted-foreground">

                  <MapPin size={16} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Address
                  </p>

                </div>

                <p className="sm:col-span-2 text-sm font-semibold text-foreground">
                  {pharmacy.address || '—'}
                </p>

              </div>

              {/* Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">

                <div className="flex items-center gap-2 text-muted-foreground">

                  <Phone size={16} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Phone
                  </p>

                </div>

                <p className="sm:col-span-2 text-sm font-semibold text-foreground">
                  {pharmacy.phone || '—'}
                </p>

              </div>

              {/* Edit Button */}
              <div className="pt-5 border-t border-border flex justify-end">

                <Button
                  variant="primary"
                  icon={
                    <Pencil size={16} />
                  }
                  onClick={() => {
                    setIsEditing(true);
                    setSaveSuccess(false);
                    setSaveError(null);
                  }}
                >
                  Edit Profile
                </Button>

              </div>

            </div>

          ) : (

            <form
              onSubmit={handleSave}
              className="flex flex-col gap-5"
            >

              {/* Pharmacy Name */}
              <Input
                label="Pharmacy Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter pharmacy name"
                required
              />

              {/* License Number — Read Only */}
              <Input
                label="License Number"
                name="license_number"
                value={
                  pharmacy.license_number ||
                  ''
                }
                disabled
              />

              <p className="-mt-3 text-xs text-muted-foreground">
                License number is verified by the administrator and cannot be changed here.
              </p>

              {/* Address */}
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter pharmacy address"
                required
              />

              {/* Phone */}
              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

              {/* Buttons */}
              <div className="pt-5 border-t border-border flex flex-col sm:flex-row justify-end gap-3">

                <Button
                  type="button"
                  variant="secondary"
                  icon={
                    <X size={16} />
                  }
                  onClick={handleCancel}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  icon={
                    <Save size={16} />
                  }
                >
                  Save Changes
                </Button>

              </div>

            </form>

          )}

        </Card>

        {/* ─────────────────────────────────────────
            Account Status
        ───────────────────────────────────────── */}
        <Card
          title="Account Status"
          icon={<ShieldCheck size={18} />}
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Verification
              </p>

              <div className="mt-2 flex items-center gap-2">

                {pharmacy.is_verified ? (
                  <>
                    <ShieldCheck
                      size={17}
                      className="text-success"
                    />

                    <span className="text-sm font-semibold text-success">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert
                      size={17}
                      className="text-urgent-foreground"
                    />

                    <span className="text-sm font-semibold text-urgent-foreground">
                      Pending Approval
                    </span>
                  </>
                )}

              </div>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Account
              </p>

              <p className="text-sm font-semibold text-foreground mt-2">
                {pharmacy.is_active
                  ? 'Active'
                  : 'Inactive'}
              </p>

            </div>

          </div>

        </Card>

      </div>

    </div>
  );
};

export default PharmacyProfilePage;