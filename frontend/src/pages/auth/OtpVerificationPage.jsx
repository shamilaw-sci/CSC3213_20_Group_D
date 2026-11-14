/**
 * @file OtpVerificationPage.jsx
 * @module Authentication UI
 * @desc Completes pending registration, serializes resend/verification and separates approval from sign-in.
 * @author Original author unverified
 */
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AuthLayout from '../../components/auth/AuthLayout';
import { verifyOtp, resendOtp, authErrorMessage } from '../../services/auth.service';
import useAuthStore from '../../store/authStore';

/** Email verification screen: check the six-digit code before a new account becomes usable. */
const OtpVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = typeof location.state?.email === 'string' ? location.state.email : '';
  const setUser = useAuthStore(state => state.setUser);
  const clearUser = useAuthStore(state => state.clearUser);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inFlight = useRef(false);
  const busy = loading || resending;

  /** Verify once: patients can continue after success; staff awaiting admin approval return to login. */
  const handleVerify = async event => {
    event.preventDefault();
    if (inFlight.current || !email) return;
    if (!/^\d{6}$/.test(otpCode)) { setError('Enter a 6-digit verification code'); document.getElementById('otpCode')?.focus(); return; }
    inFlight.current = true; setLoading(true); setError(''); setResendMessage('');
    try {
      const data = await verifyOtp(email, otpCode);
      if (data.data?.approvalPending === true) {
        clearUser();
        navigate('/login', { replace: true, state: { message: 'Email verified. Your account is awaiting admin approval. Sign in after approval.' } });
      } else {
        const user = data.data?.user;
        if (!user?.id || !user?.role) throw new Error('Invalid identity response');
        setUser(user);
        const paths = { patient: '/patient/profile', doctor: '/doctor/dashboard', pharmacist: '/pharmacy/dashboard',
          hospital_staff: '/hospital/dashboard', lab_technician: '/laboratory/dashboard' };
        navigate(paths[user.role] || '/', { replace: true });
      }
    } catch (requestError) { setError(authErrorMessage(requestError, 'Could not verify the code. Check the code or request a new one.')); }
    finally { inFlight.current = false; setLoading(false); }
  };
  /** Request a replacement code; prevent another request while verification or resend is running. */
  const handleResend = async () => {
    if (inFlight.current || !email) return;
    inFlight.current = true; setResending(true); setError(''); setResendMessage(''); setOtpCode('');
    try {
      await resendOtp(email);
      setResendMessage('A new code was submitted by email. Check your inbox and spam folder.');
    } catch (requestError) { setError(authErrorMessage(requestError, 'Could not resend the code. Please try again.')); }
    finally { inFlight.current = false; setResending(false); }
  };
  if (!email) return (
    <AuthLayout title="No registration in progress">
      <Alert type="info" message="Your registration email is missing. Start registration again or return to sign in." />
      <p className="mt-4"><Link to="/register" className="text-primary font-semibold hover:underline">Start registration</Link></p>
      <Link to="/login" className="text-primary font-semibold hover:underline">Back to sign in</Link>
    </AuthLayout>
  );
  return (
    <AuthLayout title="Verify your email" description={<>Enter the 6-digit code for <strong>{email}</strong> to complete registration.</>}>
      {error && <div id="otp-feedback" className="mb-4"><Alert type="error" message={error} /></div>}
      {resendMessage && <div className="mb-4"><Alert type="success" message={resendMessage} /></div>}
      <form onSubmit={handleVerify} noValidate aria-busy={busy} className="flex flex-col gap-4">
        <Input label="Verification code" name="otpCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={otpCode} onChange={event => { setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setError(''); }}
          aria-invalid={Boolean(error)} aria-describedby={error ? 'otp-feedback' : 'otp-help'} disabled={busy} required />
        <p id="otp-help" className="text-sm text-muted-foreground">Codes expire after 10 minutes. If resending fails, the previous code may no longer work. Wait before requesting another.</p>
        {/* Verify email button — submits the six-digit code */}
        <Button type="submit" size="lg" loading={loading} disabled={resending} className="w-full">{loading ? 'Verifying...' : 'Verify email'}</Button>
        {/* Resend code button — requests a new verification code */}
        <Button onClick={handleResend} variant="secondary" loading={resending} disabled={loading} className="w-full">{resending ? 'Requesting...' : 'Resend code'}</Button>
      </form>
      <p className="text-center mt-4"><Link to="/register" aria-disabled={busy} onClick={event => { if (busy) event.preventDefault(); }}
        className="text-sm text-primary font-semibold hover:underline">Wrong email? Start registration again</Link></p>
    </AuthLayout>
  );
};
export default OtpVerificationPage;
