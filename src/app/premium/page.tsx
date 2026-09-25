"use client";

import Link from "next/link";
import { Crown, ShieldCheck } from "lucide-react";
import { PlanCard } from "@/components/PlanCard";
import { RequireLogin } from "@/components/RequireLogin";
import { useSession } from "@/lib/auth/useSession";
import { PLANS, PREMIUM_BENEFITS, getPlan } from "@/lib/data/plans";
import { formatDate } from "@/lib/format";

function PremiumContent() {
  const { user, isPremium, membership } = useSession();
  const currentPlan = getPlan(membership?.planId);
  return (
    <>
      <section className="bg-dark">
        <div className="container-page flex flex-col items-center gap-4 py-12 text-center sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3.5 py-1.5 text-sm font-semibold text-amber-800">
            <Crown className="h-4 w-4" /> IREWIN Premium
          </span>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {isPremium ? "You're a Premium member" : `Unlock every job, ${user?.name.split(" ")[0]}`}
          </h1>
          <p className="max-w-2xl text-on-dark sm:text-lg">
            {isPremium && membership
              ? `Your ${currentPlan?.name ?? ""} plan is active until ${formatDate(membership.expiresAt)}. You can extend it any time.`
              : "Choose how long you'd like access. Every plan includes the same Premium features."}
          </p>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-on-dark">
            {PREMIUM_BENEFITS.slice(0, 3).map((b) => (
              <li key={b} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-6 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} current={isPremium} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Prices in euro.{" "}
          <Link href="/jobs" className="font-semibold text-brand-600">
            Keep browsing jobs
          </Link>
        </p>
      </section>
    </>
  );
}

export default function PremiumPage() {
  return (
    <RequireLogin>
      <PremiumContent />
    </RequireLogin>
  );
}
