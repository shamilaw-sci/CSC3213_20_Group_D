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
}) => {
  return (
    <div className="group bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon size={23} />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>

            <h2 className="text-xl font-bold text-foreground mt-1">
              {title}
            </h2>

            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="w-full mt-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <span className="text-sm font-semibold">
            {buttonLabel}
          </span>

          <ArrowRight
            size={17}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
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
  <div className="min-h-[calc(100vh-5rem)] bg-muted/30">

    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">

      <PageHeader
        eyebrow="Hospital Operations"
        title={`Welcome, ${staffName}`}
        description="Manage day-to-day OPD activity and respond to active emergency alerts from one Care4U hospital workspace."
        icon={Building2}
        meta={
          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                Access Level
              </p>

              <p className="text-sm font-bold text-foreground">
                Hospital Staff
              </p>
            </div>

          </div>
        }
      />

    </div>

    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        <section className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope size={20} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Main Workflows
              </p>

              <h2 className="text-xl font-bold text-foreground">
                Hospital Operations
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <PortalActionCard
              icon={Users}
              eyebrow="Outpatient Care"
              title="OPD Queue"
              description="View and manage the hospital's outpatient workflow from the shared OPD queue."
              buttonLabel="Open OPD Queue"
              onClick={() => navigate('/hospital/opd')}
            />

            <PortalActionCard
              icon={Activity}
              eyebrow="Emergency Response"
              title="Emergency Operations"
              description="Monitor active SOS alerts, review emergency locations, use audited Break-Glass access, and resolve handled emergencies."
              buttonLabel="Open Emergency Operations"
              onClick={() => navigate('/hospital/emergency')}
            />

          </div>
        </section>

        <section>
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0">
                <Clock3 size={20} />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  Central Hospital Workspace
                </h3>

                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  OPD and emergency workflows are available through the same authenticated hospital account, keeping hospital operations inside one consistent Care4U portal.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HospitalHomePage;