import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState, useMemo } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantCard from "../components/RestaurantCard";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import {
  SearchBar,
  SectionHeading,
  EmptyState,
  LoadingCard,
} from "@/components/fmm/primitives";
import { Home as HomeIcon, Receipt, Bike, User, Utensils } from "lucide-react";

const CATEGORIES = [
  "All",
  "Thali",
  "Biryani",
  "Paneer",
  "Rolls",
  "South Indian",
  "Chinese",
  "Desserts",
  "Beverages",
];

const Home = () => {
  const { location, city, user, quauntity } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search update to URL params
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const fetchRestaurants = async () => {
    if (!location?.latitude || !location?.longitude) {
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/all`,
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            search: searchParam,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurants(data.restaurants ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, searchParam]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "RP";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const customerNav: NavItem[] = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Orders", to: "/orders", icon: Receipt },
    { label: "Track", to: "/orders", icon: Bike },
    { label: "Account", to: "/account", icon: User },
  ];

  return (
    <>
      <CustomerShell
        cartCount={quauntity}
        userInitials={userInitials}
        sub={
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <SearchBar
              location={city}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for messes, dishes or cuisines..."
            />
          </div>
        }
      >
        {/* Category Carousel */}
        <section className="space-y-3 mb-8">
          <SectionHeading title="What are you craving?" />
          <div className="fmm-scroll-x flex gap-2 pb-2">
            {CATEGORIES.map((c) => {
              const isSelected = selectedCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary-soft text-primary shadow-sm"
                      : "border-border bg-surface text-foreground hover:border-border-strong hover:bg-muted/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </section>

        {/* Restaurant List Section */}
        <section className="space-y-4">
          <SectionHeading
            title="Recommended near you"
            subtitle={
              loading
                ? "Locating nearby messes..."
                : `${restaurants.length} messes delivering to your area`
            }
          />

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((res) => {
                const [resLng, resLat] = res.autoLocation.coordinates;
                const distance = location
                  ? getDistanceKm(
                      location.latitude,
                      location.longitude,
                      resLat,
                      resLng,
                    )
                  : 0;

                return (
                  <RestaurantCard
                    key={res._id}
                    id={res._id}
                    name={res.name}
                    image={res.image ?? ""}
                    distance={`${distance}`}
                    isOpen={res.isOpen}
                    cuisines="North Indian · Maharashtrian · Thali"
                    priceForTwo={250}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Utensils}
              title="No restaurants found"
              description={
                search
                  ? `No matches found for "${search}". Try searching with a different term.`
                  : "We couldn't find any open messes near your location right now."
              }
              action={
                search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    Clear Search
                  </button>
                ) : undefined
              }
            />
          )}
        </section>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default Home;
