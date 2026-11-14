/**
 * @file    OrderTrackerPage.jsx
 * @module  Patient / Pharmacy
 * @desc    Displays medicine-order status, delivery details and progress timelines.
 * @author  Pamudika Abayarathna (S/21/001)
 */

import {
  useQuery,
} from '@tanstack/react-query';

import {
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Truck,
} from 'lucide-react';

import api from '../../services/api';

import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const STATUS_STEPS = [
  'placed',
  'accepted',
  'packed',
  'out_for_delivery',
  'delivered',
];

const STATUS_MAP = {
  placed: {
    status: 'normal',
    label: 'Order Placed',
  },

  accepted: {
    status: 'active',
    label: 'Accepted by Pharmacy',
  },

  packed: {
    status: 'active',
    label: 'Packed & Ready',
  },

  out_for_delivery: {
    status: 'pending',
    label: 'Out for Delivery',
  },

  delivered: {
    status: 'completed',
    label: 'Delivered',
  },

  cancelled: {
    status: 'cancelled',
    label: 'Cancelled',
  },
};

const STEP_LABELS = {
  placed: 'Placed',
  accepted: 'Accepted',
  packed: 'Packed',
  out_for_delivery: 'Delivery',
  delivered: 'Delivered',
};

const formatDate = (
  iso
) => {
  if (!iso) {
    return '—';
  }

  return new Date(
    iso
  ).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

/**
 * FEATURE: Medicine delivery progress
 * LOGIC: Compare the server status with the fixed placed-to-delivered sequence.
 * Mark earlier steps complete; cancelled orders show a cancellation message instead.
 * Unknown statuses do not mark a step reached. This page only displays order state.
 */
const StatusTimeline = ({
  currentStatus,
}) => {
  if (
    currentStatus ===
    'cancelled'
  ) {
    return (
      <div className="mt-5">

        <Alert
          type="error"
          message="This medicine order was cancelled."
        />

      </div>
    );
  }

  const currentIndex =
    STATUS_STEPS.indexOf(
      currentStatus
    );

  return (
    <div className="mt-6">

      {/* Desktop timeline */}
      <div className="hidden sm:block">

        <div className="flex items-start">

          {STATUS_STEPS.map(
            (
              step,
              index
            ) => {

              const isCompleted =
                index <
                currentIndex;

              const isCurrent =
                index ===
                currentIndex;

              const isReached =
                index <=
                currentIndex;

              return (
                <div
                  key={
                    step
                  }
                  className="flex-1 relative"
                >

                  <div className="flex items-center">

                    <div
                      className={`
                        w-8 h-8
                        rounded-full
                        flex items-center justify-center
                        text-xs font-bold
                        shrink-0
                        transition-colors
                        ${
                          isReached
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        }
                      `}
                    >

                      {isCompleted ? (
                        <Check
                          size={15}
                          strokeWidth={
                            3
                          }
                        />
                      ) : (
                        index + 1
                      )}

                    </div>

                    {index <
                      STATUS_STEPS.length -
                        1 && (

                      <div
                        className={`
                          flex-1
                          h-1
                          mx-2
                          rounded-full
                          ${
                            index <
                            currentIndex
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }
                        `}
                      />

                    )}

                  </div>

                  <p
                    className={`
                      mt-2
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }
                    `}
                  >
                    {
                      STEP_LABELS[
                        step
                      ]
                    }
                  </p>

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* Mobile timeline */}
      <div className="sm:hidden space-y-0">

        {STATUS_STEPS.map(
          (
            step,
            index
          ) => {

            const isCompleted =
              index <
              currentIndex;

            const isCurrent =
              index ===
              currentIndex;

            const isReached =
              index <=
                currentIndex;

            return (
              <div
                key={
                  step
                }
                className="flex items-stretch gap-3"
              >

                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-8 h-8
                      rounded-full
                      flex items-center justify-center
                      text-xs font-bold
                      shrink-0
                      ${
                        isReached
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }
                    `}
                  >

                    {isCompleted ? (
                      <Check
                        size={15}
                        strokeWidth={
                          3
                        }
                      />
                    ) : (
                      index + 1
                    )}

                  </div>

                  {index <
                    STATUS_STEPS.length -
                      1 && (

                    <div
                      className={`
                        w-1
                        flex-1
                        min-h-7
                        my-1
                        rounded-full
                        ${
                          index <
                          currentIndex
                            ? 'bg-primary'
                            : 'bg-secondary'
                        }
                      `}
                    />

                  )}

                </div>

                <div className="pb-5 pt-1">

                  <p
                    className={`
                      text-sm
                      font-semibold
                      ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }
                    `}
                  >
                    {
                      STEP_LABELS[
                        step
                      ]
                    }
                  </p>

                  {isCurrent && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Current status
                    </p>
                  )}

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
};

/**
 * FEATURE: Track medicine orders
 * LOGIC: Load orders for the session patient and count all except delivered/cancelled as active.
 * Loading, request failure and an empty order history have separate displays; no status is changed here.
 */
const OrderTrackerPage = () => {
  const user =
    useAuthStore(
      state =>
        state.user
    );

  const patientId =
    user?.profile_id ||
    user?.id ||
    '';

  const {
    data:
      orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'patient-orders',
      patientId,
    ],

    queryFn:
      async () => {
        const res =
          await api.get(
            `/api/orders/patient/${patientId}`
          );

        return (
          res.data.data ||
          []
        );
      },

    enabled:
      !!patientId,
  });

  if (
    isLoading
  ) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">

        <Spinner
          size="lg"
        />

        <p className="text-sm text-muted-foreground">
          Loading medicine orders...
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
            message="Failed to load orders. Please try again later."
          />

        </div>

      </div>
    );
  }

  const activeOrders =
    orders.filter(
      order =>
        ![
          'delivered',
          'cancelled',
        ].includes(
          order.status
        )
    ).length;

  return (
    <div className="space-y-7">

      {/* PAGE HERO */}
      {/* Medicine Orders Heading */}
      <PageHeader
        eyebrow="Patient Portal"
        icon={
          Package
        }
        title="Medicine Orders"
        description="Track pharmacy preparation and delivery progress for your medicine orders."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-module-soft text-primary flex items-center justify-center shrink-0">

              {activeOrders >
              0 ? (

                <Truck
                  size={19}
                />

              ) : (

                <CheckCircle2
                  size={19}
                />

              )}

            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                Order Status
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                {orders.length ===
                0
                  ? 'No orders yet'
                  : `${orders.length} order${
                      orders.length ===
                      1
                        ? ''
                        : 's'
                    }`}
              </p>

              {activeOrders >
                0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {activeOrders}{' '}
                  currently active
                </p>
              )}

            </div>

          </div>
        }
      />

      {/* ORDER HISTORY */}
      {/* Medicine Order History Card */}
      <Card
        title="Order History"
      >

        {orders.length ===
        0 ? (

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-16 h-16 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <Package
                className="w-7 h-7"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-lg font-bold text-foreground">
              No medicine orders yet
            </h3>

            <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Medicine delivery orders placed through Care4U will appear here so you can follow their progress.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {orders.map(
              order => {

                const isCancelled =
                  order.status ===
                  'cancelled';

                const isDelivered =
                  order.status ===
                  'delivered';

                return (
                  <article
                    key={
                      order.id
                    }
                    className={`
                      rounded-2xl
                      p-4 sm:p-5
                      transition-colors
                      ${
                        isCancelled
                          ? 'bg-secondary/30 opacity-70'
                          : isDelivered
                            ? 'bg-success/5'
                            : 'bg-secondary/40'
                      }
                    `}
                  >

                    {/* Order summary */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                      <div className="flex items-start gap-4 min-w-0">

                        <div
                          className={`
                            w-12 h-12
                            rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${
                              isCancelled
                                ? 'bg-card text-muted-foreground'
                                : isDelivered
                                  ? 'bg-success/10 text-success'
                                  : 'bg-module-soft text-primary'
                            }
                          `}
                        >

                          {isDelivered ? (
                            <CheckCircle2
                              size={22}
                            />
                          ) : (
                            <Package
                              size={22}
                            />
                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3
                              className={`
                                text-base
                                sm:text-lg
                                font-bold
                                leading-snug
                                ${
                                  isCancelled
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                }
                              `}
                            >
                              {order.pharmacy_name ||
                                'Pharmacy Order'}
                            </h3>

                            <Badge
                              status={
                                STATUS_MAP[
                                  order.status
                                ]?.status ||
                                'normal'
                              }
                              label={
                                STATUS_MAP[
                                  order.status
                                ]?.label ||
                                order.status
                              }
                            />

                          </div>

                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">

                            <Clock3
                              size={14}
                              className="shrink-0"
                            />

                            <span>
                              Ordered{' '}
                              {
                                formatDate(
                                  order.created_at
                                )
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                      {order.total_amount && (
                        <div className="md:text-right shrink-0">

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                            Order Total
                          </p>

                          <p className="text-lg font-extrabold text-foreground mt-1">
                            LKR{' '}
                            {parseFloat(
                              order.total_amount
                            ).toFixed(
                              2
                            )}
                          </p>

                        </div>
                      )}

                    </div>

                    {/* Delivery address */}
                    {order.delivery_address && (
                      <div className="rounded-xl bg-card/70 p-4 mt-5">

                        <div className="flex items-start gap-3">

                          <MapPin
                            size={17}
                            className="text-primary shrink-0 mt-0.5"
                          />

                          <div>

                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                              Delivery Address
                            </p>

                            <p className="text-sm font-medium text-foreground mt-1 leading-relaxed">
                              {
                                order.delivery_address
                              }
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                    {/* Delivery progress */}
                    <div className="mt-5 pt-5 border-t border-border/60">

                      <div className="flex items-center justify-between gap-3">

                        <div>

                          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">
                            Delivery Progress
                          </p>

                          <p className="text-sm font-semibold text-foreground mt-1">
                            {STATUS_MAP[
                              order.status
                            ]?.label ||
                              order.status}
                          </p>

                        </div>

                        {!isCancelled &&
                          !isDelivered && (
                          <Truck
                            size={19}
                            className="text-primary"
                          />
                        )}

                      </div>

                      {/* Delivery Progress Timeline */}
                      <StatusTimeline
                        currentStatus={
                          order.status
                        }
                      />

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </Card>

    </div>
  );
};

export default OrderTrackerPage;