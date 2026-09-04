'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import { formatKES, categoryLabel, statusColor, statusLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Fuel, Gauge, Palette, Calendar, MessageCircle, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setVehicle(data as Vehicle | null);
        setActiveImage(0);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
      </div>
    );
  }

  if (!vehicle) notFound();

  const specs = [
    { label: 'Year', value: vehicle.year?.toString() || '—', icon: Calendar },
    { label: 'Registration', value: vehicle.reg_no || '—', icon: Check },
    { label: 'VIN', value: vehicle.vin || '—', icon: Check },
    { label: 'Chassis No.', value: vehicle.chassis_no || '—', icon: Check },
    { label: 'Engine No.', value: vehicle.engine_no || '—', icon: Check },
    { label: 'Colour', value: vehicle.colour || '—', icon: Palette },
    { label: 'Fuel Type', value: vehicle.fuel_type || '—', icon: Fuel },
    { label: 'Engine Capacity', value: vehicle.engine_capacity || '—', icon: Check },
    { label: 'Mileage', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—', icon: Gauge },
  ];

  const whatsappText = encodeURIComponent(
    `Hello Marque, I'm interested in the ${vehicle.make} ${vehicle.model} (${vehicle.year || ''}) listed at ${formatKES(vehicle.price)}. Is it still available?`,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-ink border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-white">Marque</Link>
          <Link href="/browse" className="text-sm text-white/60 hover:text-brass transition-colors">
            Browse
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehicle.images?.[activeImage] || 'https://images.pexels.com/photos/38570/lamborghini-car-speed-prestige-38570.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
              {vehicle.images && vehicle.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((i) => (i - 1 + vehicle.images.length) % vehicle.images.length)
                    }
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-ink/70 text-white backdrop-blur-sm transition-colors hover:bg-ink"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((i) => (i + 1) % vehicle.images.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-ink/70 text-white backdrop-blur-sm transition-colors hover:bg-ink"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm font-mono-num">
                    {activeImage + 1} / {vehicle.images.length}
                  </span>
                </>
              )}
            </div>
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {vehicle.images.slice(0, 8).map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={activeImage === i}
                    className={cn(
                      'overflow-hidden rounded-md border-2 aspect-square bg-muted transition-colors',
                      activeImage === i ? 'border-brass' : 'border-border hover:border-brass/50',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {categoryLabel(vehicle.category)}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                  statusColor(vehicle.status),
                )}
              >
                {statusLabel(vehicle.status)}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.year && (
              <p className="mt-1 text-lg text-muted-foreground font-mono-num">{vehicle.year}</p>
            )}

            <div className="mt-6 pb-6 border-b border-border">
              <span className="text-sm text-muted-foreground">Price</span>
              <p className="font-mono-num text-3xl font-semibold mt-1">
                {formatKES(vehicle.price)}
              </p>
            </div>

            {vehicle.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-foreground/80 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            {/* Contact */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/254700000000?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brass px-6 py-3 text-sm font-semibold text-white transition-colors hover:brightness-110"
              >
                <MessageCircle size={18} />
                WhatsApp Enquiry
              </a>
              <a
                href="tel:+254700000000"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
              >
                <Phone size={18} />
                Call Us
              </a>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-12">
          <h2 className="font-serif text-2xl font-semibold mb-6">Full Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="flex items-center gap-2.5 sm:gap-3 rounded-lg border border-border bg-card p-3 sm:p-4 min-w-0"
                >
                  <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-secondary">
                    <Icon size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">
                      {spec.label}
                    </p>
                    <p className="text-sm font-medium font-mono-num mt-0.5 truncate">{spec.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="bg-ink text-white/40 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-xs">
          &copy; {new Date().getFullYear()} Marque. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


