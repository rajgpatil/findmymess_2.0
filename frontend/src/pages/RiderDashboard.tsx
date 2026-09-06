import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../main";
import toast from "react-hot-toast";
import type { IOrder } from "../types";
import audio from "../assets/faaah.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";
import {
  RiderShell,
  MobileTabBar,
  type NavItem,
} from "../components/fmm/app-shell";
import { Pill } from "../components/fmm/status-badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import {
  Bike,
  IndianRupee,
  Package,
  Star,
  Bell,
  Upload,
  Home,
  Wallet,
  User,
} from "lucide-react";

interface IRider {
  _id: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  picture: string;
  isVerified: boolean;
  isAvailble: boolean;
}

const riderNavItems: NavItem[] = [
  { label: "Home", to: "/rider", icon: Home },
  { label: "Delivery", to: "#delivery", icon: Bike },
  { label: "Earnings", to: "#earnings", icon: Wallet },
  { label: "Profile", to: "/account", icon: User },
];

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bike;
  label: string;
  value: string;
}) {
  return (
    <div className="fmm-surface p-3 text-center transition-all hover:shadow-xs">
      <Icon className="mx-auto size-4 text-primary" />
      <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.preload = "auto";
  }, []);

  const unlockAudio = async () => {
    try {
      if (!audioRef.current) return;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      toast.success("Sound notifications enabled");
    } catch (error) {
      toast.error("Tap again to enable sound");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId],
      );

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
      }, 15000);
    };

    socket.on("order:available", onOrderAvailable);

    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setProfile(data || null);
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") fetchProfile();
    else setLoading(false);
  }, [user]);

  const fetchCurrentOrder = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setCurrentOrder(data.order);
    } catch (error) {
      console.log(error);
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  const toggleAvailiblity = async () => {
    if (!navigator.geolocation) {
      toast.error("Location access is required to go online");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.patch(
            `${riderService}/api/rider/toggle`,
            {
              isAvailble: !profile?.isAvailble,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          toast.success(
            profile?.isAvailble ? "You are now offline" : "You are now online!",
          );
          fetchProfile();
        } catch (error: any) {
          toast.error(
            error?.response?.data?.message || "Failed to update availability",
          );
        } finally {
          setToggling(false);
        }
      },
      () => {
        toast.error("Please enable GPS location to go online");
        setToggling(false);
      },
    );
  };

  // Onboarding form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadharNumber, setaadharNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Location access is required");
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber);
        formData.append("aadharNumber", aadharNumber);
        formData.append("drivingLicenseNumber", drivingLicenseNumber);
        formData.append("latitude", pos.coords.latitude.toString());
        formData.append("longitude", pos.coords.longitude.toString());

        if (image) {
          formData.append("file", image);
        }

        try {
          const { data } = await axios.post(
            `${riderService}/api/rider/new`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          toast.success(data.message);
          fetchProfile();
        } catch (error: any) {
          toast.error(
            error?.response?.data?.message || "Failed to register profile",
          );
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setSubmitting(false);
      },
    );
  };

  if (user?.role !== "rider") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Bike className="size-12 text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-bold">Rider Account Required</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You are currently signed in as a {user?.role || "customer"}.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading rider partner console...
          </p>
        </div>
      </div>
    );
  }

  // Registration / Onboarding View
  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8">
        <div className="mx-auto max-w-lg fmm-surface p-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Rider Partner Onboarding
            </h1>
            <p className="text-sm text-muted-foreground">
              Register your vehicle details and documents to start earning
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aadhar Card Number</Label>
              <Input
                type="text"
                placeholder="12-digit UIDAI number"
                value={aadharNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setaadharNumber(e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Contact Phone Number</Label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhoneNumber(e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Driving Licence Number</Label>
              <Input
                type="text"
                placeholder="DL number (e.g. MH12 20210001234)"
                value={drivingLicenseNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDrivingLicenseNumber(e.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Profile / Vehicle Picture</Label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50 hover:bg-surface-muted transition">
                <Upload className="size-4 text-primary" />
                <span>{image ? image.name : "Upload photo or selfie"}</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setImage(e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            <Button
              className="w-full mt-2"
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting Application..." : "Submit Registration"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = (user?.name || "Rider")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <RiderShell
        title={`Good day, ${user?.name?.split(" ")[0] || "Partner"}`}
        right={
          profile.isVerified ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-xs transition hover:border-primary/40">
              <Switch
                checked={profile.isAvailble}
                disabled={toggling}
                onCheckedChange={toggleAvailiblity}
              />
              <span
                className={`text-xs font-bold ${
                  profile.isAvailble ? "text-success" : "text-muted-foreground"
                }`}
              >
                {toggling
                  ? "Updating..."
                  : profile.isAvailble
                    ? "Online"
                    : "Offline"}
              </span>
            </label>
          ) : (
            <Pill tone="warning">Pending Verification</Pill>
          )
        }
      >
        {/* Profile Card matching Theme */}
        <div className="fmm-surface p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-2 ring-primary/10">
              {profile.picture ? (
                <img
                  src={profile.picture}
                  alt={user?.name || "Rider"}
                  className="size-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                DL: {profile.drivingLicenseNumber}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Pill tone={profile.isVerified ? "success" : "warning"}>
                {profile.isVerified ? "Verified Rider" : "Pending Review"}
              </Pill>
            </div>
          </div>

          <div className="rounded-lg bg-info-soft p-3 text-xs text-info leading-relaxed">
            Stay within 500 m of a partner mess hotspot to keep receiving
            incoming delivery requests.
          </div>
        </div>

        {/* 3 Mini KPI Stats */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat icon={Package} label="Today's Trips" value="12" />
          <MiniStat icon={IndianRupee} label="Earnings" value="₹840" />
          <MiniStat icon={Star} label="Rating" value="4.8" />
        </div>

        {/* Audio Alert notification prompt */}
        {!audioUnlocked && (
          <Alert className="border-info/30 bg-info-soft flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="size-4 text-info shrink-0" />
              <div className="min-w-0">
                <AlertTitle className="text-info text-xs font-bold">
                  Trip Sound Alerts
                </AlertTitle>
                <AlertDescription className="text-info/80 text-[11px]">
                  Audible beep on new orders
                </AlertDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-surface text-xs"
              onClick={unlockAudio}
            >
              Enable
            </Button>
          </Alert>
        )}

        {/* Incoming Order Broadcast Requests */}
        {profile.isAvailble && incomingOrders.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="fmm-section-title">Incoming Trip Requests</h2>
              <span className="text-xs font-bold text-success animate-pulse">
                Live
              </span>
            </div>
            <div className="space-y-3">
              {incomingOrders.map((id) => (
                <RiderOrderRequest
                  key={id}
                  orderId={id}
                  onAccepted={() => {
                    fetchProfile();
                    fetchCurrentOrder();
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Active Order / Current Delivery */}
        {currentOrder ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="fmm-section-title">Active Delivery</h2>
            </div>
            <RiderCurrentOrder
              order={currentOrder}
              onStatusUpdate={fetchCurrentOrder}
            />
            <RiderOrderMap order={currentOrder} />
          </section>
        ) : (
          profile.isAvailble &&
          incomingOrders.length === 0 && (
            <div className="fmm-surface p-6 text-center space-y-2">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Bike className="size-6 animate-pulse" />
              </div>
              <p className="font-bold text-sm text-foreground">
                Waiting for nearby delivery requests
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                You are online! As soon as a mess partner accepts an order, it
                will appear here.
              </p>
            </div>
          )
        )}
      </RiderShell>

      <MobileTabBar items={riderNavItems} activeTo="/rider" />
    </>
  );
};

export default RiderDashboard;
