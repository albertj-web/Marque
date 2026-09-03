import { Vehicle } from '@/lib/types';
import { formatKES, categoryLabel, statusColor, statusLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: Props) {
  const image =
    vehicle.images?.[0] ||
    'https://images.pexels.com/photos/38570/lamborghini-car-speed-prestige-38570.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  return (
    <a
      href={`/vehicle/${vehicle.id}`}
      className="group block overflow-hidden rounded-lg bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-brass/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
            {categoryLabel(vehicle.category)}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm',
              statusColor(vehicle.status),
            )}
          >
            {statusLabel(vehicle.status)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold leading-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.year && (
            <span className="text-sm text-muted-foreground font-mono-num">
              {vehicle.year}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono-num text-lg font-semibold text-foreground">
            {formatKES(vehicle.price)}
          </span>
          <span className="text-xs text-muted-foreground">
            {vehicle.colour || '—'}
          </span>
        </div>
      </div>
    </a>
  );
}
