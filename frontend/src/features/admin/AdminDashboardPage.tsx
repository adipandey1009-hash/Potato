import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { AdminMetrics, User, Role } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog } from '../../components/ui/Dialog';
import { formatDate } from '../../lib/utils';
import { ShieldCheck, Users, DollarSign, Utensils, Clock, Plus, Zap } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false);

  // Fetch admin platform metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: () => apiRequest<AdminMetrics>('/api/v1/admin/metrics'),
    refetchInterval: 5000,
  });

  // Fetch users list
  const { data: usersData, isLoading: usersLoading } = useQuery<{ content: User[] }>({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<any>('/api/v1/admin/users?size=50'),
  });

  // Role update mutation
  const roleMutation = useMutation({
    mutationFn: (variables: { userId: string; role: Role }) =>
      apiRequest<User>(`/api/v1/admin/users/${variables.userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: variables.role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest<User>(`/api/v1/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users = usersData?.content || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-potato-border gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-potato-olive text-potato-lime text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Executive Administration
          </div>
          <h1 className="text-3xl font-extrabold text-potato-ink tracking-tight">
            Platform Metrics & Governance
          </h1>
          <p className="text-sm text-potato-muted mt-1">
            Real-time platform throughput, queue health, user roles, and catalogue administration.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card elevated className="p-6 space-y-2 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between text-potato-muted text-xs font-bold uppercase tracking-wider">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-potato-olive" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-potato-ink">
            ${metrics ? metrics.totalRevenue.toFixed(2) : '0.00'}
          </div>
          <span className="text-[11px] text-potato-muted font-medium">Verified server-side calculation</span>
        </Card>

        <Card elevated className="p-6 space-y-2 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between text-potato-muted text-xs font-bold uppercase tracking-wider">
            <span>Orders Completed</span>
            <Clock className="w-4 h-4 text-potato-olive" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-potato-ink">
            {metrics?.totalOrders ?? 0}
          </div>
          <span className="text-[11px] text-potato-muted font-medium">All historical orders processed</span>
        </Card>

        <Card elevated className="p-6 space-y-2 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between text-potato-muted text-xs font-bold uppercase tracking-wider">
            <span>Active Queue Backlog</span>
            <Zap className="w-4 h-4 text-potato-olive fill-potato-lime" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-potato-olive">
            {metrics?.pendingQueueSize ?? 0}
          </div>
          <span className="text-[11px] text-potato-muted font-medium">
            {metrics?.expressQueueSize ?? 0} Express • {(metrics?.pendingQueueSize ?? 0) - (metrics?.expressQueueSize ?? 0)} Regular
          </span>
        </Card>

        <Card elevated className="p-6 space-y-2 bg-potato-surface border-potato-border">
          <div className="flex items-center justify-between text-potato-muted text-xs font-bold uppercase tracking-wider">
            <span>Registered Customers</span>
            <Users className="w-4 h-4 text-potato-olive" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-potato-ink">
            {metrics?.totalCustomers ?? 0}
          </div>
          <span className="text-[11px] text-potato-muted font-medium">Active accounts in system</span>
        </Card>
      </div>

      {/* User & Role Management Table */}
      <Card className="p-6 space-y-6 bg-potato-surface border-potato-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-potato-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-potato-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-potato-olive" />
              User Accounts & Role Permissions
            </h2>
            <p className="text-xs text-potato-muted mt-1">
              Assign Kitchen Staff or Admin roles to test different system perspectives.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-potato-border text-potato-muted uppercase font-bold tracking-wider">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Current Role</th>
                <th className="pb-3">Registered</th>
                <th className="pb-3 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-potato-border/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-black/[0.02]">
                  <td className="py-3.5 font-bold text-potato-ink">{u.fullName}</td>
                  <td className="py-3.5 font-mono text-potato-muted">{u.email}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : u.role === 'KITCHEN_STAFF'
                          ? 'bg-potato-lime/40 text-potato-olive border border-potato-lime'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-potato-muted">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 text-right space-x-2">
                    {u.role !== 'KITCHEN_STAFF' && (
                      <button
                        onClick={() => roleMutation.mutate({ userId: u.id, role: 'KITCHEN_STAFF' })}
                        className="px-2 py-1 rounded bg-[#EAE8DD] hover:bg-potato-lime text-potato-olive font-semibold transition-colors"
                      >
                        Make Kitchen
                      </button>
                    )}
                    {u.role !== 'CUSTOMER' && (
                      <button
                        onClick={() => roleMutation.mutate({ userId: u.id, role: 'CUSTOMER' })}
                        className="px-2 py-1 rounded bg-[#EAE8DD] hover:bg-gray-300 text-potato-ink font-semibold transition-colors"
                      >
                        Make Customer
                      </button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => roleMutation.mutate({ userId: u.id, role: 'ADMIN' })}
                        className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-200 text-purple-900 font-semibold transition-colors"
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
