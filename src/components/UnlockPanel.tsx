"use client";

import Link from "next/link";
import { Crown, LockOpen } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";

export function UnlockPanel({ lockedCount, compact = false }: { lockedCount: number; compact?: boolean }) {
  const { isLoggedIn } = useSession();
  const href = isLoggedIn ? "/premium" : "/login?next=/premium";
  return (
    <div className="relative overflow-hidden rounded-3xl bg-dark px-6 py-8 text-center sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-2xl" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft text-amber-700">
          <Crown className="h-7 w-7" />
        </span>
        <h3 className="text-2xl font-bold text-white sm:text-3xl">
          {lockedCount > 0 ? `Unlock ${lockedCount} more job${lockedCount === 1 ? "" : "s"}` : "Unlock every job in Ireland"}
        </h3>
        {!compact && (
          <p className="text-base leading-relaxed text-on-dark">
            Premium members see every listing, full salary details, and can apply directly with the employer.
            {isLoggedIn ? " Choose a plan to get started." : " Log in or create a free account, then choose a plan."}
          </p>
        )}
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-display text-base font-semibold text-dark hover:bg-accent-soft"
        >
          <LockOpen className="h-5 w-5" />
          {isLoggedIn ? "See Premium plans" : "Log in to unlock"}
        </Link>
        <p className="text-sm text-on-dark">Plans from 1 month to 1 year.</p>
      </div>
    </div>
  );
}
