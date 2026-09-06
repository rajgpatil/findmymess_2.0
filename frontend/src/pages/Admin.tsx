import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import { DashboardShell, type NavItem } from "../components/fmm/app-shell";
import {
  StatCard,
  SectionHeading,
  EmptyState,
} from "../components/fmm/primitives";
import {
  LayoutDashboard,
  Store,
  Bike,
  Users,
  ShoppingBag,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/button";

type AdminTab = "overview" | "restaurant" | "rider";

const adminNavItems: NavItem[] = [
  { label: "Overview", to: "#overview", icon: LayoutDashboard },
  { label: "Restaurants", to: "#restaurant", icon: Store },
  { label: "Riders", to: "#rider", icon: Bike },
];

const mockRevenueSeries = [
  { day: "Mon", revenue: 14200, orders: 48 },
  { day: "Tue", revenue: 16800, orders: 54 },
  { day: "Wed", revenue: 19500, orders: 62 },
  { day: "Thu", revenue: 17400, orders: 58 },
  { day: "Fri", revenue: 23100, orders: 74 },
  { day: "Sat", revenue: 28900, orders: 92 },
  { day: "Sun", revenue: 26400, orders: 85 },
];

const maxRev = Math.max(...mockRevenueSeries.map((d) => d.revenue));
const maxOrd = Math.max(...mockRevenueSeries.map((d) => d.orders));

const Admin = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${adminService}/api/v1/admin/restaurant/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const response = await axios.get(
        `${adminService}/api/v1/admin/rider/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurants(data.restaurants || []);
      setRiders(response.data.riders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPending = (restaurants?.length || 0) + (riders?.length || 0);

  return (
    <DashboardShell
      role="Platform admin"
      items={adminNavItems}
      activeTo={`#${tab}`}
      title="Platform Operations"
      subtitle="FindMyMess partner verifications and platform telemetry"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* Navigation tabs */}
      <div className="fmm-scroll-x flex gap-2 border-b border-border pb-3">
        {[
          {
            key: "overview",
            label: "Overview & Analytics",
            icon: LayoutDashboard,
          },
          {
            key: "restaurant",
            label: `Pending Restaurants (${restaurants.length})`,
            icon: Store,
          },
          {
            key: "rider",
            label: `Pending Riders (${riders.length})`,
            icon: Bike,
          },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as AdminTab)}
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

      {tab === "overview" && (
        <div className="space-y-6">
          {/* KPI Stat Cards matching Theme */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard
              label="Total users"
              value="12,480"
              icon={Users}
              trend={{ value: "+4.1%", positive: true }}
              hint="registered accounts"
            />
            <StatCard
              label="Restaurants"
              value="342"
              icon={Store}
              trend={{ value: "+9", positive: true }}
              hint="active kitchens"
            />
            <StatCard
              label="Riders"
              value="878"
              icon={Bike}
              trend={{ value: "+21", positive: true }}
              hint="active delivery fleet"
            />
            <StatCard
              label="Orders"
              value="9,214"
              icon={ShoppingBag}
              trend={{ value: "+7.6%", positive: true }}
              hint="completed this month"
            />
            <StatCard
              label="Gross Volume"
              value="₹18.4L"
              icon={IndianRupee}
              trend={{ value: "+12.3%", positive: true }}
              hint="platform GMV"
            />
            <StatCard
              label="Pending Verifications"
              value={`${totalPending}`}
              icon={ShieldCheck}
              trend={{
                value: `${totalPending} items`,
                positive: totalPending === 0,
              }}
              hint="needs manual review"
            />
          </div>

          {/* Revenue and Orders Charts matching Theme */}
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="fmm-surface p-5">
              <SectionHeading
                title="Revenue Volume"
                subtitle="Gross merchandise value by day"
              />
              <div className="mt-6 flex h-48 items-end gap-3">
                {mockRevenueSeries.map((d) => (
                  <div
                    key={d.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {(d.revenue / 1000).toFixed(1)}k
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary/85 hover:bg-primary transition-colors"
                      style={{ height: `${(d.revenue / maxRev) * 130}px` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="fmm-surface p-5">
              <SectionHeading
                title="Daily Orders"
                subtitle="Completed deliveries across all cities"
              />
              <div className="mt-6 h-48 flex flex-col justify-between">
                <svg
                  viewBox="0 0 320 120"
                  className="size-full"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke="#e23744"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    points={mockRevenueSeries
                      .map(
                        (d, i) =>
                          `${(i / (mockRevenueSeries.length - 1)) * 310 + 5},${110 - (d.orders / maxOrd) * 90}`,
                      )
                      .join(" ")}
                  />
                  {mockRevenueSeries.map((d, i) => (
                    <circle
                      key={d.day}
                      cx={(i / (mockRevenueSeries.length - 1)) * 310 + 5}
                      cy={110 - (d.orders / maxOrd) * 90}
                      r="4"
                      fill="#e23744"
                    />
                  ))}
                </svg>
                <div className="flex justify-between text-xs text-muted-foreground">
                  {mockRevenueSeries.map((d) => (
                    <span key={d.day}>{d.day}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Quick Pending queues preview */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="fmm-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeading
                  title="Restaurants Pending"
                  subtitle="Mess onboarding verification"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTab("restaurant")}
                >
                  View all ({restaurants.length})
                </Button>
              </div>
              {restaurants.length === 0 ? (
                <EmptyState
                  title="All caught up"
                  description="No restaurants awaiting review."
                />
              ) : (
                <div className="space-y-2">
                  {restaurants.slice(0, 2).map((r) => (
                    <AdminRestaurantCard
                      key={r._id}
                      restaurant={r}
                      onVerify={fetchData}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="fmm-surface p-5 space-y-3">
              <div className="flex items-center justify-between">
                <SectionHeading
                  title="Riders Pending"
                  subtitle="Fleet KYC and vehicle check"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setTab("rider")}
                >
                  View all ({riders.length})
                </Button>
              </div>
              {riders.length === 0 ? (
                <EmptyState
                  title="All caught up"
                  description="No delivery partners awaiting review."
                />
              ) : (
                <div className="space-y-2">
                  {riders.slice(0, 2).map((r) => (
                    <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Restaurants Tab */}
      {tab === "restaurant" && (
        <div className="space-y-4">
          <SectionHeading
            title="Pending Restaurants"
            subtitle={`${restaurants.length} mess partners waiting for verification`}
          />
          {restaurants.length === 0 ? (
            <EmptyState
              title="No pending restaurants"
              description="New restaurant registrations requiring approval will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((r) => (
                <AdminRestaurantCard
                  key={r._id}
                  restaurant={r}
                  onVerify={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Riders Tab */}
      {tab === "rider" && (
        <div className="space-y-4">
          <SectionHeading
            title="Pending Riders"
            subtitle={`${riders.length} delivery partners waiting for verification`}
          />
          {riders.length === 0 ? (
            <EmptyState
              title="No pending riders"
              description="New rider registrations requiring document check will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map((r) => (
                <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
};

export default Admin;
