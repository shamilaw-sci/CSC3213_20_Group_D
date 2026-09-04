/**
 * @file    ForgotPasswordPage.jsx
 * @desc    Lets a user request a password reset link by entering their email.
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { useState } from 'react';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';
import Card   from '../../components/common/Card';
import { forgotPassword } from '../../services/auth.service';

const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      // Always show the same generic message, whether or not the
      // email exists, to preserve the backend's enumeration protection.
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
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

        {/* Card */}
        <Card>
          <h2 className="text-xl font-bold text-foreground mb-2">Forgot your password?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {submitted ? (
            <div className="mb-4">
              <Alert type="success" message="If an account exists for this email, a password reset link has been sent." />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                error={error}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          )}

          {/* Back to Login Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Back to Login
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

export default ForgotPasswordPage;