'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatKES, formatKESCompact, formatDate, statusColor, statusLabel } from '@/lib/format';
import { Vehicle, Loan, Payment } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Car, TrendingUp, Wallet, FileText, ArrowRight } from 'lucide-react';

interface Stats {
  totalVehicles: number;
  available: number;
  reserved: number;
  sold: number;
  rented: number;
  portfolioValue: number;
  totalOutstanding: number;
  totalPaid: number;
  recentVehicles: Vehicle[];
  recentLoans: (Loan & { customer: { name: string } | null })[];
  recentPayments: (Payment & { loan: { customer: { name: string } | null } | null })[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [vehiclesRes, loansRes, paymentsRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('loans').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('*, loan:loans(customer:customers(name))').order('created_at', { ascending: false }).limit(5),
      ]);

      const vehicles = (vehiclesRes.data as Vehicle[]) || [];
      const loans = (loansRes.data as any[]) || [];
      const payments = (paymentsRes.data as any[]) || [];

      const totalOutstanding = loans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const portfolioValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);

      setStats({
        totalVehicles: vehicles.length,
        available: vehicles.filter((v) => v.status === 'available').length,
        reserved: vehicles.filter((v) => v.status === 'reserved').length,
        sold: vehicles.filter((v) => v.status === 'sold').length,
        rented: vehicles.filter((v) => v.status === 'rented').length,
        portfolioValue,
        totalOutstanding,
        totalPaid,
        recentVehicles: vehicles.slice(0, 5),
        recentLoans: loans,
        recentPayments: payments,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Vehicles',
      value: stats.totalVehicles.toString(),
      sub: `${stats.available} available · ${stats.reserved} reserved · ${stats.sold} sold`,
      icon: Car,
      color: 'text-blue-600',
    },
    {
      label: 'Portfolio Value',
      value: formatKESCompact(stats.portfolioValue),
      fullValue: formatKES(stats.portfolioValue),
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: 'Outstanding Balance',
      value: formatKESCompact(stats.totalOutstanding),
      fullValue: formatKES(stats.totalOutstanding),
      icon: FileText,
      color: 'text-amber-600',
    },
    {
      label: 'Total Paid',
      value: formatKESCompact(stats.totalPaid),
      fullValue: formatKES(stats.totalPaid),
      icon: Wallet,
      color: 'text-brass',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your dealership inventory and finances
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon size={18} className={card.color} />
              </div>
              <p
                className="mt-3 font-mono-num text-2xl font-semibold"
                title={card.fullValue || card.value}
              >
                {card.value}
              </p>
              {card.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Inventory Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Available', count: stats.available, status: 'available' },
            { label: 'Reserved', count: stats.reserved, status: 'reserved' },
            { label: 'Sold', count: stats.sold, status: 'sold' },
            { label: 'Rented', count: stats.rented, status: 'rented' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  statusColor(item.status),
                )}
              >
                {item.label}
              </span>
              <span className="font-mono-num text-lg font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent vehicles */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Vehicles
            </h2>
            <Link
              href="/admin/vehicles"
              className="inline-flex items-center gap-1 text-xs font-medium text-brass hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentVehicles.length > 0 ? (
              stats.recentVehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.make} {v.model} {v.year || ''}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono-num">
                      {formatKES(v.price)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
                      statusColor(v.status),
                    )}
                  >
                    {statusLabel(v.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No vehicles yet.</p>
            )}
          </div>
        </div>

        {/* Recent payments */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Payments
            </h2>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1 text-xs font-medium text-brass hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentPayments.length > 0 ? (
              stats.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.loan?.customer?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.payment_date)}
                    </p>
                  </div>
                  <span className="font-mono-num text-sm font-semibold text-emerald-600 shrink-0">
                    {formatKES(p.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
