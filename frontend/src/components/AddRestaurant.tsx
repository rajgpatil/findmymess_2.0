import { useState } from "react";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../main";
import { Store, Upload, MapPin, Phone } from "lucide-react";
import { FmmLogo } from "@/components/fmm/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loadingLocation, location } = useAppData();

  const handleSubmit = async () => {
    if (!name || !image || !location) {
      toast.error(
        "Please fill in restaurant name, contact number, and upload an image",
      );
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("formattedAddress", location.formattedAddress);
    formData.append("file", image);
    formData.append("phone", phone);

    try {
      setSubmitting(true);
      await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success(
        "Restaurant registered successfully! Awaiting verification.",
      );
      fetchMyRestaurant();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-lg fmm-surface p-6 sm:p-8 space-y-6 shadow-raised">
        <div className="text-center space-y-2">
          <FmmLogo size="lg" />
          <div className="pt-2">
            <span className="inline-grid size-12 place-items-center rounded-xl bg-primary-soft text-primary mx-auto mb-2">
              <Store className="size-6" />
            </span>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Register Your Mess / Restaurant
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Partner with FindMyMess to reach students and local foodies
              nearby.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Mess / Restaurant Name
            </label>
            <Input
              placeholder="e.g. Patil Deluxe Mess & Kitchen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Contact Phone Number
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Phone className="size-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cuisine Description
            </label>
            <Textarea
              placeholder="Specializing in Maharashtrian Thalis, Puran Poli, Chicken Biryani..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cover Photo
            </label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-xs text-muted-foreground hover:border-primary hover:bg-primary-soft/10 transition-colors cursor-pointer">
              <Upload className="size-6 text-primary" />
              <span className="font-medium">
                {image ? image.name : "Upload Mess Kitchen / Dining Image"}
              </span>
              <span className="text-[11px] text-muted-foreground/70">
                PNG, JPG or WEBP up to 5MB
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>Location Detected</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-6">
              {loadingLocation
                ? "Detecting GPS coordinates..."
                : location?.formattedAddress || "Location permission required"}
            </p>
          </div>

          <Button
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full font-bold shadow-raised text-base"
            size="lg"
          >
            {submitting ? "Registering Mess..." : "Submit for Verification"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddRestaurant;
