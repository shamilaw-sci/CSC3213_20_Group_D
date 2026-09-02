/**
 * @component PaymentHistoryPage
 * @desc      Shows patient payment history with status badges
 *            and a simple receipt view per transaction.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const StatusBadge = ({ status }) => {
  const colors = {
    success: 'bg-green-100 text-green-700',
    pending: 'bg-orange-100 text-orange-700',
    failed:  'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

const ReceiptModal = ({ payment, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🧾</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Payment Receipt</h2>
        <p className="text-xs text-orange-500 font-semibold mt-1">
          ⚠️ SANDBOX MODE — No real money charged
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-xs text-slate-700">{payment.id.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Type</span>
          <span className="font-semibold text-slate-800 capitalize">{payment.payment_type.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Amount</span>
          <span className="font-bold text-slate-800">LKR {parseFloat(payment.amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Method</span>
          <span className="font-semibold text-slate-800 capitalize">{payment.payment_method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status</span>
          <StatusBadge status={payment.status} />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="text-slate-700">{formatDate(payment.created_at)}</span>
        </div>
        {payment.description && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-slate-500 text-xs mb-1">Description</p>
            <p className="text-slate-700">{payment.description}</p>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: '#1E3A5F' }}
      >
        Close
      </button>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-500">Loading payment history...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-red-500">Failed to load payment history.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {selectedPayment && (
        <ReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      {/* Header */}
      <div className="px-8 py-6" style={{ backgroundColor: '#1E3A5F' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
            Patient Portal
          </p>
          <h1 className="text-2xl font-bold text-white">Payment History</h1>
          <p className="text-sm mt-1 text-slate-300">
            View all your transactions and download receipts
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-orange-500 rounded-full">
            <p className="text-xs font-semibold text-white">⚠️ Sandbox Mode — No real payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!data || data.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-slate-500 text-sm">No payment history yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setSelectedPayment(payment)}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 capitalize">
                      {payment.payment_type.replace('_', ' ')}
                    </p>
                    {payment.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{payment.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{formatDate(payment.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">
                      LKR {parseFloat(payment.amount).toFixed(2)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-3 hover:underline">
                  View Receipt →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;