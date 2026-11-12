/**
 * @file    LoginPage.jsx
 * @desc    Login page for all Care4U users (patient, doctor, admin).
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { API_BASE_URL } from '../../services/api';

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';
import Card   from '../../components/common/Card';

const LoginPage = () => {
  const location = useLocation();
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
        } else if (data.data.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.data.role === 'pharmacist') {
          window.location.href = '/pharmacy/dashboard';
        } else if (data.data.role === 'hospital_staff') {
          window.location.href = '/hospital/dashboard';
        } else if (data.data.role === 'lab_technician') {
          window.location.href = '/laboratory/dashboard';
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-deep">Care4U</h1>
          <p className="text-muted-foreground mt-1 font-medium">Centralized Healthcare Ecosystem</p>
        </div>

        {/* Login Card */}
        <Card>
          <h2 className="text-xl font-bold text-foreground mb-6">Sign in to your account</h2>

          {location.state?.message && (
            <div className="mb-6">
              <Alert type="success" message={location.state.message} />
            </div>
          )}

          {/* Server Error */}
          {serverError && (
            <div className="mb-6">
              <Alert type="error" message={serverError} />
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
            
            <a href="/forgot-password" className="text-sm text-primary font-semibold hover:underline text-center">
              Forgot your password?
            </a>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-primary font-semibold hover:underline">
              Register here
            </a>
          </p>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs font-medium text-muted-foreground mt-6">
          © 2026 Care4U — Group D | CSC3213
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
