/**
 * @component PharmacyRegisterPage
 * @desc      Registration form for new pharmacies.
 *            Submits to POST /api/pharmacies/register.
 *            On success, shows a pending approval message.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PharmacyRegisterPage = () => {
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState(null);
  const navigate                = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/pharmacies/register', {
        email:          data.email,
        password:       data.password,
        phone:          data.phone,
        name:           data.name,
        license_number: data.license_number,
        address:        data.address,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Registration Submitted!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Your pharmacy has been registered successfully. Please wait for
            admin approval before you can log in and start dispensing.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#006B6B' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-lg">

        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
            style={{ backgroundColor: '#006B6B' }}
          >
            Pharmacy Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Register Your Pharmacy</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in your details to register. An admin will review and approve your account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Pharmacy Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pharmacy Name *
            </label>
            <input
              {...register('name', { required: 'Pharmacy name is required' })}
              placeholder="e.g. City Pharmacy Colombo"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pharmacy License Number *
            </label>
            <input
              {...register('license_number', { required: 'License number is required' })}
              placeholder="e.g. PH-001-2026"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.license_number && (
              <p className="text-xs text-red-500 mt-1">{errors.license_number.message}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Address *
            </label>
            <input
              {...register('address', { required: 'Address is required' })}
              placeholder="e.g. 123 Main Street, Colombo 03"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Phone Number *
            </label>
            <input
              {...register('phone', { required: 'Phone number is required' })}
              placeholder="e.g. 0771234567"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' },
              })}
              placeholder="e.g. pharmacy@example.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password *
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
              placeholder="Minimum 8 characters"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) =>
                  val === watch('password') || 'Passwords do not match',
              })}
              placeholder="Re-enter your password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white mt-2 disabled:opacity-60"
            style={{ backgroundColor: '#006B6B' }}
          >
            {loading ? 'Registering...' : 'Register Pharmacy'}
          </button>

          {/* Login Link */}
          <p className="text-center text-xs text-slate-500 mt-2">
            Already registered?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-teal-600 font-semibold cursor-pointer hover:underline"
            >
              Log in here
            </span>
          </p>

        </form>
      </div>
    </div>
  );
};

export default PharmacyRegisterPage;