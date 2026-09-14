/**
 * @component PaymentHistoryPage
 * @desc      Shows patient payment history with status badges
 *            and a simple receipt view per transaction.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Receipt,
  AlertTriangle,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

import api from '../../services/api';
import useAuthStore from '../../store/authStore';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

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

const getPaymentBadgeProps = (
  status
) => {
  switch (
    status?.toLowerCase()
  ) {
    case 'success':
      return {
        status: 'active',
        label: 'Success',
      };

    case 'pending':
      return {
        status: 'pending',
        label: 'Pending',
      };

    case 'failed':
      return {
        status: 'cancelled',
        label: 'Failed',
      };

    default:
      return {
        status: 'normal',
        label:
          status ||
          'Unknown',
      };
  }
};

const ReceiptModal = ({
  payment,
  onClose,
}) => {
  if (!payment) {
    return null;
  }

  return (
    <Modal
      isOpen={
        !!payment
      }
      onClose={
        onClose
      }
      title="Payment Receipt"
      size="sm"
    >
      <div className="text-center mb-6">

        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-success" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-urgent/10 rounded-full">
          <AlertTriangle
            size={14}
            className="text-urgent-foreground"
          />

          <span className="text-xs text-urgent-foreground font-semibold">
            SANDBOX MODE — No real money charged
          </span>
        </div>

      </div>

      <div className="flex flex-col gap-3 text-sm">

        <div className="flex justify-between items-center gap-4 py-1">
          <span className="text-muted-foreground">
            Transaction ID
          </span>

          <span className="font-mono text-xs text-foreground font-medium text-right">
            {payment.id.slice(
              0,
              12
            )}
            ...
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 py-1">
          <span className="text-muted-foreground">
            Type
          </span>

          <span className="font-semibold text-foreground capitalize text-right">
            {payment.payment_type.replace(
              '_',
              ' '
            )}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 py-1">
          <span className="text-muted-foreground">
            Amount
          </span>

          <span className="font-bold text-foreground text-base text-right">
            LKR{' '}
            {parseFloat(
              payment.amount
            ).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 py-1">
          <span className="text-muted-foreground">
            Method
          </span>

          <span className="font-semibold text-foreground capitalize text-right">
            {payment.payment_method ||
              '—'}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 py-1">
          <span className="text-muted-foreground">
            Status
          </span>

          <Badge
            {...getPaymentBadgeProps(
              payment.status
            )}
          />
        </div>

        <div className="flex justify-between items-start gap-4 py-1">
          <span className="text-muted-foreground">
            Date
          </span>

          <span className="text-foreground font-medium text-right">
            {formatDate(
              payment.created_at
            )}
          </span>
        </div>

        {payment.description && (
          <div className="pt-4 mt-2 border-t border-border">

            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5">
              Description
            </p>

            <p className="text-foreground text-sm leading-relaxed">
              {
                payment.description
              }
            </p>

          </div>
        )}

      </div>

      <div className="mt-7">
        <Button
          variant="primary"
          className="w-full"
          onClick={
            onClose
          }
        >
          Close Receipt
        </Button>
      </div>

    </Modal>
  );
};

const PaymentHistoryPage = () => {
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
    selectedPayment,
    setSelectedPayment,
  ] = useState(
    null
  );

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'payment-history',
      patientId,
    ],

    queryFn:
      async () => {
        const res =
          await api.get(
            `/api/payments/patient/${patientId}`
          );

        return (
          res.data.data ||
          []
        );
      },

    enabled:
      !!patientId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />

        <p className="text-sm text-muted-foreground">
          Loading payment history...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
        <div className="w-full max-w-md">

          <Alert
            type="error"
            message="Failed to load payment history. Please try again."
          />

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      <ReceiptModal
        payment={
          selectedPayment
        }
        onClose={() =>
          setSelectedPayment(
            null
          )
        }
      />

      <PageHeader
        eyebrow="Patient Portal"
        icon={CreditCard}
        title="Payment History"
        description="Review your Care4U sandbox transactions and open individual payment receipts."
        meta={
          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-urgent/10 text-urgent-foreground flex items-center justify-center shrink-0">
              <AlertTriangle
                size={17}
              />
            </div>

            <div>

              <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground">
                Payment Environment
              </p>

              <p className="text-sm font-bold text-foreground mt-0.5">
                Sandbox Mode
              </p>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                No real money is charged
              </p>

            </div>

          </div>
        }
      />

      <Card title="Transactions">

        {!data ||
        data.length ===
          0 ? (

          <div className="flex flex-col items-center justify-center text-center py-12 px-4">

            <div className="w-14 h-14 rounded-2xl bg-module-soft text-primary flex items-center justify-center mb-4">

              <CreditCard
                className="w-6 h-6"
                strokeWidth={
                  1.8
                }
              />

            </div>

            <h3 className="text-base font-bold text-foreground">
              No payment history yet
            </h3>

            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              Completed sandbox payments for appointments, laboratory tests,
              or medicine delivery will appear here.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {data.map(
              (
                payment
              ) => (

                <button
                  type="button"
                  key={
                    payment.id
                  }
                  onClick={() =>
                    setSelectedPayment(
                      payment
                    )
                  }
                  className="
                    group
                    w-full
                    text-left
                    rounded-xl
                    bg-secondary/45
                    hover:bg-module-soft/70
                    transition-colors
                    p-4 sm:p-5
                  "
                >

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-sm sm:text-base font-bold text-foreground capitalize">
                          {payment.payment_type.replace(
                            '_',
                            ' '
                          )}
                        </h3>

                        <Badge
                          {...getPaymentBadgeProps(
                            payment.status
                          )}
                        />

                      </div>

                      {payment.description && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {
                            payment.description
                          }
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(
                          payment.created_at
                        )}
                      </p>

                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">

                      <p className="text-lg font-extrabold text-foreground">
                        LKR{' '}
                        {parseFloat(
                          payment.amount
                        ).toFixed(
                          2
                        )}
                      </p>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                        View Receipt

                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </span>

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </Card>

    </div>
  );
};

export default PaymentHistoryPage;