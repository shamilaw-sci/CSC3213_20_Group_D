/**
 * @component OrderTrackerPage
 * @desc      Patient-facing order tracking page showing
 *            medicine delivery status with a visual timeline.
 * @author    Pamudika Abayarathna (S/21/001)
 */

import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, MapPin } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const STATUS_STEPS = ['placed', 'accepted', 'packed', 'out_for_delivery', 'delivered'];

const STATUS_MAP = {
  placed: { status: 'normal', label: 'Order Placed' },
  accepted: { status: 'active', label: 'Accepted by Pharmacy' },
  packed: { status: 'active', label: 'Packed & Ready' },
  out_for_delivery: { status: 'pending', label: 'Out for Delivery' },
  delivered: { status: 'active', label: 'Delivered' },
  cancelled: { status: 'cancelled', label: 'Cancelled' },
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
      <div className="mt-4">
        <Alert type="error" message="This order was cancelled." />
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 mt-5">
      {STATUS_STEPS.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
            index <= currentIndex 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary border-2 border-muted text-muted-foreground'
          }`}>
            {index < currentIndex ? <CheckCircle size={14} /> : index + 1}
          </div>
          {index < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-1 mx-1 rounded-full transition-colors ${
              index < currentIndex ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading orders...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert type="error" message="Failed to load orders. Please try again later." />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="px-6 py-8 sm:px-8 bg-brand-deep">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-deep-foreground/70">
            Patient Portal
          </p>
          <h1 className="text-2xl font-bold text-brand-deep-foreground">Medicine Orders</h1>
          <p className="text-sm mt-1 text-brand-deep-foreground/80">Track your medicine delivery status</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-xl border border-dashed border-border bg-secondary/40">
            <Package className="w-9 h-9 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((order) => (
              <Card key={order.id} className="w-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {order.pharmacy_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ordered: {formatDate(order.created_at)}
                    </p>
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                      <MapPin size={14} className="shrink-0 text-primary" />
                      <span>{order.delivery_address}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {order.total_amount && (
                      <p className="text-sm font-bold text-foreground mb-2">
                        LKR {parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    )}
                    <Badge 
                      status={STATUS_MAP[order.status]?.status || 'normal'} 
                      label={STATUS_MAP[order.status]?.label || order.status} 
                    />
                  </div>
                </div>
                <StatusTimeline currentStatus={order.status} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackerPage;