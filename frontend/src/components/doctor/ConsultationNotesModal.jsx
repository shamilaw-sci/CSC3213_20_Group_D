/**
 * @file    ConsultationNotesModal.jsx
 * @module  Doctor
 * @desc    Modal form for adding structured consultation notes to an appointment.
 * @author  Tharindu (S/21/166)
 */

import { useState } from 'react';
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

const ConsultationNotesModal = ({ isOpen, onClose, appointmentId, onSaved }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      onSaved?.(data.data);
      onClose();
    } catch (err) {
      console.error('ConsultationNotesModal submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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