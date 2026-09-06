import { useState } from "react";
import type { IMenuItem } from "../types";
import { Eye, EyeOff, Trash2, Plus } from "lucide-react";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { VegMark } from "@/components/fmm/cards";
import { Money, EmptyState } from "@/components/fmm/primitives";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import dishPlaceholder from "@/assets/dish-thali.jpg";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { fetchCart, cart } = useAppData();

  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item?",
    );
    if (!confirm) return;

    try {
      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Item deleted");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete item");
    }
  };

  const toggleAvailiblity = async (itemId: string) => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${itemId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  const addToCart = async (restaurantId: string, itemId: string) => {
    try {
      setLoadingItemId(itemId);

      const { data } = await axios.post(
        `${restaurantService}/api/cart/add`,
        {
          restaurantId,
          itemId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message || "Item added to cart");
      fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoadingItemId(null);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Utensils}
        title="No menu items yet"
        description={
          isSeller
            ? "Add your first dish to start receiving orders."
            : "This mess hasn't published any items yet."
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {items.map((item) => {
        const isLoading = loadingItemId === item._id;
        const cartItem = cart?.find((c) => {
          const cItemId =
            typeof c.itemId === "string" ? c.itemId : c.itemId._id;
          return cItemId === item._id;
        });
        const currentQty = cartItem?.quauntity || 0;

        return (
          <article
            key={item._id}
            className={`fmm-surface flex gap-4 p-4 transition-all duration-200 hover:shadow-raised ${
              !item.isAvailable ? "opacity-75 bg-surface-muted/50" : ""
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <VegMark veg={true} />
                {!item.isAvailable && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    Sold Out
                  </span>
                )}
              </div>

              <h3 className="font-display text-base font-bold text-foreground">
                {item.name}
              </h3>

              <p className="text-sm font-bold text-foreground">
                <Money amount={item.price} />
              </p>

              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <div className="relative w-28 shrink-0 sm:w-32 flex flex-col items-center justify-between">
              <div className="relative h-24 w-full rounded-xl overflow-hidden bg-muted">
                <img
                  src={item.image || dishPlaceholder}
                  alt={item.name}
                  loading="lazy"
                  className={`h-full w-full object-cover transition-transform duration-300 ${
                    !item.isAvailable ? "grayscale" : ""
                  }`}
                />
              </div>

              <div className="mt-3 w-full flex justify-center">
                {isSeller ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleAvailiblity(item._id)}
                      className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title={
                        item.isAvailable ? "Mark Sold Out" : "Mark Available"
                      }
                    >
                      {item.isAvailable ? (
                        <Eye className="size-4 text-success" />
                      ) : (
                        <EyeOff className="size-4 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item._id)}
                      className="size-8 text-destructive hover:bg-destructive/10"
                      title="Delete Item"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={!item.isAvailable || isLoading}
                    onClick={() => addToCart(item.restaurantId, item._id)}
                    className="w-full shadow-raised font-bold text-xs"
                  >
                    {isLoading ? (
                      "Adding..."
                    ) : currentQty > 0 ? (
                      <span className="flex items-center gap-1">
                        Added ({currentQty})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="size-3.5" /> Add
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MenuItems;
