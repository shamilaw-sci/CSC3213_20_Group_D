/**
 * @file    ConsultationNotesModal.jsx
 * @module  Doctor
 * @desc    Modal form for adding structured consultation notes to an appointment.
 * @author  Tharindu (S/21/166)
 */

import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const API_URL = 'http://localhost:5000';

const initialForm = {
  title: '',
  chief_complaint: '',
  diagnosis: '',
  treatment_plan: '',
  description: '',
  follow_up_needed: false,
  is_confidential: false,
};

const ConsultationNotesModal = ({ isOpen, onClose, appointmentId, patientId, doctorId, onSaved }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [observations, setObservations] = useState('');
const [summarizing, setSummarizing] = useState(false);
const [summarizeError, setSummarizeError] = useState('');
const [aiFilled, setAiFilled] = useState(false);

  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [testType, setTestType] = useState('');
  const [priority, setPriority] = useState('routine');
  const [labNotes, setLabNotes] = useState('');
  const [orderingLab, setOrderingLab] = useState(false);
  const [labOrderError, setLabOrderError] = useState('');
  const [labOrderSuccess, setLabOrderSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/api/doctors/laboratories`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLabs(data.data);
        })
        .catch((err) => console.error('Failed to load laboratories:', err));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSummarize = async () => {
  setSummarizeError('');

  if (!observations || observations.trim().length < 10) {
    setSummarizeError('Please type a few observations first.');
    return;
  }

  setSummarizing(true);
  try {
    const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/summarize-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observations }),
    });
    const data = await res.json();

    if (!data.success) {
      setSummarizeError(data.message || "Couldn't generate a summary. Please fill the fields manually.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      chief_complaint: data.data.chief_complaint,
      diagnosis: data.data.diagnosis,
      treatment_plan: data.data.treatment_plan,
      follow_up_needed: data.data.follow_up_needed,
    }));
    setAiFilled(true);
  } catch (err) {
    console.error('handleSummarize error:', err);
    setSummarizeError("Couldn't generate a summary. Please fill the fields manually.");
  } finally {
    setSummarizing(false);
  }
};

  const handleOrderLabTest = async () => {
    setLabOrderError('');
    setLabOrderSuccess('');

    if (!selectedLab || !testType) {
      setLabOrderError('Please select a laboratory and test type.');
      return;
    }

    setOrderingLab(true);
    try {
      const res = await fetch(`${API_URL}/api/doctors/${doctorId}/lab-test-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentId,
          laboratoryId: selectedLab,
          testType,
          priority,
          notes: labNotes,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setLabOrderError(data.message || 'Failed to order lab test.');
        return;
      }

      setLabOrderSuccess(`${testType} ordered successfully.`);
      setSelectedLab('');
      setTestType('');
      setPriority('routine');
      setLabNotes('');
    } catch (err) {
      console.error('handleOrderLabTest error:', err);
      setLabOrderError('Something went wrong. Please try again.');
    } finally {
      setOrderingLab(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.title || !form.description || !form.chief_complaint || !form.diagnosis) {
      setError('Title, description, chief complaint, and diagnosis are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/appointments/${appointmentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to save consultation notes.');
        return;
      }

      setForm(initialForm);
      setObservations('');
      setAiFilled(false);
      setSelectedLab('');
      setTestType('');
      setPriority('routine');
      setLabNotes('');
      setLabOrderSuccess('');
      setLabOrderError('');
      onSaved?.(data.data);
      onClose();
    } catch (err) {
      console.error('ConsultationNotesModal submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabObj = labs.find((lab) => lab.id === selectedLab);
  const availableTests = selectedLabObj?.available_tests || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consultation Notes" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Follow-up consultation"
          required
        />
        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
    Observations (optional — for AI summary)
  </label>
  <textarea
    value={observations}
    onChange={(e) => setObservations(e.target.value)}
    rows={3}
    placeholder="Type your raw observations here, then let AI draft the fields below"
    className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
  />
  <div className="flex items-center justify-between">
    <Button
      type="button"
      variant="secondary"
      onClick={handleSummarize}
      loading={summarizing}
      disabled={summarizing}
    >
      {summarizing ? 'Analyzing...' : '✨ Summarize with AI'}
    </Button>
    {aiFilled && (
      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
        AI-filled — please review
      </span>
    )}
  </div>
  {summarizeError && <p className="text-xs text-red-600">{summarizeError}</p>}
  {aiFilled && !summarizeError && (
    <p className="text-xs text-slate-500 italic">
      ⚠️ AI-generated draft — not a medical diagnosis. Please review and edit before saving.
    </p>
  )}
</div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Chief Complaint <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            name="chief_complaint"
            value={form.chief_complaint}
            onChange={handleChange}
            rows={2}
            placeholder="Patient's main symptom or reason for visit"
            className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Diagnosis <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            rows={2}
            placeholder="Doctor's diagnosis"
            className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Treatment Plan
          </label>
          <textarea
            name="treatment_plan"
            value={form.treatment_plan}
            onChange={handleChange}
            rows={2}
            placeholder="Prescribed treatment, medication, advice"
            className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Order Lab Test (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedLab}
              onChange={(e) => { setSelectedLab(e.target.value); setTestType(''); }}
              className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            >
              <option value="">Select laboratory</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              disabled={!selectedLab}
              className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">Select test type</option>
              {availableTests.map((test) => (
                <option key={test} value={test}>{test}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">Stat (Immediate)</option>
            </select>
            <input
              type="text"
              value={labNotes}
              onChange={(e) => setLabNotes(e.target.value)}
              placeholder="Notes for the lab (optional)"
              className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={handleOrderLabTest}
              loading={orderingLab}
              disabled={orderingLab}
            >
              {orderingLab ? 'Ordering...' : '🧪 Order Lab Test'}
            </Button>
            {labOrderSuccess && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                {labOrderSuccess}
              </span>
            )}
          </div>
          {labOrderError && <p className="text-xs text-red-600">{labOrderError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Additional Notes <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Any other observations"
            className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="follow_up_needed"
              checked={form.follow_up_needed}
              onChange={handleChange}
            />
            Follow-up needed
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="is_confidential"
              checked={form.is_confidential}
              onChange={handleChange}
            />
            Confidential
          </label>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Save Notes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConsultationNotesModal;