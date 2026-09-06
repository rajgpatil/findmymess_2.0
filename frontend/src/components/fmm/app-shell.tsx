import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu, ShoppingCart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FmmLogo } from "./logo";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  onClick?: () => void;
};

function NavList({ items, activeTo }: { items: NavItem[]; activeTo?: string }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = activeTo === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={item.onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  items,
  activeTo,
  role,
}: {
  items: NavItem[];
  activeTo?: string;
  role: string;
}) {
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4">
      <div className="px-2 pt-2">
        <FmmLogo tone="invert" size="md" />
        <p className="mt-1 text-xs font-medium text-sidebar-foreground/55">
          {role}
        </p>
      </div>
      <NavList items={items} activeTo={activeTo} />
      <div className="mt-auto rounded-xl bg-sidebar-accent p-3">
        <p className="text-xs font-semibold text-sidebar-accent-foreground">
          Need help?
        </p>
        <p className="mt-1 text-xs text-sidebar-foreground/60">
          Support is available 24×7.
        </p>
      </div>
    </div>
  );
}

/** Sidebar + header layout used by the Restaurant and Admin themes. */
export function DashboardShell({
  role,
  items,
  activeTo,
  title,
  subtitle,
  actions,
  userInitials = "RP",
  children,
}: {
  role: string;
  items: NavItem[];
  activeTo?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userInitials?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarBody items={items} activeTo={activeTo} role={role} />
        </div>
      </aside>

      <div className="min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody items={items} activeTo={activeTo} role={role} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 lg:col-start-2">
            <h1 className="truncate font-display text-lg font-bold sm:text-xl text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
            </Button>
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}

/** Top-nav layout used by the Customer theme. */
export function CustomerShell({
  children,
  cartCount = 0,
  userInitials = "RP",
  sub,
}: {
  children: React.ReactNode;
  cartCount?: number;
  userInitials?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/">
            <FmmLogo size="md" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/orders"
              className="hidden text-sm font-semibold text-foreground/80 hover:text-primary sm:block"
            >
              Orders
            </Link>
            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted text-foreground"
            >
              <ShoppingCart className="size-5" />
              <span className="hidden sm:inline font-semibold">Cart</span>
              {cartCount > 0 ? (
                <span className="absolute top-0.5 left-5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <Link to="/account">
              <Avatar className="size-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/20 transition">
                <AvatarFallback className="bg-primary-soft text-primary text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
        {sub ? (
          <div className="border-t border-border bg-surface">{sub}</div>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

/** Mobile-first shell for the Rider theme. */
export function RiderShell({
  children,
  title,
  right,
}: {
  children: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-24">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <FmmLogo size="sm" />
            <p className="truncate font-display text-base font-bold text-foreground">
              {title}
            </p>
          </div>
          {right}
        </header>
        <main className="space-y-4 p-4">{children}</main>
      </div>
    </div>
  );
}

export function MobileTabBar({
  items,
}: {
  items: NavItem[];
  activeTo?: string;
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const active = currentPath === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.onClick}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
