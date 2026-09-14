/**
 * @file    AdminSystemSettingsPage.jsx
 * @module  Admin
 * @desc    View and edit system-wide configurable settings (OTP expiry,
 *          password policy, session timeout, emergency-access duration).
 */

import { useEffect, useState } from 'react';

import {
  Clock3,
  KeyRound,
  LockKeyhole,
  Save,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';

const API_URL = 'http://localhost:5000';

const SETTING_META = {
  otp_expiry_minutes: {
    label: 'OTP Expiry',
    icon: Clock3,
    hint: 'Controls how long a registration OTP remains valid.',
  },
  password_min_length: {
    label: 'Password Minimum',
    icon: LockKeyhole,
    hint: 'Sets the minimum password length required by the system.',
  },
  session_timeout_minutes: {
    label: 'Session Timeout',
    icon: KeyRound,
    hint: 'Controls how long an authenticated session can remain active.',
  },
  emergency_access_duration_minutes: {
    label: 'Emergency Access Duration',
    icon: ShieldAlert,
    hint: 'Defines how long approved Break-the-Glass access remains valid.',
  },
};

const getSettingMeta = (setting) => {
  const normalizedKey =
    setting.key
      ?.toLowerCase()
      .trim();

  if (
    normalizedKey &&
    SETTING_META[normalizedKey]
  ) {
    return SETTING_META[
      normalizedKey
    ];
  }

  return {
    label: setting.key,
    icon: SlidersHorizontal,
    hint: setting.description,
  };
};

const AdminSystemSettingsPage = () => {
  const [
    settings,
    setSettings
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  const [
    editValues,
    setEditValues
  ] = useState({});

  const [
    savingKey,
    setSavingKey
  ] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_URL}/api/admin/settings`,
        {
          credentials: 'include',
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Failed to load settings'
        );

        return;
      }

      setSettings(
        data.data
      );

      const initialValues = {};

      data.data.forEach(
        (setting) => {
          initialValues[
            setting.key
          ] =
            setting.value;
        }
      );

      setEditValues(
        initialValues
      );
    } catch (err) {
      console.error(
        'Fetch settings error:',
        err
      );

      setError(
        'Could not connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (
    key
  ) => {
    setSavingKey(
      key
    );

    try {
      const res = await fetch(
        `${API_URL}/api/admin/settings/${key}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            value:
              editValues[key]
          }),
        }
      );

      const data =
        await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Save failed'
        );

        return;
      }

      await fetchSettings();
    } catch (err) {
      console.error(
        'Save setting error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setSavingKey(
        null
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading system settings...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={Settings2}
        title="System Settings"
        description="Manage security and access-control values that apply across the Care4U platform."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              <SlidersHorizontal
                size={18}
              />

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Configurable Values
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {
                  settings.length
                }{' '}
                system setting
                {
                  settings.length === 1
                    ? ''
                    : 's'
                }
              </p>

            </div>

          </div>
        }
      />

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      <Card>

        <div className="flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

            <LockKeyhole
              size={18}
            />

          </div>

          <div>

            <h2 className="text-sm font-bold text-foreground">
              Platform-wide configuration
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Changes made here affect security and access behaviour across the application. Review each value carefully before saving.
            </p>

          </div>

        </div>

      </Card>

      {settings.length === 0 ? (
        <Card>

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mb-4">

              <Settings2
                className="w-7 h-7"
                strokeWidth={1.8}
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No configurable settings found
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              System settings will appear here once they are available from the server.
            </p>

          </div>

        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {settings.map(
            (
              setting
            ) => {
              const isSaving =
                savingKey ===
                setting.key;

              const hasChanged =
                editValues[
                  setting.key
                ] !==
                setting.value;

              const meta =
                getSettingMeta(
                  setting
                );

              const SettingIcon =
                meta.icon;

              return (
                <Card
                  key={
                    setting.key
                  }
                  className="h-full"
                >

                  <div className="h-full flex flex-col">

                    <div className="flex items-start gap-4">

                      <div className="w-11 h-11 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

                        <SettingIcon
                          size={20}
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-base font-bold text-foreground">
                            {
                              meta.label
                            }
                          </h3>

                          {hasChanged && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              Unsaved
                            </span>
                          )}

                        </div>

                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {
                            setting.description ||
                            meta.hint
                          }
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 rounded-xl bg-secondary/45 px-3 py-2">

                      <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                        Setting Key
                      </p>

                      <p className="font-mono text-xs text-foreground mt-1 break-all">
                        {
                          setting.key
                        }
                      </p>

                    </div>

                    <div className="mt-5 pt-5 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-end">

                      <div className="flex-1 w-full">

                        <Input
                          label="Value"
                          name={
                            setting.key
                          }
                          value={
                            editValues[
                              setting.key
                            ] ?? ''
                          }
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [setting.key]:
                                e.target.value
                            })
                          }
                          className="w-full"
                        />

                      </div>

                      <Button
                        variant="primary"
                        onClick={() =>
                          handleSave(
                            setting.key
                          )
                        }
                        disabled={
                          isSaving ||
                          !hasChanged
                        }
                        loading={
                          isSaving
                        }
                        className="w-full sm:w-auto shrink-0"
                      >
                        <Save
                          size={16}
                        />

                        {isSaving
                          ? 'Saving...'
                          : 'Save'}
                      </Button>

                    </div>

                  </div>

                </Card>
              );
            }
          )}

        </div>
      )}

    </div>
  );
};

export default AdminSystemSettingsPage;
