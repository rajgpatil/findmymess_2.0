import { useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { MapPin, Edit3, Save, X, LogOut, Store, Calendar } from "lucide-react";
import { useAppData } from "../context/AppContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Pill } from "./fmm/status-badge";

interface Props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      setIsOpen(data.restaurant.isOpen);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onUpdate(data.restaurant);
      setEditMode(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const { setIsAuth, setUser } = useAppData();

  const logoutHandler = async () => {
    try {
      await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: false },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem("token", "");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <div className="fmm-surface overflow-hidden">
      {/* Cover Image banner */}
      <div className="relative h-44 sm:h-52 w-full bg-surface-muted overflow-hidden">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full flex items-center justify-center bg-primary/5 text-primary">
            <Store className="size-16 opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
          <div>
            <div className="flex items-center gap-2">
              <Pill tone={isOpen ? "success" : "danger"}>
                {isOpen ? "OPEN FOR ORDERS" : "CURRENTLY CLOSED"}
              </Pill>
            </div>
          </div>

          {isSeller && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={editMode ? "secondary" : "outline"}
                className="bg-surface/90 text-foreground backdrop-blur hover:bg-surface"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <>
                    <X className="size-4" /> Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="size-4" /> Edit Details
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {editMode ? (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Restaurant Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 font-semibold text-base"
                placeholder="Restaurant name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Cuisines
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 text-sm"
                placeholder="Description of food, specialities..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={loading}>
                <Save className="size-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {restaurant.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span>
                {restaurant.autoLocation?.formattedAddress ||
                  "Location address unavailable"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
              {restaurant.description || "No description provided yet."}
            </p>
          </div>
        )}

        {/* Status toggle & actions row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 shadow-sm hover:border-primary/40 transition">
              <Switch checked={isOpen} onCheckedChange={toggleOpenStatus} />
              <span
                className={`text-xs font-bold ${
                  isOpen ? "text-success" : "text-destructive"
                }`}
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </span>
            </label>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Toggle store visibility to customers
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSeller && (
              <Button
                variant="ghost"
                size="sm"
                onClick={logoutHandler}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <Calendar className="size-3.5" />
          <span>
            Partner since{" "}
            {restaurant.createdAt
              ? new Date(restaurant.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : "Recent"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;
