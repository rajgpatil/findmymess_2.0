import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        brand: "bg-primary-soft text-primary",
        accent: "bg-accent-soft text-accent-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning-foreground",
        danger: "bg-danger-soft text-destructive",
        info: "bg-info-soft text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type OrderStatus =
  | "new"
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "ready_for_rider"
  | "rider_assigned"
  | "picked_up"
  | "en_route"
  | "completed"
  | "delivered"
  | "cancelled"
  | "pending"
  | "active"
  | "blocked"
  | string;

const statusMap: Record<
  string,
  { label: string; tone: VariantProps<typeof statusBadgeVariants>["tone"] }
> = {
  new: { label: "New", tone: "brand" },
  placed: { label: "Placed", tone: "brand" },
  accepted: { label: "Accepted", tone: "info" },
  preparing: { label: "Preparing", tone: "warning" },
  ready: { label: "Ready", tone: "accent" },
  ready_for_rider: { label: "Ready for Rider", tone: "accent" },
  rider_assigned: { label: "Rider Assigned", tone: "info" },
  picked_up: { label: "Picked up", tone: "info" },
  en_route: { label: "En route", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  pending: { label: "Pending", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  blocked: { label: "Blocked", tone: "danger" },
};

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: OrderStatus;
  className?: string;
  dot?: boolean;
}) {
  const normalized = status?.toLowerCase() || "pending";
  const { label, tone } = statusMap[normalized] || {
    label: status ? status.replaceAll("_", " ") : "Unknown",
    tone: "neutral",
  };
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      <span className="capitalize">{label}</span>
    </span>
  );
}

export function Pill({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: VariantProps<typeof statusBadgeVariants>["tone"];
  className?: string;
}) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      {children}
    </span>
  );
}
