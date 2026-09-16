/**
 * @file    HospitalHomePage.jsx
 * @module  Hospital
 * @desc    Main landing page for authenticated hospital staff.
 *          Provides access to OPD and Emergency operations while
 *          following the shared Care4U visual design system.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import PageHeader from '../../components/common/PageHeader';

/**
 * @component PortalActionCard
 * @desc      Reusable action card for navigating to a hospital workflow.
 * @param {Object}   props             - Component properties
 * @param {Object}   props.icon        - Lucide icon component
 * @param {string}   props.eyebrow     - Small section label
 * @param {string}   props.title       - Action title
 * @param {string}   props.description - Action description
 * @param {string}   props.buttonLabel - Navigation action label
 * @param {Function} props.onClick     - Navigation callback
 */
const PortalActionCard = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  buttonLabel,
  onClick,
  emergency = false,
  highlights = [],
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${
        emergency
          ? 'border-rose-200/70 hover:border-rose-300'
          : 'border-cyan-200/70 hover:border-cyan-300'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${
          emergency
            ? 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-400'
            : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600'
        }`}
      />

      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${
              emergency
                ? 'bg-rose-50 text-rose-600'
                : 'bg-cyan-50 text-cyan-700'
            }`}
          >
            <Icon size={24} />
          </div>

          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
              emergency
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-cyan-200 bg-cyan-50 text-cyan-800'
            }`}
          >
            {emergency ? 'Live response' : 'Daily operations'}
          </span>
        </div>

        <div className="mt-5">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
              emergency
                ? 'text-rose-600'
                : 'text-cyan-700'
            }`}
          >
            {eyebrow}
          </p>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1">
            {title}
          </h2>

          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
            {description}
          </p>
        </div>

        {highlights.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/25 px-3 py-2.5"
              >
                <CheckCircle2
                  size={14}
                  className={
                    emergency
                      ? 'text-rose-500'
                      : 'text-cyan-700'
                  }
                />

                <span className="text-xs font-semibold text-foreground">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          className={`mt-6 w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            emergency
              ? 'bg-[#12344D] text-white hover:bg-[#0D2A3E] focus:ring-[#12344D]/30'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500/30'
          }`}
        >
          <span>{buttonLabel}</span>

          <ArrowRight
            size={17}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </article>
  );
};

/**
 * @component HospitalHomePage
 * @desc      Displays the hospital portal landing screen with quick
 *            access to OPD and Emergency operations.
 */
const HospitalHomePage = () => {
  const navigate = useNavigate();

  const user = useAuthStore(
    (state) => state.user
  );

  const staffName =
    user?.full_name ||
    user?.name ||
    'Hospital Staff';

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F6F8FA]">

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 sm:pt-8">

        <PageHeader
          eyebrow="Hospital Operations"
          title={`Welcome, ${staffName}`}
          description="Manage day-to-day OPD activity and respond to active emergency alerts from one Care4U hospital workspace."
          icon={Building2}
          meta={
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
                <ShieldAlert size={18} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-cyan-700">
                  Access Level
                </p>

                <p className="text-sm font-bold text-foreground mt-0.5">
                  Hospital Staff
                </p>
              </div>

            </div>
          }
        />

      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-7 sm:py-8 pb-12">

        {/* =====================================================
            MAIN HOSPITAL WORKFLOWS
        ====================================================== */}
        <section className="mb-7">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">
                Main Workflows
              </p>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1">
                Hospital Operations
              </h2>

              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Choose the workflow that matches the patient&apos;s current care needs.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm">
              <Clock3 size={14} className="text-cyan-700" />
              Shared authenticated workspace
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <PortalActionCard
              icon={Users}
              eyebrow="Outpatient Care"
              title="OPD Queue"
              description="Manage today&apos;s hospital-wide outpatient workflow, reception check-in, assisted patient registration, and walk-in doctor assignment."
              buttonLabel="Open OPD Queue"
              highlights={[
                'Patient check-in',
                'Walk-in registration',
                'Doctor assignment',
                'Live queue visibility',
              ]}
              onClick={() => navigate('/hospital/opd')}
            />

            <PortalActionCard
              icon={Activity}
              eyebrow="Emergency Response"
              title="Emergency Operations"
              description="Monitor active SOS alerts, review emergency locations, use audited Break-Glass access, and resolve handled emergencies."
              buttonLabel="Open Emergency Operations"
              emergency
              highlights={[
                'Live SOS feed',
                'Emergency location',
                'Break-Glass access',
                'Resolution tracking',
              ]}
              onClick={() => navigate('/hospital/emergency')}
            />

          </div>
        </section>

        {/* =====================================================
            WORKSPACE NOTE
        ====================================================== */}
        <section>

          <div className="rounded-2xl border border-cyan-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">

            <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 sm:p-6">

              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <Stethoscope size={21} />
              </div>

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-cyan-700">
                  Care4U Hospital Portal
                </p>

                <h3 className="text-base sm:text-lg font-bold text-foreground mt-1">
                  Central Hospital Workspace
                </h3>

                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
                  OPD and emergency workflows use the same hospital login while keeping their operational responsibilities clearly separated. Consultation decisions remain with doctors, while hospital staff manage arrival, routing, and emergency coordination.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                Connected workflow
              </div>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
};

export default HospitalHomePage;
