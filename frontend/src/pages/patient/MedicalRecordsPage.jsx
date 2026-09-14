/**
 * @file      MedicalRecordsPage.jsx
 * @component MedicalRecordsPage
 * @desc      Displays all medical records for a patient.
 *            Uses a desktop table and responsive mobile cards.
 *            Clicking a record opens the full clinical details.
 * @author    Wasana Karunanayaka (S/21/081)
 */

import {
  useState,
} from 'react';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  Eye,
  FileText,
  FlaskConical,
  LockKeyhole,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import {
  getMedicalRecords,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

/**
 * Formats record dates for patient-facing display.
 */
const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return '—';
  }

  return new Date(
    dateStr
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
};

/**
 * Returns the appropriate visual icon for each
 * medical record category.
 */
const RecordTypeIcon = ({
  type,
  size = 14,
}) => {
  const icons = {
    consultation: (
      <Stethoscope
        size={size}
      />
    ),

    lab_result: (
      <FlaskConical
        size={size}
      />
    ),

    imaging: (
      <Eye
        size={size}
      />
    ),
  };

  return (
    icons[type] || (
      <FileText
        size={size}
      />
    )
  );
};

/**
 * Converts backend record types into readable labels.
 */
const formatRecordType = (
  type
) => {
  const labels = {
    consultation:
      'Consultation',

    lab_result:
      'Lab Result',

    imaging:
      'Imaging',
  };

  return (
    labels[type] ||
    type ||
    'Medical Record'
  );
};

/**
 * Small reusable clinical detail block used inside
 * the record detail modal.
 */
const DetailBlock = ({
  label,
  children,
  emphasis = false,
}) => {
  return (
    <div>

      <p className="
        text-[10px]
        font-bold
        text-muted-foreground
        uppercase
        tracking-[0.14em]
        mb-2
      ">
        {label}
      </p>

      <div
        className={`
          rounded-xl
          p-4
          text-sm
          text-foreground
          leading-relaxed
          ${
            emphasis
              ? 'bg-module-soft/70'
              : 'bg-secondary/55'
          }
        `}
      >
        {children}
      </div>

    </div>
  );
};

const MedicalRecordsPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const [
    selectedRecord,
    setSelectedRecord,
  ] = useState(
    null
  );

  const {
    data:
      records = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'medicalRecords',
      patientId,
    ],

    queryFn: () =>
      getMedicalRecords(
        patientId
      ),

    enabled:
      !!patientId,
  });

  const columns = [
    {
      key: 'created_at',
      label: 'Date',

      render:
        value => (
          <span className="font-medium text-foreground whitespace-nowrap">
            {
              formatDate(
                value
              )
            }
          </span>
        ),
    },

    {
      key: 'record_type',
      label: 'Type',

      render:
        value => (
          <span className="flex items-center gap-2 text-foreground font-semibold">

            <span className="text-primary">
              <RecordTypeIcon
                type={
                  value
                }
              />
            </span>

            {
              formatRecordType(
                value
              )
            }

          </span>
        ),
    },

    {
      key: 'title',
      label: 'Title',

      render:
        value => (
          <span className="font-medium text-foreground">
            {value ||
              'Untitled Record'}
          </span>
        ),
    },

    {
      key: 'doctor_name',
      label: 'Doctor',

      render:
        value => (
          <span className="text-muted-foreground">
            {value
              ? `Dr. ${value}`
              : '—'}
          </span>
        ),
    },

    {
      key: 'is_confidential',
      label: 'Privacy',

      render:
        value => (
          <Badge
            status={
              value
                ? 'confidential'
                : 'normal'
            }
            label={
              value
                ? 'Confidential'
                : 'Standard'
            }
          />
        ),
    },

    {
      key: 'action',
      label: 'Action',

      render:
        (
          value,
          record
        ) => (
          <Button
            variant="ghost"
            size="sm"
            icon={
              <Eye
                size={15}
              />
            }
            onClick={
              event => {
                event.stopPropagation();

                setSelectedRecord(
                  record
                );
              }
            }
          >
            View
          </Button>
        ),
    },
  ];

  if (
    isLoading
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading medical records...
        </p>

      </div>
    );
  }

  if (
    isError
  ) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4">

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message={
              error?.message ||
              'Failed to load medical records.'
            }
          />

        </div>

      </div>
    );
  }

  const confidentialCount =
    records.filter(
      record =>
        record.is_confidential
    ).length;

  return (
    <div className="space-y-7">

      {/* =========================================
          PAGE HERO
      ========================================= */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          FileText
        }
        title="Medical Records"
        description="Review your consultation history, diagnoses, treatment information, laboratory results, and other clinical records."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              <FileText
                size={19}
              />

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Health History
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {records.length ===
                0
                  ? 'No records yet'
                  : `${records.length} record${
                      records.length ===
                      1
                        ? ''
                        : 's'
                    }`}
              </p>

              {confidentialCount >
                0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {confidentialCount}{' '}
                  confidential
                </p>
              )}

            </div>

          </div>
        }
      />

      {/* =========================================
          MEDICAL HISTORY
      ========================================= */}
      <Card
        title="Health Record History"
      >

        {records.length ===
        0 ? (

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <FileText
                className="w-7 h-7"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No medical records yet
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Clinical records created during consultations and other
              healthcare activities will appear here.
            </p>

          </div>

        ) : (
          <>

            {/* =====================================
                MOBILE RECORD LIST
            ===================================== */}
            <div className="md:hidden space-y-3">

              {records.map(
                record => (

                  <button
                    key={
                      record.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedRecord(
                        record
                      )
                    }
                    className="
                      group
                      w-full
                      text-left
                      rounded-xl
                      bg-secondary/45
                      hover:bg-module-soft/65
                      transition-colors
                      p-4
                    "
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-3 min-w-0">

                        <div className="
                          w-10 h-10
                          rounded-xl
                          bg-module-soft
                          text-primary
                          flex items-center justify-center
                          shrink-0
                        ">

                          <RecordTypeIcon
                            type={
                              record.record_type
                            }
                            size={
                              18
                            }
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                            {
                              formatRecordType(
                                record.record_type
                              )
                            }
                          </p>

                          <h3 className="text-sm font-bold text-foreground mt-1 leading-snug break-words">
                            {record.title ||
                              'Untitled Record'}
                          </h3>

                          <p className="text-xs text-muted-foreground mt-1">
                            {
                              formatDate(
                                record.created_at
                              )
                            }
                          </p>

                        </div>

                      </div>

                      {record.is_confidential && (
                        <div
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-urgent/10
                            text-urgent-foreground
                            flex items-center justify-center
                            shrink-0
                          "
                          title="Confidential record"
                        >

                          <LockKeyhole
                            size={15}
                          />

                        </div>
                      )}

                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">

                      <div className="flex items-center gap-2 min-w-0">

                        <UserRound
                          size={15}
                          className="text-muted-foreground shrink-0"
                        />

                        <p className="text-xs text-muted-foreground truncate">
                          {record.doctor_name
                            ? `Dr. ${record.doctor_name}`
                            : 'Doctor not specified'}
                        </p>

                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary shrink-0">

                        <Eye
                          size={14}
                        />

                        View

                      </span>

                    </div>

                  </button>

                )
              )}

            </div>

            {/* =====================================
                DESKTOP TABLE
            ===================================== */}
            <div className="hidden md:block">

              <DataTable
                columns={
                  columns
                }
                data={
                  records
                }
                onRowClick={
                  record =>
                    setSelectedRecord(
                      record
                    )
                }
                emptyMessage="No medical records found."
              />

            </div>

          </>
        )}

      </Card>

      {/* =========================================
          RECORD DETAIL MODAL
      ========================================= */}
      <Modal
        isOpen={
          !!selectedRecord
        }
        onClose={() =>
          setSelectedRecord(
            null
          )
        }
        title={
          selectedRecord?.title ||
          'Record Details'
        }
        size="lg"
      >

        {selectedRecord && (
          <div className="space-y-6">

            {/* Record summary */}
            <div className="rounded-2xl bg-module-soft/60 p-4 sm:p-5">

              <div className="flex items-start gap-4">

                <div className="
                  w-11 h-11
                  rounded-xl
                  bg-primary
                  text-primary-foreground
                  flex items-center justify-center
                  shrink-0
                ">

                  <RecordTypeIcon
                    type={
                      selectedRecord.record_type
                    }
                    size={
                      19
                    }
                  />

                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <p className="text-sm font-bold text-foreground">
                      {
                        formatRecordType(
                          selectedRecord.record_type
                        )
                      }
                    </p>

                    {selectedRecord.is_confidential && (
                      <Badge
                        status="confidential"
                        label="Confidential"
                      />
                    )}

                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">

                    <span>
                      {
                        formatDate(
                          selectedRecord.created_at
                        )
                      }
                    </span>

                    {selectedRecord.doctor_name && (
                      <span>
                        Dr. {
                          selectedRecord.doctor_name
                        }
                      </span>
                    )}

                    {selectedRecord.doctor_specialization && (
                      <span className="font-semibold text-primary">
                        {
                          selectedRecord.doctor_specialization
                        }
                      </span>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* Confidential warning */}
            {selectedRecord.is_confidential && (
              <Alert
                type="warning"
                message="This medical record is marked as confidential."
              />
            )}

            {/* Consultation-specific details */}
            {selectedRecord.record_type ===
              'consultation' && (
              <div className="space-y-5">

                {selectedRecord.chief_complaint && (
                  <DetailBlock
                    label="Chief Complaint"
                  >
                    {
                      selectedRecord.chief_complaint
                    }
                  </DetailBlock>
                )}

                {selectedRecord.diagnosis && (
                  <DetailBlock
                    label="Diagnosis"
                    emphasis
                  >
                    {
                      selectedRecord.diagnosis
                    }
                  </DetailBlock>
                )}

                {selectedRecord.treatment_plan && (
                  <DetailBlock
                    label="Treatment Plan"
                  >
                    {
                      selectedRecord.treatment_plan
                    }
                  </DetailBlock>
                )}

                {selectedRecord.follow_up_needed && (
                  <Alert
                    type="info"
                    message="Follow-up recommended by the doctor."
                  />
                )}

              </div>
            )}

            {/* General description */}
            <DetailBlock
              label="Notes"
            >
              {selectedRecord.description ||
                'No additional notes.'}
            </DetailBlock>

          </div>
        )}

      </Modal>

    </div>
  );
};

export default MedicalRecordsPage;