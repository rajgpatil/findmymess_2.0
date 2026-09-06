import { useEffect, useState, useMemo } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import {
  MapPin,
  Plus,
  CreditCard,
  ShieldCheck,
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
import { Money, SectionHeading, EmptyState } from "@/components/fmm/primitives";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const { cart, subTotal, quauntity, user } = useAppData();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        setAddresses(data || []);
        if (data && data.length > 0) {
          setSelectedAddressId(data[0]._id);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);

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

  if (!cart || cart.length === 0) {
    return (
      <>
        <CustomerShell cartCount={0} userInitials={userInitials}>
          <div className="py-12">
            <EmptyState
              title="Your cart is empty"
              description="Please add items to your cart before proceeding to checkout."
              action={
                <Button onClick={() => navigate("/")} className="shadow-raised">
                  Browse Messes
                </Button>
              }
            />
          </div>
        </CustomerShell>
        <MobileTabBar items={customerNav} />
      </>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      return data;
    } catch (error) {
      toast.error("Failed to create Order");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);

      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;

      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });

      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "findmymess.",
        description: "Mess Food Order Payment",
        order_id: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.success("Payment successful 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: {
          color: "#E23744",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  return (
    <>
      <CustomerShell cartCount={quauntity} userInitials={userInitials}>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/cart")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Cart
          </Button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Checkout
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Left Column: Address Selection & Restaurant */}
          <div className="space-y-6">
            <div className="fmm-surface p-5">
              <SectionHeading
                title={restaurant.name}
                subtitle={
                  restaurant.autoLocation?.formattedAddress || "Pickup location"
                }
              />
            </div>

            <div className="fmm-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <SectionHeading title="Delivery Address" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/address")}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Address
                </Button>
              </div>

              {loadingAddress ? (
                <p className="text-sm text-muted-foreground">
                  Loading addresses...
                </p>
              ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No delivery addresses found. Please add an address to
                    continue.
                  </p>
                  <Button onClick={() => navigate("/address")} size="sm">
                    Add Address
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={selectedAddressId || ""}
                  onValueChange={(val) => setSelectedAddressId(val)}
                  className="space-y-3"
                >
                  {addresses.map((add) => (
                    <Label
                      key={add._id}
                      htmlFor={add._id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                        selectedAddressId === add._id
                          ? "border-primary bg-primary-soft/30 shadow-sm ring-1 ring-primary"
                          : "border-border bg-surface hover:border-border-strong hover:bg-muted/30"
                      }`}
                    >
                      <RadioGroupItem
                        id={add._id}
                        value={add._id}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span>Delivery Location</span>
                        </span>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {add.formattedAddress}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground pt-1">
                          Phone: {add.mobile}
                        </p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Pay */}
          <aside className="fmm-surface p-5 space-y-5 lg:sticky lg:top-24 shadow-raised">
            <h2 className="fmm-section-title">Order Summary</h2>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                return (
                  <div
                    key={cartItem._id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground pr-2">
                      {item.name} × {cartItem.quauntity}
                    </span>
                    <span className="font-semibold text-foreground shrink-0 tabular-nums">
                      <Money amount={item.price * cartItem.quauntity} />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  <Money amount={subTotal} />
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-success">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee</span>
                <span className="font-semibold text-foreground">
                  <Money amount={platformFee} />
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center text-base font-bold">
                <span>Total Amount</span>
                <span className="text-primary text-lg">
                  <Money amount={grandTotal} />
                </span>
              </div>
            </div>

            <Button
              size="lg"
              disabled={!selectedAddressId || loadingRazorpay || creatingOrder}
              onClick={payWithRazorpay}
              className="w-full text-base font-bold shadow-raised gap-2"
            >
              <CreditCard className="size-5" />
              {loadingRazorpay || creatingOrder
                ? "Securing Payment..."
                : `Pay ₹${grandTotal} with Razorpay`}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="size-4 text-success" />
              <span>Safe & Secure 256-bit Encrypted Payment</span>
            </div>
          </aside>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default Checkout;
