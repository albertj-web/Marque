'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Payment, Loan, Customer } from '@/lib/types';
import { formatKES, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import Link from 'next/link';
import { Printer, Receipt as ReceiptIcon, Loader2 } from 'lucide-react';

interface PaymentRow extends Payment {
  loan: Pick<Loan, 'id' | 'remaining_balance'> & {
    customer: Pick<Customer, 'name'> | null;
  } | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, loan:loans(id, remaining_balance, customer:customers(name))')
      .order('payment_date', { ascending: false });
    setPayments((data as PaymentRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = payments.filter(
    (p) => p.loan?.customer?.name?.toLowerCase().includes(search.toLowerCase()) || false,
  );

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded · Total: {formatKES(totalPaid)}
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by customer name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-md border border-border bg-card px-4 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
      />

      {filtered.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance After</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.loan?.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 text-right font-mono-num font-semibold text-emerald-600">{formatKES(p.amount)}</td>
                    <td className="px-4 py-3 text-right font-mono-num text-xs">{formatKES(p.remaining_after)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.note || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/receipts/${p.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary"
                      >
                        <Printer size={12} />
                        Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.loan?.customer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(p.payment_date)}</p>
                    {p.note && <p className="text-xs text-muted-foreground mt-1">{p.note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num font-semibold text-emerald-600">{formatKES(p.amount)}</p>
                    <p className="text-xs text-muted-foreground font-mono-num">Bal: {formatKES(p.remaining_after)}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/receipts/${p.id}`}
                  className="mt-3 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <Printer size={12} />
                  Print Receipt
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
          <ReceiptIcon className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-4 text-muted-foreground">
            {search ? 'No payments match your search.' : 'No payments recorded yet. Record payments from the Loans page.'}
          </p>
        </div>
      )}
    </div>
  );
}
