/**
 * @file LoginPage.jsx
 * @module Authentication UI
 * @desc Signs in any supported web role after acknowledged server session creation.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */
import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AuthLayout from '../../components/auth/AuthLayout';
import { login, authErrorMessage } from '../../services/auth.service';
import useAuthStore from '../../store/authStore';

/** @component LoginPage
 * @returns {JSX.Element} Keyboard-submittable sign-in form; API remains authoritative.
 * Controlled credentials/errors stay local. The ref prevents same-tick duplicate requests.
 */
const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const inFlight = useRef(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  /** @param {Object} event Input event. @returns {void} Update value and clear stale feedback. */
  const handleChange = event => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
    setServerError('');
  };
  /** @returns {Object} Required-field errors; existing passwords are not subjected to new-password length rules. */
  const validate = () => {
    const next = {};
    if (!formData.email.trim()) next.email = 'Email is required';
    if (!formData.password) next.password = 'Password is required';
    return next;
  };
  /** @param {Object} event Form event. @returns {Promise<void>} Validate, request session, set public identity and navigate. */
  const handleSubmit = async event => {
    event.preventDefault();
    if (inFlight.current) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    inFlight.current = true;
    setLoading(true);
    setServerError('');
    try {
      const data = await login(formData.email.trim(), formData.password);
      if (!data.data?.id || !data.data?.role) throw new Error('Invalid identity response');
      const destinations = { patient: '/patient/profile', doctor: '/doctor/dashboard', admin: '/admin',
        pharmacist: '/pharmacy/dashboard', hospital_staff: '/hospital/dashboard', lab_technician: '/laboratory/dashboard' };
      setUser(data.data);
      navigate(destinations[data.data.role] || '/', { replace: true });
    } catch (error) {
      setServerError(authErrorMessage(error, 'Sign-in failed. Please try again.'));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };
  return (
    <AuthLayout title="Sign in to your account">
      {location.state?.message && <div className="mt-4"><Alert type="success" message={location.state.message} /></div>}
      {serverError && <div className="mt-4"><Alert type="error" message={serverError} /></div>}
      <form onSubmit={handleSubmit} noValidate aria-busy={loading} className="flex flex-col gap-4 mt-6">
        <Input label="Email address" name="email" type="email" autoComplete="username" value={formData.email}
          onChange={handleChange} placeholder="you@example.com" error={errors.email} disabled={loading} required />
        <Input label="Password" name="password" type="password" autoComplete="current-password" revealPassword
          value={formData.password} onChange={handleChange} error={errors.password} disabled={loading} required />
        <Button type="submit" size="lg" loading={loading} className="w-full mt-2">{loading ? 'Signing in...' : 'Sign in'}</Button>
        <Link aria-disabled={loading} onClick={event => { if (loading) event.preventDefault(); }} to="/forgot-password" className="text-sm text-primary font-semibold hover:underline justify-center">Forgot your password?</Link>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">New to Care4U?{' '}
        <Link aria-disabled={loading} onClick={event => { if (loading) event.preventDefault(); }} to="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
};
export default LoginPage;
