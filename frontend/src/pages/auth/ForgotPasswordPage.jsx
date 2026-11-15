/**
 * @file ForgotPasswordPage.jsx
 * @module Authentication UI
 * @desc Requests account recovery without claiming account existence or inbox delivery.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AuthLayout from '../../components/auth/AuthLayout';
import { forgotPassword, authErrorMessage } from '../../services/auth.service';

/** Password recovery screen: ask for an email without revealing whether an account exists. */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inFlight = useRef(false);
  /** Update the email field and clear the earlier error. */
  const handleChange = event => { setEmail(event.target.value); setError(''); };
  /** Request one reset email; show a neutral confirmation after the backend acknowledges it. */
  const handleSubmit = async event => {
    event.preventDefault();
    // Keep duplicate reset-link requests from being sent during a pending request.
    if (inFlight.current) return;
    if (!email.trim()) { setError('Email is required'); document.getElementById('email')?.focus(); return; }
    inFlight.current = true;
    setLoading(true); setError('');
    try {
      await forgotPassword(email.trim());
      // Show a neutral success message rather than disclosing whether the email belongs to an account.
      setSubmitted(true);
    } catch (requestError) {
      setError(authErrorMessage(requestError, 'Could not request a reset link. Please try again.'));
    } finally { inFlight.current = false; setLoading(false); }
  };
  return (
    <AuthLayout title="Forgot your password?" description="Enter your email address to request a password reset link.">
      {submitted ? <Alert type="success" message="If an account exists for this email, the reset request has been processed. Check your inbox and spam folder for a link." /> : (
        <form onSubmit={handleSubmit} noValidate aria-busy={loading} className="flex flex-col gap-4">
          <Input label="Email address" name="email" type="email" autoComplete="email" value={email}
            onChange={handleChange} error={error === 'Email is required' ? error : ''} placeholder="you@example.com" disabled={loading} required />
          {error && error !== 'Email is required' && <Alert type="error" message={error} />}
          {/* Request reset link button — sends the recovery request */}
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">{loading ? 'Requesting...' : 'Request reset link'}</Button>
        </form>
      )}
      <p className="text-center mt-4"><Link aria-disabled={loading} onClick={event => { if (loading) event.preventDefault(); }} to="/login" className="text-sm text-primary font-semibold hover:underline">Back to sign in</Link></p>
    </AuthLayout>
  );
};
export default ForgotPasswordPage;
