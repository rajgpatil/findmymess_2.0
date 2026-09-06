import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useMemo } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Package,
  Home as HomeIcon,
  Receipt,
  Bike,
  User,
} from "lucide-react";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { fetchCart, quauntity, user } = useAppData();

  useEffect(() => {
    fetchCart();
  }, []);

  const userInitials = useMemo(() => {
    if (!user?.name) return "RP";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const customerNav: NavItem[] = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Orders", to: "/orders", icon: Receipt },
    { label: "Track", to: "/orders", icon: Bike },
    { label: "Account", to: "/account", icon: User },
  ];

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="flex min-h-[65vh] items-center justify-center py-8">
          <div className="w-full max-w-md fmm-surface p-6 sm:p-8 text-center space-y-5 shadow-raised">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-success-soft text-success shadow-card">
              <CheckCircle2
                size={44}
                className="animate-in zoom-in duration-300"
              />
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your order has been placed and sent to the kitchen for
                preparation 🎉
              </p>
            </div>

            {paymentId && (
              <div className="rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground border border-border">
                <span className="block font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/80 mb-1">
                  Razorpay Transaction ID
                </span>
                <p className="font-mono break-all font-medium text-foreground">
                  {paymentId}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/orders")}
                className="w-full font-bold shadow-raised gap-2"
              >
                <Package className="size-4" /> View Your Active Orders
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="w-full font-semibold gap-2"
              >
                Order More Food <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default PaymentSuccess;
