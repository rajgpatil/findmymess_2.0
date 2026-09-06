import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../main";
import { ShoppingBag, Store, Bike, ArrowRight, Check } from "lucide-react";
import { FmmLogo } from "@/components/fmm/logo";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Role = "customer" | "rider" | "seller" | null;

interface RoleOption {
  id: "customer" | "rider" | "seller";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "customer",
    title: "Customer",
    description:
      "Browse nearby messes, order healthy food, and track deliveries.",
    icon: ShoppingBag,
    tag: "Order Food",
  },
  {
    id: "seller",
    title: "Mess & Restaurant Partner",
    description: "Manage your menu, live orders, sales, and kitchen pipeline.",
    icon: Store,
    tag: "Manage Kitchen",
  },
  {
    id: "rider",
    title: "Delivery Partner",
    description: "Accept delivery requests, navigate routes, and earn payouts.",
    icon: Bike,
    tag: "Deliver Orders",
  },
];

const SelectRole = () => {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppData();
  const navigate = useNavigate();

  const addRole = async () => {
    if (!role) return;
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${authService}/api/auth/add/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success(`Welcome as ${role}!`);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Something went wrong while setting role");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <FmmLogo size="lg" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-4">
            How will you use FindMyMess?
          </h1>
          <p className="text-sm text-muted-foreground">
            Select your account type to get started. You can change this later
            in account settings.
          </p>
        </div>

        <div className="space-y-3">
          {roleOptions.map((opt) => {
            const isSelected = role === opt.id;
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => setRole(opt.id)}
                className={`fmm-surface relative flex items-start gap-4 p-5 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary-soft/30 shadow-raised ring-2 ring-primary/30"
                    : "hover:border-border-strong hover:shadow-raised"
                }`}
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-xl transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-6" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-foreground">
                      {opt.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {opt.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div
                  className={`grid size-6 shrink-0 place-items-center rounded-full border transition-all mt-1 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface"
                  }`}
                >
                  {isSelected ? <Check className="size-3.5" /> : null}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          size="lg"
          disabled={!role || loading}
          onClick={addRole}
          className="w-full text-base font-semibold shadow-raised"
        >
          {loading ? (
            "Setting up your account..."
          ) : (
            <span className="inline-flex items-center gap-2">
              Continue as{" "}
              {role ? roleOptions.find((r) => r.id === role)?.title : "..."}
              <ArrowRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SelectRole;
