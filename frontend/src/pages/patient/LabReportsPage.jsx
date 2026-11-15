/**
 * @file    LabReportsPage.jsx
 * @module  Patient
 * @desc    List lab reports, preview images, open PDFs, and mark reports read.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import {
  useMemo,
  useState,
} from 'react';

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileImage,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';

import {
  getLabReports,
  markLabReportAsRead,
} from '../../services/patient.service';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';



/**
 * Formats a report timestamp.
 */
const formatDate = (
  dateStr
) => {
  if (!dateStr) {
    return 'Date unavailable';
  }

  const date =
    new Date(
      dateStr
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Date unavailable';
  }

  return date.toLocaleString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  );
};

/**
 * Removes query parameters and fragments before
 * checking an uploaded report's file extension.
 */
const cleanFileUrl = (
  url
) => {
  if (!url) {
    return '';
  }

  return String(
    url
  )
    .split('?')[0]
    .split('#')[0]
    .toLowerCase();
};

/**
 * Checks whether an uploaded laboratory report is an image.
 */
const isImageReport = (
  url
) => {
  const cleanUrl =
    cleanFileUrl(
      url
    );

  return [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
  ].some(
    extension =>
      cleanUrl.endsWith(
        extension
      )
  );
};

/**
 * Checks whether an uploaded laboratory report is a PDF.
 */
const isPdfReport = (
  url
) => {
  return cleanFileUrl(
    url
  ).endsWith(
    '.pdf'
  );
};

/**
 * Returns visual metadata for an uploaded report.
 */
const getFileMeta = (
  url
) => {
  if (
    isImageReport(
      url
    )
  ) {
    return {
      type: 'image',
      label: 'Image Report',
      icon: FileImage,
      textClass:
        'text-violet-700',
      backgroundClass:
        'bg-violet-50',
      borderClass:
        'border-violet-100',
    };
  }

  if (
    isPdfReport(
      url
    )
  ) {
    return {
      type: 'pdf',
      label: 'PDF Report',
      icon: FileText,
      textClass:
        'text-blue-700',
      backgroundClass:
        'bg-blue-50',
      borderClass:
        'border-blue-100',
    };
  }

  return {
    type: 'document',
    label: 'Lab Document',
    icon: FileText,
    textClass:
      'text-primary',
    backgroundClass:
      'bg-module-soft',
    borderClass:
      'border-primary/10',
  };
};



/**
 * Display one laboratory summary metric; numbers are computed from loaded reports.
 */
const SummaryCard = ({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  backgroundClass,
}) => {
  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border/70
        p-5
        shadow-[0_8px_24px_rgba(15,23,42,0.045)]
      "
    >

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div>

          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.14em]
              text-muted-foreground
            "
          >
            {label}
          </p>

          <p
            className="
              text-3xl
              font-black
              text-foreground
              tracking-tight
              mt-2
            "
          >
            {value}
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
              mt-1
            "
          >
            {description}
          </p>

        </div>

        <div
          className={`
            w-11 h-11
            rounded-xl
            flex
            items-center
            justify-center
            shrink-0
            ${backgroundClass}
            ${iconClass}
          `}
        >

          <Icon
            size={20}
            strokeWidth={2}
          />

        </div>

      </div>

    </div>
  );
};



/**
 * Distinguish reports already viewed from newly available results on each card.
 */
const ReadBadge = ({
  isRead,
}) => {
  if (
    isRead
  ) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-slate-100
          text-slate-600
          px-2.5
          py-1.5
        "
      >

        <CheckCircle2
          size={11}
        />

        <span
          className="
            text-[9px]
            font-bold
          "
        >
          Viewed
        </span>

      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-emerald-50
        text-emerald-700
        px-2.5
        py-1.5
      "
    >

      <span
        className="
          w-1.5 h-1.5
          rounded-full
          bg-emerald-600
        "
      />

      <span
        className="
          text-[9px]
          font-bold
        "
      >
        New Result
      </span>

    </span>
  );
};



/**
 * Show the test details, status and report-view action for a single laboratory result.
 */
const LabReportCard = ({
  report,
  onOpen,
}) => {
  const fileMeta =
    getFileMeta(
      report.report_url
    );

  const FileIcon =
    fileMeta.icon;

  return (
    <article
      className="
        rounded-2xl
        bg-card
        border
        border-border/70
        overflow-hidden
        shadow-[0_8px_28px_rgba(15,23,42,0.045)]
        hover:shadow-[0_14px_38px_rgba(15,23,42,0.08)]
        transition-shadow
      "
    >



      {fileMeta.type ===
      'image' ? (

        /* Open Lab Report Image Button */
        <button
          type="button"
          onClick={() =>
            onOpen(
              report
            )
          }
          className="
            group
            relative
            block
            w-full
            h-56
            overflow-hidden
            bg-secondary
          "
        >

          <img
            src={
              report.report_url
            }
            alt={`${
              report.test_type ||
              'Laboratory'
            } report`}
            className="
              w-full
              h-full
              object-cover
              object-top
              group-hover:scale-[1.015]
              transition-transform
              duration-300
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-slate-950/35
              via-transparent
              to-transparent
            "
          />

          <div
            className="
              absolute
              right-4
              bottom-4
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-[#12344D]/90
              text-white
              px-3
              py-2
              backdrop-blur-sm
            "
          >

            <Eye
              size={14}
            />

            <span
              className="
                text-[10px]
                font-bold
              "
            >
              Preview image
            </span>

          </div>

        </button>

      ) : (

        <div
          className="
            h-24
            relative
            overflow-hidden
            bg-[#12344D]
          "
        >

          <div
            className="
              absolute
              -right-10
              -top-16
              w-40 h-40
              rounded-full
              bg-primary/25
            "
          />

          <div
            className="
              absolute
              left-5
              top-5
              w-12 h-12
              rounded-2xl
              bg-white/10
              text-white
              flex
              items-center
              justify-center
            "
          >

            <FileIcon
              size={22}
            />

          </div>

        </div>

      )}



      <div className="p-5">

        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >

          <div className="min-w-0">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              <span
                className={`
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  py-1.5
                  ${fileMeta.textClass}
                  ${fileMeta.backgroundClass}
                  ${fileMeta.borderClass}
                `}
              >

                <FileIcon
                  size={11}
                />

                <span
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wide
                  "
                >
                  {fileMeta.label}
                </span>

              </span>

              <ReadBadge
                isRead={
                  report.is_read
                }
              />

            </div>

            <h3
              className="
                text-lg
                font-bold
                text-foreground
                leading-tight
                mt-3
              "
            >
              {report.test_type ||
                'Laboratory Report'}
            </h3>

          </div>

        </div>



        <div
          className="
            rounded-xl
            bg-secondary/40
            p-4
            mt-4
            space-y-3
          "
        >

          {report.lab_name && (

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <Building2
                size={15}
                className="
                  text-primary
                  shrink-0
                  mt-0.5
                "
              />

              <div className="min-w-0">

                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.12em]
                    font-bold
                    text-muted-foreground
                  "
                >
                  Laboratory
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-foreground
                    mt-0.5
                  "
                >
                  {report.lab_name}
                </p>

              </div>

            </div>

          )}

          {report.doctor_name && (

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <Stethoscope
                size={15}
                className="
                  text-primary
                  shrink-0
                  mt-0.5
                "
              />

              <div className="min-w-0">

                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-[0.12em]
                    font-bold
                    text-muted-foreground
                  "
                >
                  Requested By
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-foreground
                    mt-0.5
                  "
                >
                  Dr. {
                    report.doctor_name
                  }
                </p>

              </div>

            </div>

          )}

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            <CalendarDays
              size={15}
              className="
                text-primary
                shrink-0
                mt-0.5
              "
            />

            <div>

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-muted-foreground
                "
              >
                Report Date
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-foreground
                  mt-0.5
                "
              >
                {formatDate(
                  report.created_at
                )}
              </p>

            </div>

          </div>

        </div>



        {/* Open Lab Report Button */}
        <button
          type="button"
          disabled={
            !report.report_url
          }
          onClick={() =>
            onOpen(
              report
            )
          }
          className="
            group
            w-full
            flex
            items-center
            justify-between
            gap-3
            rounded-xl
            bg-[#12344D]
            text-white
            px-4
            py-3.5
            mt-4
            hover:bg-[#173F5C]
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-colors
          "
        >

          <div
            className="
              flex
              items-center
              gap-2.5
            "
          >

            {fileMeta.type ===
            'image' ? (

              <ImageIcon
                size={16}
              />

            ) : (

              <FileText
                size={16}
              />

            )}

            <span
              className="
                text-xs
                font-bold
              "
            >
              {!report.report_url
                ? 'Report Unavailable'
                : fileMeta.type ===
                  'image'
                  ? 'View Report Image'
                  : fileMeta.type ===
                    'pdf'
                    ? 'Open PDF Report'
                    : 'Open Report'}
            </span>

          </div>

          <ChevronRight
            size={17}
            className="
              text-white/75
              group-hover:text-white
            "
          />

        </button>

      </div>

    </article>
  );
};



/**
 * Preview a report image in a modal and allow the user to close it without changing the report.
 */
const ImageReportViewer = ({
  report,
  onClose,
}) => {
  if (!report) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        bg-slate-950/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-3
        sm:p-6
      "
      role="dialog"
      aria-modal="true"
    >

      <div
        className="
          w-full
          max-w-5xl
          max-h-[96vh]
          overflow-hidden
          rounded-[1.75rem]
          bg-card
          border
          border-border
          shadow-2xl
          flex
          flex-col
        "
      >



        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            px-5
            py-4
            border-b
            border-border
            bg-card
            shrink-0
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              min-w-0
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-violet-50
                text-violet-700
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <ImageIcon
                size={19}
              />

            </div>

            <div className="min-w-0">

              <p
                className="
                  text-[9px]
                  uppercase
                  tracking-[0.14em]
                  font-bold
                  text-violet-700
                "
              >
                Lab Report
              </p>

              <h3
                className="
                  text-sm
                  sm:text-base
                  font-bold
                  text-foreground
                  mt-0.5
                  truncate
                "
              >
                {report.test_type ||
                  'Diagnostic Report'}
              </h3>

            </div>

          </div>

          {/* Close Report Preview Button */}
          <button
            type="button"
            onClick={
              onClose
            }
            className="
              w-10 h-10
              rounded-xl
              bg-secondary
              text-muted-foreground
              hover:text-foreground
              flex
              items-center
              justify-center
              shrink-0
              transition-colors
            "
            aria-label="Close report preview"
          >

            <X
              size={18}
            />

          </button>

        </div>



        <div
          className="
            flex-1
            overflow-auto
            bg-slate-100
            p-3
            sm:p-5
          "
        >

          <div
            className="
              max-w-3xl
              mx-auto
              bg-white
              rounded-xl
              overflow-hidden
              shadow-lg
            "
          >

            <img
              src={
                report.report_url
              }
              alt={`${
                report.test_type ||
                'Laboratory'
              } report`}
              className="
                block
                w-full
                h-auto
              "
            />

          </div>

        </div>



        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            px-5
            py-4
            border-t
            border-border
            bg-card
            shrink-0
          "
        >

          <div
            className="
              text-xs
              text-muted-foreground
            "
          >
            {formatDate(
              report.created_at
            )}

            {report.lab_name
              ? ` · ${report.lab_name}`
              : ''}
          </div>

          {/* Open Original Report Link */}
          <a
            href={
              report.report_url
            }
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-module-soft
              text-primary
              px-4
              py-2.5
              text-xs
              font-bold
              hover:bg-primary
              hover:text-white
              transition-colors
            "
          >

            <FileImage
              size={15}
            />

            Open Original

          </a>

        </div>

      </div>

    </div>
  );
};



/**
 * FEATURE: Laboratory reports
 * LOGIC: Load the patient reports and separate unread completed results.
 */
const LabReportsPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  // Prefer the patient profile ID from the session; the user ID is only a fallback here.
  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const queryClient =
    useQueryClient();

  const [
    imageReport,
    setImageReport,
  ] = useState(
    null
  );

  // Read reports only when a patient identity is available; ownership is enforced by the API.
  const {
    data:
      reports = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'labReports',
      patientId,
    ],

    queryFn: () =>
      getLabReports(
        patientId
      ),

    enabled:
      !!patientId,
  });



  /**
   * FEATURE: Mark report as read
   * LOGIC: Skip already-read reports; after a successful write refresh the shared report query and navbar badge.
   * Failure is logged without closing the report or changing its cached unread flag.
   */
  // Marking a report as read is a separate API call; opening a document does not itself update the database.
  const markAsRead =
    async (
      report
    ) => {
      if (
        report.is_read ||
        !patientId
      ) {
        return;
      }

      try {

        await markLabReportAsRead(
          patientId,
          report.id
        );

        await queryClient
          .invalidateQueries({
            queryKey: [
              'labReports',
              patientId,
            ],
          });

      } catch (
        err
      ) {

        console.error(
          'Failed to mark report as read:',
          err
        );
      }
    };



  /**
   * FEATURE: View Lab Report
   * LOGIC: Ignore missing URLs; detect images by extension after removing URL query/fragment text.
   * Show images here, or attempt a new tab for other files, then request the read update.
   * A blocked popup is not detected, so a read request can still follow an unsuccessful tab opening.
   */
  const handleViewReport =
    async (
      report
    ) => {
      if (
        !report.report_url
      ) {
        return;
      }

      /**
       * Image reports stay inside Care4U.
       */
      if (
        isImageReport(
          report.report_url
        )
      ) {
        setImageReport(
          report
        );

        await markAsRead(
          report
        );

        return;
      }

      /**
       * PDF and other documents open in another browser tab.
       */
      window.open(
        report.report_url,
        '_blank',
        'noopener,noreferrer'
      );

      await markAsRead(
        report
      );
    };



  /**
   * Show newest reports first using a copied array so cached results remain unchanged.
   */
  const sortedReports =
    useMemo(
      () =>
        [
          ...reports,
        ].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.created_at
            ) -
            new Date(
              first.created_at
            )
        ),
      [
        reports,
      ]
    );

  /**
   * Count only completed, unread results for the New Results summary.
   */
  const unreadCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            report.status ===
              'completed' &&
            !report.is_read
        ).length,
      [
        reports,
      ]
    );

  /**
   * Count URLs recognized as image types for the summary card.
   */
  const imageCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            isImageReport(
              report.report_url
            )
        ).length,
      [
        reports,
      ]
    );

  /**
   * Count URLs recognized as PDF documents for the summary card.
   */
  const pdfCount =
    useMemo(
      () =>
        reports.filter(
          report =>
            isPdfReport(
              report.report_url
            )
        ).length,
      [
        reports,
      ]
    );



  if (
    isLoading
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          flex-col
          items-center
          justify-center
          gap-3
        "
      >

        <div
          className="
            w-14 h-14
            rounded-2xl
            bg-module-soft
            text-primary
            flex
            items-center
            justify-center
            mb-1
          "
        >

          <FlaskConical
            size={25}
          />

        </div>

        <Spinner
          size="lg"
        />

        <p
          className="
            text-sm
            font-semibold
            text-foreground
            mt-1
          "
        >
          Loading lab reports
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Preparing your latest diagnostic results
        </p>

      </div>
    );
  }



  if (
    isError
  ) {
    return (
      <div
        className="
          min-h-[55vh]
          flex
          items-center
          justify-center
          px-4
        "
      >

        <div className="w-full max-w-md">

          <Alert
            type="error"
            message={
              error?.message ||
              'Failed to load lab reports.'
            }
          />

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-7">



      {imageReport && (

        /* Lab Report Image Preview Dialog */ <ImageReportViewer
          report={
            imageReport
          }
          onClose={() =>
            setImageReport(
              null
            )
          }
        />

      )}



      {/* Laboratory Reports Heading */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          FlaskConical
        }
        title="Laboratory Reports"
        description="Review diagnostic reports uploaded by Care4U laboratories as images or PDF documents."
        meta={
          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                w-10 h-10
                rounded-xl
                bg-module-soft
                text-primary
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              {unreadCount >
              0 ? (

                <FileText
                  size={19}
                />

              ) : (

                <CheckCircle2
                  size={19}
                />

              )}

            </div>

            <div>

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.12em]
                  font-bold
                  text-primary
                "
              >
                Report Status
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-foreground
                  mt-0.5
                "
              >
                {reports.length ===
                0
                  ? 'No reports available'
                  : `${reports.length} report${
                      reports.length ===
                      1
                        ? ''
                        : 's'
                    } available`}
              </p>

              {unreadCount >
                0 && (

                <p
                  className="
                    text-[11px]
                    font-semibold
                    text-primary
                    mt-0.5
                  "
                >
                  {unreadCount}{' '}
                  new result
                  {unreadCount ===
                  1
                    ? ''
                    : 's'}{' '}
                  ready
                </p>

              )}

            </div>

          </div>
        }
      />



      <section
        className="
          grid
          grid-cols-1
          sm:grid-cols-3
          gap-4
        "
      >

        <SummaryCard
          icon={
            FlaskConical
          }
          label="Reports"
          value={
            reports.length
          }
          description="Completed results"
          iconClass="text-primary"
          backgroundClass="bg-module-soft"
        />

        <SummaryCard
          icon={
            AlertCircle
          }
          label="New Results"
          value={
            unreadCount
          }
          description={
            unreadCount ===
            0
              ? 'All reports viewed'
              : 'Waiting to be viewed'
          }
          iconClass={
            unreadCount >
            0
              ? 'text-amber-700'
              : 'text-emerald-700'
          }
          backgroundClass={
            unreadCount >
            0
              ? 'bg-amber-50'
              : 'bg-emerald-50'
          }
        />

        <SummaryCard
          icon={
            FileImage
          }
          label="Documents"
          value={
            imageCount +
            pdfCount
          }
          description={`${imageCount} image${
            imageCount === 1
              ? ''
              : 's'
          } · ${pdfCount} PDF${
            pdfCount === 1
              ? ''
              : 's'
          }`}
          iconClass="text-blue-700"
          backgroundClass="bg-blue-50"
        />

      </section>



      <section
        className="
          rounded-2xl
          bg-card
          border
          border-border/70
          shadow-[0_8px_26px_rgba(15,23,42,0.04)]
          overflow-hidden
        "
      >

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            px-5
            sm:px-6
            py-5
            border-b
            border-border
          "
        >

          <div>

            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.15em]
                font-bold
                text-primary
              "
            >
              Diagnostic Results
            </p>

            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                text-foreground
                mt-1
              "
            >
              Laboratory history
            </h2>

            <p
              className="
                text-xs
                sm:text-sm
                text-muted-foreground
                mt-1
              "
            >
              {sortedReports.length}{' '}
              {sortedReports.length ===
              1
                ? 'report'
                : 'reports'}{' '}
              available
            </p>

          </div>

          {unreadCount >
            0 && (

            <div
              className="
                inline-flex
                items-center
                gap-2
                self-start
                sm:self-auto
                rounded-full
                bg-amber-50
                text-amber-700
                px-3
                py-2
              "
            >

              <span
                className="
                  w-2 h-2
                  rounded-full
                  bg-amber-600
                "
              />

              <span
                className="
                  text-xs
                  font-bold
                "
              >
                {unreadCount}{' '}
                new
              </span>

            </div>

          )}

        </div>

        <div
          className="
            p-5
            sm:p-6
            bg-secondary/10
          "
        >

          {sortedReports.length ===
          0 ? (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                text-center
                py-14
                px-4
              "
            >

              <div
                className="
                  w-16 h-16
                  rounded-2xl
                  bg-module-soft
                  text-primary
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >

                <FlaskConical
                  size={28}
                  strokeWidth={1.8}
                />

              </div>

              <h3
                className="
                  text-lg
                  font-bold
                  text-foreground
                "
              >
                No laboratory reports yet
              </h3>

              <p
                className="
                  text-sm
                  text-muted-foreground
                  mt-2
                  max-w-md
                  leading-relaxed
                "
              >
                When a doctor requests a laboratory test and the laboratory completes it, the uploaded report will appear here.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                xl:grid-cols-2
                gap-5
                items-start
              "
            >

              {sortedReports.map(
                report => (

                  <LabReportCard
                    key={
                      report.id
                    }
                    report={
                      report
                    }
                    onOpen={
                      handleViewReport
                    }
                  />

                )
              )}

            </div>

          )}

        </div>

      </section>



      <div
        className="
          flex
          items-center
          justify-center
          gap-2
          text-xs
          text-muted-foreground
          px-4
        "
      >

        <ShieldCheck
          size={15}
        />

        <span>
          Diagnostic reports are available only through your authenticated Care4U patient account.
        </span>

      </div>

    </div>
  );
};

export default LabReportsPage;
