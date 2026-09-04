'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/browse?category=import', label: 'Imports' },
  { href: '/browse?category=private-sale', label: 'Private Sales' },
  { href: '/browse?category=rental', label: 'Rentals' },
  { href: '/browse?category=motorbike', label: 'Motorbikes' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-sm border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              Marque
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-brass',
                  pathname === link.href.split('?')[0]
                    ? 'text-brass'
                    : 'text-white/70',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle className="border-white/20 text-white/70 hover:border-brass hover:text-brass" />
            <Link
              href="/admin"
              className="text-sm font-medium text-white/50 hover:text-brass transition-colors"
            >
              Admin
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle className="border-white/20 text-white/70 hover:border-brass hover:text-brass" />
            <button
              className="text-white"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-ink animate-fade-in-fast">
          <nav className="flex flex-col px-4 py-4 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/70 hover:text-brass py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-white/50 hover:text-brass py-2 border-t border-white/5 pt-3"
            >
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-ink text-white/60 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-serif text-2xl font-bold text-white">Marque</span>
            <p className="mt-3 text-sm leading-relaxed">
              A curated marketplace for luxury vehicles, private sales, rentals,
              and motorbikes. Sourced with discretion, sold with integrity.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-brass font-semibold mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/browse" className="hover:text-white transition-colors">All Vehicles</Link></li>
              <li><Link href="/browse?category=import" className="hover:text-white transition-colors">Imports</Link></li>
              <li><Link href="/browse?category=private-sale" className="hover:text-white transition-colors">Private Sales</Link></li>
              <li><Link href="/browse?category=rental" className="hover:text-white transition-colors">Rentals</Link></li>
              <li><Link href="/browse?category=motorbike" className="hover:text-white transition-colors">Motorbikes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-brass font-semibold mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Nairobi, Kenya</li>
              <li>+254 700 000 000</li>
              <li>info@marque.co.ke</li>
              <li>Mon–Sat, 9am–6pm</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 text-xs text-white/40">
          &copy; {new Date().getFullYear()} Marque. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
