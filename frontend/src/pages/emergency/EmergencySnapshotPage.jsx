/**
 * @file    EmergencySnapshotPage.jsx
 * @module  Emergency
 * @desc    High-contrast, large-text Break-Glass snapshot for crisis reading.
 *          Displays only life-saving info (blood type, allergies, contacts).
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Droplet,
  Phone,
  User,
  Activity,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmergencySnapshotPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        // FIXED: Added '/api' prefix to the route
        const response = await api.get(`/api/emergencies/snapshot/${patientId}`);

        if (response.data.success) {
          setSnapshot(response.data.data);
        } else {
          toast.error(response.data.message || 'Failed to retrieve snapshot');
        }
      } catch (error) {
        console.error('Error fetching snapshot:', error);
        toast.error(error.response?.data?.message || 'Network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
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
          className="px-8 py-4 bg-slate-800 text-white text-xl rounded-lg hover:bg-slate-700 transition flex items-center gap-3"
        >
          <ArrowLeft className="w-6 h-6" />
          Return to Emergency Dashboard
        </button>
      </div>
    );
  }

  const { patient, allergies } = snapshot;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-red-500/30">

      {/* Flashing Alert Banner */}
      <div className="max-w-5xl mx-auto mb-6 bg-red-600 text-white p-4 rounded-xl flex items-center justify-center gap-4 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]">
        <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />

        <h1 className="text-2xl md:text-4xl font-black tracking-widest uppercase">
          Emergency Medical Snapshot
        </h1>

        <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />
      </div>

      <div className="max-w-5xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => navigate('/hospital/emergency')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-xl hover:bg-slate-800 hover:border-slate-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Return to Emergency Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Patient Identity & Blood Group */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-linear-to-r from-red-600 to-rose-500"></div>
          
          <User className="w-16 h-16 text-slate-500 mb-4" />

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">
            {patient.full_name}
          </h2>
          
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-lg uppercase tracking-widest mb-2 font-bold">
              Blood Group
            </span>

            <div className="w-40 h-40 rounded-full bg-red-500/10 border-4 border-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <Droplet className="w-10 h-10 text-red-500 absolute -mt-20 opacity-50" />

              <span className="text-7xl font-black text-red-500">
                {patient.blood_group || 'UNK'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          
          {/* Critical Allergies */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />

              <h3 className="text-3xl font-bold text-white">
                Critical Allergies
              </h3>
            </div>
            
            {allergies.length > 0 ? (
              <div className="space-y-4">
                {allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between"
                  >
                    <span className="text-2xl font-bold text-slate-200">
                      {allergy.allergen}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-lg text-lg font-black uppercase tracking-wider ${
                        allergy.severity === 'severe'
                          ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                          : allergy.severity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      }`}
                    >
                      {allergy.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center">
                <span className="text-2xl font-bold text-emerald-500">
                  No Known Allergies
                </span>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-8 h-8 text-blue-500" />

              <h3 className="text-3xl font-bold text-white">
                Emergency Contact
              </h3>
            </div>
            
            {patient.emergency_contact_name ? (
              <div className="bg-blue-500/10 border border-blue-500/30 p-6 rounded-2xl">
                <h4 className="text-3xl font-bold text-slate-100 mb-2">
                  {patient.emergency_contact_name}
                </h4>

                <a
                  href={`tel:${patient.emergency_contact_phone}`}
                  className="text-4xl font-black text-blue-400 hover:text-blue-300 transition block mt-4"
                >
                  {patient.emergency_contact_phone}
                </a>
              </div>
            ) : (
              <p className="text-xl text-slate-500 italic">
                No emergency contact on file.
              </p>
            )}
          </div>

        </div>
      </div>
      
      {/* Audit Log Disclaimer */}
      <div className="max-w-5xl mx-auto mt-8 text-center text-slate-500 text-sm md:text-base font-semibold">
        <ShieldAlert className="inline-block w-4 h-4 mr-2 -mt-1" />
        BREAK-GLASS PROTOCOL ACTIVE. THIS ACCESS EVENT HAS BEEN SECURELY LOGGED AND AUDITED.
      </div>

    </div>
  );
};

export default EmergencySnapshotPage;