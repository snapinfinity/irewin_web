"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { CircleCheck, Clock, PenLine, Star, XCircle } from "lucide-react";
import { Stars } from "@/components/Stars";
import { useSession } from "@/lib/auth/useSession";
import { deleteMyReview, getMyReview, REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH, saveMyReview } from "@/lib/reviews-client";
import type { Review } from "@/lib/types";

const STATUS = {
  pending: { icon: Clock, text: "Thanks! Your review is waiting for our team to approve it.", className: "bg-gold-soft text-amber-900" },
  approved: { icon: CircleCheck, text: "Your review is published on IREWIN. Thank you!", className: "bg-brand-50 text-brand-700" },
  rejected: { icon: XCircle, text: "Your review wasn't approved. You can edit it and send it again.", className: "bg-red-50 text-red-700" },
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Write, edit or delete your own review. Every save goes to the dashboard for approval first. */
export function ReviewForm() {
  const { ready, user } = useSession();
  const [mine, setMine] = useState<Review | null | undefined>(undefined); // undefined = still loading
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getMyReview()
      .then((r) => {
        if (cancelled) return;
        setMine(r);
        setRating(r?.rating ?? 0);
        setText(r?.text ?? "");
      })
      .catch((err) => {
        console.error("[IREWIN] Couldn't load your review:", err);
        if (!cancelled) setMine(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (!ready || (user && mine === undefined)) {
    return <div className="h-48 animate-pulse rounded-2xl bg-white" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Used IREWIN? Tell others how it went.</p>
          <p className="text-[15px] text-muted">Sign in with Google to write a review.</p>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent("/reviews")}`}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700"
        >
          <PenLine className="h-4 w-4" /> Write a review
        </Link>
      </div>
    );
  }

  const trimmed = text.trim().length;
  const canSend = rating >= 1 && trimmed >= REVIEW_MIN_LENGTH && trimmed <= REVIEW_MAX_LENGTH && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      await saveMyReview({ rating, text });
      setMine(await getMyReview());
      setEditing(false);
    } catch (err) {
      console.error("[IREWIN] Saving review failed:", err);
      setError("Couldn't send your review. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete your review?")) return;
    setBusy(true);
    try {
      await deleteMyReview();
      setMine(null);
      setRating(0);
      setText("");
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  if (mine && !editing) {
    const s = STATUS[mine.status];
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        <p className={clsx("flex items-start gap-2.5 rounded-xl px-4 py-3 text-[15px] font-medium", s.className)}>
          <s.icon className="mt-0.5 h-5 w-5 shrink-0" /> {s.text}
        </p>
        <div>
          <p className="text-sm text-muted">Your review</p>
          <Stars rating={mine.rating} className="mt-1" />
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{mine.text}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-10 items-center gap-2 rounded-xl border-2 border-brand-600 px-4 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            <PenLine className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="h-10 rounded-xl border border-line px-4 text-sm font-semibold text-muted hover:bg-surface disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
      <div>
        <p className="font-display text-lg font-semibold">{mine ? "Edit your review" : "Write a review"}</p>
        <p className="text-sm text-muted">Reviews are checked by our team before they appear on the site.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Your rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="rounded-md p-0.5"
            >
              <Star className={clsx("h-8 w-8 transition-colors", n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-line text-line")} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-muted">{RATING_LABELS[hover || rating]}</span>
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Your review</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={REVIEW_MAX_LENGTH}
          rows={5}
          placeholder="How did IREWIN help your job search?"
          className="rounded-xl border border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        <span className="text-right text-xs text-muted">
          {trimmed < REVIEW_MIN_LENGTH ? `At least ${REVIEW_MIN_LENGTH} characters` : `${trimmed}/${REVIEW_MAX_LENGTH}`}
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSend}
          className="h-11 rounded-xl bg-brand-600 px-6 font-display font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Sending…" : mine ? "Send for approval" : "Submit review"}
        </button>
        {mine && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setRating(mine.rating);
              setText(mine.text);
            }}
            className="h-11 rounded-xl border border-line px-5 font-semibold text-ink-2 hover:bg-surface"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
