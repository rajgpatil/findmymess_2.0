import * as React from "react";
import { Star, Clock, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Money } from "./primitives";
import { Pill } from "./status-badge";

export function RestaurantCard({
  name,
  image,
  cuisines,
  rating = 4.5,
  eta = "25-30 min",
  distance,
  priceForTwo,
  offer,
  closed,
  onClick,
}: {
  name: string;
  image: string;
  cuisines?: string;
  rating?: number;
  eta?: string;
  distance?: string;
  priceForTwo?: number;
  offer?: string;
  closed?: boolean;
  onClick?: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "fmm-surface group overflow-hidden transition-shadow hover:shadow-raised cursor-pointer",
        closed && "opacity-80",
      )}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className={cn(
            "h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
            closed && "grayscale",
          )}
        />
        {offer ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
            {offer}
          </span>
        ) : null}
        {closed ? (
          <span className="absolute inset-0 grid place-items-center bg-foreground/45 text-sm font-bold text-background">
            Currently closed
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h3 className="truncate font-display text-base font-bold">{name}</h3>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-bold text-success">
            <Star className="size-3 fill-current" />
            {rating.toFixed(1)}
          </span>
        </div>
        {cuisines ? (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {cuisines}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {eta}
          </span>
          {distance ? <span>{distance} KM away</span> : null}
          {priceForTwo ? (
            <span className="ml-auto">
              <Money amount={priceForTwo} /> for two
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FoodCard({
  name,
  description,
  price,
  image,
  veg = true,
  rating,
  qty = 0,
  bestseller,
  isAvailable = true,
  isLoading = false,
  onAdd,
  onInc,
  onDec,
  actions,
}: {
  name: string;
  description?: string;
  price: number;
  image?: string;
  veg?: boolean;
  rating?: number;
  qty?: number;
  bestseller?: boolean;
  isAvailable?: boolean;
  isLoading?: boolean;
  onAdd?: () => void;
  onInc?: () => void;
  onDec?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "fmm-surface flex gap-4 p-4 transition-opacity",
        !isAvailable && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegMark veg={veg} />
          {bestseller ? <Pill tone="accent">Bestseller</Pill> : null}
          {!isAvailable ? <Pill tone="danger">Not Available</Pill> : null}
        </div>
        <h3 className="mt-2 font-display text-base font-bold">{name}</h3>
        <p className="mt-1 text-sm font-semibold text-foreground">
          <Money amount={price} />
        </p>
        {rating ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
            <Star className="size-3 fill-current" /> {rating.toFixed(1)}
          </p>
        ) : null}
        {description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="relative w-28 shrink-0 sm:w-32 flex flex-col items-center">
        {image ? (
          <div className="relative h-28 w-full rounded-lg overflow-hidden sm:h-32">
            <img
              src={image}
              alt={name}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover",
                !isAvailable && "grayscale brightness-75",
              )}
            />
          </div>
        ) : null}
        <div className="mt-2">
          {actions ? (
            actions
          ) : qty > 0 ? (
            <QtyStepper
              qty={qty}
              onInc={onInc}
              onDec={onDec}
              isLoading={isLoading}
            />
          ) : (
            <Button
              size="sm"
              disabled={!isAvailable || isLoading}
              onClick={onAdd}
              className="px-5 shadow-raised"
            >
              {isLoading ? "Adding..." : "Add"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function VegMark({ veg = true }: { veg?: boolean }) {
  return (
    <span
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[3px] border",
        veg ? "border-success" : "border-destructive",
      )}
      aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          veg ? "bg-success" : "bg-destructive",
        )}
      />
    </span>
  );
}

export function QtyStepper({
  qty,
  onInc,
  onDec,
  isLoading = false,
  className,
}: {
  qty: number;
  onInc?: () => void;
  onDec?: () => void;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-primary/30 bg-surface p-0.5 shadow-card",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isLoading}
        onClick={onDec}
        className="size-7 text-primary hover:bg-primary-soft"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="w-5 text-center text-sm font-bold tabular-nums">
        {qty}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isLoading}
        onClick={onInc}
        className="size-7 text-primary hover:bg-primary-soft"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
