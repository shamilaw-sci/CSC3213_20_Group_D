/**
 * @file    AdminSystemSettingsPage.jsx
 * @module  Admin
 * @desc    View and edit system-wide configurable settings (OTP expiry,
 *          password policy, session timeout, emergency-access duration).
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';

const API_URL = 'http://localhost:5000';

const AdminSystemSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to load settings');
        return;
      }

      setSettings(data.data);
      const initialValues = {};
      data.data.forEach((s) => { initialValues[s.key] = s.value; });
      setEditValues(initialValues);
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key) => {
    setSavingKey(key);
    try {
      const res = await fetch(`${API_URL}/api/admin/settings/${key}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValues[key] }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Save failed');
        return;
      }

      await fetchSettings();
    } catch (err) {
      console.error('Save setting error:', err);
      alert('Could not connect to the server.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-sm text-slate-500">
          Configurable values that were previously hardcoded in the application.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {settings.map((setting) => {
          const isSaving = savingKey === setting.key;
          const hasChanged = editValues[setting.key] !== setting.value;
          return (
            <div key={setting.key} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-slate-800 font-mono">{setting.key}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-3">{setting.description}</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={editValues[setting.key] ?? ''}
                  onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => handleSave(setting.key)}
                  disabled={isSaving || !hasChanged}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSystemSettingsPage;