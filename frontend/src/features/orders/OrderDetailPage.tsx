import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Order, OrderStatus } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dialog } from '../../components/ui/Dialog';
import { CheckCircle2, Clock, AlertTriangle, ArrowLeft, XCircle, MapPin, Receipt, Flame } from 'lucide-react';

const STATUS_STEPS: OrderStatus[] = [
  'QUEUED',
  'CLAIMED',
  'PREPARING',
  'READY',
  'DISPATCHED',
  'DELIVERED',
];

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['order-detail', id],
    queryFn: () => apiRequest<Order>(`/api/v1/orders/${id}`),
    enabled: !!id,
    // Poll every 3s while order is still in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'DELIVERED' || data.status === 'CANCELLED')) {
        return false;
      }
      return 3000;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest<Order>(`/api/v1/orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-detail', id], updated);
      setCancelModalOpen(false);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to cancel order');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full rounded-[2rem]" />
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-potato-ink">Order Not Found</h2>
        <p className="text-potato-muted text-sm">We couldn't retrieve the requested order ticket.</p>
        <Link to="/account/orders">
          <Button variant="outline">View All Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-potato-border">
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-potato-muted hover:text-potato-ink transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Order History
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-potato-ink tracking-tight">
              Order {order.orderNumber}
            </h1>
            <Badge status={order.status} />
          </div>
          <p className="text-xs text-potato-muted mt-1">
            Placed on {formatDate(order.queuedAt)} • Kitchen: <strong>{order.restaurantName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge priority={order.priority} />
          {order.status === 'QUEUED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(true)}
              className="text-potato-error border-potato-error/30 hover:bg-rose-50"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Live Order Timeline Progress */}
      <Card elevated className="p-6 sm:p-8 space-y-6 bg-potato-surface border-[#D8D5C8]">
        <div className="flex items-center justify-between border-b border-potato-border pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-potato-ink uppercase tracking-wide">
              Live Queue Status
            </h2>
          </div>
          <span className="text-xs font-mono text-potato-muted">
            Auto-refresh active (3s)
          </span>
        </div>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-potato-error text-sm flex items-center gap-3">
            <XCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <strong className="block font-bold">This order was cancelled.</strong>
              <span>Any authorized charges have been reversed in demo sandbox.</span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-potato-lime text-potato-olive ring-4 ring-potato-lime/40 scale-110 shadow-md'
                          : isPassed
                          ? 'bg-potato-olive text-potato-lime'
                          : 'bg-[#EAE8DD] text-potato-muted'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div>
                      <span
                        className={`block text-xs font-bold uppercase tracking-wider ${
                          isCurrent
                            ? 'text-potato-olive font-extrabold'
                            : isPassed
                            ? 'text-potato-ink'
                            : 'text-potato-muted/60'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit Log Events List */}
        <div className="pt-4 border-t border-potato-border/70 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-potato-muted">
            Status Audit Events
          </h3>
          <div className="space-y-1.5 font-mono text-xs">
            {order.statusEvents.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between text-potato-muted py-1 border-b border-potato-border/30 last:border-0">
                <span className="text-potato-ink font-medium">
                  {ev.toStatus}: {ev.note}
                </span>
                <span className="text-[11px] text-potato-muted/80 ml-4 flex-shrink-0">
                  {formatDate(ev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Details Grid: Items and Delivery Destination */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Item Snapshots */}
        <div className="lg:col-span-7">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-potato-ink flex items-center gap-2 border-b border-potato-border pb-3">
              <Receipt className="w-4 h-4 text-potato-olive" />
              Item Receipt (Snapshot)
            </h2>

            <div className="divide-y divide-potato-border/60">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-potato-ink">{item.itemName}</span>
                    <span className="block text-xs text-potato-muted font-mono">
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-potato-ink">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-potato-border space-y-2 text-xs">
              <div className="flex justify-between text-potato-muted">
                <span>Subtotal</span>
                <span className="font-mono text-potato-ink font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-potato-muted">
                <span>Delivery Fee</span>
                <span className="font-mono text-potato-ink font-semibold">${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-potato-muted">
                <span>Tax (8.25%)</span>
                <span className="font-mono text-potato-ink font-semibold">${order.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-potato-border flex justify-between text-sm font-bold text-potato-ink">
                <span>Total Paid</span>
                <span className="font-mono text-lg text-potato-olive font-extrabold">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Delivery Address Snapshot */}
        <div className="lg:col-span-5">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-potato-ink flex items-center gap-2 border-b border-potato-border pb-3">
              <MapPin className="w-4 h-4 text-potato-olive" />
              Delivery Destination
            </h2>

            <div className="space-y-2 text-sm text-potato-ink">
              <p className="font-bold">{order.address.recipientName}</p>
              <p className="text-xs text-potato-muted font-mono">{order.address.phone}</p>
              <p className="text-xs text-potato-muted leading-relaxed">
                {order.address.streetLine1} {order.address.streetLine2 && `, ${order.address.streetLine2}`}
                <br />
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
              {order.address.deliveryInstructions && (
                <div className="mt-3 p-3 rounded-xl bg-potato-bg text-xs text-potato-muted">
                  <strong>Instructions:</strong> {order.address.deliveryInstructions}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order?"
        description="Are you sure you wish to remove this ticket from the kitchen queue?"
      >
        <div className="space-y-4">
          <p className="text-xs text-potato-muted">
            Once cancelled, the kitchen queue worker will release this ticket and it cannot be claimed.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-potato-border">
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
