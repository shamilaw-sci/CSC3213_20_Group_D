/**
 * @file    AdminSystemSettingsPage.jsx
 * @module  Admin
 * @desc    View and edit system-wide configurable settings (OTP expiry,
 *          password policy, session timeout, emergency-access duration).
 */

import { useEffect, useState } from 'react';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Configurable values that were previously hardcoded in the application.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settings.map((setting) => {
          const isSaving = savingKey === setting.key;
          const hasChanged = editValues[setting.key] !== setting.value;
          return (
            <Card key={setting.key} className="p-5 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-foreground font-mono bg-secondary px-2.5 py-1 rounded inline-block">
                  {setting.key}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-3 mb-5">
                  {setting.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <Input
                  name={setting.key}
                  value={editValues[setting.key] ?? ''}
                  onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                  className="w-full flex-1"
                />
                <Button
                  variant="primary"
                  onClick={() => handleSave(setting.key)}
                  disabled={isSaving || !hasChanged}
                  loading={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSystemSettingsPage;