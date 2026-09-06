import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** "ink" = black wordmark (default), "brand" = crimson, "invert" = light on dark */
  tone?: "ink" | "brand" | "invert";
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
};

const sizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

const tones = {
  ink: "text-foreground",
  brand: "text-primary",
  invert: "text-sidebar-foreground",
};

/**
 * FindMyMess wordmark. Mirrors the logo lockup: heavy geometric lowercase
 * with a terminating period set in the brand crimson.
 */
export function FmmLogo({
  className,
  tone = "ink",
  size = "md",
  withMark = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {withMark ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground fmm-wordmark text-sm">
          f
        </span>
      ) : null}
      <span className={cn("fmm-wordmark", sizes[size], tones[tone])}>
        findmymess<span className="text-primary">.</span>
      </span>
    </span>
  );
}
