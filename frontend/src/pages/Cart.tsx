import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState, useMemo } from "react";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { Tag, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import {
  CustomerShell,
  MobileTabBar,
  type NavItem,
} from "@/components/fmm/app-shell";
import { Money, SectionHeading, EmptyState } from "@/components/fmm/primitives";
import { QtyStepper, VegMark } from "@/components/fmm/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Receipt, Bike, User } from "lucide-react";
import dishPlaceholder from "@/assets/dish-thali.jpg";

const Cart = () => {
  const { cart, subTotal, quauntity, fetchCart, user } = useAppData();
  const navigate = useNavigate();

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [couponCode, setCouponCode] = useState("");

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
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Explore healthy meals from nearby messes and add them to your cart."
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

  const increaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      await fetchCart();
    } catch (error) {
      toast.error("Failed to update item quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/dec`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      await fetchCart();
    } catch (error) {
      toast.error("Failed to update item quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Are you sure you want to clear your cart?");
    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      await fetchCart();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    } finally {
      setClearingCart(false);
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    toast.error("Invalid coupon code or expired");
  };

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
            <ArrowLeft className="size-4" /> Continue Ordering
          </Button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Your Cart
        </h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* Left Column: Items */}
          <div className="space-y-6">
            {/* Restaurant header card */}
            <div className="fmm-surface p-5">
              <SectionHeading
                title={restaurant.name}
                subtitle={
                  restaurant.autoLocation?.formattedAddress ||
                  "Pickup from mess"
                }
              />
              {!restaurant.isOpen && (
                <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  ⚠️ This restaurant is currently closed. You will not be able
                  to proceed to checkout until it opens.
                </div>
              )}
            </div>

            {/* Items Card */}
            <div className="fmm-surface p-5 space-y-4">
              <h2 className="fmm-section-title">Items ({quauntity})</h2>

              <div className="divide-y divide-border">
                {cart.map((cartItem: ICart) => {
                  const item = cartItem.itemId as IMenuItem;
                  const isLoading = loadingItemId === item._id;

                  return (
                    <div
                      key={item._id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <img
                        src={item.image || dishPlaceholder}
                        alt={item.name}
                        loading="lazy"
                        className="size-16 rounded-xl object-cover bg-muted"
                      />

                      <div className="min-w-0 space-y-0.5">
                        <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
                          <VegMark veg={true} /> {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Money amount={item.price} /> each
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <QtyStepper
                          qty={cartItem.quauntity}
                          onInc={() => increaseQty(item._id)}
                          onDec={() => decreaseQty(item._id)}
                          isLoading={isLoading}
                        />
                        <p className="w-16 text-right text-sm font-bold tabular-nums">
                          <Money amount={item.price * cartItem.quauntity} />
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {subTotal < 250 ? (
                <div className="rounded-lg bg-accent-soft p-3 text-xs text-accent-foreground font-medium">
                  Add items worth <b>₹{250 - subTotal}</b> more to get Free
                  delivery!
                </div>
              ) : (
                <div className="rounded-lg bg-success-soft p-3 text-xs text-success font-medium">
                  🎉 You have unlocked Free Delivery!
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={clearingCart}
                  onClick={clearCart}
                  className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="size-3.5" /> Clear Cart
                </Button>
              </div>
            </div>

            {/* Apply Coupon Surface */}
            <div className="fmm-surface p-5 space-y-3">
              <SectionHeading title="Have a coupon?" />
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3">
                  <Tag className="size-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="border-0 px-0 shadow-none focus-visible:ring-0 text-sm uppercase"
                  />
                </div>
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sticky Column: Bill Summary */}
          <aside className="fmm-surface space-y-4 p-5 lg:sticky lg:top-24 shadow-raised">
            <h2 className="fmm-section-title">Bill Summary</h2>

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>Total Items ({quauntity})</dt>
                <dd className="font-semibold text-foreground">
                  <Money amount={subTotal} />
                </dd>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <dt>Delivery Fee</dt>
                <dd>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-success">FREE</span>
                  ) : (
                    <span className="font-semibold text-foreground">
                      ₹{deliveryFee}
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between text-muted-foreground">
                <dt>Platform Fee</dt>
                <dd className="font-semibold text-foreground">
                  <Money amount={platformFee} />
                </dd>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between font-bold text-base">
                  <dt>Grand Total</dt>
                  <dd className="text-primary text-lg">
                    <Money amount={grandTotal} />
                  </dd>
                </div>
              </div>
            </dl>

            <Button
              size="lg"
              disabled={!restaurant.isOpen}
              onClick={() => navigate("/checkout")}
              className="w-full text-base font-bold shadow-raised"
            >
              {!restaurant.isOpen ? (
                "Restaurant is Closed"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Proceed to Checkout <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </aside>
        </div>
      </CustomerShell>

      <MobileTabBar items={customerNav} />
    </>
  );
};

export default Cart;
