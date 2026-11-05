"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CircleAlert, CircleCheck, Crown, LogOut, Mail } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { billingInterval, getPlan } from "@/lib/data/plans";
import { formatDate, formatMoney } from "@/lib/format";
import { FREE_JOB_PREVIEW_COUNT } from "@/lib/constants";

const TEST_MODE = process.env.NEXT_PUBLIC_DODO_TEST_MODE !== "false";

export function AccountView() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile, membership, isPremium, signOut, cancelMembership, setMarketingOptIn, setAutoRenew, openBillingPortal, testSubscription } = useSession();
  const [testInfo, setTestInfo] = useState<string | null>(null);
  async function runTest(action: "test_renew_soon" | "refresh") {
    setTestInfo("Working…");
    try {
      const r = await testSubscription(action);
      setTestInfo(JSON.stringify(r, null, 2));
    } catch (err) {
      setTestInfo(err instanceof Error ? err.message : String(err));
    }
  }
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [billingBusy, setBillingBusy] = useState<null | "cancel" | "resume" | "portal">(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const plan = getPlan(membership?.planId);
  const activated = params.get("activated") === "1";
  const subscription = membership?.subscriptionId ? membership : null;
  const paymentProblem = !!subscription && (subscription.subscriptionStatus === "past_due" || subscription.status === "on_hold");

  async function billing(action: "cancel" | "resume" | "portal") {
    setBillingBusy(action);
    setBillingError(null);
    try {
      if (action === "portal") await openBillingPortal(); // navigates away
      else await setAutoRenew(action === "resume");
      setConfirmCancel(false);
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      if (action !== "portal") setBillingBusy(null);
    }
  }

  return (
    <div className="container-page flex max-w-3xl flex-col gap-6 py-10 sm:py-14">
      {activated && isPremium && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-700">
          <CircleCheck className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold">Premium unlocked!</p>
            <p className="text-[15px]">Every job is now visible and you can apply directly with employers.</p>
            <Link href="/jobs" className="mt-2 inline-block font-semibold underline">
              Browse all jobs
            </Link>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My account</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google profile photo
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 font-display text-xl font-bold text-brand-600">
            {user?.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1">
          <p className="font-display text-lg font-semibold">{user?.name}</p>
          <p className="text-muted">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold text-ink-2 hover:bg-surface"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      {profile && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Account details</h2>
          <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Signed in with</dt>
              <dd className="font-semibold">Google{profile.emailVerified ? " · email verified" : ""}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Member since</dt>
              <dd className="font-semibold">{formatDate(profile.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Last sign-in</dt>
              <dd className="font-semibold">{formatDate(profile.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Sign-ins</dt>
              <dd className="font-semibold">{profile.loginCount}</dd>
            </div>
          </dl>
        </section>
      )}

      {profile && (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5 text-brand-600" /> Email preferences
          </h2>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink-2">
            <input
              type="checkbox"
              checked={profile.marketingOptIn}
              disabled={savingPrefs}
              onChange={async (e) => {
                setSavingPrefs(true);
                await setMarketingOptIn(e.target.checked);
                setSavingPrefs(false);
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-[#0f766e]"
            />
            <span>
              Send me new jobs, career tips and IREWIN offers by email.
              {profile.marketingOptIn && profile.marketingOptInAt && (
                <span className="block text-sm text-muted">Subscribed on {formatDate(profile.marketingOptInAt)}.</span>
              )}
            </span>
          </label>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Crown className="h-5 w-5 text-amber-600" /> Membership
        </h2>
        {paymentProblem && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">Your last renewal payment didn&apos;t go through</p>
              <p>
                {subscription?.status === "on_hold"
                  ? "Premium is paused until the card is updated. Update it and we'll switch Premium back on."
                  : "We'll try the card again shortly. Update it now to avoid losing Premium."}
              </p>
              <button type="button" onClick={() => billing("portal")} disabled={!!billingBusy} className="mt-2 font-semibold underline disabled:opacity-60">
                {billingBusy === "portal" ? "Opening…" : "Update payment method"}
              </button>
            </div>
          </div>
        )}
        {isPremium && membership ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted">Plan</dt>
                <dd className="font-semibold">{plan ? `Premium · ${plan.name}` : "Premium"}</dd>
                {subscription && plan && (
                  <dd className="text-sm text-muted">
                    {formatMoney(plan.price, "EUR", 2)} {billingInterval(plan)}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-sm text-muted">Started</dt>
                <dd className="font-semibold">{formatDate(membership.startedAt)}</dd>
              </div>
              <div>
                {subscription?.autoRenew ? (
                  <>
                    <dt className="text-sm text-muted">Renews on</dt>
                    <dd className="font-semibold">{formatDate(subscription.nextBillingDate)}</dd>
                  </>
                ) : (
                  <>
                    <dt className="text-sm text-muted">{subscription ? "Ends on" : "Active until"}</dt>
                    <dd className="font-semibold">
                      {plan && !plan.recurring
                        ? new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" }).format(
                            new Date(membership.expiresAt),
                          )
                        : formatDate(membership.expiresAt)}
                    </dd>
                    {subscription && <dd className="text-sm text-muted">Auto-renew is off</dd>}
                  </>
                )}
              </div>
            </dl>

            {subscription ? (
              <div className="flex flex-col gap-3">
                {confirmCancel ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                    <p className="text-[15px] text-ink-2">
                      Turn off auto-renew? You&apos;ll keep Premium until <span className="font-semibold">{formatDate(subscription.nextBillingDate)}</span> and
                      won&apos;t be charged again.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => billing("cancel")}
                        disabled={!!billingBusy}
                        className="flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {billingBusy === "cancel" ? "Cancelling…" : "Yes, cancel auto-renew"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="flex h-11 items-center justify-center rounded-xl border border-line px-5 font-semibold text-ink-2 hover:bg-white"
                      >
                        Keep my plan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {subscription.autoRenew ? (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        className="flex h-11 items-center justify-center rounded-xl border border-line px-5 font-semibold text-ink-2 hover:bg-surface"
                      >
                        Cancel auto-renew
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => billing("resume")}
                        disabled={!!billingBusy}
                        className="flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {billingBusy === "resume" ? "Turning on…" : "Turn auto-renew back on"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => billing("portal")}
                      disabled={!!billingBusy}
                      className="flex h-11 items-center justify-center rounded-xl border border-line px-5 font-semibold text-ink-2 hover:bg-surface disabled:opacity-60"
                    >
                      {billingBusy === "portal" ? "Opening…" : "Payment method & invoices"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/premium" className="flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700">
                  Switch to auto-renew
                </Link>
                {TEST_MODE && (
                  <button
                    type="button"
                    onClick={() => cancelMembership()}
                    className="flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-semibold text-muted hover:bg-surface"
                  >
                    Remove Premium (test)
                  </button>
                )}
              </div>
            )}
            {TEST_MODE && subscription && (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-300 bg-gold-soft p-4 text-amber-900">
                <p className="text-sm font-semibold">Test mode: renewal check</p>
                <p className="text-sm">
                  &quot;Renew in 2 min&quot; makes Dodo charge the next renewal 2 minutes from now. Wait about 3 minutes, then press &quot;Refresh from Dodo&quot;:
                  the previous billing date should move to today and &quot;Renews on&quot; should jump one billing period ahead.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => runTest("test_renew_soon")} className="h-10 rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold hover:bg-amber-50">
                    Renew in 2 min (test)
                  </button>
                  <button type="button" onClick={() => runTest("refresh")} className="h-10 rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold hover:bg-amber-50">
                    Refresh from Dodo
                  </button>
                </div>
                {testInfo && <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-ink-2">{testInfo}</pre>}
              </div>
            )}
            {billingError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {billingError}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-muted">You&apos;re on the free plan. You can see {FREE_JOB_PREVIEW_COUNT} preview jobs in every category; Premium unlocks every job and the apply button.</p>
            <Link href="/premium" className="flex h-11 w-fit items-center gap-2 rounded-xl bg-accent px-5 font-display font-semibold text-dark hover:bg-accent-soft">
              <Crown className="h-4 w-4" /> See Premium plans
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
