import { useEffect, useState, useMemo } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService } from "../main";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { StatusBadge } from "@/components/fmm/status-badge";
import { Money, SectionHeading, EmptyState } from "@/components/fmm/primitives";
import { Button } from "@/components/ui/button";
import { Receipt, ArrowRight, Home, Bike, User } from "lucide-react";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const Orders = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { quauntity, user } = useAppData();

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/myorder`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrders();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  const userInitials = useMemo(() => {
    if (!user?.name) return "RP";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const customerNav: NavItem[] = [
    { label: "Home", to: "/", icon: Home },
    { label: "Orders", to: "/orders", icon: Receipt },
    { label: "Track", to: "/orders", icon: Bike },
    { label: "Account", to: "/account", icon: User },
  ];

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          My Orders
        </h1>

        {loading ? (
          <p className="text-sm text-muted-foreground mt-6">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Receipt}
              title="No orders yet"
              description="You haven't placed any orders with FindMyMess yet. Order from your favorite mess!"
              action={
                <Button onClick={() => navigate("/")} className="shadow-raised">
                  Browse Messes
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Active Orders Section */}
            <section className="space-y-3">
              <SectionHeading
                title={`Active Orders (${activeOrders.length})`}
                subtitle="Live updates on preparing and en route deliveries"
              />

              {activeOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active orders right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map((order) => (
                    <OrderCardRow
                      key={order._id}
                      order={order}
                      isActive={true}
                      onClick={() => navigate(`/order/${order._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Completed Orders Section */}
            <section className="space-y-3">
              <SectionHeading
                title={`Past Orders (${completedOrders.length})`}
                subtitle="Delivered and cancelled order history"
              />

              {completedOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No completed orders yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {completedOrders.map((order) => (
                    <OrderCardRow
                      key={order._id}
                      order={order}
                      isActive={false}
                      onClick={() => navigate(`/order/${order._id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default Orders;

function OrderCardRow({
  order,
  isActive,
  onClick,
}: {
  order: IOrder;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`fmm-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:shadow-raised ${
        isActive ? "border-primary/40 shadow-sm" : ""
      }`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm sm:text-base font-bold text-foreground">
            Order #{order._id.slice(-6)}
          </p>
          <StatusBadge status={order.status} />
        </div>

        <p className="truncate text-xs sm:text-sm font-semibold text-foreground">
          {order.restaurantName || "Mess Order"}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {order.items.map((it) => `${it.name} × ${it.quauntity}`).join(", ")}
        </p>
      </div>

      <div className="text-right space-y-1">
        <p className="font-display text-base font-bold text-foreground tabular-nums">
          <Money amount={order.totalAmount} />
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 gap-1"
        >
          {isActive ? "Track live" : "View details"}{" "}
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </article>
  );
}
