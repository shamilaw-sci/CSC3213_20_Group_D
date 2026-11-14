/**
 * @file    RegisterPage.jsx
 * @module Authentication UI
 * @desc Two-step registration for all five public web roles; email verification precedes account creation.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { register, authErrorMessage } from '../../services/auth.service';
import AuthLayout from '../../components/auth/AuthLayout';

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'hospital_staff', label: 'Hospital Staff' },
];

/** Two-step registration: collect account details, then the details required for the chosen role. */
const RegisterPage = () => {
  const inFlight = useRef(false);
  const formRef = useRef(null);
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
    laboratoryName: '',
    laboratoryLicenseNumber: '',
    laboratoryAddress: '',
    laboratoryPhone: '',
    hospitalName: '',
    hospitalType: '',
    hospitalLocation: '',
    hospitalDepartments: '',
  });

  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  // Focus the first field when moving between registration steps.
  useEffect(() => { formRef.current?.querySelector('input')?.focus(); }, [step]);

  /** Update the selected field without discarding the other registration details. */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  /** Account details: require email and phone, plus a password of at least eight matching characters. */
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (
      formData.password &&
      formData.password.length < 8
    ) {
      newErrors.password =
        'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        'Please confirm your password';
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        'Passwords do not match';
    }

    return newErrors;
  };

  /** Check only the fields required for the chosen role (patient, doctor, pharmacy, lab or hospital). */
  const validateStep2 = () => {
    const newErrors = {};

    if (
      ['patient', 'doctor'].includes(formData.role) &&
      !formData.fullName.trim()
    ) {
      newErrors.fullName = 'Full name is required';
    }

    if (
      formData.role === 'patient' &&
      !formData.nic.trim()
    ) {
      newErrors.nic =
        'NIC is required for patients';
    }

    if (
      formData.role === 'patient' &&
      !formData.dateOfBirth.trim()
    ) {
      newErrors.dateOfBirth =
        'Date of birth is required for patients';
    }

    if (formData.role === 'doctor') {
      if (!formData.slmcRegNumber.trim()) {
        newErrors.slmcRegNumber =
          'SLMC number is required';
      }

      if (!formData.specialization.trim()) {
        newErrors.specialization =
          'Specialization is required';
      }
    }

    if (formData.role === 'pharmacist') {
      if (!formData.pharmacyName.trim()) {
        newErrors.pharmacyName =
          'Pharmacy name is required';
      }

      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber =
          'License number is required';
      }

      if (!formData.pharmacyAddress.trim()) {
        newErrors.pharmacyAddress =
          'Address is required';
      }

      if (!formData.pharmacyPhone.trim()) {
        newErrors.pharmacyPhone =
          'Pharmacy phone is required';
      }
    }

    if (formData.role === 'lab_technician') {
      if (!formData.laboratoryName.trim()) {
        newErrors.laboratoryName =
          'Laboratory name is required';
      }

      if (!formData.laboratoryLicenseNumber.trim()) {
        newErrors.laboratoryLicenseNumber =
          'License number is required';
      }

      if (!formData.laboratoryAddress.trim()) {
        newErrors.laboratoryAddress =
          'Laboratory address is required';
      }

      if (!formData.laboratoryPhone.trim()) {
        newErrors.laboratoryPhone =
          'Laboratory phone is required';
      }
    }

    if (formData.role === 'hospital_staff') {
      if (!formData.hospitalName.trim()) {
        newErrors.hospitalName =
          'Hospital name is required';
      }

      if (!formData.hospitalType.trim()) {
        newErrors.hospitalType =
          'Hospital type is required';
      }

      if (!formData.hospitalLocation.trim()) {
        newErrors.hospitalLocation =
          'Hospital location is required';
      }

      if (!formData.hospitalDepartments.trim()) {
        newErrors.hospitalDepartments =
          'At least one department is required';
      }
    }

    return newErrors;
  };

  /** Continue to the second step only after the account fields are valid. */
  const handleNext = event => {
    event.preventDefault();
    const validationErrors = validateStep1();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    setErrors({}); setServerError('');
    setStep(2);
  };

  /** Send role-specific details once; after a successful registration request, open email verification. */
  const handleSubmit = async event => {
    event.preventDefault();
    if (inFlight.current) return;
    const validationErrors = validateStep2();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setServerError('');

    try {
      let profileData;

      if (formData.role === 'patient') {
        profileData = {
          fullName: formData.fullName,
          nic: formData.nic,
          dateOfBirth: formData.dateOfBirth
        };

      } else if (formData.role === 'doctor') {
        profileData = {
          fullName: formData.fullName,
          slmcRegNumber: formData.slmcRegNumber,
          specialization: formData.specialization
        };

      } else if (formData.role === 'pharmacist') {
        // The pharmacy profile is created at verification; access still needs admin approval.
        profileData = {
          name: formData.pharmacyName,
          licenseNumber: formData.licenseNumber,
          address: formData.pharmacyAddress,
          phone: formData.pharmacyPhone,
        };

      } else if (formData.role === 'lab_technician') {
        profileData = {
          name: formData.laboratoryName,
          licenseNumber: formData.laboratoryLicenseNumber,
          address: formData.laboratoryAddress,
          phone: formData.laboratoryPhone,
        };

      } else if (formData.role === 'hospital_staff') {
        profileData = {
          name: formData.hospitalName,
          type: formData.hospitalType,
          location: formData.hospitalLocation,
          departments: formData.hospitalDepartments,
        };

      }
      const data = await register(formData.email.trim(), formData.phone.trim(), formData.password, formData.role, profileData);

      if (typeof data.data?.email !== 'string' || !data.data.email.trim()) throw new Error('Invalid registration response');
      if (data.success) {
        navigate(
          '/verify-otp',
          {
            state: {
              email: data.data.email
            }
          }
        );

      } else {
        setServerError(
          data.message ||
          'Registration failed. Please try again.'
        );
      }

    } catch (error) {
      setServerError(authErrorMessage(error, 'Registration failed. Please try again.'));

    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const roleLabel =
    ROLE_OPTIONS.find(
      (r) => r.value === formData.role
    )?.label ?? '';

  return (
    <AuthLayout title="Create your account">
          {/* Registration progress indicator — two steps */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`h-2 flex-1 rounded-full ${
                step >= 1
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}
            />

            <div
              className={`h-2 flex-1 rounded-full ${
                step >= 2
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}
            />
          </div>

          {/* Registration error message */}
          {serverError && (
            <div className="mb-4">
              <Alert
                type="error"
                message={serverError}
              />
            </div>
          )}

          {/* Step 1 — Account Details form */}
          {step === 1 && (
            <form ref={formRef} onSubmit={handleNext} noValidate className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Step 1 of 2 — Account Details
              </p>

              {/* Role selector — choose Patient, Doctor, Pharmacist, Lab Technician or Hospital Staff */}
              <div className="grid grid-cols-3 gap-2 mb-1">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={formData.role === r.value}
                    onClick={() => { setFormData({ ...formData, role: r.value }); setErrors({}); setServerError(''); }}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                      ${
                        formData.role === r.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-muted-foreground border-input hover:bg-secondary'
                      }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <Input
                disabled={loading}
                label="Email Address"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={errors.email}
                required
              />

              <Input
                disabled={loading}
                label="Phone Number"
                name="phone"
                autoComplete="tel"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                error={errors.phone}
                required
              />

              <Input
                disabled={loading}
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                revealPassword
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                error={errors.password}
                required
              />

              <Input
                disabled={loading}
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                revealPassword
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                required
              />

              {/* Continue button — validates the first registration step */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full mt-2"
              >
                Continue
              </Button>
            </form>
          )}

          {/* Step 2 — Role Details form */}
          {step === 2 && (
            <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={loading} className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Step 2 of 2 — {roleLabel} Details
              </p>

              {formData.role !== 'patient' && <Alert type="info" message="Email verification creates your account. Admin approval is required before you can sign in." />}

              {['patient', 'doctor'].includes(formData.role) && (
                <Input
                disabled={loading}
                  label="Full Name"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  error={errors.fullName}
                  required
                />
              )}

              {formData.role === 'patient' && (
                <>
                  <Input
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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

              {formData.role === 'lab_technician' && (
                <>
                  <Input
                disabled={loading}
                    label="Laboratory Name"
                    name="laboratoryName"
                    type="text"
                    value={formData.laboratoryName}
                    onChange={handleChange}
                    placeholder="e.g. CareLab Diagnostics"
                    error={errors.laboratoryName}
                    required
                  />

                  <Input
                disabled={loading}
                    label="License Number"
                    name="laboratoryLicenseNumber"
                    type="text"
                    value={formData.laboratoryLicenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. LAB/2026/1234"
                    error={errors.laboratoryLicenseNumber}
                    required
                  />

                  <Input
                disabled={loading}
                    label="Laboratory Address"
                    name="laboratoryAddress"
                    type="text"
                    value={formData.laboratoryAddress}
                    onChange={handleChange}
                    placeholder="Street, City"
                    error={errors.laboratoryAddress}
                    required
                  />

                  <Input
                disabled={loading}
                    label="Laboratory Phone"
                    name="laboratoryPhone"
                    type="text"
                    value={formData.laboratoryPhone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    error={errors.laboratoryPhone}
                    required
                  />
                </>
              )}

              {formData.role === 'hospital_staff' && (
                <>
                  <Input
                disabled={loading}
                    label="Hospital Name"
                    name="hospitalName"
                    type="text"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="e.g. Teaching Hospital Peradeniya"
                    error={errors.hospitalName}
                    required
                  />

                  <Input
                disabled={loading}
                    label="Hospital Type"
                    name="hospitalType"
                    type="text"
                    value={formData.hospitalType}
                    onChange={handleChange}
                    placeholder="e.g. Teaching Hospital"
                    error={errors.hospitalType}
                    required
                  />

                  <Input
                disabled={loading}
                    label="Hospital Location"
                    name="hospitalLocation"
                    type="text"
                    value={formData.hospitalLocation}
                    onChange={handleChange}
                    placeholder="Street, City"
                    error={errors.hospitalLocation}
                    required
                  />

                  <Input
                disabled={loading}
                    label="Departments"
                    name="hospitalDepartments"
                    type="text"
                    value={formData.hospitalDepartments}
                    onChange={handleChange}
                    placeholder="e.g. OPD, Emergency"
                    error={errors.hospitalDepartments}
                    required
                  />
                </>
              )}

              <div className="flex gap-3 mt-2">
                {/* Back button — returns from role details to account details */}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => { setStep(1); setErrors({}); setServerError(''); }}
                  disabled={loading}
                  className="flex-1 min-w-0 px-3"
                >
                  Back
                </Button>

                {/* Request code button — submits registration and opens verification */}
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  type="submit"
                  className="flex-1 min-w-0 px-3"
                >
                  {loading
                    ? 'Requesting code...'
                    : 'Request code'}
                </Button>
              </div>
            </form>
          )}

          {/* Back to sign in link — returns to the login screen */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              aria-disabled={loading}
              onClick={event => { if (loading) event.preventDefault(); }}
              className="text-primary font-semibold hover:underline"
            >
              Back to sign in
            </Link>
          </p>

    </AuthLayout>
  );
};
export default RegisterPage;
