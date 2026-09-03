'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleStatus, VehicleCategory } from '@/lib/types';
import { formatKES, categoryLabel, statusColor, statusLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

const STATUSES: VehicleStatus[] = ['available', 'reserved', 'sold', 'rented'];
const CATEGORIES: VehicleCategory[] = ['import', 'private-sale', 'rental', 'motorbike'];

interface FormState {
  make: string;
  model: string;
  year: string;
  vin: string;
  reg_no: string;
  chassis_no: string;
  engine_no: string;
  price: string;
  status: VehicleStatus;
  category: VehicleCategory;
  colour: string;
  fuel_type: string;
  engine_capacity: string;
  mileage: string;
  description: string;
  images: string[];
}

const emptyForm: FormState = {
  make: '',
  model: '',
  year: '',
  vin: '',
  reg_no: '',
  chassis_no: '',
  engine_no: '',
  price: '',
  status: 'available',
  category: 'import',
  colour: '',
  fuel_type: '',
  engine_capacity: '',
  mileage: '',
  description: '',
  images: [],
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    setVehicles((data as Vehicle[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (v: Vehicle) => {
    setForm({
      make: v.make,
      model: v.model,
      year: v.year?.toString() || '',
      vin: v.vin || '',
      reg_no: v.reg_no || '',
      chassis_no: v.chassis_no || '',
      engine_no: v.engine_no || '',
      price: v.price?.toString() || '',
      status: v.status,
      category: v.category,
      colour: v.colour || '',
      fuel_type: v.fuel_type || '',
      engine_capacity: v.engine_capacity || '',
      mileage: v.mileage?.toString() || '',
      description: v.description || '',
      images: v.images || [],
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        const { data: urlData } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);
        newImages.push(urlData.publicUrl);
      }
    }
    setForm((f) => ({ ...f, images: [...f.images, ...newImages] }));
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.price) {
      toast.error('Make, model, and price are required');
      return;
    }
    setSaving(true);

    const payload = {
      make: form.make,
      model: form.model,
      year: form.year ? parseInt(form.year) : null,
      vin: form.vin || null,
      reg_no: form.reg_no || null,
      chassis_no: form.chassis_no || null,
      engine_no: form.engine_no || null,
      price: parseFloat(form.price) || 0,
      status: form.status,
      category: form.category,
      colour: form.colour || null,
      fuel_type: form.fuel_type || null,
      engine_capacity: form.engine_capacity || null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      description: form.description || null,
      images: form.images,
    };

    if (editingId) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId);
      if (error) toast.error(error.message);
      else toast.success('Vehicle updated');
    } else {
      const { error } = await supabase.from('vehicles').insert(payload);
      if (error) toast.error(error.message);
      else toast.success('Vehicle added');
    }

    setSaving(false);
    setShowForm(false);
    fetchVehicles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle? This cannot be undone.')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Vehicle deleted');
      fetchVehicles();
    }
  };

  const toggleStatus = async (v: Vehicle) => {
    const statuses: VehicleStatus[] = ['available', 'reserved', 'sold', 'rented'];
    const next = statuses[(statuses.indexOf(v.status) + 1) % statuses.length];
    const { error } = await supabase.from('vehicles').update({ status: next }).eq('id', v.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Status changed to ${statusLabel(next)}`);
      fetchVehicles();
    }
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
          <h1 className="font-serif text-2xl font-semibold">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} in inventory
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      {/* Vehicle list */}
      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.images?.[0] || 'https://images.pexels.com/photos/38570/lamborghini-car-speed-prestige-38570.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                  alt={`${v.make} ${v.model}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleStatus(v)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer',
                      statusColor(v.status),
                    )}
                    title="Click to cycle status"
                  >
                    {statusLabel(v.status)}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">
                      {v.make} {v.model} {v.year || ''}
                    </h3>
                    <p className="text-xs text-muted-foreground">{categoryLabel(v.category)}</p>
                  </div>
                  <p className="font-mono-num text-sm font-semibold shrink-0">
                    {formatKES(v.price)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(v)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
          <ImageIcon className="mx-auto text-muted-foreground" size={32} />
          <p className="mt-4 text-muted-foreground">No vehicles yet. Click &ldquo;Add Vehicle&rdquo; to get started.</p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-lg bg-card border border-border shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card rounded-t-lg z-10">
              <h2 className="font-serif text-lg font-semibold">
                {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Make *">
                  <input className="form-input" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required />
                </Field>
                <Field label="Model *">
                  <input className="form-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
                </Field>
                <Field label="Year">
                  <input type="number" className="form-input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </Field>
                <Field label="Price (KES) *">
                  <input type="number" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </Field>
                <Field label="Registration No.">
                  <input className="form-input" value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })} />
                </Field>
                <Field label="VIN">
                  <input className="form-input" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
                </Field>
                <Field label="Chassis No.">
                  <input className="form-input" value={form.chassis_no} onChange={(e) => setForm({ ...form, chassis_no: e.target.value })} />
                </Field>
                <Field label="Engine No.">
                  <input className="form-input" value={form.engine_no} onChange={(e) => setForm({ ...form, engine_no: e.target.value })} />
                </Field>
                <Field label="Colour">
                  <input className="form-input" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                </Field>
                <Field label="Fuel Type">
                  <input className="form-input" value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} />
                </Field>
                <Field label="Engine Capacity">
                  <input className="form-input" value={form.engine_capacity} onChange={(e) => setForm({ ...form, engine_capacity: e.target.value })} />
                </Field>
                <Field label="Mileage (km)">
                  <input type="number" className="form-input" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
                </Field>
                <Field label="Category">
                  <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VehicleCategory })}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{categoryLabel(c)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea className="form-input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>

              {/* Image upload */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Images
                </label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-md overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-md p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-24 h-24 rounded-md border-2 border-dashed border-border cursor-pointer hover:border-brass transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleUpload(e.target.files)}
                    />
                    {uploading ? (
                      <Loader2 className="animate-spin text-muted-foreground" size={20} />
                    ) : (
                      <Upload className="text-muted-foreground" size={20} />
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Vehicle'}
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
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
