import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  LogOut,
  MapPin,
  Package,
  User as UserIcon,
  Shield,
  ChevronRight,
  ArrowLeft,
  Home,
  Receipt,
  Bike,
} from "lucide-react";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/fmm/status-badge";
import { useMemo } from "react";

const Account = () => {
  const { user, setUser, setIsAuth, quauntity } = useAppData();
  const navigate = useNavigate();

  const userInitials = useMemo(() => {
    if (!user?.name) return "RP";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const logoutHandler = () => {
    localStorage.setItem("token", "");
    setUser(null);
    setIsAuth(false);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const customerNav: NavItem[] = [
    { label: "Home", to: "/", icon: Home },
    { label: "Orders", to: "/orders", icon: Receipt },
    { label: "Track", to: "/orders", icon: Bike },
    { label: "Account", to: "/account", icon: UserIcon },
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

        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            My Account
          </h1>

          {/* Profile Card */}
          <div className="fmm-surface p-6 space-y-4 shadow-card">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-4 ring-primary-soft">
                <AvatarFallback className="bg-primary-soft text-primary text-xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-foreground truncate">
                    {user?.name || "Customer"}
                  </h2>
                  <Pill tone="brand">{user?.role || "customer"}</Pill>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {user?.email || "Signed in with Google"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="fmm-surface overflow-hidden divide-y divide-border shadow-card">
            <div
              onClick={() => navigate("/orders")}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Package className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Your Orders
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View active orders & order history
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>

            <div
              onClick={() => navigate("/address")}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Saved Addresses
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Manage delivery locations on map
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>

            <div
              onClick={() => navigate("/select-role")}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-9 place-items-center rounded-lg bg-info-soft text-info">
                  <Shield className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Switch Account Role
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Switch to Rider or Mess Partner
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>

            <div
              onClick={logoutHandler}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-destructive/10 transition-colors text-destructive"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <LogOut className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Log Out</p>
                  <p className="text-xs opacity-80">
                    Sign out of your FindMyMess account
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 opacity-70" />
            </div>
          </div>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default Account;
