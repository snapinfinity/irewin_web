"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CreditCard, Crown, FlaskConical } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { billingInterval, getPlan, planExpiry, planLength, weeklyPrice } from "@/lib/data/plans";
import { formatDate, formatMoney } from "@/lib/format";

const TEST_MODE = process.env.NEXT_PUBLIC_DODO_TEST_MODE !== "false";

/**
 * Checkout. "Subscribe" sends the visitor to Dodo Payments' hosted checkout for
 * an auto-renewing plan; they come back to /checkout/success, and Premium is
 * granted on the server once Dodo confirms the subscription.
 */
export function CheckoutView() {
  const params = useSearchParams();
  const { user, membership, isPremium, isSubscribed, startCheckout } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  if (isPremium && !plan.recurring) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl font-semibold">You already have Premium</p>
        <p className="mt-2 text-muted">The {plan.name} pass is for members without Premium.</p>
        <Link href="/account" className="mt-4 inline-block font-semibold text-brand-600">
          See your plan in My account
        </Link>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="container-page py-16 text-center">
        <p className="font-display text-xl font-semibold">You already have an auto-renewing Premium plan</p>
        <Link href="/account" className="mt-4 inline-block font-semibold text-brand-600">
          Manage it in My account
        </Link>
      </div>
    );
  }

  // Premium already running on a one-off plan: a new pass is added on after it; a subscription
  // only gets a free trial for whole days left (the server's rule), so short passes don't delay the first charge.
  const extending = isPremium && !!membership;
  const now = new Date();
  const start = extending ? new Date(membership.expiresAt) : now;
  const renews = planExpiry(start, plan);
  const oneOff = !plan.recurring;
  const deferCharge = !oneOff && extending && start.getTime() - now.getTime() >= 86_400_000;

  // Short passes need the time, not just the date.
  const formatDateTime = (d: Date) =>
    new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" }).format(d);

  async function pay() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      await startCheckout(plan.id); // navigates away to Dodo
    } catch (err) {
      console.warn("[IREWIN] Checkout:", err);
      setBusy(false);
      setError(err instanceof Error ? err.message : "Couldn't start the payment. Please try again.");
    }
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
          <p className="text-[15px] leading-relaxed text-ink-2">
            You&apos;ll pay securely on Dodo Payments&apos; checkout page, then come straight back here. Premium unlocks as soon as the payment is confirmed.{" "}
            {oneOff
              ? `This is a one-off payment for ${planLength(plan)} of Premium. It doesn't renew.`
              : `Your plan renews automatically ${billingInterval(plan)} with the same card, and you can cancel any time from My account.`}
          </p>
          {TEST_MODE && (
            <div className="flex gap-3 rounded-xl border border-dashed border-amber-300 bg-gold-soft p-4 text-amber-900">
              <FlaskConical className="h-5 w-5 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">Test mode — no real money is taken</p>
                <p>
                  Pay with test card <span className="font-mono font-semibold">4242 4242 4242 4242</span>, expiry 06/32, CVC 123.
                  Use <span className="font-mono font-semibold">4000 0000 0000 0002</span> to try a declined payment.
                </p>
              </div>
            </div>
          )}
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
            <p className="text-sm text-muted">
              {oneOff
                ? `${planLength(plan)} access`
                : plan.period === "day"
                  ? `${formatMoney(plan.price, "EUR", 2)} / day`
                  : `${formatMoney(weeklyPrice(plan), "EUR", 2)} / week`}
            </p>
          </div>
        </div>
        <dl className="flex flex-col gap-2 text-[15px]">
          {oneOff ? (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">{extending ? "Current Premium ends" : "Access starts"}</dt>
                <dd>{extending ? formatDateTime(start) : "Now"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Access until</dt>
                <dd className="font-semibold">{formatDateTime(renews)}</dd>
              </div>
              <p className="text-sm leading-relaxed text-muted">One payment, no renewal. Premium simply ends after {planLength(plan)}.</p>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <dt className="text-muted">Billed</dt>
                <dd>
                  {formatMoney(plan.price, "EUR", 2)} {billingInterval(plan)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{deferCharge ? "First charge" : "Next renewal"}</dt>
                <dd>{formatDate((deferCharge ? start : planExpiry(now, plan)).toISOString())}</dd>
              </div>
              {deferCharge && (
                <p className="text-sm leading-relaxed text-muted">
                  You still have Premium until {formatDate(start.toISOString())}, so nothing is charged today. Your card is saved and the
                  first {formatMoney(plan.price, "EUR", 2)} is taken when your current access ends. You won&apos;t lose any days.
                </p>
              )}
            </>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-3 font-display text-lg font-bold">
            <dt>Due today</dt>
            <dd>{formatMoney(deferCharge ? 0 : plan.price, "EUR", 2)}</dd>
          </div>
          {!oneOff && (
            <p className="text-xs leading-relaxed text-muted">Renews automatically until you cancel. Cancel any time and keep Premium until the end of the paid period.</p>
          )}
        </dl>
        <button
          type="button"
          onClick={pay}
          disabled={busy}
          className="h-12 rounded-xl bg-brand-600 font-display font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy
            ? "Opening secure checkout…"
            : oneOff
              ? `Pay ${formatMoney(plan.price, "EUR", 2)}`
              : deferCharge
                ? "Subscribe — nothing to pay today"
                : `Subscribe · ${formatMoney(plan.price, "EUR", 2)} ${billingInterval(plan)}`}
        </button>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}
