/**
 * @component PaymentHistoryPage
 * @desc      Shows patient payment history with status badges
 *            and a simple receipt view per transaction.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, AlertTriangle, CreditCard, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const getPaymentBadgeProps = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
      return { status: 'active', label: 'Success' };
    case 'pending':
      return { status: 'pending', label: 'Pending' };
    case 'failed':
      return { status: 'cancelled', label: 'Failed' };
    default:
      return { status: 'normal', label: status };
  }
};

const ReceiptModal = ({ payment, onClose }) => {
  if (!payment) return null;

  return (
    <Modal isOpen={!!payment} onClose={onClose} title="Payment Receipt" size="sm">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-success" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-urgent/10 rounded-full">
          <AlertTriangle size={14} className="text-urgent-foreground" />
          <span className="text-xs text-urgent-foreground font-semibold">
            SANDBOX MODE — No real money charged
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Transaction ID</span>
          <span className="font-mono text-xs text-foreground font-medium">{payment.id.slice(0, 12)}...</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Type</span>
          <span className="font-semibold text-foreground capitalize">{payment.payment_type.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-bold text-foreground text-base">LKR {parseFloat(payment.amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Method</span>
          <span className="font-semibold text-foreground capitalize">{payment.payment_method}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Status</span>
          <Badge {...getPaymentBadgeProps(payment.status)} />
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">Date</span>
          <span className="text-foreground font-medium">{formatDate(payment.created_at)}</span>
        </div>
        {payment.description && (
          <div className="pt-3 mt-1 border-t border-border">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Description</p>
            <p className="text-foreground text-sm">{payment.description}</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button variant="primary" className="w-full" onClick={onClose}>
          Close Receipt
        </Button>
      </div>
    </Modal>
  );
};

const PaymentHistoryPage = () => {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-history', TEST_PATIENT_ID],
    queryFn: async () => {
      const res = await api.get(`/api/payments/patient/${TEST_PATIENT_ID}`);
      return res.data.data;
    },
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading payment history...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert type="error" message="Failed to load payment history. Please try again." />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />

      {/* Header */}
      <div className="px-6 py-8 sm:px-8 bg-brand-deep">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
            Patient Portal
          </p>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">Payment History</h1>
          <p className="text-sm mt-1 text-brand-deep-foreground/80">
            View all your transactions and download receipts
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-urgent rounded-full">
            <AlertTriangle size={14} className="text-urgent-foreground" />
            <p className="text-xs font-bold text-urgent-foreground">Sandbox Mode — No real payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
            <CreditCard className="w-9 h-9 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-muted-foreground">No payment history yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setSelectedPayment(payment)}
                className="group bg-card rounded-xl border border-border shadow-sm p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-bold text-foreground capitalize">
                      {payment.payment_type.replace('_', ' ')}
                    </p>
                    {payment.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{payment.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1.5">{formatDate(payment.created_at)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-lg font-bold text-foreground mb-2">
                      LKR {parseFloat(payment.amount).toFixed(2)}
                    </p>
                    <Badge {...getPaymentBadgeProps(payment.status)} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary group-hover:text-primary/80 transition-colors">
                  View Receipt <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;