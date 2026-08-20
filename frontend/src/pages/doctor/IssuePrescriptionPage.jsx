/**
 * @component IssuePrescriptionPage
 * @desc      Allows a doctor to issue a digital prescription.
 *            Doctor fills in patient ID, medicines, and submits.
 *            On success, displays the generated QR code.
 * @author    S/21/001
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { createPrescription } from '../../services/prescription.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { searchMedicines } from '../../utils/medicineSearch';
import { checkDrugInteractions } from '../../services/interaction.service';

const SEVERITY_STYLES = {
  severe: 'border-red-300 bg-red-50 text-red-700',
  moderate: 'border-orange-300 bg-orange-50 text-orange-700',
  mild: 'border-yellow-300 bg-yellow-50 text-yellow-700',
};

const IssuePrescriptionPage = () => {
  const [medicines, setMedicines] = useState([
    { medicine_name: '', dosage: '', frequency: '', duration_days: '', quantity_prescribed: '', special_notes: '' }
  ]);
  const [qrValue, setQrValue] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [warnings, setWarnings] = useState({}); // { [medicineIndex]: [warningObj, ...] }
  const [dismissedWarnings, setDismissedWarnings] = useState(new Set());

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  // Add a new empty medicine row
  const addMedicine = () => {
    setMedicines([...medicines, {
      medicine_name: '', dosage: '', frequency: '',
      duration_days: '', quantity_prescribed: '', special_notes: ''
    }]);
  };

  // Remove a medicine row by index
  const removeMedicine = (index) => {
    if (medicines.length === 1) return; // keep at least one row
    setMedicines(medicines.filter((_, i) => i !== index));
    // Reset dismissed state on remove so a re-shown row never silently hides a real warning
    setDismissedWarnings(new Set());
  };

  // Update a specific field in a medicine row
  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleMedicineNameChange = (index, value) => {
  updateMedicine(index, 'medicine_name', value);
  setActiveSuggestionIndex(index);
  setSuggestions(searchMedicines(value));
  setWarnings((prev) => ({ ...prev, [index]: [] }));
};

  // Checks the given medicine name against the current patient's allergies
  // and active prescriptions. Never blocks the doctor — fails silently on error.
  const runConflictCheck = async (index, medicineName) => {
    const patientId = watch('patientId');
    if (!patientId || !medicineName || !medicineName.trim()) {
      setWarnings((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    try {
      const result = await checkDrugInteractions(patientId, medicineName);
      setWarnings((prev) => ({ ...prev, [index]: result }));
    } catch (err) {
      setWarnings((prev) => ({ ...prev, [index]: [] }));
    }
  };

  const dismissWarning = (index, warning) => {
    setDismissedWarnings((prev) => {
      const updated = new Set(prev);
      updated.add(`${index}-${warning.type}-${warning.conflictWith}`);
      return updated;
    });
  };

const selectSuggestion = (index, medicine) => {
  const updated = [...medicines];
  updated[index] = {
    ...updated[index],
    medicine_name: medicine.name,
    dosage: medicine.defaultDosage,
    frequency: medicine.defaultFrequency,
  };
  setMedicines(updated);
  setActiveSuggestionIndex(null);
  setSuggestions([]);
  runConflictCheck(index, medicine.name);
};

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setQrValue(null);

    try {
      const prescriptionData = {
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        notes: data.notes || null,
        items: medicines.map(m => ({
          medicine_name: m.medicine_name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration_days: parseInt(m.duration_days),
          quantity_prescribed: parseInt(m.quantity_prescribed),
          special_notes: m.special_notes || null
        }))
      };

      const response = await createPrescription(prescriptionData);
      setQrValue(response.data.qr_code_value);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Issue Prescription</h1>
          <p className="text-sm text-slate-500">Fill in the details and submit to generate a QR code</p>
        </div>

        {/* Success — Show QR Code */}
        {qrValue && (
          <Card className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              ✅ Prescription Created Successfully
            </h2>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={qrValue} size={200} />
            </div>
            <p className="text-sm text-slate-500">QR Code: {qrValue}</p>
            <p className="text-xs text-slate-400 mt-2">
              Patient can show this QR code at the pharmacy
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => setQrValue(null)}
              >
                Issue Another Prescription
              </Button>
            </div>
          </Card>
        )}

        {/* Prescription Form */}
        {!qrValue && (
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Patient & Appointment Details */}
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">Patient Details</h2>

              {error && (
                <Alert type="error" message={error} />
              )}

              <div className="grid grid-cols-1 gap-4 mt-4">
                <Input
                  label="Patient ID"
                  name="patientId"
                  placeholder="Enter patient UUID"
                  required
                  {...register('patientId', { required: 'Patient ID is required' })}
                  error={errors.patientId?.message}
                />
                <Input
                  label="Appointment ID (optional)"
                  name="appointmentId"
                  placeholder="Enter appointment UUID (optional)"
                  {...register('appointmentId')}
                />
                <Input
                  label="Notes (optional)"
                  name="notes"
                  placeholder="Any additional notes for the patient"
                  {...register('notes')}
                />
              </div>
            </Card>

            {/* Medicine Items */}
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Medicines</h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addMedicine}
                >
                  + Add Medicine
                </Button>
              </div>

              {medicines.map((medicine, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-600">
                      Medicine {index + 1}
                    </h3>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
  <Input
    label="Medicine Name"
    value={medicine.medicine_name}
    onChange={(e) => handleMedicineNameChange(index, e.target.value)}
    onBlur={() => setTimeout(() => {
      setActiveSuggestionIndex(null);
      runConflictCheck(index, medicine.medicine_name);
    }, 150)}
    placeholder="e.g. Paracetamol"
    autoComplete="off"
    required
  />
  {activeSuggestionIndex === index && suggestions.length > 0 && (
    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
      {suggestions.map((med, i) => (
       <li
  key={i}
  onMouseDown={(e) => {
    e.preventDefault();
    selectSuggestion(index, med);
  }}
  className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
>
          <span className="font-medium">{med.name}</span>
          <span className="text-slate-400 text-xs ml-2">{med.category}</span>
        </li>
      ))}
    </ul>
  )}
  {activeSuggestionIndex === index && suggestions.length === 0 && medicine.medicine_name.trim().length >= 2 && (
    <p className="absolute z-10 w-full mt-1 px-3 py-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg shadow-lg">
      No matches — you can still type it manually
    </p>
  )}
  {(warnings[index] || [])
    .filter((w) => !dismissedWarnings.has(`${index}-${w.type}-${w.conflictWith}`))
    .map((w, wi) => (
      <div
        key={wi}
        className={`mt-2 rounded-lg border px-3 py-2 text-xs flex justify-between items-start gap-2 ${SEVERITY_STYLES[w.severity] || SEVERITY_STYLES.moderate}`}
      >
        <div>
          <span className="font-semibold uppercase">
            {w.severity} — {w.type === 'allergy' ? 'Allergy Conflict' : 'Drug Interaction'}
          </span>
          <p className="mt-0.5">{w.message}</p>
        </div>
        <button
          type="button"
          onClick={() => dismissWarning(index, w)}
          className="text-current opacity-60 hover:opacity-100 font-bold leading-none"
          aria-label="Dismiss warning"
        >
          ×
        </button>
      </div>
    ))}
</div>
                    <Input
                      label="Dosage"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      required
                    />
                    <Input
                      label="Frequency"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      placeholder="e.g. Twice daily"
                      required
                    />
                    <Input
                      label="Duration (days)"
                      type="number"
                      value={medicine.duration_days}
                      onChange={(e) => updateMedicine(index, 'duration_days', e.target.value)}
                      placeholder="e.g. 7"
                      required
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      value={medicine.quantity_prescribed}
                      onChange={(e) => updateMedicine(index, 'quantity_prescribed', e.target.value)}
                      placeholder="e.g. 14"
                      required
                    />
                    <Input
                      label="Special Notes (optional)"
                      value={medicine.special_notes}
                      onChange={(e) => updateMedicine(index, 'special_notes', e.target.value)}
                      placeholder="e.g. Take after meals"
                    />
                  </div>
                </div>
              ))}
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Prescription...' : 'Issue Prescription'}
            </Button>

          </form>
        )}
      </div>
    </div>
  );
};

export default IssuePrescriptionPage;