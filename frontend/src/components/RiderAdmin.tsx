import toast from "react-hot-toast";
import { adminService } from "../main";
import axios from "axios";
import { Button } from "./ui/button";
import { Pill } from "./fmm/status-badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Phone, Shield, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  rider: any;
  onVerify: () => void;
}

const RiderAdmin = ({ rider, onVerify }: Props) => {
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);
      await axios.patch(
        `${adminService}/api/v1/verify/rider/${rider._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Rider verified successfully");
      onVerify();
    } catch (error) {
      toast.error("Failed to verify rider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fmm-surface p-4 flex flex-col justify-between gap-4 transition-shadow hover:shadow-card">
      <div className="flex items-start gap-3">
        <Avatar className="size-14 ring-2 ring-primary/10 shrink-0">
          {rider.picture ? (
            <img
              src={rider.picture}
              alt="Rider"
              className="size-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-primary/10 font-bold text-primary">
              RD
            </AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">
              Rider #{rider._id.slice(-6).toUpperCase()}
            </h3>
            <Pill tone="warning">Pending</Pill>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5 text-primary shrink-0" />
            <span>{rider.phoneNumber || "No phone listed"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5 text-primary shrink-0" />
            <span>Aadhar: {rider.aadharNumber || "Not provided"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5 text-primary shrink-0" />
            <span>DL: {rider.drivingLicenseNumber || "Not provided"}</span>
          </div>
        </div>
      </div>

      <div>
        <Button
          className="w-full bg-success text-success-foreground hover:bg-success/90 font-bold"
          size="sm"
          disabled={loading}
          onClick={verify}
        >
          <CheckCircle2 className="size-4" />
          {loading ? "Verifying..." : "Verify Rider"}
        </Button>
      </div>
    </div>
  );
};

export default RiderAdmin;
