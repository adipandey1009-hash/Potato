import React from 'react';
import { cn } from '../../lib/utils';
import { OrderPriority, OrderStatus } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'express' | 'regular' | 'status' | 'outline';
  status?: OrderStatus;
  priority?: OrderPriority;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  priority,
  children,
  ...props
}) => {
  if (priority === 'EXPRESS') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-potato-lime text-potato-ink border border-[#C5E44E]',
          className
        )}
        {...props}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-potato-olive animate-pulse" />
        EXPRESS PRIORITY
      </span>
    );
  }

  if (priority === 'REGULAR') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E7E5DC] text-potato-muted border border-potato-border',
          className
        )}
        {...props}
      >
        REGULAR (FIFO)
      </span>
    );
  }

  if (status) {
    const statusStyles: Record<OrderStatus, string> = {
      QUEUED: 'bg-amber-100 text-amber-900 border-amber-300',
      CLAIMED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      PREPARING: 'bg-blue-100 text-blue-900 border-blue-300',
      READY: 'bg-teal-100 text-teal-900 border-teal-300',
      DISPATCHED: 'bg-purple-100 text-purple-900 border-purple-300',
      DELIVERED: 'bg-green-100 text-green-900 border-green-300',
      CANCELLED: 'bg-rose-100 text-rose-900 border-rose-300',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border',
          statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-300',
          className
        )}
        {...props}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-potato-surface border border-potato-border text-potato-ink',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
