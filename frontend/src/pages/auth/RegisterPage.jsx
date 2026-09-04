/**
 * @file    RegisterPage.jsx
 * @desc    Registration page for patients and doctors in Care4U.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';
import Card   from '../../components/common/Card';

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'hospital_staff', label: 'Hospital Staff' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
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
    dateOfBirth: '',
    // Doctor fields
    slmcRegNumber: '',
    specialization: '',
    // Pharmacist fields
    pharmacyName: '',
    licenseNumber: '',
    pharmacyAddress: '',
    pharmacyPhone: '',
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
    if (formData.role === 'patient' && !formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required for patients';
    }
    if (formData.role === 'doctor') {
      if (!formData.slmcRegNumber)  newErrors.slmcRegNumber  = 'SLMC number is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    }
    if (formData.role === 'pharmacist') {
      if (!formData.pharmacyName)    newErrors.pharmacyName    = 'Pharmacy name is required';
      if (!formData.licenseNumber)   newErrors.licenseNumber   = 'License number is required';
      if (!formData.pharmacyAddress) newErrors.pharmacyAddress = 'Address is required';
      if (!formData.pharmacyPhone)   newErrors.pharmacyPhone   = 'Pharmacy phone is required';
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
      let profileData;
      if (formData.role === 'patient') {
        profileData = { fullName: formData.fullName, nic: formData.nic, dateOfBirth: formData.dateOfBirth };
      } else if (formData.role === 'doctor') {
        profileData = { fullName: formData.fullName, slmcRegNumber: formData.slmcRegNumber, specialization: formData.specialization };
      } else if (formData.role === 'pharmacist') {
        // Pharmacy business profile - creates a matching row in the
        // pharmacies table during OTP verification, so the pharmacy
        // dashboard has real data immediately after registration.
        profileData = {
          name: formData.pharmacyName,
          licenseNumber: formData.licenseNumber,
          address: formData.pharmacyAddress,
          phone: formData.pharmacyPhone,
        };
      } else {
        // lab_technician, hospital_staff — only fullName is collected
        // here; these roles have no dedicated business profile table
        // yet (no dashboard exists either - see mobile App.js placeholder).
        profileData = { fullName: formData.fullName };
      }

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
        navigate('/verify-otp', { state: { email: formData.email } });
      }else {
        setServerError(data.message || 'Registration failed. Please try again.');
      }

    } catch {
      setServerError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === formData.role)?.label ?? '';

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-deep">Care4U</h1>
          <p className="text-muted-foreground mt-1 font-medium">Centralized Healthcare Ecosystem</p>
        </div>

        {/* Register Card */}
        <Card>
          <h2 className="text-xl font-bold text-foreground mb-2">Create your account</h2>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} />
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-4">
              <Alert type="error" message={serverError} />
            </div>
          )}

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Step 1 of 2 — Account Details
              </p>

              {/* Role selector */}
              <div className="grid grid-cols-3 gap-2 mb-1">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setFormData({ ...formData, role: r.value })}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                      ${formData.role === r.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white text-muted-foreground border-input hover:bg-secondary'}`}
                  >
                    {r.label}
                  </button>
                ))}
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
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Step 2 of 2 — {roleLabel} Details
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
                <>
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
                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    error={errors.dateOfBirth}
                    required
                  />
                </>
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

              {formData.role === 'pharmacist' && (
                <>
                  <Input
                    label="Pharmacy Name"
                    name="pharmacyName"
                    type="text"
                    value={formData.pharmacyName}
                    onChange={handleChange}
                    placeholder="e.g. Green Cross Pharmacy"
                    error={errors.pharmacyName}
                    required
                  />
                  <Input
                    label="License Number"
                    name="licenseNumber"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. PH/2024/1234"
                    error={errors.licenseNumber}
                    required
                  />
                  <Input
                    label="Pharmacy Address"
                    name="pharmacyAddress"
                    type="text"
                    value={formData.pharmacyAddress}
                    onChange={handleChange}
                    placeholder="Street, City"
                    error={errors.pharmacyAddress}
                    required
                  />
                  <Input
                    label="Pharmacy Phone"
                    name="pharmacyPhone"
                    type="text"
                    value={formData.pharmacyPhone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    error={errors.pharmacyPhone}
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
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Sign in here
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

export default RegisterPage;