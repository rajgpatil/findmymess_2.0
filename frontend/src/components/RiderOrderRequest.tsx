import { useEffect, useState } from "react";
import { riderService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";
import { Pill } from "./fmm/status-badge";
import { Button } from "./ui/button";
import { Clock, Check, X, Bike } from "lucide-react";

interface Props {
  orderId: string;
  onAccepted: () => void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAccepted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onAccepted]);

  const acceptOrder = async () => {
    try {
      setAccepting(true);
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Order accepted! Proceed to pickup.");
      onAccepted();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to accept order");
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-success/50 bg-surface p-4 shadow-card transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between">
        <Pill tone="success">New Delivery Request</Pill>
        <span className="flex items-center gap-1 text-xs font-bold text-destructive tabular-nums">
          <Clock className="size-3.5" />
          00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-success/15 text-success">
          <Bike className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-foreground">
            Order #{orderId.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            New trip ready for dispatch
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={onAccepted}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" /> Skip
        </Button>
        <Button
          size="sm"
          disabled={accepting}
          onClick={acceptOrder}
          className="bg-success text-success-foreground hover:bg-success/90 font-bold px-4"
        >
          <Check className="size-4" />
          {accepting ? "Accepting..." : "Accept Order"}
        </Button>
      </div>
    </div>
  );
};

export default RiderOrderRequest;
