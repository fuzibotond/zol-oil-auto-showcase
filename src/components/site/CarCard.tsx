import { Link } from "@tanstack/react-router";
import { Gauge, Fuel, Cog, Calendar } from "lucide-react";
import type { Car } from "@/lib/types";
import { fmtKm, fmtPrice } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

const PLACEHOLDER = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop";

export function CarCard({ car }: { car: Car }) {
  const img = car.images?.[0]?.url ?? PLACEHOLDER;
  return (
    <Link
      to="/masini/$slug"
      params={{ slug: car.slug }}
      className="group surface-card overflow-hidden flex flex-col transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={img}
          alt={`${car.brand} ${car.model} ${car.year}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <StatusBadge status={car.status} />
          {car.is_featured && (
            <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
              Recomandat
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold tracking-tight leading-tight">
              {car.brand} {car.model}
            </div>
            {car.version && <div className="text-sm text-muted-foreground">{car.version}</div>}
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-bold">{fmtPrice(car.price, car.currency)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <Spec icon={<Calendar className="h-3.5 w-3.5" />} label={String(car.year)} />
          <Spec icon={<Gauge className="h-3.5 w-3.5" />} label={fmtKm(car.mileage)} />
          <Spec icon={<Fuel className="h-3.5 w-3.5" />} label={car.fuel_type} />
          <Spec icon={<Cog className="h-3.5 w-3.5" />} label={car.transmission} />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Vezi detalii →</span>
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
