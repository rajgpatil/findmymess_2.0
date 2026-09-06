import axios from "axios";
import type { IOrder } from "../types";
import { riderService } from "../main";
import toast from "react-hot-toast";
import { Money } from "./fmm/primitives";
import { StatusBadge, type OrderStatus } from "./fmm/status-badge";
import { Button } from "./ui/button";
import { Store, MapPin, Phone, Check, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Props {
  order: IOrder;
  onStatusUpdate: () => void;
}

const flowSteps = ["Assigned", "At Store", "Picked Up", "Delivered"];

const getStepIndex = (status: string) => {
  switch (status) {
    case "rider_assigned":
      return 1;
    case "picked_up":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
};

const RiderCurrentOrder = ({ order, onStatusUpdate }: Props) => {
  const [loading, setLoading] = useState(false);
  const currentStep = getStepIndex(order.status);

  const updateStatus = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${riderService}/api/rider/order/update/${order._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Order status updated successfully!");
      onStatusUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 4-Step Status Flow */}
      <div className="fmm-surface p-4">
        <div className="flex items-center justify-between">
          {flowSteps.map((step, i) => (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-7 place-items-center rounded-full text-[11px] font-bold ${
                    i < currentStep
                      ? "bg-success text-success-foreground"
                      : i === currentStep
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    i === currentStep
                      ? "text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < flowSteps.length - 1 ? (
                <span
                  className={`mx-1 mb-4 h-0.5 flex-1 transition-colors ${
                    i < currentStep ? "bg-success" : "bg-border"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Pickup and Drop Details */}
      <div className="fmm-surface divide-y divide-border overflow-hidden">
        {/* Pickup */}
        <div className="flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <Store className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pickup Point
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {order.restaurantName || "Mess Partner"}
            </p>
            <p className="text-xs text-muted-foreground">
              Collect hot packaged food
            </p>
          </div>
          <StatusBadge status={order.status as OrderStatus} />
        </div>

        {/* Drop */}
        <div className="flex gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery Drop
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              {order.deliveryAddress?.fromattedAddress || "Customer address"}
            </p>
            {order.deliveryAddress?.mobile && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Contact: {order.deliveryAddress.mobile}
              </p>
            )}
          </div>

          {order.deliveryAddress?.mobile && (
            <Button
              size="icon"
              variant="outline"
              asChild
              className="size-9 shrink-0 border-border text-foreground hover:bg-surface-muted"
            >
              <a
                href={`tel:${order.deliveryAddress.mobile}`}
                aria-label="Call customer"
              >
                <Phone className="size-4 text-primary" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Payout & Order Items Card */}
      <div className="fmm-surface p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <p className="font-mono text-sm font-bold text-foreground">
              Order #{order._id.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.items?.length || 0} item(s) to deliver
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Your Payout
            </p>
            <p className="text-base font-bold text-success">
              <Money amount={order.riderAmount || 45} />
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {order.items?.map((it, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {it.name} × {it.quauntity}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {order.status === "rider_assigned" && (
            <Button
              size="lg"
              disabled={loading}
              onClick={updateStatus}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            >
              {loading ? "Updating..." : "Reached Restaurant / Picked Up"}
              <ArrowRight className="size-4" />
            </Button>
          )}

          {order.status === "picked_up" && (
            <Button
              size="lg"
              disabled={loading}
              onClick={updateStatus}
              className="w-full bg-success text-success-foreground hover:bg-success/90 font-bold"
            >
              <Check className="size-4" />
              {loading ? "Completing..." : "Confirm Delivered to Customer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderCurrentOrder;
