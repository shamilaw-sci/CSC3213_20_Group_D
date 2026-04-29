/**
 * @file    RegisterPage.jsx
 * @desc    Registration page for patients and doctors in Care4U.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { useState } from 'react';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';

const RegisterPage = () => {
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Role info

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // Patient fields
    fullName: '',
    nic: '',
    // Doctor fields
    slmcRegNumber: '',
    specialization: '',
  });

  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.email)    newErrors.email    = 'Email is required';
    if (!formData.phone)    newErrors.phone    = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    }
    if (formData.password && formData.confirmPassword &&
        formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (formData.role === 'patient' && !formData.nic) {
      newErrors.nic = 'NIC is required for patients';
    }
    if (formData.role === 'doctor') {
      if (!formData.slmcRegNumber)  newErrors.slmcRegNumber  = 'SLMC number is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    }
    return newErrors;
  };

  // Go to step 2
  const handleNext = () => {
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep(2);
  };

  // Submit registration
  const handleSubmit = async () => {
    const validationErrors = validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const profileData = formData.role === 'patient'
        ? { fullName: formData.fullName, nic: formData.nic }
        : { fullName: formData.fullName, slmcRegNumber: formData.slmcRegNumber, specialization: formData.specialization };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          profileData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Registration successful! Please login.');
        window.location.href = '/login';
      }else {
        setServerError(data.message || 'Registration failed. Please try again.');
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <h2 className="text-xl font-semibold text-slate-800 mb-2">Create your account</h2>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-[#1E3A5F]' : 'bg-slate-200'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-[#1E3A5F]' : 'bg-slate-200'}`} />
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">Step 1 of 2 — Account Details</p>

              {/* Role selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({ ...formData, role: 'patient' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${formData.role === 'patient'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Patient
                </button>
                <button
                  onClick={() => setFormData({ ...formData, role: 'doctor' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${formData.role === 'doctor'
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  Doctor
                </button>
              </div>

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
                label="Phone Number"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                error={errors.phone}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                error={errors.password}
                required
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                required
              />

              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                className="w-full mt-2"
              >
                Next →
              </Button>
            </div>
          )}

          {/* Step 2 — Role Info */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500">
                Step 2 of 2 — {formData.role === 'patient' ? 'Patient' : 'Doctor'} Details
              </p>

              <Input
                label="Full Name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                error={errors.fullName}
                required
              />

              {formData.role === 'patient' && (
                <Input
                  label="NIC Number"
                  name="nic"
                  type="text"
                  value={formData.nic}
                  onChange={handleChange}
                  placeholder="e.g. 200012345678"
                  error={errors.nic}
                  required
                />
              )}

              {formData.role === 'doctor' && (
                <>
                  <Input
                    label="SLMC Registration Number"
                    name="slmcRegNumber"
                    type="text"
                    value={formData.slmcRegNumber}
                    onChange={handleChange}
                    placeholder="e.g. SLMC/2024/12345"
                    error={errors.slmcRegNumber}
                    required
                  />
                  <Input
                    label="Specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Cardiologist"
                    error={errors.specialization}
                    required
                  />
                </>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </div>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-[#1E3A5F] font-medium hover:underline">
              Sign in here
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

export default RegisterPage;