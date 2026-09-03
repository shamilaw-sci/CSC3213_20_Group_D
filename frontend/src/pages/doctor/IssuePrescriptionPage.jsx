/**
 * @component IssuePrescriptionPage
 * @desc      Allows a doctor to issue a digital prescription.
 *            Doctor fills in patient ID, medicines, and submits.
 *            On success, displays the generated QR code.
 *            When opened from the Appointment Queue ("Issue Prescription"
 *            button), the patient is already picked — no manual ID entry.
 * @author    S/21/001
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, User } from 'lucide-react';
import { createPrescription } from '../../services/prescription.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { searchMedicines } from '../../utils/medicineSearch';
import { checkDrugInteractions } from '../../services/interaction.service';

const IssuePrescriptionPage = () => {
  const location = useLocation();
  // Passed in from AppointmentQueuePage's "Issue Prescription" button.
  // If missing (page opened directly), the doctor falls back to typing the ID.
  const preselectedPatientId = location.state?.patientId || '';
  const preselectedPatientName = location.state?.patientName || '';
  const preselectedAppointmentId = location.state?.appointmentId || '';

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      patientId: preselectedPatientId,
      appointmentId: preselectedAppointmentId,
    },
  });

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
    } catch {
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
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Issue Prescription</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Fill in the details and submit to generate a QR code</p>
        </div>

        {/* Success — Show QR Code */}
        {qrValue && (
          <Card className="mb-6 text-center border-success/30 shadow-sm">
            <div className="py-8 flex flex-col items-center">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
                <span className="text-success text-2xl">✅</span> Prescription Created Successfully
              </h2>
              <div className="flex justify-center mb-6 p-4 bg-white rounded-xl shadow-sm border border-border inline-block">
                <QRCodeSVG value={qrValue} size={200} />
              </div>
              <p className="text-sm font-bold text-foreground">QR Code: <span className="text-muted-foreground font-medium">{qrValue}</span></p>
              <p className="text-sm font-medium text-muted-foreground mt-2">
                Patient can show this QR code at the pharmacy
              </p>
              <div className="mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setQrValue(null)}
                >
                  Issue Another Prescription
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Prescription Form */}
        {!qrValue && (
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Patient & Appointment Details */}
            <Card title="Patient Details" className="mb-6">
              {error && (
                <div className="mb-4">
                   <Alert type="error" message={error} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 mt-2">
                {preselectedPatientId ? (
                  // Came from the Appointment Queue — patient already picked.
                  <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide">Patient Selected</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{preselectedPatientName || 'Unknown Patient'}</p>
                    </div>
                    {/* Hidden field so react-hook-form still submits the patient's ID */}
                    <input type="hidden" {...register('patientId', { required: true })} />
                  </div>
                ) : (
                  <Input
                    label="Patient ID"
                    name="patientId"
                    placeholder="Enter patient UUID"
                    required
                    {...register('patientId', { required: 'Patient ID is required' })}
                    error={errors.patientId?.message}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Appointment ID (optional)"
                      name="appointmentId"
                      placeholder="Enter appointment UUID (optional)"
                      {...register('appointmentId')}
                    />
                    <Input
                      label="General Notes (optional)"
                      name="notes"
                      placeholder="Any additional notes for the patient"
                      {...register('notes')}
                    />
                </div>
              </div>
            </Card>

            {/* Medicine Items */}
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-foreground">Medicines</h2>
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
                <div key={index} className="border border-border bg-secondary/20 rounded-xl p-5 mb-4 relative">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                      Medicine {index + 1}
                    </h3>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-destructive text-sm font-semibold hover:underline focus:outline-none"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative md:col-span-2">
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
                        <ul className="absolute z-20 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map((med, i) => (
                          <li
                            key={i}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(index, med);
                            }}
                            className="px-4 py-2.5 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors duration-150 border-b border-border last:border-0"
                          >
                              <span className="font-bold">{med.name}</span>
                              <span className="text-muted-foreground font-medium text-xs ml-2">{med.category}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {activeSuggestionIndex === index && suggestions.length === 0 && medicine.medicine_name.trim().length >= 2 && (
                        <p className="absolute z-10 w-full mt-1 px-4 py-2.5 text-xs font-medium text-muted-foreground bg-card border border-border rounded-xl shadow-lg">
                          No matches — you can still type it manually
                        </p>
                      )}
                      
                      {/* Drug Interaction / Allergy Warnings */}
                      {(warnings[index] || [])
                        .filter((w) => !dismissedWarnings.has(`${index}-${w.type}-${w.conflictWith}`))
                        .map((w, wi) => (
                          <div
                            key={wi}
                            className="mt-3 flex items-start gap-3 p-3 rounded-lg border bg-card shadow-sm"
                            style={{ 
                              // Inline styles here are just to override the complex dynamic logic briefly,
                              // but we rely on standard tokens where possible. The prompt allowed reusing Badge logic.
                              borderColor: w.severity === 'severe' ? 'var(--color-destructive)' : 'var(--color-urgent)',
                            }}
                          >
                            <AlertTriangle 
                                size={16} 
                                className={`shrink-0 mt-0.5 ${w.severity === 'severe' ? 'text-destructive' : 'text-urgent-foreground'}`} 
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                    severity={w.severity === 'severe' ? 'severe' : 'moderate'} 
                                    label={w.severity} 
                                />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    {w.type === 'allergy' ? 'Allergy Conflict' : 'Drug Interaction'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">{w.message}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => dismissWarning(index, w)}
                              className="text-muted-foreground hover:text-foreground font-bold p-1 rounded-md hover:bg-secondary focus:outline-none"
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
                    <div className="md:col-span-2">
                        <Input
                          label="Special Notes (optional)"
                          value={medicine.special_notes}
                          onChange={(e) => updateMedicine(index, 'special_notes', e.target.value)}
                          placeholder="e.g. Take after meals"
                        />
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Creating Prescription...' : 'Issue Prescription'}
                </Button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default IssuePrescriptionPage;