/**
 * @component PharmacyLookupPage
 * @desc      Prescription lookup and dispensing page for pharmacists.
 * @author    Wasana Karunanayaka (S/21/081) — original
 * @author    Pamudika Abayarathna (S/21/001) — dispensing upgrade
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Pill,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  CalendarDays,
  Stethoscope,
  FileText,
} from 'lucide-react';

import { verifyPrescriptionByQR } from '../../services/prescription.service';
import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PageHeader from '../../components/common/PageHeader';

const formatDate = (iso) => {
  if (!iso) return '-';

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;

  return new Date(expiresAt) < new Date();
};

const resolveBadgeStatus = (
  status,
  expiresAt
) => {
  if (isExpired(expiresAt)) {
    return 'expired';
  }

  return status || 'active';
};

/**
 * Displays one prescription medicine and,
 * while dispensing, allows the pharmacist
 * to enter the quantity being dispensed.
 */
const MedicineRow = ({
  item,
  dispenseQty,
  onQtyChange,
  canDispense,
}) => {
  const remaining =
    item.quantity_prescribed -
    item.quantity_dispensed;

  return (
    <div className="border border-border rounded-xl p-4 mb-3 last:mb-0 bg-card transition-colors hover:border-primary/30">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

        {/* Medicine information */}
        <div className="flex items-start gap-3 flex-1">

          <div className="mt-0.5 p-2 bg-primary/10 rounded-lg shrink-0">
            <Pill
              size={16}
              className="text-primary"
            />
          </div>

          <div>

            <p className="text-sm font-bold text-foreground">
              {item.medicine_name}
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              {item.dosage}
              {' · '}
              {item.frequency}
              {' · '}
              {item.duration_days} days
            </p>

            {item.special_notes && (
              <div className="mt-2 flex items-start gap-2">

                <FileText
                  size={14}
                  className="text-primary mt-0.5 shrink-0"
                />

                <p className="text-xs text-primary italic">
                  {item.special_notes}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* Quantity information */}
        <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-5 text-center sm:text-right shrink-0">

          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
              Prescribed
            </p>

            <p className="text-lg font-bold text-foreground mt-1">
              {item.quantity_prescribed}
            </p>
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
              Dispensed
            </p>

            <p className="text-lg font-bold text-success mt-1">
              {item.quantity_dispensed}
            </p>
          </div>

          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
              Remaining
            </p>

            <p
              className={`text-lg font-bold mt-1 ${
                remaining > 0
                  ? 'text-urgent-foreground'
                  : 'text-success'
              }`}
            >
              {remaining}
            </p>
          </div>

        </div>

      </div>

      {/* Quantity input */}
      {canDispense && remaining > 0 && (
        <div className="mt-4 pt-4 border-t border-border">

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Quantity to dispense now
            </label>

            <div className="w-full sm:w-28">

              <Input
                type="number"
                min="0"
                max={remaining}
                value={dispenseQty}
                onChange={(e) =>
                  onQtyChange(
                    item.id,
                    parseInt(
                      e.target.value,
                      10
                    ) || 0
                  )
                }
              />

            </div>

            <span className="text-xs text-muted-foreground">
              Maximum: {remaining}
            </span>

          </div>

        </div>
      )}

      {/* Fully dispensed indicator */}
      {remaining === 0 && (
        <div className="mt-4 pt-4 border-t border-border">

          <p className="text-xs text-success font-semibold flex items-center gap-1.5">

            <CheckCircle size={14} />

            Fully dispensed

          </p>

        </div>
      )}

    </div>
  );
};

const PharmacyLookupPage = () => {
  const { qrValue } = useParams();

  const queryClient =
    useQueryClient();

  const [
    dispensing,
    setDispensing
  ] = useState(false);

  const [
    dispenseQtys,
    setDispenseQtys
  ] = useState({});

  const [
    dispenseError,
    setDispenseError
  ] = useState(null);

  const [
    dispenseSuccess,
    setDispenseSuccess
  ] = useState(false);

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  /**
   * Loads and verifies the prescription
   * using the QR code supplied in the URL.
   */
  const {
    data: prescriptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'pharmacy-lookup',
      qrValue
    ],

    queryFn: () =>
      verifyPrescriptionByQR(
        qrValue
      ),

    retry: false,
  });

  const prescription =
    prescriptionData?.data;

  /**
   * Updates a medicine dispensing quantity.
   */
  const handleQtyChange = (
    itemId,
    qty
  ) => {
    setDispenseQtys(
      (prev) => ({
        ...prev,
        [itemId]: qty
      })
    );

    setDispenseError(null);
  };

  /**
   * Submits selected medicine quantities
   * to the backend for dispensing.
   */
  const handleDispenseSubmit =
    async () => {
      setDispenseError(null);
      setSubmitting(true);

      try {
        const dispenseItems =
          Object.entries(
            dispenseQtys
          )
            .filter(
              ([, qty]) =>
                qty > 0
            )
            .map(
              ([
                prescriptionItemId,
                quantityDispensed
              ]) => ({
                prescriptionItemId,
                quantityDispensed,
              })
            );

        if (
          dispenseItems.length === 0
        ) {
          setDispenseError(
            'Please enter a quantity for at least one medicine.'
          );

          setSubmitting(false);

          return;
        }

        await api.post(
          `/api/prescriptions/${prescription.id}/dispense`,
          {
            dispenseItems
          }
        );

        setDispenseSuccess(true);
        setDispensing(false);
        setDispenseQtys({});

        /**
         * Refresh the verified prescription so that
         * the latest quantities and status appear.
         */
        await queryClient.invalidateQueries({
          queryKey: [
            'pharmacy-lookup',
            qrValue
          ]
        });

        /**
         * Dispensing also changes pharmacy dashboard
         * statistics and dispensing history.
         */
        await queryClient.invalidateQueries({
          queryKey: [
            'pharmacy-dashboard'
          ]
        });

        await queryClient.invalidateQueries({
          queryKey: [
            'pharmacy-dispensing-history'
          ]
        });

      } catch (err) {
        console.error(
          'Dispensing failed:',
          err
        );

        setDispenseError(
          err.response?.data?.message ||
          'Dispensing failed. Please try again.'
        );

      } finally {
        setSubmitting(false);
      }
    };

  /**
   * Cancels the current dispensing operation.
   */
  const handleCancelDispense = () => {
    setDispensing(false);
    setDispenseQtys({});
    setDispenseError(null);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-muted/30 flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Spinner size="lg" />

          <p className="text-sm text-muted-foreground">
            Verifying prescription...
          </p>

        </div>

      </div>
    );
  }

  // ── Invalid / Not Found ──
  if (error || !prescription) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">

          <PageHeader
            eyebrow="Pharmacy Operations"
            title="Prescription Verification"
            description="The requested prescription could not be verified."
            icon={QrCode}
            meta={
              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wide font-bold text-destructive">
                    Verification
                  </p>

                  <p className="text-sm font-bold text-foreground">
                    Not available
                  </p>
                </div>

              </div>
            }
          />

        </div>

        <div className="max-w-md mx-auto px-4 py-10">

          <Alert
            type="error"
            message={
              error?.response?.data?.message ||
              `No prescription found for QR code: ${qrValue}`
            }
          />

        </div>

      </div>
    );
  }

  const badgeStatus =
    resolveBadgeStatus(
      prescription.status,
      prescription.expires_at
    );

  const expired =
    isExpired(
      prescription.expires_at
    );

  const validItems =
    (
      prescription.items ||
      []
    ).filter(
      (item) =>
        item &&
        item.medicine_name
    );

  const canDispense =
    !expired &&
    prescription.status !==
      'completed';

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

        <PageHeader
          eyebrow="Pharmacy Operations"
          title="Prescription Details"
          description="Verify prescription validity and dispense medicines against the remaining prescribed quantities."
          icon={QrCode}
          meta={
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <QrCode size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                  Prescription QR
                </p>

                <p className="text-sm font-mono font-bold text-foreground max-w-[220px] truncate">
                  {qrValue}
                </p>
              </div>

            </div>
          }
        />

      </div>

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Prescription validity */}
        {!expired &&
          prescription.status !==
            'completed' && (

          <div className="border border-success/30 bg-success/10 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <ShieldCheck
                size={22}
                className="text-success shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-bold text-success">
                  Valid Prescription
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  This prescription is active and can be processed for dispensing.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* Expired warning */}
        {expired && (
          <Alert
            type="error"
            message="This prescription has EXPIRED and cannot be dispensed."
          />
        )}

        {/* Completed information */}
        {!expired &&
          prescription.status ===
            'completed' && (

          <div className="border border-success/30 bg-success/10 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <CheckCircle
                size={22}
                className="text-success shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-bold text-success">
                  Prescription Completed
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  All prescribed medicines have already been fully dispensed.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* Successful dispensing */}
        {dispenseSuccess && (
          <Alert
            type="success"
            message="Medicines dispensed successfully! Prescription status updated and dispensing activity recorded."
          />
        )}

        {/* ─────────────────────────────────────────
            Prescription Summary
        ───────────────────────────────────────── */}
        <Card title="Prescription Summary">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-2">

            {/* Status */}
            <div>

              <div className="flex items-center gap-2 text-muted-foreground">

                {expired ? (
                  <ShieldAlert
                    size={15}
                  />
                ) : (
                  <ShieldCheck
                    size={15}
                  />
                )}

                <p className="text-xs uppercase tracking-wide">
                  Status
                </p>

              </div>

              <div className="mt-2">

                <Badge
                  status={
                    badgeStatus
                  }
                />

              </div>

            </div>

            {/* Doctor */}
            <div>

              <div className="flex items-center gap-2 text-muted-foreground">

                <Stethoscope
                  size={15}
                />

                <p className="text-xs uppercase tracking-wide">
                  Doctor
                </p>

              </div>

              <p className="text-sm font-semibold text-foreground mt-2">
                {prescription.doctor_name
                  ? `Dr. ${prescription.doctor_name}`
                  : '-'}
              </p>

            </div>

            {/* Issued Date */}
            <div>

              <div className="flex items-center gap-2 text-muted-foreground">

                <CalendarDays
                  size={15}
                />

                <p className="text-xs uppercase tracking-wide">
                  Issued
                </p>

              </div>

              <p className="text-sm font-medium text-foreground mt-2">
                {formatDate(
                  prescription.created_at
                )}
              </p>

            </div>

            {/* Expiry Date */}
            <div>

              <div className="flex items-center gap-2 text-muted-foreground">

                <CalendarDays
                  size={15}
                />

                <p className="text-xs uppercase tracking-wide">
                  Expires
                </p>

              </div>

              <p
                className={`text-sm font-semibold mt-2 ${
                  expired
                    ? 'text-destructive'
                    : 'text-success'
                }`}
              >
                {formatDate(
                  prescription.expires_at
                )}
              </p>

            </div>

          </div>

          {/* Doctor Notes */}
          {prescription.notes && (
            <div className="mt-5 pt-5 border-t border-border">

              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Doctor's Notes
              </p>

              <div className="bg-secondary/50 border border-border rounded-lg p-4">

                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {prescription.notes}
                </p>

              </div>

            </div>
          )}

        </Card>

        {/* ─────────────────────────────────────────
            Medicines
        ───────────────────────────────────────── */}
        <Card
          title={`Medicines (${validItems.length})`}
        >

          {validItems.length === 0 ? (

            <div className="text-center py-8">

              <Pill className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />

              <p className="text-sm text-muted-foreground">
                No medicines found.
              </p>

            </div>

          ) : (

            <div className="pt-2">

              {validItems.map(
                (item) => (

                  <MedicineRow
                    key={item.id}
                    item={item}
                    dispenseQty={
                      dispenseQtys[
                        item.id
                      ] || 0
                    }
                    onQtyChange={
                      handleQtyChange
                    }
                    canDispense={
                      dispensing
                    }
                  />

                )
              )}

            </div>

          )}

          {/* Dispensing instructions */}
          {dispensing && (
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">

              <div className="flex items-start gap-3">

                <ClipboardCheck
                  size={18}
                  className="text-primary shrink-0 mt-0.5"
                />

                <div>

                  <p className="text-sm font-semibold text-foreground">
                    Dispensing Mode
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the quantity being supplied now for each medicine. You can dispense one or more medicines partially.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* Error */}
          {dispenseError && (
            <div className="mt-4">

              <Alert
                type="error"
                message={
                  dispenseError
                }
              />

            </div>
          )}

          {/* Dispensing buttons */}
          {canDispense && (
            <div className="mt-5 pt-5 border-t border-border">

              {!dispensing ? (

                <Button
                  variant="primary"
                  className="w-full"
                  icon={
                    <ClipboardCheck
                      size={16}
                    />
                  }
                  onClick={() => {
                    setDispensing(true);
                    setDispenseSuccess(false);
                    setDispenseError(null);
                  }}
                >
                  Dispense Medicines
                </Button>

              ) : (

                <div className="flex flex-col sm:flex-row gap-3">

                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={submitting}
                    icon={
                      <CheckCircle
                        size={16}
                      />
                    }
                    onClick={
                      handleDispenseSubmit
                    }
                  >
                    Confirm Dispense
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex-1"
                    icon={
                      <XCircle
                        size={16}
                      />
                    }
                    onClick={
                      handleCancelDispense
                    }
                  >
                    Cancel
                  </Button>

                </div>

              )}

            </div>
          )}

          {/* Completed */}
          {prescription.status ===
            'completed' && (

            <div className="mt-5 pt-5 border-t border-border text-center">

              <div className="flex items-center justify-center gap-2">

                <CheckCircle
                  size={18}
                  className="text-success"
                />

                <p className="text-sm text-success font-semibold">
                  All medicines have been fully dispensed
                </p>

              </div>

            </div>

          )}

        </Card>

      </main>

    </div>
  );
};

export default PharmacyLookupPage;
