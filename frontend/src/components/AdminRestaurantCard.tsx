import axios from "axios";
import { adminService } from "../main";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import { Pill } from "./fmm/status-badge";
import { Store, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  restaurant: any;
  onVerify: () => void;
}

const AdminRestaurantCard = ({ restaurant, onVerify }: Props) => {
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `${adminService}/api/v1/verify/restaurant/${restaurant._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Restaurant verified successfully");
      onVerify();
    } catch (error) {
      toast.error("Failed to verify restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fmm-surface overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-card">
      <div>
        <div className="relative h-36 w-full bg-surface-muted overflow-hidden">
          {restaurant.image ? (
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-primary/5 text-primary">
              <Store className="size-10 opacity-30" />
            </div>
          )}
          <div className="absolute top-2.5 right-2.5">
            <Pill tone="warning">Pending Verification</Pill>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-display font-bold text-base text-foreground truncate">
            {restaurant.name}
          </h3>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5 text-primary shrink-0" />
            <span>{restaurant.phone || "No phone listed"}</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {restaurant.autoLocation?.formattedAddress ||
                "Address not specified"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button
          className="w-full bg-success text-success-foreground hover:bg-success/90 font-bold"
          size="sm"
          disabled={loading}
          onClick={verify}
        >
          <CheckCircle2 className="size-4" />
          {loading ? "Verifying..." : "Verify Restaurant"}
        </Button>
      </div>
    </div>
  );
};

export default AdminRestaurantCard;
