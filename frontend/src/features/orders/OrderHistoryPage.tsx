import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Order } from '../../types';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Clock, ArrowRight, ShoppingBag } from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<{ content: Order[] }>({
    queryKey: ['my-orders'],
    queryFn: () => apiRequest<any>('/api/v1/orders?size=20'),
  });

  const orders = data?.content || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-potato-ink tracking-tight">Order History</h1>
        <p className="text-sm text-potato-muted mt-1">
          Review past orders and track active delivery tickets in real time.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-potato-surface rounded-[2rem] border border-potato-border p-8 space-y-4">
          <div className="w-14 h-14 bg-potato-bg rounded-2xl flex items-center justify-center mx-auto text-potato-muted">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-potato-ink">No orders yet</h3>
          <p className="text-sm text-potato-muted max-w-sm mx-auto">
            You haven't placed any orders yet. Discover our artisanal kitchens today.
          </p>
          <Link to="/restaurants">
            <Button variant="primary">Explore Food</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-potato-olive/40 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-potato-ink">
                    {order.orderNumber}
                  </span>
                  <Badge status={order.status} />
                  <Badge priority={order.priority} />
                </div>
                <p className="text-xs text-potato-muted font-medium">
                  {order.restaurantName} • {formatDate(order.queuedAt)}
                </p>
                <div className="text-xs text-potato-muted">
                  {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-potato-border/60">
                <span className="font-mono text-lg font-bold text-potato-ink">
                  ${order.total.toFixed(2)}
                </span>
                <Link to={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
