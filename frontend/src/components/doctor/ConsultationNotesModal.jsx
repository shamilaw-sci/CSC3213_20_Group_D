/**
 * @file    ConsultationNotesModal.jsx
 * @module  Doctor
 * @desc    Modal form for adding structured consultation notes to an appointment.
 * @author  Tharindu (S/21/166)
 */

import { API_BASE_URL } from '../../services/api';

import { useState, useEffect } from 'react';
import { Sparkles, FlaskConical, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import { searchLabTests } from '../../utils/labTestSearch';

const API_URL = API_BASE_URL;

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
  const [testTypeSuggestions, setTestTypeSuggestions] = useState([]);
  const [showTestSuggestions, setShowTestSuggestions] = useState(false);
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

  const handleTestTypeChange = (value) => {
    setTestType(value);
    setTestTypeSuggestions(value.trim() === '' ? availableTests : searchLabTests(availableTests, value));
    setShowTestSuggestions(true);
  };

  const selectTestType = (test) => {
    setTestType(test);
    setTestTypeSuggestions([]);
    setShowTestSuggestions(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consultation Notes" size="lg">
      <div className="flex flex-col gap-5">
        
        {error && <Alert type="error" message={error} />}

        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Follow-up consultation"
          required
        />
        
        <div className="flex flex-col gap-3 p-4 bg-primary/5 border border-primary/20 border-l-4 border-l-primary rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Sparkles size={14} className="text-primary" />
            Observations (optional — for AI summary)
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            placeholder="Type your raw observations here, then let AI draft the fields below"
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
          />
          <div className="flex items-center justify-between mt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSummarize}
              loading={summarizing}
              disabled={summarizing}
              size="sm"
            >
              {summarizing ? 'Analyzing...' : 'Summarize with AI'}
            </Button>
            {aiFilled && (
              <Badge status="pending" label="AI-filled — please review" />
            )}
          </div>
          {summarizeError && <p className="text-xs font-medium text-destructive mt-1">{summarizeError}</p>}
          {aiFilled && !summarizeError && (
            <p className="text-[11px] text-muted-foreground italic mt-1">
              AI-generated draft — not a medical diagnosis. Please review and edit before saving.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Chief Complaint <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            name="chief_complaint"
            value={form.chief_complaint}
            onChange={handleChange}
            rows={2}
            placeholder="Patient's main symptom or reason for visit"
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Diagnosis <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            rows={2}
            placeholder="Doctor's diagnosis"
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Treatment Plan
          </label>
          <textarea
            name="treatment_plan"
            value={form.treatment_plan}
            onChange={handleChange}
            rows={2}
            placeholder="Prescribed treatment, medication, advice"
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-3 p-4 bg-brand-deep/5 border border-brand-deep/20 border-l-4 border-l-brand-deep rounded-xl">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <FlaskConical size={14} className="text-brand-deep" />
            Order Lab Test (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedLab}
              onChange={(e) => {
                setSelectedLab(e.target.value);
                setTestType('');
                setTestTypeSuggestions([]);
                setShowTestSuggestions(false);
              }}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            >
              <option value="">Select laboratory</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type="text"
                value={testType}
                onChange={(e) => handleTestTypeChange(e.target.value)}
                onFocus={() => {
                  setShowTestSuggestions(true);
                  if (!testType.trim()) setTestTypeSuggestions(availableTests);
                }}
                onBlur={() => setTimeout(() => setShowTestSuggestions(false), 150)}
                disabled={!selectedLab}
                autoComplete="off"
                placeholder={selectedLab ? 'Type to search test type' : 'Select a laboratory first'}
                className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground hover:border-muted-foreground disabled:cursor-not-allowed"
              />
              {showTestSuggestions && testTypeSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {testTypeSuggestions.map((test, i) => (
                    <li
                      key={i}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectTestType(test);
                      }}
                      className="px-3.5 py-2.5 text-sm text-foreground hover:bg-secondary hover:text-primary cursor-pointer transition-colors duration-150"
                    >
                      {test}
                    </li>
                  ))}
                </ul>
              )}
              {showTestSuggestions && testType.trim().length >= 2 && testTypeSuggestions.length === 0 && (
                <p className="absolute z-10 w-full mt-1 px-3.5 py-2.5 text-xs text-muted-foreground bg-card border border-border rounded-lg shadow-lg">
                  No matches in this lab's test list
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
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
              className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={handleOrderLabTest}
              loading={orderingLab}
              disabled={orderingLab}
              size="sm"
            >
              {orderingLab ? 'Ordering...' : 'Order Lab Test'}
            </Button>
            {labOrderSuccess && (
              <Badge status="active" label={labOrderSuccess} />
            )}
          </div>
          {labOrderError && <p className="text-xs font-medium text-destructive mt-1">{labOrderError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Additional Notes <span className="text-destructive ml-1">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Any other observations"
            className="w-full px-3.5 py-2.5 text-sm text-foreground bg-background border border-border rounded-lg transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-6 mt-1">
          <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="follow_up_needed"
              checked={form.follow_up_needed}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            Follow-up needed
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              name="is_confidential"
              checked={form.is_confidential}
              onChange={handleChange}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            Confidential
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
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