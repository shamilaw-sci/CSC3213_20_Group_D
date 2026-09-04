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
import Alert from '../common/Alert';

const API_URL = 'http://localhost:5000';

const PatientNotesModal = ({ isOpen, onClose, patientId, patientName }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
      // eslint-disable-next-line
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
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        )}

        {!loading && error && (
          <Alert type="error" message={error} />
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-lg border border-dashed border-border bg-secondary/40">
            <FileText className="w-9 h-9 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-muted-foreground">No past consultation notes for this patient yet.</p>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-border rounded-xl p-5 bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground">{note.title}</h3>
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground mr-1.5">Chief Complaint:</span>
                    {note.chief_complaint}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground mr-1.5">Diagnosis:</span>
                    {note.diagnosis}
                  </p>
                  {note.treatment_plan && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground mr-1.5">Treatment Plan:</span>
                      {note.treatment_plan}
                    </p>
                  )}
                  {note.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border border-dashed">
                      <span className="font-semibold text-foreground mr-1.5">Notes:</span>
                      {note.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PatientNotesModal;