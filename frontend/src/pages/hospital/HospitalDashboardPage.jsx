/**
 * @file    HospitalDashboardPage.jsx
 * @module  Emergency
 * @desc    Live, auto-polling dashboard for hospital dispatchers to view active SOS alerts.
 *          Enforces Break-Glass audit logging before granting access to snapshots.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, MapPin, CheckCircle, ShieldAlert, Clock, Phone, Droplet, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const HospitalDashboardPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [accessingId, setAccessingId] = useState(null);
  const navigate = useNavigate();

  const fetchAlerts = async (isBackground = false) => {
    try {
      const response = await api.get('/api/emergencies/alerts');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (!isBackground) toast.error('Failed to load active emergencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const intervalId = setInterval(() => {
      fetchAlerts(true);
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleResolve = async (alertId) => {
    if (!window.confirm("Are you sure this emergency has been handled and resolved?")) return;
    
    setResolvingId(alertId);
    try {
      const response = await api.patch(`/api/emergencies/alerts/${alertId}/resolve`);
      if (response.data.success) {
        toast.success('Emergency marked as resolved');
        setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  // NEW: Break-Glass Audit Interceptor
  const handleAccessSnapshot = async (patientId) => {
    // 1. Force the doctor to provide a reason
    const reason = window.prompt("SECURITY PROTOCOL: Enter medical reason for Break-Glass access (REQUIRED):");

    if (!reason || reason.trim() === '') {
      toast.error("Access denied: Reason is required for the audit log.");
      return;
    }

    setAccessingId(patientId);
    
    // 2. Log the access to the backend (which triggers the email)
    try {
      const response = await api.post('/api/emergencies/access-logs', {
        patientId,
        reason: reason.trim()
      });

      if (response.data.success) {
        toast.success("Access logged securely. Navigating...");
        // 3. Navigate to the snapshot ONLY after successful logging
        navigate(`/emergency/snapshot/${patientId}`);
      }
    } catch (error) {
      console.error('Error logging access:', error);
      toast.error(error.response?.data?.message || 'Failed to authorize access');
      setAccessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-red-500/30">
      
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-500" />
            Central Dispatch
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">SECURE HOSPITAL EMERGENCY DASHBOARD</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-inner">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          <span className="font-bold text-red-500 tracking-wider">LIVE FEED</span>
          <span className="ml-2 text-slate-500 text-sm font-mono border-l border-slate-700 pl-2">POLLING: 10s</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {alerts.length === 0 ? (
          <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">NO ACTIVE EMERGENCIES</h2>
            <p className="text-slate-500">The sector is currently clear. Stand by for incoming alerts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <div 
                key={alert.alert_id} 
                className="bg-slate-900 border-2 border-red-900/50 hover:border-red-500/80 transition-colors rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.1)] relative"
              >
                <div className="h-2 w-full bg-red-600 animate-pulse"></div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-white">{alert.full_name}</h3>
                      <div className="flex items-center gap-1 text-slate-400 mt-1 text-sm font-mono">
                        <Clock className="w-4 h-4" />
                        {new Date(alert.alert_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/30">
                      <Droplet className="w-5 h-5 text-red-500 mb-1" />
                      <span className="text-xs font-bold text-red-400">{alert.blood_group || 'UNK'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {alert.latitude && alert.longitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500/50 transition group"
                      >
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GPS Coordinates</p>
                          <p className="text-sm font-mono text-slate-300 group-hover:text-blue-400">{Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 opacity-70">
                        <MapPin className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GPS Coordinates</p>
                          <p className="text-sm font-mono text-slate-500">Location Unavailable</p>
                        </div>
                      </div>
                    )}

                    {alert.emergency_contact_phone ? (
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <Phone className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Emergency Contact</p>
                          <p className="text-sm font-mono text-amber-400">{alert.emergency_contact_phone}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* UPDATED: Button now routes through the interceptor */}
                    <button
                      onClick={() => handleAccessSnapshot(alert.patient_id)}
                      disabled={accessingId === alert.patient_id}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                    >
                      <ShieldAlert className="w-5 h-5" />
                      {accessingId === alert.patient_id ? 'AUTHORIZING...' : 'ACCESS SNAPSHOT'}
                    </button>
                    
                    <button
                      onClick={() => handleResolve(alert.alert_id)}
                      disabled={resolvingId === alert.alert_id}
                      className="w-full flex items-center justify-center gap-2 bg-transparent border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {resolvingId === alert.alert_id ? 'RESOLVING...' : 'MARK RESOLVED'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboardPage;