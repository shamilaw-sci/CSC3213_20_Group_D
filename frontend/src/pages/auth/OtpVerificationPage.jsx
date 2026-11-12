/**
 * @file    OtpVerificationPage.jsx
 * @desc    Collects the 6-digit OTP sent during registration and verifies
 *          it, completing account creation. Fixes CARE4U-193 — web
 *          registration previously had no OTP step at all.
 */

import { API_BASE_URL } from '../../services/api';

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';
import Card   from '../../components/common/Card';

const OtpVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/login', {
          state: {
            message: data.data?.approvalPending
              ? 'Account verified. An admin must approve it before you can sign in.'
              : 'Account verified. You can sign in now.',
          },
        });
      } else {
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('A new code has been sent.');
      } else {
        setError(data.message || 'Could not resend code.');
      }
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground font-medium">
            No registration in progress. Please{' '}
            <a href="/register" className="text-primary font-bold hover:underline">
              register
            </a>{' '}
            first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-deep">Care4U</h1>
          <p className="text-muted-foreground mt-1 font-medium">Centralized Healthcare Ecosystem</p>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-foreground mb-2">Verify your account</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification code to <strong className="text-foreground">{email}</strong>. Enter it below to complete registration.
          </p>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} />
            </div>
          )}

          {resendMessage && (
            <div className="mb-4">
              <Alert type="success" message={resendMessage} />
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <Input
              label="Verification Code"
              name="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Didn't receive a code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
