import { clsx } from "clsx";
import { Star } from "lucide-react";

/** Read-only 1–5 star rating. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={clsx("h-4 w-4", n <= rounded ? "fill-amber-400 text-amber-400" : "fill-line text-line")} />
      ))}
    </span>
  );
}
