"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CreditCard, Crown, FlaskConical } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { getPlan, monthlyPrice } from "@/lib/data/plans";
import { addMonths, formatDate, formatMoney } from "@/lib/format";

/**
 * Checkout. Payment is NOT integrated yet: the button activates the plan
 * directly (test mode). When the payment provider is added, start its
 * checkout here and call `activateMembership` only after the provider confirms
 * payment (ideally from a server webhook, not the browser).
 */
export function CheckoutView() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, membership, isPremium, activateMembership } = useSession();
  const [busy, setBusy] = useState(false);
  const plan = getPlan(params.get("plan"));

  if (!plan) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl font-semibold">Choose a plan first</p>
        <Link href="/premium" className="mt-4 inline-block font-semibold text-brand-600">
          See Premium plans
        </Link>
      </div>
    );
  }

  const start = isPremium && membership ? new Date(membership.expiresAt) : new Date();
  const until = addMonths(start, plan.months);

  function activate() {
    if (!plan) return;
    setBusy(true);
    activateMembership(plan.id);
    router.push("/account?activated=1");
  }

  return (
    <div className="container-page grid gap-6 py-10 sm:py-14 lg:grid-cols-[1fr_380px] lg:gap-8">
      <div className="flex flex-col gap-6">
        <Link href="/premium" className="flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Change plan
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Checkout</h1>
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5 text-brand-600" /> Payment
          </h2>
          <div className="flex gap-3 rounded-xl border border-dashed border-amber-300 bg-gold-soft p-4 text-amber-900">
            <FlaskConical className="h-5 w-5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">Test mode — no payment is taken</p>
              <p>Online payment will be connected here later. For now, activating unlocks Premium straight away so you can test the site.</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Signed in as <span className="font-medium text-ink">{user?.email}</span>
          </p>
        </section>
      </div>

      <aside className="flex flex-col gap-5 self-start rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-600">
            <Crown className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display font-semibold">Premium · {plan.name}</p>
            <p className="text-sm text-muted">{formatMoney(monthlyPrice(plan), "EUR", 2)} / month</p>
          </div>
        </div>
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">Access starts</dt>
            <dd>{formatDate(start.toISOString())}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Access until</dt>
            <dd>{formatDate(until.toISOString())}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatMoney(plan.price, "EUR", 2)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className="h-12 rounded-xl bg-brand-600 font-display font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Activating…" : "Activate Premium (test)"}
        </button>
      </aside>
    </div>
  );
}
