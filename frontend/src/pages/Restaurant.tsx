import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";
import { DashboardShell, type NavItem } from "../components/fmm/app-shell";
import { StatCard, SectionHeading } from "../components/fmm/primitives";
import { Switch } from "../components/ui/switch";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  IndianRupee,
  ShoppingBag,
  Clock,
  Star,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import toast from "react-hot-toast";

type SellerTab = "dashboard" | "orders" | "menu" | "settings";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("dashboard");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurant(data.restaurant || null);

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (restaurant?._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  const toggleOpenStatus = async () => {
    if (!restaurant) return;
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !restaurant.isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      setRestaurant(data.restaurant);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to toggle status");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading your mess partner dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      to: "#dashboard",
      icon: LayoutDashboard,
      badge: undefined,
    },
    { label: "Orders", to: "#orders", icon: ClipboardList, badge: undefined },
    {
      label: "Menu Items",
      to: "#menu",
      icon: UtensilsCrossed,
      badge: `${menuItems.length}`,
    },
    { label: "Mess Settings", to: "#settings", icon: Settings },
  ];

  return (
    <DashboardShell
      role="Restaurant partner"
      items={navItems}
      activeTo={`#${tab}`}
      title={restaurant.name}
      subtitle={restaurant.autoLocation?.formattedAddress || "Warje, Pune"}
      actions={
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 shadow-xs hover:border-primary/40 transition">
            <Switch
              checked={restaurant.isOpen}
              onCheckedChange={toggleOpenStatus}
            />
            <span
              className={`text-xs font-bold ${restaurant.isOpen ? "text-success" : "text-destructive"}`}
            >
              {restaurant.isOpen ? "OPEN" : "CLOSED"}
            </span>
          </label>
        </div>
      }
    >
      {/* Navigation Pill Bar for Quick Mode Switching */}
      <div className="fmm-scroll-x flex gap-2 border-b border-border pb-3">
        {[
          {
            key: "dashboard",
            label: "Overview & Orders",
            icon: LayoutDashboard,
          },
          { key: "orders", label: "Order Pipeline", icon: ClipboardList },
          { key: "menu", label: "Menu Management", icon: UtensilsCrossed },
          { key: "settings", label: "Mess Profile", icon: Settings },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as SellerTab)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Dashboard Overview */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* 4 KPI stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's revenue"
              value="₹14,850"
              icon={IndianRupee}
              trend={{ value: "+12.4%", positive: true }}
              hint="vs yesterday"
            />
            <StatCard
              label="Active Menu Items"
              value={`${menuItems.length}`}
              icon={ShoppingBag}
              hint="in catalog"
            />
            <StatCard
              label="Avg prep time"
              value="15 min"
              icon={Clock}
              trend={{ value: "-2 min", positive: true }}
              hint="kitchen turnaround"
            />
            <StatCard
              label="Customer Rating"
              value="4.7"
              icon={Star}
              hint="verified reviews"
            />
          </div>

          {/* Quick Order Pipeline */}
          <div className="space-y-4">
            <SectionHeading
              title="Live Order Queue"
              subtitle="Orders currently in progress"
            />
            <RestaurantOrders restaurantId={restaurant._id} />
          </div>
        </div>
      )}

      {/* Tab: Orders Pipeline Only */}
      {tab === "orders" && (
        <div className="space-y-4">
          <SectionHeading
            title="Order Management"
            subtitle="Full kitchen workflow and dispatch queue"
          />
          <RestaurantOrders restaurantId={restaurant._id} />
        </div>
      )}

      {/* Tab: Menu Management */}
      {tab === "menu" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Menu Management
              </h2>
              <p className="text-xs text-muted-foreground">
                {menuItems.length} dishes in your food catalogue
              </p>
            </div>

            {/* Add Item Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" /> Add New Dish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                </DialogHeader>
                <AddMenuItem
                  onItemAdded={() => {
                    setIsAddDialogOpen(false);
                    fetchMenuItems(restaurant._id);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <MenuItems
            items={menuItems}
            onItemDeleted={() => fetchMenuItems(restaurant._id)}
            isSeller={true}
          />
        </div>
      )}

      {/* Tab: Mess Profile & Settings */}
      {tab === "settings" && (
        <div className="max-w-3xl space-y-6">
          <SectionHeading
            title="Mess Profile & Details"
            subtitle="Manage your restaurant listing, photos, and contact info"
          />
          <RestaurantProfile
            restaurant={restaurant}
            onUpdate={setRestaurant}
            isSeller={true}
          />
        </div>
      )}
    </DashboardShell>
  );
};

export default Restaurant;
