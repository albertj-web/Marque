import { PublicHeader, PublicFooter } from '@/components/public-layout';
import { VehicleCard } from '@/components/vehicle-card';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import { formatKES, categoryLabel } from '@/lib/format';
import Link from 'next/link';
import { ArrowRight, Car, KeyRound, Bike, Tag } from 'lucide-react';

const HERO_IMAGE =
  'https://images.pexels.com/photos/5050535/pexels-photo-5050535.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1920';

const CATEGORIES = [
  {
    href: '/browse?category=import',
    label: 'Imports',
    description: 'Premium vehicles sourced from international markets.',
    icon: Car,
  },
  {
    href: '/browse?category=private-sale',
    label: 'Private Sales',
    description: 'Consignment and direct sales from private owners.',
    icon: Tag,
  },
  {
    href: '/browse?category=rental',
    label: 'Rentals',
    description: 'Short-term luxury vehicle rentals for any occasion.',
    icon: KeyRound,
  },
  {
    href: '/browse?category=motorbike',
    label: 'Motorbikes',
    description: 'Curated motorcycles for the discerning rider.',
    icon: Bike,
  },
];

export const revalidate = 60;

async function getFeaturedVehicles() {
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);
  return (data as Vehicle[]) || [];
}

export default async function HomePage() {
  const vehicles = await getFeaturedVehicles();

  return (
    <>
      <PublicHeader />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="Luxury vehicles"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance max-w-4xl animate-fade-in">
            The Art of the Automobile
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-white/80 animate-fade-in">
            A curated marketplace for luxury vehicles, private sales, rentals,
            and motorbikes — sourced with discretion, sold with integrity.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-brass px-8 py-3 text-sm font-semibold text-white transition-colors hover:brightness-110"
            >
              Browse Collection
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/browse?category=import"
              className="inline-flex items-center justify-center rounded-md border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View Imports
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-semibold">Explore by Category</h2>
          <p className="mt-2 text-muted-foreground">
            Find exactly what you&apos;re looking for
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href}
                className="group rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:border-brass/40 hover:shadow-md"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary group-hover:bg-brass/10 transition-colors">
                  <Icon className="text-foreground group-hover:text-brass transition-colors" size={24} />
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold">{cat.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brass">
                  Explore
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Featured Vehicles</h2>
            <p className="mt-2 text-muted-foreground">
              The latest additions to our collection
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-brass hover:underline"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 py-20 text-center">
            <p className="text-muted-foreground">
              No vehicles listed yet. Check back soon.
            </p>
          </div>
        )}
      </section>

      {/* CTA Band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl bg-ink px-8 py-16 text-center">
          <h2 className="font-serif text-3xl font-semibold text-white">
            Looking for something specific?
          </h2>
          <p className="mt-3 text-white/60 max-w-lg mx-auto">
            Our team can source vehicles to your exact specifications. Get in
            touch to discuss your requirements.
          </p>
          <Link
            href="/browse"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-brass px-8 py-3 text-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            Browse Available Vehicles
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
