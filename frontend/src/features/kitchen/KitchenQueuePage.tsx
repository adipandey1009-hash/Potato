import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiException } from '../../lib/api';
import { QueueStatus, QueueOrderSummary, Order, OrderStatus } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  UtensilsCrossed,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Eye,
} from 'lucide-react';

export const KitchenQueuePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [peekedOrder, setPeekedOrder] = useState<QueueOrderSummary | null>(null);
  const [claimNotification, setClaimNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll kitchen status every 2.5s
  const { data: queueStatus, isLoading: statusLoading } = useQuery<QueueStatus>({
    queryKey: ['kitchen-status'],
    queryFn: () => apiRequest<QueueStatus>('/api/v1/kitchen/status'),
    refetchInterval: 2500,
  });

  // Recent in-prep & completed tickets
  const { data: recentOrders, isLoading: recentLoading } = useQuery<Order[]>({
    queryKey: ['kitchen-recent-orders'],
    queryFn: () => apiRequest<Order[]>('/api/v1/kitchen/orders/recent?limit=10'),
    refetchInterval: 3000,
  });

  // Peek next without mutation
  const peekMutation = useMutation({
    mutationFn: () => apiRequest<QueueOrderSummary>('/api/v1/kitchen/queue/peek'),
    onSuccess: (data) => {
      setPeekedOrder(data);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to peek queue');
    },
  });

  // Atomic process-next
  const processNextMutation = useMutation({
    mutationFn: () => apiRequest<Order>('/api/v1/kitchen/queue/process-next', { method: 'POST' }),
    onSuccess: (claimed) => {
      setClaimNotification(`Successfully claimed ticket ${claimed.orderNumber} (${claimed.priority})`);
      setErrorMessage(null);
      setPeekedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['kitchen-status'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-recent-orders'] });
      setTimeout(() => setClaimNotification(null), 4000);
    },
    onError: (err: any) => {
      if (err instanceof ApiException && err.code === 'QUEUE_EMPTY') {
        setErrorMessage('The queue is currently empty. No pending tickets to claim.');
      } else {
        setErrorMessage(err.message || 'Failed to claim next order');
      }
    },
  });

  // Status transition mutation
  const transitionMutation = useMutation({
    mutationFn: (variables: { orderId: string; status: OrderStatus; note?: string }) =>
      apiRequest<Order>(`/api/v1/kitchen/orders/${variables.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: variables.status, note: variables.note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-status'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Invalid status transition');
    },
  });

  const queueBacklog = queueStatus?.queueBacklog || [];
  const nextOrder = queueStatus?.nextEligibleOrder;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-potato-border gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-potato-olive text-potato-lime text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-potato-lime animate-pulse" />
            Kitchen Display System (KDS)
          </div>
          <h1 className="text-3xl font-extrabold text-potato-ink tracking-tight">
            Live Kitchen Order Queue
          </h1>
          <p className="text-xs text-potato-muted mt-1 font-mono">
            Deterministic Dispatch • PostgreSQL row-locking FOR UPDATE SKIP LOCKED
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => peekMutation.mutate()}
            isLoading={peekMutation.isPending}
            className="text-xs"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Peek Next (No Mutation)
          </Button>

          <Button
            variant="lime"
            size="md"
            onClick={() => processNextMutation.mutate()}
            isLoading={processNextMutation.isPending}
            disabled={queueBacklog.length === 0}
            className="font-bold shadow-md"
          >
            <Flame className="w-4 h-4 mr-2 text-potato-olive fill-potato-olive" />
            Claim Next Eligible Order
          </Button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {claimNotification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>{claimNotification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline ml-4 hover:text-amber-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Peek Result Modal / Banner if active */}
      {peekedOrder && (
        <Card className="p-5 bg-potato-surface border-potato-olive/40 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-potato-lime/30 text-potato-olive flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-potato-muted">
                Peek Inspection (State Unmutated)
              </span>
              <p className="text-sm font-bold text-potato-ink">
                {peekedOrder.orderNumber} • {peekedOrder.restaurantName} ({peekedOrder.itemCount} items)
              </p>
              <span className="text-xs text-potato-muted font-mono">
                Recipient: {peekedOrder.recipientName} • Priority: {peekedOrder.priority} (Rank {peekedOrder.priorityRank})
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPeekedOrder(null)}>
            Close Peek
          </Button>
        </Card>
      )}

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-potato-surface border-potato-border">
          <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
            Total Backlog
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold text-potato-ink">
              {queueStatus?.totalPending ?? 0}
            </span>
            <span className="text-xs font-mono text-potato-muted">tickets waiting</span>
          </div>
        </Card>

        <Card className="p-5 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
              Express Priority
            </span>
            <Badge variant="express" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold text-potato-olive">
              {queueStatus?.expressPending ?? 0}
            </span>
            <span className="text-xs font-mono text-potato-olive">Rank 1 (Jump FIFO)</span>
          </div>
        </Card>

        <Card className="p-5 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
              Regular FIFO
            </span>
            <span className="text-xs font-mono text-potato-muted">Rank 2</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold text-potato-ink">
              {queueStatus?.regularPending ?? 0}
            </span>
            <span className="text-xs font-mono text-potato-muted">Arrival order</span>
          </div>
        </Card>

        <Card className="p-5 bg-potato-surface border-potato-border">
          <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
            Next In Line
          </span>
          <div className="mt-2">
            {nextOrder ? (
              <div>
                <span className="font-mono text-sm font-bold text-potato-ink block">
                  {nextOrder.orderNumber}
                </span>
                <span className="text-xs text-potato-muted truncate block">
                  {nextOrder.restaurantName} ({nextOrder.priority})
                </span>
              </div>
            ) : (
              <span className="text-xs font-mono text-potato-muted">Queue is empty</span>
            )}
          </div>
        </Card>
      </div>

      {/* Main Split: Backlog Queue Table & Active Prep / Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Pending Queue Backlog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-potato-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-potato-olive" />
              Pending Order Queue
            </h2>
            <span className="text-xs font-mono text-potato-muted">
              Sorted: Priority Rank ASC, Queued Time ASC
            </span>
          </div>

          {queueBacklog.length === 0 ? (
            <Card className="py-16 text-center space-y-3 bg-potato-surface border-potato-border">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-potato-ink">All caught up!</h3>
              <p className="text-xs text-potato-muted max-w-sm mx-auto">
                Zero orders in the kitchen queue. New customer orders will automatically enqueue here in real time.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {queueBacklog.map((order, index) => {
                const isNext = index === 0;

                return (
                  <Card
                    key={order.id}
                    className={`p-4 transition-all duration-200 ${
                      isNext
                        ? 'border-potato-olive ring-2 ring-potato-olive/20 bg-potato-surface shadow-md'
                        : 'border-potato-border bg-potato-surface/70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-potato-bg text-potato-ink">
                            #{index + 1}
                          </span>
                          <span className="font-mono text-sm font-bold text-potato-ink">
                            {order.orderNumber}
                          </span>
                          <Badge priority={order.priority} />
                          {isNext && (
                            <span className="text-[10px] font-bold text-potato-olive bg-potato-lime px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Next to Claim
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-potato-ink">
                          {order.restaurantName} • <span className="text-potato-muted">{order.itemCount} items for {order.recipientName}</span>
                        </p>
                        <p className="text-[11px] font-mono text-potato-muted">
                          Queued: {formatDate(order.queuedAt)} ({order.waitMinutes}m wait)
                        </p>
                      </div>

                      {isNext && (
                        <Button
                          variant="lime"
                          size="sm"
                          onClick={() => processNextMutation.mutate()}
                          isLoading={processNextMutation.isPending}
                          className="font-bold text-xs"
                        >
                          Claim Now
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Prep & Recent Completions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-potato-ink flex items-center gap-2">
              <Flame className="w-5 h-5 text-potato-olive" />
              Active Prep & Transitions
            </h2>
            <span className="text-xs font-mono text-potato-muted">Station Controls</span>
          </div>

          <div className="space-y-3">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((ticket) => (
                <Card key={ticket.id} className="p-4 space-y-3 bg-potato-surface border-potato-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-potato-ink">
                        {ticket.orderNumber}
                      </span>
                      <span className="text-xs text-potato-muted block">
                        {ticket.restaurantName}
                      </span>
                    </div>
                    <Badge status={ticket.status} />
                  </div>

                  <div className="text-xs text-potato-muted">
                    {ticket.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </div>

                  {/* Transition Control Buttons */}
                  <div className="pt-2 border-t border-potato-border/60 flex flex-wrap gap-2">
                    {ticket.status === 'CLAIMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          transitionMutation.mutate({
                            orderId: ticket.id,
                            status: 'PREPARING',
                            note: 'Kitchen station started cooking',
                          })
                        }
                      >
                        Start Preparing
                      </Button>
                    )}

                    {ticket.status === 'PREPARING' && (
                      <Button
                        variant="lime"
                        size="sm"
                        className="text-xs font-bold"
                        onClick={() =>
                          transitionMutation.mutate({
                            orderId: ticket.id,
                            status: 'READY',
                            note: 'Dishes plated and boxed, awaiting courier',
                          })
                        }
                      >
                        Mark Ready
                      </Button>
                    )}

                    {ticket.status === 'READY' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          transitionMutation.mutate({
                            orderId: ticket.id,
                            status: 'DISPATCHED',
                            note: 'Handed off to courier for delivery',
                          })
                        }
                      >
                        <Truck className="w-3.5 h-3.5 mr-1 text-potato-olive" />
                        Dispatch Order
                      </Button>
                    )}

                    {ticket.status === 'DISPATCHED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs bg-emerald-800 hover:bg-emerald-900"
                        onClick={() =>
                          transitionMutation.mutate({
                            orderId: ticket.id,
                            status: 'DELIVERED',
                            note: 'Order successfully delivered to customer',
                          })
                        }
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Mark Delivered
                      </Button>
                    )}

                    {ticket.status === 'DELIVERED' && (
                      <span className="text-[11px] font-mono text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed & Delivered
                      </span>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="py-12 text-center text-xs text-potato-muted">
                No active tickets in preparation. Claim a pending order above to begin cooking.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
