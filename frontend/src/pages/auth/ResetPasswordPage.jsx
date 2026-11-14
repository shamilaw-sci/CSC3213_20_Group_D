/**
 * @file ResetPasswordPage.jsx
 * @module Authentication UI
 * @desc Validates the emailed token and new password, then waits for update acknowledgement.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AuthLayout from '../../components/auth/AuthLayout';
import { resetPassword, authErrorMessage } from '../../services/auth.service';

/** Reset password screen: require a valid-looking link token and matching new passwords. */
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const validToken = /^[a-f0-9]{64}$/.test(token);
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const inFlight = useRef(false);
  /** Keep password fields updated and clear earlier errors. */
  const handleChange = event => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' }); setServerError('');
  };
  /** Reject passwords shorter than eight characters or confirmation that does not match. */
  const validate = () => {
    const next = {};
    if (formData.newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (formData.newPassword !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match';
    return next;
  };
  /** Send the new password once; clear the entered passwords only after the backend confirms success. */
  const handleSubmit = async event => {
    event.preventDefault();
    if (inFlight.current || !validToken) return;
    const next = validate(); setErrors(next);
    if (Object.keys(next).length) { document.getElementById(Object.keys(next)[0])?.focus(); return; }
    inFlight.current = true; setLoading(true); setServerError('');
    try {
      await resetPassword(token, formData.newPassword);
      setSuccess(true); setFormData({ newPassword: '', confirmPassword: '' });
    } catch (error) { setServerError(authErrorMessage(error, 'Could not reset your password. Request a new link if it has expired.')); }
    finally { inFlight.current = false; setLoading(false); }
  };
  return (
    <AuthLayout title="Set a new password" description="Use at least 8 characters. Resetting your password does not sign you in.">
      {!validToken ? <Alert type="error" message="This reset link is missing or invalid. Request a new link to continue." /> : success ? (
        <Alert type="success" message="Your password has been reset. You can sign in now." />
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-busy={loading} className="flex flex-col gap-4">
          {serverError && <div>
            <Alert type="error" message={serverError} />
            <Link aria-disabled={loading} onClick={event => { if (loading) event.preventDefault(); }} to="/forgot-password"
              className="text-sm text-primary font-semibold hover:underline">Request a new reset link</Link>
          </div>}
          <Input label="New password" name="newPassword" type="password" autoComplete="new-password" revealPassword
            value={formData.newPassword} onChange={handleChange} error={errors.newPassword} disabled={loading} required />
          <Input label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" revealPassword
            value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} disabled={loading} required />
          {/* Reset password button — submits the new password */}
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">{loading ? 'Resetting...' : 'Reset password'}</Button>
        </form>
      )}
      <p className="text-center mt-4"><Link aria-disabled={loading} onClick={event => { if (loading) event.preventDefault(); }} to={validToken ? '/login' : '/forgot-password'} className="text-sm text-primary font-semibold hover:underline">
        {validToken ? 'Back to sign in' : 'Request a new reset link'}</Link></p>
    </AuthLayout>
  );
};
export default ResetPasswordPage;
