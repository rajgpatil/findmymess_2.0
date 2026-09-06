import * as React from "react";
import {
  Search,
  MapPin,
  Navigation,
  Bike,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function Money({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const formatted =
    typeof amount === "number" ? amount.toLocaleString("en-IN") : "0";
  return <span className={cn("tabular-nums", className)}>₹{formatted}</span>;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="fmm-section-title truncate">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="fmm-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend ? (
          <span
            className={cn(
              "font-semibold",
              trend.positive ? "text-success" : "text-destructive",
            )}
          >
            {trend.value}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

export function SearchBar({
  placeholder = "Search for restaurants or dishes",
  location,
  value,
  onChange,
  className,
}: {
  placeholder?: string;
  location?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-card focus-within:border-primary/50 focus-within:shadow-focus",
        className,
      )}
    >
      {location ? (
        <>
          <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
            <MapPin className="size-4 text-primary shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {location}
            </span>
          </span>
          <span className="h-6 w-px bg-border shrink-0" />
        </>
      ) : null}
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-sm"
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fmm-surface flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-base font-bold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="fmm-surface overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function MapPlaceholder({
  className,
  label = "Live map",
  riderLabel = "Rider",
}: {
  className?: string;
  label?: string;
  riderLabel?: string;
}) {
  return (
    <div
      className={cn(
        "fmm-map-grid relative overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <div className="absolute inset-0">
        <div className="absolute top-[62%] left-0 h-1 w-full -rotate-6 bg-border-strong/70" />
        <div className="absolute top-0 left-[38%] h-full w-1 rotate-3 bg-border-strong/70" />
        <svg
          className="absolute inset-0 size-full"
          viewBox="0 0 400 240"
          fill="none"
          aria-hidden
        >
          <path
            d="M60 190 C 130 170, 150 110, 220 100 S 320 70, 350 50"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray="8 7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <span className="absolute top-3 left-3 rounded-md bg-surface/90 px-2 py-1 text-xs font-semibold backdrop-blur">
        {label}
      </span>

      <span className="absolute bottom-[16%] left-[12%] flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold shadow-card">
        <MapPin className="size-3.5 text-primary" /> Pickup
      </span>
      <span className="absolute top-[14%] right-[10%] flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold shadow-card">
        <Navigation className="size-3.5 text-success" /> Drop
      </span>
      <span className="absolute top-[42%] left-[46%] flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-raised">
        <Bike className="size-3.5" /> {riderLabel}
      </span>
    </div>
  );
}
