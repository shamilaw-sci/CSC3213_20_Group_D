/**
 * @component PharmacyDispensingHistoryPage
 * @desc      Displays dispensing history for the logged-in pharmacy.
 *            Allows pharmacists to review previous dispensing activity.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Search,
  History,
  ClipboardList,
  User,
  Stethoscope,
  CalendarDays,
  QrCode,
  ArrowRight,
} from 'lucide-react';

import api from '../../services/api';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';

import useAuthStore from '../../store/authStore';

/**
 * Formats an ISO date string into a readable date.
 * @param {string} iso - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (iso) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats an ISO date string into readable date and time.
 * @param {string} iso - ISO date string
 * @returns {string} Formatted date and time
 */
const formatDateTime = (iso) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PharmacyDispensingHistoryPage = () => {
  const navigate = useNavigate();

  const user = useAuthStore(
    (state) => state.user
  );

  const PHARMACY_ID =
    user?.profile_id ||
    user?.id ||
    '';

  const [searchTerm, setSearchTerm] =
    useState('');

  /**
   * Loads dispensing history for the logged-in pharmacy.
   */
  const {
    data: history = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'pharmacy-dispensing-history',
      PHARMACY_ID,
    ],

    queryFn: async () => {
      const res = await api.get(
        `/api/pharmacies/${PHARMACY_ID}/dispensing-history`
      );

      return res.data.data;
    },

    enabled: !!PHARMACY_ID,
  });

  /**
   * Filters dispensing history locally.
   */
  const filteredHistory = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    if (!term) {
      return history;
    }

    return history.filter((record) => {
      const qrCode =
        record.qr_code_value
          ?.toLowerCase() || '';

      const patientName =
        record.patient_name
          ?.toLowerCase() || '';

      const doctorName =
        record.doctor_name
          ?.toLowerCase() || '';

      const status =
        record.status
          ?.toLowerCase() || '';

      return (
        qrCode.includes(term) ||
        patientName.includes(term) ||
        doctorName.includes(term) ||
        status.includes(term)
      );
    });
  }, [
    history,
    searchTerm,
  ]);


  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-muted/30 flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Spinner size="lg" />

          <p className="text-sm text-muted-foreground">
            Loading dispensing history...
          </p>

        </div>

      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-muted/30 flex items-center justify-center p-6">

        <div className="text-center">

          <p className="text-sm text-destructive font-medium mb-4">
            Failed to load dispensing history.
          </p>

          <Button
            variant="primary"
            onClick={() => refetch()}
          >
            Try Again
          </Button>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">

        <PageHeader
          eyebrow="Pharmacy Operations"
          title="Dispensing History"
          description="Review prescriptions previously dispensed by this pharmacy and search historical dispensing activity."
          icon={History}
          meta={
            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ClipboardList size={18} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                  Records
                </p>

                <p className="text-sm font-bold text-foreground">
                  {history.length} total
                </p>
              </div>

            </div>
          }
        />

      </div>

      {/* ─────────────────────────────────────────────
          Main Content
      ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Search */}
        <Card
          title="Search Dispensing History"
          icon={<Search size={18} />}
        >

          <Input
            name="historySearch"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            placeholder="Search by prescription QR, patient, doctor, or status"
          />

        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Card>

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Dispensing Records
            </p>

            <p className="text-3xl font-bold text-foreground mt-2">
              {history.length}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              recorded dispensing activities
            </p>

          </Card>

          <Card>

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search Results
            </p>

            <p className="text-3xl font-bold text-foreground mt-2">
              {filteredHistory.length}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              matching records
            </p>

          </Card>

        </div>

        {/* History List */}
        <Card
          title={`Dispensing Records (${filteredHistory.length})`}
          icon={
            <ClipboardList size={18} />
          }
        >

          {filteredHistory.length === 0 ? (

            <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-border bg-secondary/40">

              <ClipboardList className="w-9 h-9 text-muted-foreground/50 mb-3" />

              <p className="text-sm font-semibold text-muted-foreground">
                No dispensing records found.
              </p>

              {searchTerm && (
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching with a different prescription QR, patient name, or doctor name.
                </p>
              )}

            </div>

          ) : (

            <div className="flex flex-col gap-4">

              {filteredHistory.map(
                (record) => (
                  <div
                    key={
                      record.dispensing_id
                    }
                    className="border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >

                    {/* Top Row */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <QrCode
                            size={16}
                            className="text-primary shrink-0"
                          />

                          <p className="text-sm font-bold text-foreground font-mono break-all">
                            {record.qr_code_value ||
                              '—'}
                          </p>

                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Dispensed:{' '}
                          <span className="font-medium text-foreground">
                            {formatDateTime(
                              record.dispensed_at
                            )}
                          </span>
                        </p>

                      </div>

                      <Badge
                        status={
                          record.status
                        }
                      />

                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5 pt-5 border-t border-border">

                      {/* Patient */}
                      <div>

                        <div className="flex items-center gap-2 text-muted-foreground">

                          <User size={15} />

                          <p className="text-xs uppercase tracking-wide">
                            Patient
                          </p>

                        </div>

                        <p className="text-sm font-semibold text-foreground mt-1">
                          {record.patient_name ||
                            '—'}
                        </p>

                      </div>

                      {/* Doctor */}
                      <div>

                        <div className="flex items-center gap-2 text-muted-foreground">

                          <Stethoscope size={15} />

                          <p className="text-xs uppercase tracking-wide">
                            Doctor
                          </p>

                        </div>

                        <p className="text-sm font-semibold text-foreground mt-1">
                          {record.doctor_name
                            ? `Dr. ${record.doctor_name}`
                            : '—'}
                        </p>

                      </div>

                      {/* Issued */}
                      <div>

                        <div className="flex items-center gap-2 text-muted-foreground">

                          <CalendarDays size={15} />

                          <p className="text-xs uppercase tracking-wide">
                            Issued
                          </p>

                        </div>

                        <p className="text-sm font-semibold text-foreground mt-1">
                          {formatDate(
                            record.prescription_created_at
                          )}
                        </p>

                      </div>

                      {/* Expires */}
                      <div>

                        <div className="flex items-center gap-2 text-muted-foreground">

                          <CalendarDays size={15} />

                          <p className="text-xs uppercase tracking-wide">
                            Expires
                          </p>

                        </div>

                        <p className="text-sm font-semibold text-foreground mt-1">
                          {formatDate(
                            record.expires_at
                          )}
                        </p>

                      </div>

                    </div>

                    {/* Notes */}
                    {record.notes && (
                      <div className="mt-5 pt-5 border-t border-border">

                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Prescription Notes
                        </p>

                        <p className="text-sm text-foreground">
                          {record.notes}
                        </p>

                      </div>
                    )}

                    {/* Action */}
                    <div className="mt-5 pt-5 border-t border-border flex justify-end">

                      <Button
                        variant="secondary"
                        icon={
                          <ArrowRight size={16} />
                        }
                        onClick={() =>
                          navigate(
                            `/pharmacy/${record.qr_code_value}`
                          )
                        }
                      >
                        View Prescription
                      </Button>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </Card>

      </main>

    </div>
  );
};

export default PharmacyDispensingHistoryPage;