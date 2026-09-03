'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loan,
  Customer,
  Vehicle,
  BalanceItem,
  Payment,
  LoanStatus,
} from '@/lib/types';
import {
  formatKES,
  formatDate,
  formatDateLong,
  statusLabel,
  statusColor,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  X,
  Loader2,
  Trash2,
  FileText,
  Printer,
  ChevronDown,
  ChevronRight,
  Pencil,
} from 'lucide-react';

interface LoanRow extends Loan {
  customer: Pick<Customer, 'name' | 'phone' | 'id_number'> | null;
  vehicle: Pick<Vehicle, 'make' | 'model' | 'year' | 'reg_no'> | null;
  payments_count: { count: number }[];
}

const emptyForm = {
  customer_id: '',
  vehicle_id: '',
  vehicle_price: '',
  deposit: '',
  duration_months: '',
  interest_rate: '',
  start_date: '',
  contract_date: '',
  deposit_date: '',
  witness_name: '',
  witness_id_number: '',
  witness_phone: '',
  balance_items: [{ description: '', amount: '', due_date: '' }],
};

type FormState = typeof emptyForm;

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loanPayments, setLoanPayments] = useState<Record<string, Payment[]>>({});
  const [loanBalanceItems, setLoanBalanceItems] = useState<Record<string, BalanceItem[]>>({});
  const [paymentForm, setPaymentForm] = useState<Record<string, { amount: string; date: string; note: string }>>({});

  const fetchLoans = useCallback(async () => {
    const { data } = await supabase
      .from('loans')
      .select('*, customer:customers(name, phone, id_number), vehicle:vehicles(make, model, year, reg_no), payments_count:payments(count)')
      .order('created_at', { ascending: false });
    setLoans((data as unknown as LoanRow[]) || []);
    setLoading(false);
  }, []);

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers((data as Customer[]) || []);
  }, []);

  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    setVehicles((data as Vehicle[]) || []);
  }, []);

  useEffect(() => {
    fetchLoans();
    fetchCustomers();
    fetchVehicles();
  }, [fetchLoans, fetchCustomers, fetchVehicles]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (loan: LoanRow) => {
    fetchLoanDetails(loan.id).then(({ balanceItems }) => {
      setForm({
        customer_id: loan.customer_id,
        vehicle_id: loan.vehicle_id || '',
        vehicle_price: loan.vehicle_price?.toString() || '',
        deposit: loan.deposit?.toString() || '',
        duration_months: loan.duration_months?.toString() || '',
        interest_rate: loan.interest_rate?.toString() || '',
        start_date: loan.start_date || '',
        contract_date: loan.contract_date || '',
        deposit_date: loan.deposit_date || '',
        witness_name: loan.witness_name || '',
        witness_id_number: loan.witness_id_number || '',
        witness_phone: loan.witness_phone || '',
        balance_items:
          balanceItems.length > 0
            ? balanceItems.map((bi) => ({
                description: bi.description,
                amount: bi.amount.toString(),
                due_date: bi.due_date || '',
              }))
            : [{ description: '', amount: '', due_date: '' }],
      });
      setEditingId(loan.id);
      setShowForm(true);
    });
  };

  const fetchLoanDetails = async (loanId: string) => {
    const [paymentsRes, balanceRes] = await Promise.all([
      supabase.from('payments').select('*').eq('loan_id', loanId).order('payment_date', { ascending: false }),
      supabase.from('balance_items').select('*').eq('loan_id', loanId).order('sort_order', { ascending: true }),
    ]);
    setLoanPayments((prev) => ({ ...prev, [loanId]: (paymentsRes.data as Payment[]) || [] }));
    setLoanBalanceItems((prev) => ({ ...prev, [loanId]: (balanceRes.data as BalanceItem[]) || [] }));
    return {
      payments: (paymentsRes.data as Payment[]) || [],
      balanceItems: (balanceRes.data as BalanceItem[]) || [],
    };
  };

  const toggleRow = async (loanId: string) => {
    if (expandedRow === loanId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(loanId);
      await fetchLoanDetails(loanId);
    }
  };

  const addBalanceItem = () => {
    setForm((f) => ({
      ...f,
      balance_items: [...f.balance_items, { description: '', amount: '', due_date: '' }],
    }));
  };

  const removeBalanceItem = (idx: number) => {
    setForm((f) => ({
      ...f,
      balance_items: f.balance_items.filter((_, i) => i !== idx),
    }));
  };

  const updateBalanceItem = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      balance_items: f.balance_items.map((bi, i) => (i === idx ? { ...bi, [field]: value } : bi)),
    }));
  };

  const calcMonthlyPayment = (price: number, deposit: number, months: number, rate: number) => {
    const principal = price - deposit;
    if (months <= 0 || principal <= 0) return 0;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id) {
      toast.error('Select a customer');
      return;
    }
    setSaving(true);

    const price = parseFloat(form.vehicle_price) || 0;
    const deposit = parseFloat(form.deposit) || 0;
    const months = parseInt(form.duration_months) || 0;
    const rate = parseFloat(form.interest_rate) || 0;
    const balance = price - deposit;
    const monthly = calcMonthlyPayment(price, deposit, months, rate);

    const loanPayload = {
      customer_id: form.customer_id,
      vehicle_id: form.vehicle_id || null,
      vehicle_price: price,
      deposit,
      balance,
      duration_months: months,
      interest_rate: rate,
      monthly_payment: monthly,
      remaining_balance: balance,
      status: 'active' as LoanStatus,
      start_date: form.start_date || null,
      contract_date: form.contract_date || null,
      deposit_date: form.deposit_date || null,
      witness_name: form.witness_name || null,
      witness_id_number: form.witness_id_number || null,
      witness_phone: form.witness_phone || null,
    };

    let loanId = editingId;

    if (editingId) {
      const { error } = await supabase.from('loans').update(loanPayload).eq('id', editingId);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      await supabase.from('balance_items').delete().eq('loan_id', editingId);
    } else {
      const { data, error } = await supabase.from('loans').insert(loanPayload).select('id').single();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      loanId = data.id;
    }

    if (loanId && form.balance_items.some((bi) => bi.description && bi.amount)) {
      const balancePayload = form.balance_items
        .filter((bi) => bi.description && bi.amount)
        .map((bi, i) => ({
          loan_id: loanId,
          description: bi.description,
          amount: parseFloat(bi.amount) || 0,
          due_date: bi.due_date || null,
          sort_order: i,
        }));
      const { error: biError } = await supabase.from('balance_items').insert(balancePayload);
      if (biError) toast.error(`Balance items: ${biError.message}`);
    }

    toast.success(editingId ? 'Loan updated' : 'Loan created');
    setSaving(false);
    setShowForm(false);
    fetchLoans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loan? All related payments and balance items will also be deleted.')) return;
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Loan deleted');
      fetchLoans();
    }
  };

  const recordPayment = async (loanId: string) => {
    const pf = paymentForm[loanId];
    if (!pf || !pf.amount) {
      toast.error('Enter payment amount');
      return;
    }
    const amount = parseFloat(pf.amount);
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;
    const newRemaining = loan.remaining_balance - amount;

    const { error } = await supabase.from('payments').insert({
      loan_id: loanId,
      amount,
      payment_date: pf.date || new Date().toISOString().slice(0, 10),
      note: pf.note || null,
      remaining_after: newRemaining,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase
      .from('loans')
      .update({
        remaining_balance: newRemaining,
        status: newRemaining <= 0 ? 'completed' : 'active',
      })
      .eq('id', loanId);

    toast.success('Payment recorded');
    setPaymentForm((prev) => ({ ...prev, [loanId]: { amount: '', date: '', note: '' } }));
    fetchLoans();
    fetchLoanDetails(loanId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loans.length} {loans.length === 1 ? 'loan' : 'loans'} — financing contracts
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <Plus size={16} />
          New Loan
        </button>
      </div>

      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => {
            const expanded = expandedRow === loan.id;
            const payments = loanPayments[loan.id] || [];
            const balanceItems = loanBalanceItems[loan.id] || [];
            return (
              <div key={loan.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleRow(loan.id)}
                >
                  {expanded ? <ChevronDown size={16} className="mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {loan.customer?.name || 'Unknown'}
                      </p>
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', statusColor(loan.status))}>
                        {statusLabel(loan.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {loan.vehicle ? `${loan.vehicle.make} ${loan.vehicle.model} ${loan.vehicle.year || ''}` : 'No vehicle linked'}
                      {' · '}
                      {formatDate(loan.contract_date || loan.created_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono-num">
                      <span>Price: <span className="text-foreground">{formatKES(loan.vehicle_price)}</span></span>
                      <span>Deposit: <span className="text-foreground">{formatKES(loan.deposit)}</span></span>
                      <span>Balance: <span className="text-foreground">{formatKES(loan.balance)}</span></span>
                      <span>Monthly: <span className="text-foreground">{formatKES(loan.monthly_payment)}</span></span>
                      <span>Duration: <span className="text-foreground">{loan.duration_months} mo</span></span>
                      <span>Payments: <span className="text-foreground">{loan.payments_count?.[0]?.count ?? 0}</span></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num text-sm font-semibold">{formatKES(loan.remaining_balance)}</p>
                    <p className="text-xs text-muted-foreground">Remaining of {formatKES(loan.balance)}</p>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-4 animate-fade-in-fast">
                    {/* Loan details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <DetailItem label="Vehicle Price" value={formatKES(loan.vehicle_price)} />
                      <DetailItem label="Deposit" value={formatKES(loan.deposit)} />
                      <DetailItem label="Balance" value={formatKES(loan.balance)} />
                      <DetailItem label="Monthly" value={formatKES(loan.monthly_payment)} />
                      <DetailItem label="Duration" value={`${loan.duration_months} months`} />
                      <DetailItem label="Interest Rate" value={`${loan.interest_rate}%`} />
                      <DetailItem label="Start Date" value={formatDate(loan.start_date)} />
                      <DetailItem label="Contract Date" value={formatDate(loan.contract_date)} />
                    </div>

                    {/* Witness */}
                    {(loan.witness_name || loan.witness_id_number || loan.witness_phone) && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Witness</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <span>{loan.witness_name || '—'}</span>
                          <span className="font-mono-num text-xs">{loan.witness_id_number || '—'}</span>
                          <span className="font-mono-num text-xs">{loan.witness_phone || '—'}</span>
                        </div>
                      </div>
                    )}

                    {/* Balance items */}
                    {balanceItems.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Balance Breakdown</p>
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Description</th>
                                <th className="text-right px-3 py-2 font-medium text-muted-foreground text-xs">Amount</th>
                                <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Due Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {balanceItems.map((bi) => (
                                <tr key={bi.id}>
                                  <td className="px-3 py-2">{bi.description}</td>
                                  <td className="px-3 py-2 text-right font-mono-num">{formatKES(bi.amount)}</td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(bi.due_date)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Payment history */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Payment History</p>
                      {payments.length > 0 ? (
                        <div className="space-y-2">
                          {payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{formatKES(p.amount)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(p.payment_date)}
                                  {p.note ? ` · ${p.note}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground font-mono-num">Bal: {formatKES(p.remaining_after)}</span>
                                <Link
                                  href={`/admin/receipts/${p.id}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-secondary"
                                >
                                  <Printer size={12} />
                                  Receipt
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                      )}
                    </div>

                    {/* Quick payment form */}
                    <div className="rounded-md border border-dashed border-border p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Record Payment</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          placeholder="Amount (KES)"
                          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass min-w-0"
                          value={paymentForm[loan.id]?.amount || ''}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              [loan.id]: { amount: e.target.value, date: prev[loan.id]?.date || '', note: prev[loan.id]?.note || '' },
                            }))
                          }
                        />
                        <input
                          type="date"
                          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                          value={paymentForm[loan.id]?.date || ''}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              [loan.id]: { amount: prev[loan.id]?.amount || '', date: e.target.value, note: prev[loan.id]?.note || '' },
                            }))
                          }
                        />
                        <button
                          onClick={() => recordPayment(loan.id)}
                          className="rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110 shrink-0"
                        >
                          Record
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/admin/contracts/${loan.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                      >
                        <FileText size={14} />
                        View Contract
                      </Link>
                      <button
                        onClick={() => openEdit(loan)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
          <FileText className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-4 text-muted-foreground">No loans yet. Click &ldquo;New Loan&rdquo; to create one.</p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-lg bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card rounded-t-lg z-10">
              <h2 className="font-serif text-lg font-semibold">
                {editingId ? 'Edit Loan' : 'New Loan'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Customer *">
                  <select
                    className="form-input"
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Vehicle">
                  <select
                    className="form-input"
                    value={form.vehicle_id}
                    onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} {v.year || ''} — {v.reg_no || 'No reg'}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Vehicle Price (KES)">
                  <input type="number" className="form-input" value={form.vehicle_price}
                    onChange={(e) => setForm({ ...form, vehicle_price: e.target.value })} />
                </Field>
                <Field label="Deposit (KES)">
                  <input type="number" className="form-input" value={form.deposit}
                    onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
                </Field>
                <Field label="Duration (months)">
                  <input type="number" className="form-input" value={form.duration_months}
                    onChange={(e) => setForm({ ...form, duration_months: e.target.value })} />
                </Field>
                <Field label="Interest Rate (%)">
                  <input type="number" step="0.1" className="form-input" value={form.interest_rate}
                    onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Start Date">
                  <input type="date" className="form-input" value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </Field>
                <Field label="Contract Date">
                  <input type="date" className="form-input" value={form.contract_date}
                    onChange={(e) => setForm({ ...form, contract_date: e.target.value })} />
                </Field>
                <Field label="Deposit Date">
                  <input type="date" className="form-input" value={form.deposit_date}
                    onChange={(e) => setForm({ ...form, deposit_date: e.target.value })} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Witness Name">
                  <input className="form-input" value={form.witness_name}
                    onChange={(e) => setForm({ ...form, witness_name: e.target.value })} />
                </Field>
                <Field label="Witness ID Number">
                  <input className="form-input" value={form.witness_id_number}
                    onChange={(e) => setForm({ ...form, witness_id_number: e.target.value })} />
                </Field>
                <Field label="Witness Phone">
                  <input className="form-input" value={form.witness_phone}
                    onChange={(e) => setForm({ ...form, witness_phone: e.target.value })} />
                </Field>
              </div>

              {/* Balance items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Balance Breakdown Items
                  </label>
                  <button
                    type="button"
                    onClick={addBalanceItem}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brass hover:underline"
                  >
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.balance_items.map((bi, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2">
                      <input
                        placeholder="Description"
                        className="form-input flex-1 min-w-0"
                        value={bi.description}
                        onChange={(e) => updateBalanceItem(idx, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        className="form-input sm:w-32"
                        value={bi.amount}
                        onChange={(e) => updateBalanceItem(idx, 'amount', e.target.value)}
                      />
                      <input
                        type="date"
                        className="form-input sm:w-40"
                        value={bi.due_date}
                        onChange={(e) => updateBalanceItem(idx, 'due_date', e.target.value)}
                      />
                      {form.balance_items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBalanceItem(idx)}
                          className="rounded-md border border-border p-2 text-red-600 hover:bg-red-50 shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .form-input:focus {
          border-color: hsl(var(--brass));
          box-shadow: 0 0 0 1px hsl(var(--brass));
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium font-mono-num mt-0.5">{value}</p>
    </div>
  );
}
