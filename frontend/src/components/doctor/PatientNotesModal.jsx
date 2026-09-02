/**
 * @file    PatientNotesModal.jsx
 * @module  Doctor
 * @desc    Simple read-only popup showing a patient's past consultation notes.
 *          Lets the doctor look back at previous visits before/while treating
 *          the patient again.
 * @author  Tharindu (S/21/166)
 */

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

const API_URL = 'http://localhost:5000';

const PatientNotesModal = ({ isOpen, onClose, patientId, patientName }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
      setLoading(true);
      setError('');
      fetch(`${API_URL}/api/appointments/patients/${patientId}/notes`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setNotes(data.data);
          } else {
            setError(data.message || 'Failed to load notes.');
          }
        })
        .catch((err) => {
          console.error('PatientNotesModal fetch error:', err);
          setError('Failed to load notes.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, patientId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Consultation History — ${patientName || 'Patient'}`} size="lg">
      <div className="flex flex-col gap-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <FileText size={32} />
            <p className="text-sm">No past consultation notes for this patient yet.</p>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-800">{note.title}</h3>
                  <span className="text-xs text-slate-400">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-600">Chief Complaint:</span> {note.chief_complaint}
                </p>
                <p className="text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-600">Diagnosis:</span> {note.diagnosis}
                </p>
                {note.treatment_plan && (
                  <p className="text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-600">Treatment Plan:</span> {note.treatment_plan}
                  </p>
                )}
                {note.description && (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Notes:</span> {note.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PatientNotesModal;