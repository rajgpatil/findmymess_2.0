import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState, useMemo } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import UserOrderMap from "../components/UserOrderMap";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { StatusBadge } from "@/components/fmm/status-badge";
import {
  Money,
  SectionHeading,
  EmptyState,
  MapPlaceholder,
} from "@/components/fmm/primitives";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Check,
  ChefHat,
  Package,
  Bike,
  Home as HomeIcon,
  Phone,
  ArrowLeft,
  Receipt,
  User,
} from "lucide-react";
import { useAppData } from "../context/AppContext";

interface StepConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { key: "placed", label: "Order placed", icon: Check },
  { key: "preparing", label: "Kitchen preparing", icon: ChefHat },
  { key: "picked_up", label: "Picked up by rider", icon: Package },
  { key: "en_route", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: HomeIcon },
];

const getStepIndex = (status: string): number => {
  switch (status) {
    case "placed":
      return 0;
    case "accepted":
    case "preparing":
    case "ready_for_rider":
      return 1;
    case "rider_assigned":
      return 2;
    case "picked_up":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
};

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { quauntity, user } = useAppData();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setOrder(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrder();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join", `user:${id}`);

    return () => {
      socket.emit("leave", `user:${id}`);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!socket) return;

    const onRiderLocation = ({ latitude, longitude }: any) => {
      setRiderLocation([latitude, longitude]);
    };

    socket.on("rider:location", onRiderLocation);

    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket]);

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

  if (loading) {
    return (
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <p className="text-sm text-muted-foreground py-12 text-center">
          Loading order details...
        </p>
      </CustomerShell>
    );
  }

  if (!order) {
    return (
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="py-12">
          <EmptyState
            title="Order not found"
            description="We could not locate this order. It may have expired or does not exist."
            action={
              <Button
                onClick={() => navigate("/orders")}
                className="shadow-raised"
              >
                View Your Orders
              </Button>
            }
          />
        </div>
      </CustomerShell>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to orders
          </Button>
        </div>

        {/* Order Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Order #{order._id.slice(-6)}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {order.restaurantName || "Mess Partner"} · {order.items.length}{" "}
              item{order.items.length > 1 ? "s" : ""}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* Left Column: Map and Delivery Progress */}
          <div className="space-y-6">
            {/* Live Leaflet Map or Fallback Map */}
            {(order.status === "rider_assigned" ||
              order.status === "picked_up") &&
            riderLocation &&
            order.deliveryAddress.latitude &&
            order.deliveryAddress.longitude ? (
              <UserOrderMap
                riderLocation={riderLocation}
                deliveryLocation={[
                  order.deliveryAddress.latitude,
                  order.deliveryAddress.longitude,
                ]}
              />
            ) : (
              <MapPlaceholder
                className="h-64 sm:h-80"
                label={
                  order.status === "delivered" ? "Delivered" : "Order Tracking"
                }
                riderLabel={order.riderName || "Rider"}
              />
            )}

            {/* Delivery Progress Timeline */}
            {!isCancelled && (
              <div className="fmm-surface p-5 space-y-4 shadow-card">
                <SectionHeading
                  title="Delivery Progress"
                  subtitle={
                    isDelivered
                      ? "Order successfully delivered! Enjoy your meal."
                      : "Real-time updates as your food is prepared and dispatched"
                  }
                />

                <ol className="mt-4 space-y-0">
                  {STEPS.map((step, idx) => {
                    const isDone = idx < currentStepIdx || isDelivered;
                    const isCurrent = idx === currentStepIdx && !isDelivered;
                    const Icon = step.icon;

                    return (
                      <li
                        key={step.key}
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid size-9 place-items-center rounded-full border-2 transition-all ${
                              isDone
                                ? "border-success bg-success text-success-foreground shadow-sm"
                                : isCurrent
                                  ? "border-primary bg-primary-soft text-primary ring-4 ring-primary/15"
                                  : "border-border bg-surface text-muted-foreground"
                            }`}
                          >
                            <Icon className="size-4" />
                          </span>

                          {idx < STEPS.length - 1 ? (
                            <span
                              className={`w-0.5 flex-1 min-h-[32px] ${
                                isDone ? "bg-success" : "bg-border"
                              }`}
                            />
                          ) : null}
                        </div>

                        <div
                          className={`pb-6 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}
                        >
                          <p
                            className={`text-sm font-bold ${
                              isCurrent ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isDone
                              ? "Completed"
                              : isCurrent
                                ? "In progress..."
                                : "Upcoming"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          {/* Right Column: Rider & Order Summary */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {/* Rider Card (if assigned) */}
            {order.riderName && (
              <div className="fmm-surface p-5 space-y-3 shadow-card">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-primary-soft font-bold text-primary text-sm">
                      {order.riderName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {order.riderName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delivery Partner
                    </p>
                  </div>
                </div>

                {order.riderPhone && (
                  <a
                    href={`tel:${order.riderPhone}`}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                  >
                    <Phone className="size-3.5 text-primary" /> Call Rider (
                    {order.riderPhone})
                  </a>
                )}
              </div>
            )}

            {/* Delivery Address Card */}
            <div className="fmm-surface p-5 space-y-2 shadow-card">
              <h2 className="fmm-section-title">Delivery Address</h2>
              <p className="text-xs text-foreground leading-relaxed font-medium">
                {order.deliveryAddress.fromattedAddress}
              </p>
              {order.deliveryAddress.mobile && (
                <p className="text-xs text-muted-foreground">
                  Contact: {order.deliveryAddress.mobile}
                </p>
              )}
            </div>

            {/* Order Items & Bill Breakdown */}
            <div className="fmm-surface p-5 space-y-4 shadow-card">
              <h2 className="fmm-section-title">Order Items</h2>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="truncate text-muted-foreground pr-2">
                      {item.name} × {item.quauntity}
                    </span>
                    <span className="font-semibold text-foreground shrink-0 tabular-nums">
                      <Money amount={item.price * item.quauntity} />
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    <Money amount={order.subtotal} />
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>
                    {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee</span>
                  <span>₹{order.platfromFee}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center text-sm font-bold">
                  <span>Total Paid</span>
                  <span className="text-primary text-base">
                    <Money amount={order.totalAmount} />
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground space-y-0.5">
                <p>
                  Payment: <b className="uppercase">{order.paymentMethod}</b> (
                  {order.paymentStatus})
                </p>
                <p>
                  Placed:{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default OrderPage;
