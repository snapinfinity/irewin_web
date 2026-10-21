import type { Metadata } from "next";
import { MessageSquareQuote } from "lucide-react";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { getLatestReviews } from "@/lib/data/reviews";

/** How many of the newest approved reviews the page shows (and reads). */
const REVIEWS_SHOWN = 30;

export const metadata: Metadata = { title: "Customer reviews" };

export const revalidate = 60;

export default async function ReviewsPage() {
  const reviews = await getLatestReviews(REVIEWS_SHOWN);
  return (
    <>
      <section className="bg-dark">
        <div className="container-page flex flex-col items-center gap-4 py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1.5 text-sm font-semibold text-accent-soft">
            <MessageSquareQuote className="h-4 w-4" /> Customer reviews
          </span>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">What job seekers say about IREWIN</h1>
          <p className="max-w-2xl text-on-dark sm:text-lg">
            {reviews.length > 0
              ? "Honest reviews from people using IREWIN to find work in Ireland."
              : "Be the first to share how IREWIN helped your job search."}
          </p>
        </div>
      </section>

      <section className="container-page flex flex-col gap-10 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <ReviewForm />
        </div>
        {reviews.length > 0 && (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.uid} review={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
