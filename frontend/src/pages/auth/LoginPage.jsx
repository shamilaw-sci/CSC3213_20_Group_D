/**
 * @file    LoginPage.jsx
 * @desc    Login page for all Care4U users (patient, doctor, admin).
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { useState } from 'react';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  // Validate form before submitting
  const validate = () => {
    const newErrors = {};
    if (!formData.email)    newErrors.email    = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    return newErrors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        if (data.data.role === 'patient') {
          window.location.href = '/patient/profile';
        } else if (data.data.role === 'doctor') {
          window.location.href = '/doctor/dashboard';
        } else {
          window.location.href = '/';
        }
      } else {
        setServerError(data.message || 'Login failed. Please try again.');
      }

    } catch {
      setServerError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E3A5F]">Care4U</h1>
          <p className="text-slate-500 mt-1">Centralized Healthcare Ecosystem</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>

          {/* Server Error */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleSubmit}
              className="w-full mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-[#1E3A5F] font-medium hover:underline">
              Register here
            </a>
          </p>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Care4U — Group D | CSC3213
        </p>

      </div>
    </div>
  );
};

export default LoginPage;