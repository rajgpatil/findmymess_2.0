import { useNavigate } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import coverPlaceholder from "@/assets/restaurant-cover.jpg";

type Props = {
  id: string;
  image: string;
  name: string;
  distance: string;
  isOpen: boolean;
  cuisines?: string;
  rating?: number;
  eta?: string;
  priceForTwo?: number;
};

const RestaurantCard = ({
  id,
  image,
  name,
  distance,
  isOpen,
  cuisines = "North Indian · Maharashtrian · Thali",
  rating = 4.5,
  eta = "25-30 min",
  priceForTwo = 250,
}: Props) => {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/restaurant/${id}`)}
      className={cn(
        "fmm-surface group overflow-hidden transition-all duration-300 hover:shadow-raised cursor-pointer",
        !isOpen && "opacity-80",
      )}
    >
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        <img
          src={image || coverPlaceholder}
          alt={name}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
            !isOpen && "grayscale",
          )}
        />

        {!isOpen && (
          <span className="absolute inset-0 grid place-items-center bg-foreground/50 text-xs font-bold text-background uppercase tracking-wider backdrop-blur-[1px]">
            Currently Closed
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <h3 className="truncate font-display text-base font-bold text-foreground">
            {name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-bold text-success">
            <Star className="size-3 fill-current" />
            {rating.toFixed(1)}
          </span>
        </div>

        <p className="truncate text-xs text-muted-foreground">{cuisines}</p>

        <div className="flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {eta}
          </span>
          <span>{distance} KM away</span>
          <span className="ml-auto font-medium text-foreground">
            ₹{priceForTwo} for two
          </span>
        </div>
      </div>
    </article>
  );
};

export default RestaurantCard;
