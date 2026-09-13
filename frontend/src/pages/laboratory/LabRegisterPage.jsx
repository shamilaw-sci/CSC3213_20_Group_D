/**
 * @component LabRegisterPage
 * @desc      Registration form for new laboratories.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AVAILABLE_TESTS = [
  'Blood Test', 'Urine Test', 'X-Ray', 'ECG',
  'MRI Scan', 'CT Scan', 'Ultrasound', 'Cholesterol Test',
  'Blood Sugar Test', 'Thyroid Test', 'Liver Function Test',
  'Kidney Function Test', 'COVID-19 PCR', 'Dengue Test',
];

const LabRegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    name: '', license_number: '', address: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/laboratories/register', {
        ...form,
        available_tests: selectedTests,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your laboratory has been registered. Please wait for admin approval.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-lg">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
            style={{ backgroundColor: '#1E3A5F' }}>
            Laboratory Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Register Your Laboratory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in your details to register. An admin will review and approve your account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Laboratory Name *', name: 'name', placeholder: 'e.g. City Diagnostics' },
            { label: 'License Number *', name: 'license_number', placeholder: 'e.g. LAB-001-2026' },
            { label: 'Address *', name: 'address', placeholder: 'e.g. 78 Hospital Road, Colombo' },
            { label: 'Phone *', name: 'phone', placeholder: 'e.g. 0751234567' },
            { label: 'Email *', name: 'email', type: 'email', placeholder: 'lab@example.com' },
            { label: 'Password *', name: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#1E3A5F' }}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Available Tests (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TESTS.map(test => (
                <label key={test} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test)}
                    onChange={() => toggleTest(test)}
                    className="rounded"
                  />
                  <span className="text-xs text-slate-700">{test}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white mt-2 disabled:opacity-60"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            {loading ? 'Registering...' : 'Register Laboratory'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LabRegisterPage;