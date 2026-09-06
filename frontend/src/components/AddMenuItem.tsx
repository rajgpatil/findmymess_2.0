import axios from "axios";
import { useState } from "react";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { Upload, Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onItemAdded: () => void;
}

const AddMenuItem = ({ onItemAdded }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!name || !price || !image) {
      toast.error("Item name, price, and photo are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("file", image);

    try {
      setLoading(true);
      await axios.post(`${restaurantService}/api/item/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Menu item added successfully!");
      resetForm();
      onItemAdded();
    } catch (error) {
      console.log(error);
      toast.error("Failed to add menu item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg fmm-surface p-6 space-y-5 shadow-card">
      <div className="flex items-center gap-2.5 pb-2 border-b border-border">
        <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
          <Utensils className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Add Menu Item
          </h2>
          <p className="text-xs text-muted-foreground">
            Add dishes with appetizing photos and prices
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Dish Name
          </label>
          <Input
            placeholder="e.g. Special Chicken Biryani / Dal Tadka"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Description
          </label>
          <Textarea
            placeholder="Describe the preparation, spices, and ingredients..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Price (₹ INR)
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
            <span className="text-sm font-bold text-muted-foreground">₹</span>
            <Input
              type="number"
              placeholder="e.g. 180"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Dish Photo
          </label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-xs text-muted-foreground hover:border-primary hover:bg-primary-soft/10 transition-colors cursor-pointer">
            <Upload className="size-5 text-primary" />
            <span className="font-medium">
              {image ? image.name : "Upload Dish Photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <Button
          disabled={loading || !name || !price}
          onClick={handleSubmit}
          className="w-full font-bold shadow-raised gap-2"
          size="lg"
        >
          <Plus className="size-4" />
          {loading ? "Adding to Menu..." : "Publish Menu Item"}
        </Button>
      </div>
    </div>
  );
};

export default AddMenuItem;
