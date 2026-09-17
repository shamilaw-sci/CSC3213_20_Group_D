/**
 * @file    AdminQrReissuePage.jsx
 * @module  Admin
 * @desc    Search for a patient and reissue their QR code — the old
 *          code is instantly deactivated, a fresh one is assigned.
 */

import { API_BASE_URL } from '../../services/api';

import { useState } from 'react';

import {
  QrCode,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';

const API_URL = API_BASE_URL;

const AdminQrReissuePage = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reissuingId, setReissuingId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!search.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/patients/search?search=${encodeURIComponent(search)}`,
        {
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        setError(
          data.message ||
          'Search failed'
        );

        return;
      }

      setPatients(
        data.data
      );
    } catch (err) {
      console.error(
        'Search patients error:',
        err
      );

      setError(
        'Could not connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async (
    patientId
  ) => {
    if (
      !window.confirm(
        'Reissue this patient\'s QR code? The old code will stop working immediately.'
      )
    ) {
      return;
    }

    setReissuingId(
      patientId
    );

    try {
      const res = await fetch(
        `${API_URL}/api/admin/patients/${patientId}/reissue-qr`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.message ||
          'Reissue failed'
        );

        return;
      }

      // Update the patient's qr_code_id in the current list
      setPatients(
        prev =>
          prev.map(
            patient =>
              patient.id ===
              patientId
                ? {
                    ...patient,
                    qr_code_id:
                      data.data.qr_code_id
                  }
                : patient
          )
      );

      alert(
        'QR code reissued successfully.'
      );
    } catch (err) {
      console.error(
        'Reissue QR error:',
        err
      );

      alert(
        'Could not connect to the server.'
      );
    } finally {
      setReissuingId(
        null
      );
    }
  };

  return (
    <div className="space-y-7 pb-10">

      <PageHeader
        eyebrow="Administration"
        icon={QrCode}
        title="QR Code Deactivation & Reissue"
        description="Search for a patient and securely replace a lost or compromised Care4U identity QR code."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Security
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                Old QR disabled instantly
              </p>
            </div>

          </div>
        }
      />

      <Card
        title={
          <span className="flex items-center gap-2">
            <Search
              size={18}
              className="text-primary"
            />
            Find Patient
          </span>
        }
      >

        <form
          onSubmit={
            handleSearch
          }
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >

          <div className="flex-1 w-full">

            <Input
              label="Patient Search"
              name="search"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by patient name or NIC..."
            />

          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={
              loading ||
              !search.trim()
            }
            loading={
              loading
            }
          >
            Search
          </Button>

        </form>

        <div className="mt-4 rounded-xl bg-secondary/45 px-4 py-3">

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Reissuing a QR code immediately invalidates the patient&apos;s previous code. Use this only when the original QR has been lost, exposed, or otherwise compromised.
          </p>

        </div>

      </Card>

      {error && (
        <Alert
          type="error"
          message={
            error
          }
        />
      )}

      {loading && (
        <Card>

          <div className="flex flex-col items-center justify-center gap-3 py-10">

            <Spinner
              size="lg"
            />

            <p className="text-sm text-muted-foreground">
              Searching patients...
            </p>

          </div>

        </Card>
      )}

      {!loading &&
        hasSearched &&
        patients.length === 0 && (
          <Card>

            <div className="flex flex-col items-center justify-center text-center py-12 px-4">

              <div className="w-16 h-16 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mb-4">

                <SearchX
                  className="w-7 h-7"
                  strokeWidth={1.8}
                />

              </div>

              <h3 className="text-lg font-bold text-foreground">
                No patients found
              </h3>

              <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                Check the patient name or NIC number and try the search again.
              </p>

            </div>

          </Card>
        )}

      {!loading &&
        patients.length > 0 && (
          <Card
            title="Search Results"
          >

            <div className="space-y-3">

              {patients.map(
                (
                  patient
                ) => {
                  const isReissuing =
                    reissuingId ===
                    patient.id;

                  return (
                    <div
                      key={
                        patient.id
                      }
                      className="rounded-2xl bg-secondary/45 p-4 sm:p-5 transition-colors hover:bg-secondary/65"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        <div className="flex items-start gap-4 min-w-0">

                          <div className="w-11 h-11 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

                            <UserRound
                              size={20}
                            />

                          </div>

                          <div className="min-w-0">

                            <h3 className="text-base sm:text-lg font-bold text-foreground">
                              {
                                patient.full_name
                              }
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">

                              <p>
                                <span className="font-semibold text-foreground">
                                  NIC:
                                </span>
                                {' '}
                                {
                                  patient.nic
                                }
                              </p>

                            </div>

                            <div className="mt-3">

                              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground mb-1.5">
                                Current QR Reference
                              </p>

                              <p className="inline-flex max-w-full rounded-lg bg-card px-3 py-2 font-mono text-xs text-foreground break-all border border-border">
                                {
                                  patient.qr_code_id
                                }
                              </p>

                            </div>

                          </div>

                        </div>

                        <Button
                          variant="danger"
                          onClick={() =>
                            handleReissue(
                              patient.id
                            )
                          }
                          disabled={
                            isReissuing
                          }
                          loading={
                            isReissuing
                          }
                          className="w-full lg:w-auto shrink-0"
                        >
                          <RefreshCw
                            size={16}
                          />

                          {isReissuing
                            ? 'Reissuing...'
                            : 'Reissue QR Code'}
                        </Button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </Card>
        )}

    </div>
  );
};

export default AdminQrReissuePage;