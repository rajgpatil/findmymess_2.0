import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import MenuItems from "../components/MenuItems";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import {
  SearchBar,
  Money,
  EmptyState,
  LoadingCard,
} from "@/components/fmm/primitives";
import { Pill } from "@/components/fmm/status-badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Clock,
  MapPin,
  Share2,
  Heart,
  ArrowLeft,
  Home,
  Receipt,
  Bike,
  User,
} from "lucide-react";
import { useAppData } from "../context/AppContext";
import coverPlaceholder from "@/assets/restaurant-cover.jpg";
import toast from "react-hot-toast";

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subTotal, quauntity, user } = useAppData();

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuSearch, setMenuSearch] = useState("");

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurant(data || null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenuItems();
    }
  }, [id]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "RP";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(menuSearch.toLowerCase());
      return matchesSearch;
    });
  }, [menuItems, menuSearch]);

  const customerNav: NavItem[] = [
    { label: "Home", to: "/", icon: Home },
    { label: "Orders", to: "/orders", icon: Receipt },
    { label: "Track", to: "/orders", icon: Bike },
    { label: "Account", to: "/account", icon: User },
  ];

  if (loading) {
    return (
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="space-y-6">
          <LoadingCard />
          <div className="grid gap-4 sm:grid-cols-2">
            <LoadingCard />
            <LoadingCard />
          </div>
        </div>
      </CustomerShell>
    );
  }

  if (!restaurant) {
    return (
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <EmptyState
          title="Restaurant not found"
          description="The mess you are looking for may have been removed or does not exist."
          action={
            <Button onClick={() => navigate("/")}>Browse Nearby Messes</Button>
          }
        />
      </CustomerShell>
    );
  }

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to nearby messes
          </Button>
        </div>

        {/* Restaurant Header Surface */}
        <div className="fmm-surface overflow-hidden shadow-raised">
          <div className="relative h-48 sm:h-64 w-full bg-muted">
            <img
              src={restaurant.image || coverPlaceholder}
              alt={restaurant.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => toast.success("Saved to favorites")}
                className="size-9 rounded-full bg-surface/80 backdrop-blur shadow-sm hover:bg-surface"
              >
                <Heart className="size-4 text-primary" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied to clipboard");
                }}
                className="size-9 rounded-full bg-surface/80 backdrop-blur shadow-sm hover:bg-surface"
              >
                <Share2 className="size-4 text-foreground" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 p-5 sm:p-6">
            <div className="min-w-0 space-y-2">
              <h1 className="truncate font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                {restaurant.name}
              </h1>

              {restaurant.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {restaurant.description}
                </p>
              )}

              <p className="flex items-start gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {restaurant.autoLocation?.formattedAddress ||
                    "Location not specified"}
                </span>
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {restaurant.isOpen ? (
                  <Pill tone="success">Open now</Pill>
                ) : (
                  <Pill tone="danger">Closed</Pill>
                )}
                <Pill tone="brand">Fresh Mess Food</Pill>
                <Pill tone="neutral">Free delivery over ₹250</Pill>
              </div>
            </div>

            <div className="shrink-0 space-y-2 text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-success-soft px-2.5 py-1.5 text-sm font-bold text-success">
                <Star className="size-4 fill-current" /> 4.5
              </span>
              <p className="text-xs text-muted-foreground">Verified Mess</p>
              <p className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" /> 20-30 min
              </p>
            </div>
          </div>
        </div>

        {/* Menu Search */}
        <div className="mt-6">
          <SearchBar
            placeholder="Search within this menu..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
          />
        </div>

        {/* Menu Items Section */}
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="fmm-section-title">
              Menu Items ({filteredItems.length})
            </h2>
          </div>

          <MenuItems
            isSeller={false}
            items={filteredItems}
            onItemDeleted={() => {}}
          />
        </section>
      </CustomerShell>

      {/* Floating Sticky Cart Bar */}
      {quauntity > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-6">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl bg-foreground px-4 py-3 text-background shadow-raised backdrop-blur">
            <p className="text-sm font-semibold">
              {quauntity} item{quauntity > 1 ? "s" : ""} ·{" "}
              <Money amount={subTotal} />
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/cart")}
              className="font-bold shadow-sm"
            >
              View Cart
            </Button>
          </div>
        </div>
      )}

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default RestaurantPage;
