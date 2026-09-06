import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import L from "leaflet";
import {
  LocateFixed,
  MapPin,
  Plus,
  Trash2,
  Phone,
  ArrowLeft,
  Home,
  Receipt,
  Bike,
  User,
} from "lucide-react";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { SectionHeading } from "@/components/fmm/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

// Fix leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

// Click-to-select location
const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Locate me button
const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied"),
    );
  };

  return (
    <button
      type="button"
      onClick={locateUser}
      className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-xl bg-surface/90 px-3 py-2 text-xs font-bold text-foreground shadow-card backdrop-blur transition hover:bg-surface hover:shadow-raised cursor-pointer border border-border"
    >
      <LocateFixed size={15} className="text-primary" />
      Use Current Location
    </button>
  );
};

const AddAddressPage = () => {
  const { quauntity, user } = useAppData();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Reverse geocoding
  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setFormattedAddress(data.display_name || "");
    } catch {
      toast.error("Failed to fetch address name");
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAddresses(data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    if (
      !mobile ||
      !formattedAddress ||
      latitude === null ||
      longitude === null
    ) {
      toast.error("Please click on the map to choose a delivery location");
      return;
    }

    try {
      setAdding(true);
      await axios.post(
        `${restaurantService}/api/address/new`,
        {
          formattedAddress,
          mobile,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Delivery address added");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      setDeletingId(id);
      await axios.delete(`${restaurantService}/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

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

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Delivery Addresses
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Left Column: Map & Form */}
          <div className="fmm-surface p-5 space-y-4 shadow-card">
            <SectionHeading
              title="Pin Delivery Location"
              subtitle="Tap anywhere on the map or click 'Use Current Location'"
            />

            <div className="relative h-80 w-full overflow-hidden rounded-xl border border-border shadow-inner">
              <MapContainer
                center={[latitude || 28.6139, longitude || 77.209]}
                zoom={13}
                className="h-full w-full"
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationPicker setLocation={setLocation} />
                <LocateMeButton onLocate={setLocation} />
                {latitude && longitude && (
                  <Marker position={[latitude, longitude]} />
                )}
              </MapContainer>
            </div>

            {formattedAddress ? (
              <div className="rounded-xl border border-success/30 bg-success-soft/30 p-3.5 text-xs text-foreground space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-success">
                  <MapPin size={14} /> Selected Address:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {formattedAddress}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                📍 No pin placed yet. Tap on the map to set your delivery spot.
              </p>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Contact Mobile Number
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter 10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="border-0 px-0 shadow-none focus-visible:ring-0 text-sm"
                  />
                </div>
              </div>

              <Button
                disabled={adding || !formattedAddress || !mobile}
                onClick={addAddress}
                className="w-full font-bold shadow-raised gap-2"
                size="lg"
              >
                <Plus className="size-4" />
                {adding ? "Saving Address..." : "Save Delivery Address"}
              </Button>
            </div>
          </div>

          {/* Right Column: Saved Addresses */}
          <aside className="fmm-surface p-5 space-y-4 shadow-card">
            <SectionHeading
              title="Saved Addresses"
              subtitle={`${addresses.length} address${addresses.length === 1 ? "" : "es"} saved`}
            />

            {loading ? (
              <p className="text-xs text-muted-foreground">
                Loading saved addresses...
              </p>
            ) : addresses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No addresses saved yet. Use the map to add your first delivery
                location.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border p-3.5 hover:border-border-strong hover:bg-muted/30 transition-all"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-foreground leading-relaxed">
                        {addr.formattedAddress}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={12} /> {addr.mobile}
                      </p>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === addr._id}
                      onClick={() => deleteAddress(addr._id)}
                      className="size-8 text-destructive hover:bg-destructive/10 shrink-0"
                      title="Delete Address"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default AddAddressPage;
