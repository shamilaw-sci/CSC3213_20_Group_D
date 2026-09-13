/**
 * @file    EmergencySnapshotPage.jsx
 * @module  Emergency
 * @desc    High-contrast, large-text Break-Glass snapshot for crisis reading.
 *          Displays only emergency-relevant patient safety information.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Droplet,
  Phone,
  User,
  Activity,
  ShieldAlert,
  HeartPulse,
  Stethoscope,
  Pill,
  History,
  CalendarDays,
  Clock3,
  ArrowLeft,
  ShieldCheck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return 'Not recorded';

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Unavailable';

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBackgroundType = (type) => {
  const labels = {
    major_surgery: 'Major Surgery',
    major_procedure: 'Major Procedure',
    organ_transplant: 'Organ Transplant',
    major_hospitalization: 'Major Hospitalization',
    serious_past_condition: 'Serious Past Condition',
    other: 'Other',
  };

  return labels[type] || 'Medical Background';
};

const formatFamilyRelation = (relation) => {
  if (!relation) return 'Relation not recorded';

  return relation
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
};

const capitalise = (value) => {
  if (!value) return 'Not recorded';

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const EmergencySnapshotPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const response = await api.get(
          `/api/emergencies/snapshot/${patientId}`
        );

        if (response.data.success) {
          setSnapshot(response.data.data);
        } else {
          toast.error(
            response.data.message ||
              'Failed to retrieve emergency snapshot'
          );
        }
      } catch (error) {
        console.error('Error fetching emergency snapshot:', error);
        toast.error(
          error.response?.data?.message ||
            'Unable to retrieve emergency snapshot.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center animate-pulse">
          <Activity className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-300">
            AUTHORIZING EMERGENCY ACCESS...
          </h2>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-24 h-24 text-red-600 mb-6" />

        <h1 className="text-4xl font-extrabold text-white mb-2">
          SNAPSHOT UNAVAILABLE
        </h1>

        <p className="text-xl text-slate-400 mb-8">
          The requested patient emergency profile could not be located.
        </p>

        <button
          type="button"
          onClick={() => navigate('/hospital/emergency')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 text-white text-xl rounded-lg hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Emergency Dashboard
        </button>
      </div>
    );
  }

  const {
    patient = {},
    allergies = [],
    priority_conditions: priorityConditions = [],
    current_prescribed_medications: currentMedications = [],
    medical_devices: medicalDevices = [],
    health_background: healthBackground = [],
    family_history: familyHistory = [],
    information_last_updated: informationLastUpdated,
    snapshot_generated_at: snapshotGeneratedAt,
  } = snapshot;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-6xl mx-auto mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/hospital/emergency')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Emergency Dashboard</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
          <ShieldAlert className="w-4 h-4" />
          Break-Glass Access
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-8 bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-4 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]">
        <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
        <h1 className="text-2xl md:text-4xl font-black tracking-widest uppercase text-center">
          Emergency Medical Snapshot
        </h1>
        <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
      </div>

      <div className="max-w-6xl mx-auto mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />

        <div>
          <p className="text-sm md:text-base font-bold text-amber-300">
            Emergency-use summary only
          </p>

          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            This snapshot contains selected emergency-relevant information. Confirm details with the patient, caregiver, or full clinical record whenever circumstances allow.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-red-600 to-rose-500" />

            <div className="flex flex-col items-center text-center pt-2">
              <User className="w-14 h-14 text-slate-500 mb-3" />

              <h2 className="text-3xl md:text-4xl font-extrabold text-white break-words">
                {patient.full_name || 'Unknown Patient'}
              </h2>

              <div className="w-full grid grid-cols-2 gap-3 mt-6 text-left">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Date of Birth
                  </p>
                  <p className="text-sm font-bold text-slate-100 mt-1">
                    {formatDate(patient.date_of_birth)}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Age
                  </p>
                  <p className="text-sm font-bold text-slate-100 mt-1">
                    {patient.age ?? 'Unknown'}
                  </p>
                </div>

                <div className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Gender
                  </p>
                  <p className="text-sm font-bold text-slate-100 mt-1">
                    {capitalise(patient.gender)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center mt-7">
                <span className="text-slate-400 text-sm uppercase tracking-widest mb-3 font-bold">
                  Blood Group
                </span>

                <div className="relative w-36 h-36 rounded-full bg-red-500/10 border-4 border-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                  <Droplet className="w-8 h-8 text-red-500 absolute top-4 opacity-50" />
                  <span className="text-6xl font-black text-red-500 mt-5">
                    {patient.blood_group || 'UNK'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <Phone className="w-7 h-7 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">
                Emergency Contact
              </h3>
            </div>

            {patient.emergency_contact_name ? (
              <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-2xl">
                <h4 className="text-2xl font-bold text-slate-100">
                  {patient.emergency_contact_name}
                </h4>

                <p className="text-sm text-blue-200 mt-1 font-semibold">
                  {capitalise(patient.emergency_contact_relationship)}
                </p>

                {patient.emergency_contact_phone ? (
                  <a
                    href={`tel:${patient.emergency_contact_phone}`}
                    className="text-2xl md:text-3xl font-black text-blue-400 hover:text-blue-300 transition block mt-4 break-all"
                  >
                    {patient.emergency_contact_phone}
                  </a>
                ) : (
                  <p className="text-slate-400 mt-4">
                    No phone number recorded.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-lg text-slate-500 italic">
                No emergency contact on file.
              </p>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock3 className="w-6 h-6 text-slate-400" />
              <h3 className="text-xl font-bold text-white">
                Information Freshness
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[11px]">
                  Last Updated
                </p>
                <p className="text-slate-200 mt-1 font-semibold">
                  {formatDateTime(informationLastUpdated)}
                </p>
              </div>

              <div>
                <p className="text-slate-500 font-semibold uppercase tracking-wide text-[11px]">
                  Snapshot Generated
                </p>
                <p className="text-slate-200 mt-1 font-semibold">
                  {formatDateTime(snapshotGeneratedAt)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Known Allergies
              </h3>
            </div>

            {allergies.length > 0 ? (
              <div className="space-y-3">
                {allergies.map((allergy) => (
                  <div
                    key={allergy.id || `${allergy.allergen}-${allergy.severity}`}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <span className="text-xl md:text-2xl font-bold text-slate-200">
                        {allergy.allergen}
                      </span>

                      {allergy.notes && (
                        <p className="text-sm text-slate-400 mt-1">
                          {allergy.notes}
                        </p>
                      )}
                    </div>

                    <span
                      className={`self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider ${
                        allergy.severity?.toLowerCase() === 'severe'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : allergy.severity?.toLowerCase() === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      }`}
                    >
                      {allergy.severity || 'Recorded'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl text-center">
                <span className="text-xl md:text-2xl font-bold text-emerald-400">
                  No Known Allergies Recorded
                </span>
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <Stethoscope className="w-8 h-8 text-red-400" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Priority Conditions
              </h3>
            </div>

            {priorityConditions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorityConditions.map((condition) => (
                  <div
                    key={condition.id || condition.condition}
                    className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />

                      <div>
                        <p className="text-lg font-black text-red-300">
                          {condition.condition}
                        </p>

                        {condition.diagnosed_at && (
                          <p className="text-xs text-slate-400 mt-1">
                            Diagnosed: {formatDate(condition.diagnosed_at)}
                          </p>
                        )}

                        {condition.notes && (
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            {condition.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-400 text-center font-semibold">
                No priority conditions recorded.
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <Pill className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Current Prescribed Medications
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Based on active, unexpired prescription records.
                </p>
              </div>
            </div>

            {currentMedications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentMedications.map((medication) => (
                  <div
                    key={
                      medication.prescription_item_id ||
                      `${medication.prescription_id}-${medication.medicine_name}`
                    }
                    className="bg-cyan-500/10 border border-cyan-500/25 rounded-2xl p-4"
                  >
                    <p className="text-lg font-black text-cyan-200">
                      {medication.medicine_name}
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                      {medication.dosage && (
                        <p>
                          <span className="text-slate-500">Dose:</span>{' '}
                          {medication.dosage}
                        </p>
                      )}

                      {medication.frequency && (
                        <p>
                          <span className="text-slate-500">Frequency:</span>{' '}
                          {medication.frequency}
                        </p>
                      )}

                      {medication.duration_days && (
                        <p>
                          <span className="text-slate-500">Duration:</span>{' '}
                          {medication.duration_days} day(s)
                        </p>
                      )}

                      {medication.special_notes && (
                        <p className="mt-2 text-slate-400">
                          {medication.special_notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-400 text-center font-semibold">
                No active prescribed medications found.
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <HeartPulse className="w-8 h-8 text-fuchsia-400" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Emergency-Relevant Medical Devices
              </h3>
            </div>

            {medicalDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {medicalDevices.map((device) => (
                  <div
                    key={device.id || device.device_name}
                    className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <HeartPulse className="w-5 h-5 text-fuchsia-400 mt-0.5 shrink-0" />

                      <div>
                        <p className="text-lg font-black text-fuchsia-200">
                          {device.device_name}
                        </p>

                        {device.device_type && (
                          <p className="text-sm font-semibold text-fuchsia-300 mt-1">
                            {device.device_type}
                          </p>
                        )}

                        <p className="text-xs text-slate-400 mt-2">
                          Implanted / Started: {formatDate(device.implanted_at)}
                        </p>

                        {device.notes && (
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            {device.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-400 text-center font-semibold">
                No emergency-relevant medical devices recorded.
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <History className="w-8 h-8 text-violet-400" />
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Critical Medical Background
              </h3>
            </div>

            {healthBackground.length > 0 ? (
              <div className="space-y-3">
                {healthBackground.map((item) => (
                  <div
                    key={item.id || `${item.background_type}-${item.title}`}
                    className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-violet-200">
                          {item.title}
                        </p>

                        <p className="text-sm font-semibold text-violet-300 mt-1">
                          {formatBackgroundType(item.background_type)}
                        </p>

                        {item.notes && (
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {item.event_date && (
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 shrink-0">
                          <CalendarDays className="w-4 h-4 text-violet-400" />
                          {formatDate(item.event_date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-400 text-center font-semibold">
                No emergency-relevant medical background recorded.
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <Users className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Critical Family History
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Only family history marked as emergency relevant is shown here.
                </p>
              </div>
            </div>

            {familyHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {familyHistory.map((item) => (
                  <div
                    key={item.id || `${item.relation}-${item.condition}`}
                    className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />

                      <div>
                        <p className="text-lg font-black text-orange-200">
                          {item.condition}
                        </p>

                        <p className="text-sm font-semibold text-orange-300 mt-1">
                          {formatFamilyRelation(item.relation)}
                        </p>

                        {item.notes && (
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-slate-400 text-center font-semibold">
                No emergency-relevant family history recorded.
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 text-center text-slate-500 text-sm md:text-base font-semibold">
        <ShieldAlert className="inline-block w-4 h-4 mr-2 -mt-1" />
        BREAK-GLASS PROTOCOL ACTIVE. THIS ACCESS EVENT HAS BEEN SECURELY LOGGED AND AUDITED.
      </div>
    </div>
  );
};

export default EmergencySnapshotPage;
