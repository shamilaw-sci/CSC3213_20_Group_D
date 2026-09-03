/**
 * @component OrderTrackerPage
 * @desc      Patient-facing order tracking page showing
 *            medicine delivery status with a visual timeline.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const STATUS_STEPS = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered'];

const STATUS_LABELS = {
  placed:           '📦 Order Placed',
  accepted:         '✅ Accepted by Pharmacy',
  packed:           '🛍️ Packed & Ready',
  out_for_delivery: '🚗 Out for Delivery',
  delivered:        '🏠 Delivered',
  cancelled:        '❌ Cancelled',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const StatusTimeline = ({ currentStatus }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="p-3 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600 font-semibold">❌ This order was cancelled</p>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            index <= currentIndex ? 'text-white' : 'text-slate-300 border-2 border-slate-200'
          }`}
          style={{ backgroundColor: index <= currentIndex ? '#006B6B' : 'transparent' }}>
            {index < currentIndex ? '✓' : index + 1}
          </div>
          {index < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-1 mx-1 rounded ${
              index < currentIndex ? 'bg-teal-600' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};
// --- NEW CODE ---
const OrderTrackerPage = () => {
  const user = useAuthStore((state) => state.user);
  const TEST_PATIENT_ID = user?.profile_id || user?.id || '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-orders', TEST_PATIENT_ID],

    queryFn: async () => {
      const res = await api.get(`/api/orders/patient/${TEST_PATIENT_ID}`);
      return res.data.data;
    },
  });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-slate-500">Loading orders...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-sm text-red-500">Failed to load orders.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-8 py-6" style={{ backgroundColor: '#1E3A5F' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-300">
            Patient Portal
          </p>
          <h1 className="text-2xl font-bold text-white">Medicine Orders</h1>
          <p className="text-sm mt-1 text-slate-300">Track your medicine delivery status</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!data || data.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-slate-500 text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {order.pharmacy_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ordered: {formatDate(order.created_at)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {order.delivery_address}
                    </p>
                  </div>
                  <div className="text-right">
                    {order.total_amount && (
                      <p className="text-sm font-bold text-slate-800">
                        LKR {parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs font-semibold mt-1"
                      style={{ color: order.status === 'delivered' ? '#1F7A1F' : order.status === 'cancelled' ? '#C00000' : '#E67E22' }}>
                      {STATUS_LABELS[order.status]}
                    </p>
                  </div>
                </div>
                <StatusTimeline currentStatus={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackerPage;