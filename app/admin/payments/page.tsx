'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Payment, Loan, Customer, Vehicle } from '@/lib/types';
import { formatKES, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import Link from 'next/link';
import { Printer, Receipt as ReceiptIcon, Plus, X } from 'lucide-react';

interface PaymentRow extends Payment {
  loan: Pick<Loan, 'id' | 'remaining_balance'> & {
    customer: Pick<Customer, 'name'> | null;
  } | null;
}

interface ActiveLoan extends Pick<Loan, 'id' | 'remaining_balance'> {
  customer: Pick<Customer, 'name'> | null;
  vehicle: Pick<Vehicle, 'make' | 'model'> | null;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    loanId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, loan:loans(id, remaining_balance, customer:customers(name))')
      .order('payment_date', { ascending: false });
    setPayments((data as PaymentRow[]) || []);
    setLoading(false);
  }, []);

  const fetchActiveLoans = useCallback(async () => {
    const { data } = await supabase
      .from('loans')
      .select('id, remaining_balance, customer:customers(name), vehicle:vehicles(make, model)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setActiveLoans((data as unknown as ActiveLoan[]) || []);
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchActiveLoans();
  }, [fetchPayments, fetchActiveLoans]);

  const filtered = payments.filter(
    (p) => p.loan?.customer?.name?.toLowerCase().includes(search.toLowerCase()) || false,
  );

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const openAddModal = () => {
    setForm({ loanId: '', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
    setShowAddModal(true);
  };

  const handleAddPayment = async () => {
    if (!form.loanId) {
      toast.error('Select a loan');
      return;
    }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    const loan = activeLoans.find((l) => l.id === form.loanId);
    if (!loan) return;

    const newRemaining = loan.remaining_balance - amount;
    setSaving(true);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        loan_id: form.loanId,
        amount,
        payment_date: form.date || new Date().toISOString().slice(0, 10),
        note: form.note || null,
        remaining_after: newRemaining,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error(error?.message || 'Unable to record payment');
      setSaving(false);
      return;
    }

    await supabase
      .from('loans')
      .update({
        remaining_balance: newRemaining,
        status: newRemaining <= 0 ? 'completed' : 'active',
      })
      .eq('id', form.loanId);

    setSaving(false);
    setShowAddModal(false);
    toast.success('Payment recorded');
    router.push(`/admin/receipts/${data.id}`);
  };

  const selectedLoan = activeLoans.find((l) => l.id === form.loanId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded · Total: {formatKES(totalPaid)}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brass-light"
        >
          <Plus size={16} />
          Add Payment
        </button>
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
            {search ? 'No payments match your search.' : 'No payments recorded yet. Click "Add Payment" to record one.'}
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-6 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Add Payment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Loan *</label>
                <select
                  value={form.loanId}
                  onChange={(e) => setForm({ ...form, loanId: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                >
                  <option value="">Select an active loan...</option>
                  {activeLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.customer?.name || 'Unknown'} — {loan.vehicle ? `${loan.vehicle.make} ${loan.vehicle.model}` : 'No vehicle'} (Bal: {formatKES(loan.remaining_balance)})
                    </option>
                  ))}
                </select>
                {activeLoans.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">No active loans yet — create one on the Loans page first.</p>
                )}
              </div>

              {selectedLoan && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Current balance: <span className="font-mono-num font-semibold text-foreground">{formatKES(selectedLoan.remaining_balance)}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount (KES) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Paid via M-Pesa"
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
              </div>

              <button
                onClick={handleAddPayment}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brass-light disabled:opacity-60"
              >
                {saving ? 'Recording...' : 'Record Payment & View Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
