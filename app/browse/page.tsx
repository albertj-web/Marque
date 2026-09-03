'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { VehicleCard } from '@/components/vehicle-card';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleCategory, VehicleStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES: { value: VehicleCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'import', label: 'Imports' },
  { value: 'private-sale', label: 'Private Sales' },
  { value: 'rental', label: 'Rentals' },
  { value: 'motorbike', label: 'Motorbikes' },
];

const STATUSES: { value: VehicleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'rented', label: 'Rented' },
  { value: 'sold', label: 'Sold' },
];

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under 2M', min: 0, max: 2_000_000 },
  { label: '2M – 5M', min: 2_000_000, max: 5_000_000 },
  { label: '5M – 10M', min: 5_000_000, max: 10_000_000 },
  { label: '10M+', min: 10_000_000, max: Infinity },
];

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') as VehicleCategory) || 'all';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<VehicleCategory | 'all'>(initialCategory);
  const [status, setStatus] = useState<VehicleStatus | 'all'>('all');
  const [priceRange, setPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

    if (category !== 'all') query = query.eq('category', category);
    if (status !== 'all') query = query.eq('status', status);

    const range = PRICE_RANGES[priceRange];
    if (range.min > 0) query = query.gte('price', range.min);
    if (range.max !== Infinity) query = query.lte('price', range.max);

    const { data } = await query;
    setVehicles((data as Vehicle[]) || []);
    setLoading(false);
  }, [category, status, priceRange]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  return (
    <>
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl font-semibold mb-2">Browse Vehicles</h1>
        <p className="text-muted-foreground mb-6">
          {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} available
        </p>

        {/* Filter bar */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    category === cat.value
                      ? 'bg-ink text-white'
                      : 'bg-secondary text-foreground hover:bg-secondary/70',
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-card p-4 animate-fade-in-fast">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        status === s.value
                          ? 'bg-brass text-white'
                          : 'bg-secondary text-foreground hover:bg-secondary/70',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price Range
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRICE_RANGES.map((r, i) => (
                    <button
                      key={r.label}
                      onClick={() => setPriceRange(i)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        priceRange === i
                          ? 'bg-brass text-white'
                          : 'bg-secondary text-foreground hover:bg-secondary/70',
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
            <p className="text-muted-foreground">
              No vehicles match your filters. Try adjusting your search.
            </p>
          </div>
        )}
      </div>
      <PublicFooter />
    </>
  );
}
