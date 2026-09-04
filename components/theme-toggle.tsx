'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn('h-9 w-9 shrink-0', className)} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-brass hover:text-brass',
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
