/**
 * @file PharmacyRegisterPage.jsx
 * @module Public pharmacy application
 * @component PharmacyRegisterPage
 * @desc      Registration form for new pharmacies.
 *            Submits to POST /api/pharmacies/register.
 *            On success, shows a pending approval message.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { registerPharmacy, authErrorMessage } from '../../services/auth.service';
import '../../components/auth/auth.css';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';

/** @component PharmacyRegisterPage @returns {JSX.Element} Existing direct pending-approval application, including RHF field/confirmation errors. */
const PharmacyRegisterPage = () => {
  const inFlight = useRef(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState(null);
  const navigate                = useNavigate();

  // RHF setValueAs callbacks trim non-secret strings before required checks.
  // handleSubmit validates/focuses errors before onSubmit receives values; passwords are preserved.
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  /** @param {Object} data Validated RHF values. @returns {Promise<void>} Submit once; show pending approval only after acknowledgement. */
  const onSubmit = async data => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);

    try {
      await registerPharmacy({
        email:          data.email,
        password:       data.password,
        phone:          data.phone,
        name:           data.name,
        license_number: data.license_number,
        address:        data.address,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      setError(authErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="auth-controls min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Card className="text-center sm:p-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Application submitted
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Your pharmacy account is awaiting admin approval. Sign in after approval.
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Back to sign in
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <main className="auth-controls min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        <Card>
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary mb-4">
              Pharmacy Portal
            </div>
            <h1 className="text-2xl font-bold text-foreground">Register your pharmacy</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Fill in your details to register. An admin will review and approve your account.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={loading} className="flex flex-col gap-4">
            <fieldset disabled={loading} className="contents">
            <Input
              label="Pharmacy Name"
              required
              placeholder="e.g. City Pharmacy Colombo"
              error={errors.name?.message}
              {...register('name', { required: 'Pharmacy name is required', setValueAs: value => (value || '').trim() })}
            />

            <Input
              label="Pharmacy License Number"
              required
              placeholder="e.g. PH-001-2026"
              error={errors.license_number?.message}
              {...register('license_number', { required: 'License number is required', setValueAs: value => (value || '').trim() })}
            />

            <Input
              label="Address"
              required
              placeholder="e.g. 123 Main Street, Colombo 03"
              error={errors.address?.message}
              {...register('address', { required: 'Address is required', setValueAs: value => (value || '').trim() })}
            />

            <Input
              label="Phone Number"
              required
              placeholder="e.g. 0771234567"
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone number is required', setValueAs: value => (value || '').trim() })}
            />

            <Input
              type="email"
              label="Email Address"
              required
              placeholder="e.g. pharmacy@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required', setValueAs: value => (value || '').trim(),
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' },
              })}
            />

            <Input
              type="password"
              revealPassword
              autoComplete="new-password"
              label="Password"
              required
              placeholder="Minimum 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />

            <Input
              type="password"
              revealPassword
              autoComplete="new-password"
              label="Confirm Password"
              required
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) =>
                  val === watch('password') || 'Passwords do not match',
              })}
            />

            {/* Submit Button */}
            <div className="mt-3">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Submit application
              </Button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-3">
              Already registered?{' '}
              <Link to="/login"
                className="text-primary font-semibold cursor-pointer hover:underline transition-all"
              >
                Back to sign in
              </Link>
            </p>
            </fieldset>
          </form>
        </Card>
      </div>
    </main>
  );
};

export default PharmacyRegisterPage;