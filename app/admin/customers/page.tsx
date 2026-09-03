'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Loader2, Users } from 'lucide-react';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  id_number: '',
  address: '',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      id_number: c.id_number || '',
      address: c.address || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      id_number: form.id_number || null,
      address: form.address || null,
    };

    if (editingId) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
      if (error) toast.error(error.message);
      else toast.success('Customer updated');
    } else {
      const { error } = await supabase.from('customers').insert(payload);
      if (error) toast.error(error.message);
      else toast.success('Customer added');
    }

    setSaving(false);
    setShowForm(false);
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? Their loans will also be deleted.')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Customer deleted');
      fetchCustomers();
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

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
          <h1 className="font-serif text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {customers.length} {customers.length === 1 ? 'customer' : 'customers'} registered
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name, phone, or email..."
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID Number</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Added</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono-num text-xs">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs">{c.email || '—'}</td>
                    <td className="px-4 py-3 font-mono-num text-xs">{c.id_number || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-md border border-border p-1.5 hover:bg-secondary" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="rounded-md border border-border p-1.5 text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono-num mt-0.5">{c.phone || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.email || '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono-num mt-0.5">ID: {c.id_number || '—'}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(c)} className="rounded-md border border-border p-1.5 hover:bg-secondary">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="rounded-md border border-border p-1.5 text-red-600 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
          <Users className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-4 text-muted-foreground">
            {search ? 'No customers match your search.' : 'No customers yet. Click "Add Customer" to get started.'}
          </p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-lg bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-serif text-lg font-semibold">
                {editingId ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
                <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</label>
                  <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <input type="email" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Number</label>
                <input className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</label>
                <textarea className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass min-h-[60px]" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
