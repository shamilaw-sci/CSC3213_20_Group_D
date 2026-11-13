/**
 * @file    LabRegisterPage.jsx
 * @module Public laboratory application
 * @author Original author unconfirmed; creation history is recorded in OWNERSHIP.md.
 * @desc    Public laboratory account application using the existing
 *          laboratory registration API contract and approval workflow.
 */

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  KeyRound,
  Mail,
  MapPin,
  Microscope,
  Phone,
  ShieldCheck,
} from 'lucide-react';

import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { registerLaboratory, authErrorMessage } from '../../services/auth.service';
import '../../components/auth/auth.css';

const AVAILABLE_TESTS = [
  'Blood Test',
  'Urine Test',
  'X-Ray',
  'ECG',
  'MRI Scan',
  'CT Scan',
  'Ultrasound',
  'Cholesterol Test',
  'Blood Sugar Test',
  'Thyroid Test',
  'Liver Function Test',
  'Kidney Function Test',
  'COVID-19 PCR',
  'Dengue Test',
];

const INITIAL_FORM = {
  name: '',
  license_number: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/** @component LabRegisterPage @returns {JSX.Element} Module-branded facility application, selected tests and acknowledged pending approval. */
const LabRegisterPage = () => {
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedTests, setSelectedTests] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  /** @param {Object} event Input/textarea event. @returns {void} Update one field and clear stale field/request errors. */
  const handleChange = (event) => {
    setSubmitError('');
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  /** @param {string} test Existing catalogue option. @returns {void} Toggle selected service without duplicate entries. */
  const toggleTest = (test) => {
    setSelectedTests((current) => (
      current.includes(test)
        ? current.filter((item) => item !== test)
        : [...current, test]
    ));
  };

  /** @returns {boolean} Required facility/contact fields, existing formats and new-password confirmation. */
  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = 'Laboratory name is required.';
    if (!form.license_number.trim()) {
      errors.license_number = 'License number is required.';
    }
    if (!form.address.trim()) errors.address = 'Laboratory address is required.';
    if (!form.phone.trim()) {
      errors.phone = 'Contact number is required.';
    } else if (!/^[+\d][\d\s()-]{6,19}$/.test(form.phone.trim())) {
      errors.phone = 'Enter a valid contact number.';
    }
    if (!form.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) document.getElementById(Object.keys(errors)[0])?.focus();
    return Object.keys(errors).length === 0;
  };

  /** @param {Object} event Form event. @returns {Promise<void>} Submit current facility/test payload once; require acknowledgement. */
  const handleSubmit = async (event) => {
    if (inFlight.current) { event.preventDefault(); return; }
    event.preventDefault();

    if (!validate()) return;

    inFlight.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await registerLaboratory({
        name: form.name.trim(),
        license_number: form.license_number.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        available_tests: selectedTests,
      });
      setIsComplete(true);
      setForm(INITIAL_FORM);
    } catch (error) {
      setSubmitError(
        authErrorMessage(error, 'Registration could not be submitted. Please try again.')
      );
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <main data-module="laboratory" className="auth-controls min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-xl">
          <div className="text-center py-6 sm:py-10">
            <span className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-6">
              Application submitted
            </h1>
            <p className="text-muted-foreground leading-relaxed mt-3 max-w-md mx-auto">
              Your laboratory account is awaiting administrator approval. You can sign in after the application is approved.
            </p>
            <Button
              className="mt-7"
              disabled={isSubmitting} onClick={() => navigate('/login')}
            >
              Back to sign in
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main data-module="laboratory" className="auth-controls min-h-screen bg-muted/30">
      {/* Public registration header */}
      <header className="care4u-page-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <button
            type="button"
            disabled={isSubmitting} onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>

          <div className="mt-7 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90">
              <Microscope className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">
                Laboratory network
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-4">
              Register your laboratory
            </h1>
            <p className="text-white/80 leading-relaxed mt-3 max-w-2xl">
              Enter your facility details and available diagnostic services. A Care4U administrator will review the account before access is enabled.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {submitError && (
          <div className="mb-6">
            <Alert type="error" message={submitError} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-6">
          <fieldset disabled={isSubmitting} className="space-y-6 min-w-0">
          {/* Facility details */}
          <Card
            title="Facility details"
            icon={<Building2 className="w-5 h-5" />}
          >
            <p className="text-sm text-muted-foreground -mt-1 mb-5">
              Enter the legal identity and contact information used for verification.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="Laboratory name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={fieldErrors.name}
                placeholder="City Diagnostics Laboratory"
                required
                autoComplete="organization"
              />
              <Input
                label="License number"
                name="license_number"
                value={form.license_number}
                onChange={handleChange}
                error={fieldErrors.license_number}
                placeholder="LAB-001-2026"
                required
                autoComplete="off"
              />
              <Input
                label="Contact number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
                placeholder="+94 75 123 4567"
                required
                autoComplete="tel"
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="address"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Street, city, and postal code"
                  autoComplete="street-address"
                  required
                  aria-invalid={Boolean(fieldErrors.address)}
                  aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm text-foreground bg-white border rounded-lg resize-y placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${fieldErrors.address ? 'border-destructive' : 'border-input'}`}
                />
                {fieldErrors.address && (
                  <p id="address-error" className="text-xs text-destructive">{fieldErrors.address}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
              {[
                { icon: ShieldCheck, text: 'Admin review required' },
                { icon: MapPin, text: 'Facility based' },
                { icon: Phone, text: 'Contact details' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </Card>

          {/* Account access */}
          <Card
            title="Account access"
            icon={<KeyRound className="w-5 h-5" />}
          >
            <p className="text-sm text-muted-foreground -mt-1 mb-5">
              These credentials will be used by the approved laboratory technician account.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="relative">
                <Mail className="absolute right-3 top-9 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                  placeholder="laboratory@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <Input
                label="Password"
                name="password"
                type="password"
                revealPassword
                value={form.password}
                onChange={handleChange}
                error={fieldErrors.password}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <Input label="Confirm password" name="confirmPassword" type="password" revealPassword autoComplete="new-password"
                value={form.confirmPassword} onChange={handleChange} error={fieldErrors.confirmPassword} required />
            </div>
          </Card>

          {/* Diagnostic catalogue */}
          <Card
            title="Available diagnostic tests"
            icon={<FlaskConical className="w-5 h-5" />}
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
              <p className="text-sm text-muted-foreground">
                Select every service currently available at your facility.
              </p>
              <p className="text-xs font-bold text-primary">
                {selectedTests.length} selected
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_TESTS.map((test) => {
                const isSelected = selectedTests.includes(test);

                return (
                  <label
                    key={test}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-module-soft border-primary/30' : 'bg-card border-border hover:border-primary/25'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTest(test)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {test}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Submission */}
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-bold text-foreground">Ready for review?</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Confirm that the facility and license details are accurate. Access remains disabled until administrator approval.
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 shrink-0">
                <Button
                  variant="ghost"
                  disabled={isSubmitting} onClick={() => navigate('/login')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Submit registration
                </Button>
              </div>
            </div>
          </Card>
          </fieldset>
        </form>
      </div>
    </main>
  );
};

export default LabRegisterPage;
