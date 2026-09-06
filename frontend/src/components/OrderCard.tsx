import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { ORDER_ACTIONS } from "../utils/orderflow";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { StatusBadge, type OrderStatus } from "./fmm/status-badge";
import { Money } from "./fmm/primitives";
import { Button } from "./ui/button";
import { RotateCcw, ArrowRight } from "lucide-react";

interface Props {
  order: IOrder;
  onStatusUpdate?: () => void;
}

const OrderCard = ({ order, onStatusUpdate }: Props) => {
  const [loading, setLoading] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);

  const actions = ORDER_ACTIONS[order.status] || [];

  useEffect(() => {
    if (order.status !== "ready_for_rider") {
      setRetryVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setRetryVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [order.status]);

  const updateStatus = async (status: string) => {
    try {
      setLoading(true);
      setRetryVisible(false);
      await axios.put(
        `${restaurantService}/api/order/${order._id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(`Order marked as ${status.replaceAll("_", " ")}`);
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accept Order";
      case "preparing":
        return "Start Cooking";
      case "ready_for_rider":
        return "Mark Ready";
      case "picked_up":
        return "Handover to Rider";
      default:
        return `Mark as ${status.replaceAll("_", " ")}`;
    }
  };

  return (
    <div className="fmm-surface p-4 sm:p-5 flex flex-col justify-between gap-3 transition-shadow hover:shadow-card">
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm font-bold text-foreground">
              #{order._id.slice(-6).toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ·{" "}
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <StatusBadge status={order.status as OrderStatus} />
        </div>

        {/* Order Items list */}
        <div className="mt-3 space-y-1.5 text-sm">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {item.name}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  × {item.quauntity}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border/80 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {order.paymentStatus === "paid" ? "Prepaid" : "Payment Pending"}
          </span>
          <span className="text-base font-bold text-foreground">
            <Money amount={order.totalAmount} />
          </span>
        </div>

        {order.paymentStatus === "paid" && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map((status) => (
              <Button
                key={status}
                size="sm"
                disabled={loading}
                onClick={() => updateStatus(status)}
                className="flex-1 min-w-32"
              >
                {getActionLabel(status)}
                <ArrowRight className="size-3.5" />
              </Button>
            ))}
          </div>
        )}

        {order.status === "ready_for_rider" && retryVisible && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/30 text-primary hover:bg-primary-soft"
              disabled={loading}
              onClick={() => updateStatus("ready_for_rider")}
            >
              <RotateCcw className="size-3.5" />
              Retry Ready for Rider Broadcast
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
