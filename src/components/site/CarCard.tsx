import { Link } from "@tanstack/react-router";
import { Gauge, Fuel, Cog, Calendar, ImageOff } from "lucide-react";
import type { Car } from "@/lib/types";
import { fmtKm, fmtPrice, isRecent, priceDrop } from "@/lib/format";
import { imgUrl, imgSrcSet, CAR_IMAGE_WIDTHS } from "@/lib/images/responsive";
import { StatusBadge } from "./StatusBadge";

/**
 * `priority` marks an above-the-fold card (first in a grid): its photo loads
 * eagerly with high fetch priority because it is usually the page's LCP image.
 */
export function CarCard({ car, priority = false }: { car: Car; priority?: boolean }) {
  const img = car.images?.[0]?.url ?? null;
  const drop = priceDrop(car.price, car.original_price);
  return (
    <Link
      to="/masini/$slug"
      params={{ slug: car.slug }}
      className="group surface-card overflow-hidden flex flex-col transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {img ? (
          <img
            src={imgUrl(img, 640)}
            srcSet={imgSrcSet(img, CAR_IMAGE_WIDTHS.slice(0, 3))}
            sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
            alt={`${car.brand} ${car.model} ${car.year}`}
            width={640}
            height={400}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        ) : (
          // No stock photo stand-in: a generic picture of another car would mislead.
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden />
            <span className="text-xs">Fotografii în curând</span>
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={car.status} />
            {isRecent(car.created_at) && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
                Nou
              </span>
            )}
            {car.is_featured && (
              <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
                Recomandat
              </span>
            )}
          </div>
          {drop && (
            <span className="flex-shrink-0 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground backdrop-blur">
              Reducere −{drop.percent}%
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight leading-tight">
              {car.brand} {car.model}
            </h3>
            {car.version && <div className="text-sm text-muted-foreground">{car.version}</div>}
          </div>
          <div className="text-right">
            {drop && (
              <div className="text-xs font-medium text-muted-foreground line-through">
                {fmtPrice(drop.original, car.currency)}
              </div>
            )}
            <div className={`font-display text-xl font-bold ${drop ? "text-destructive" : ""}`}>
              {fmtPrice(car.price, car.currency)}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <Spec icon={<Calendar className="h-3.5 w-3.5" />} label={String(car.year)} />
          <Spec icon={<Gauge className="h-3.5 w-3.5" />} label={fmtKm(car.mileage)} />
          <Spec icon={<Fuel className="h-3.5 w-3.5" />} label={car.fuel_type} />
          <Spec icon={<Cog className="h-3.5 w-3.5" />} label={car.transmission} />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground" aria-hidden>
            Vezi detalii →
          </span>
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
