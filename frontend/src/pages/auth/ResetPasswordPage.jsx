/**
 * @file    ResetPasswordPage.jsx
 * @desc    Lets a user set a new password using a valid reset token
 *          (read from the URL query string, e.g. ?token=abc123).
 * @author  I.M.L.S. Idirisinghe (S/21/389)
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Input  from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert  from '../../components/common/Alert';
import Card   from '../../components/common/Card';
import { resetPassword } from '../../services/auth.service';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  // Validate form before submitting
  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setServerError('Missing or invalid reset link.');
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const data = await resetPassword(token, formData.newPassword);

      if (data.success) {
        setSuccess(true);
      } else {
        setServerError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(message);
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
          <h2 className="text-xl font-bold text-foreground mb-6">Set a new password</h2>

          {!token && (
            <div className="mb-4">
              <Alert type="error" message="This reset link is missing or invalid. Please request a new one." />
            </div>
          )}

          {serverError && (
            <div className="mb-4">
              <Alert type="error" message={serverError} />
            </div>
          )}

          {success ? (
            <div className="flex flex-col gap-4 text-center">
              <Alert type="success" message="Your password has been reset successfully." />
              <a href="/login" className="text-sm text-primary font-semibold hover:underline mt-2 inline-block">
                Go to Login
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                error={errors.newPassword}
                required
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                error={errors.confirmPassword}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleSubmit}
                disabled={!token}
                className="w-full mt-2"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          )}

        </Card>

        {/* Footer */}
        <p className="text-center text-xs font-medium text-muted-foreground mt-6">
          © 2026 Care4U — Group D | CSC3213
        </p>

      </div>
    </div>
  );
};

export default ResetPasswordPage;