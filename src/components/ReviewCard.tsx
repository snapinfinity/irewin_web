import { Quote } from "lucide-react";
import { Stars } from "@/components/Stars";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {review.sample ? (
          <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-800">Sample</span>
        ) : (
          <Quote className="h-6 w-6 text-brand-100" aria-hidden="true" />
        )}
      </div>
      <blockquote className="flex-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{review.text}</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-line pt-4">
        {review.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google profile photo
          <img src={review.photoURL} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 font-display font-bold text-brand-600">
            {review.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-display font-semibold text-ink">{review.name}</p>
          <p className="text-sm text-muted">{formatDate(review.updatedAt ?? review.createdAt)}</p>
        </div>
      </figcaption>
    </figure>
  );
}
