"use client";

import Link from "next/link";
import { CircleCheck, Crown } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { PLANS, PREMIUM_BENEFITS } from "@/lib/data/plans";

/** Home-page pitch for Premium. Prices are only shown on /premium, after login. */
export function PremiumTeaser() {
  const { ready, isLoggedIn, isPremium } = useSession();
  const cta = !ready
    ? null
    : isPremium
      ? { href: "/jobs", label: "Browse all jobs" }
      : isLoggedIn
        ? { href: "/premium", label: "See Premium plans" }
        : { href: "/login?next=/premium", label: "Sign in with Google" };

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-page">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-dark p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-14">
          <div className="flex flex-col gap-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gold-soft px-3.5 py-1.5 text-sm font-semibold text-amber-800">
              <Crown className="h-4 w-4" /> IREWIN Premium
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Every job in Ireland. <span className="text-accent">One membership.</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-on-dark">
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {b}
                </li>
              ))}
            </ul>
            <div className="flex min-h-[52px] flex-wrap items-center gap-3">
              {cta && (
                <Link
                  href={cta.href}
                  className="rounded-xl bg-accent px-6 py-3.5 font-display font-semibold text-dark hover:bg-accent-soft"
                >
                  {cta.label}
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className="relative flex flex-col gap-1 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-6"
              >
                {p.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-dark">
                    {p.badge}
                  </span>
                )}
                <span className="font-display text-3xl font-extrabold text-white sm:text-4xl">{p.months}</span>
                <span className="text-sm text-on-dark">{p.months === 1 ? "month" : p.months === 12 ? "months · 1 year" : "months"}</span>
              </div>
            ))}
            <p className="col-span-2 text-center text-sm text-on-dark">
              {isLoggedIn ? "Pick the plan that suits you." : "Log in to see plan prices."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
