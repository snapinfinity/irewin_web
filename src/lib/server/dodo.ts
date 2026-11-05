import DodoPayments from "dodopayments";
import type { Payment } from "dodopayments/resources/payments";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { PLANS, getPlan, planExpiry } from "@/lib/data/plans";
import type { Plan, PlanId } from "@/lib/types";

/**
 * Dodo Payments (server only). DODO_PAYMENTS_ENVIRONMENT=test_mode uses the
 * test API and test cards; switch to live_mode (with live keys and live
 * product ids) to take real payments.
 */
export const dodoEnvironment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
const source = dodoEnvironment === "test_mode" ? "dodo_test" : "dodo";

let client: DodoPayments | undefined;

export function dodo(): DodoPayments {
  client ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: dodoEnvironment,
  });
  return client;
}

/** Older one-time Dodo products (1-hour/1-day passes, one-off Weekly/3 Months) — only to recognise payments made with them. */
export function productIdFor(planId: PlanId): string | undefined {
  const ids: Record<PlanId, string | undefined> = {
    "1h": process.env.DODO_PRODUCT_1H,
    "1d": process.env.DODO_PRODUCT_1D,
    "1w": process.env.DODO_PRODUCT_1W,
    "3m": process.env.DODO_PRODUCT_3M,
  };
  return ids[planId];
}

/** Recurring Dodo product per plan (npm run dodo:setup creates them): Daily renews every day, Weekly every week, 3 Months every 3 months. */
export function subscriptionProductIdFor(planId: PlanId): string | undefined {
  const ids: Record<PlanId, string | undefined> = {
    "1h": undefined, // the old 1-hour pass was one-off only
    "1d": process.env.DODO_SUBSCRIPTION_1D,
    "1w": process.env.DODO_SUBSCRIPTION_1W,
    "3m": process.env.DODO_SUBSCRIPTION_3M,
  };
  return ids[planId];
}

function planForSubscription(sub: Subscription): Plan | undefined {
  return PLANS.find((p) => subscriptionProductIdFor(p.id) === sub.product_id) ?? getPlan(String(sub.metadata?.planId ?? ""));
}

export type ApplyResult =
  | { status: "applied" | "already_applied"; expiresAt: string }
  | { status: "not_paid"; paymentStatus: string | null }
  | { status: "ignored"; reason: string };

/**
 * Legacy one-time payments: turns a succeeded payment into Premium on
 * users/{uid}. Idempotent via `payments/{paymentId}`. Subscription payments
 * are handled by syncSubscription instead.
 */
export async function applyPayment(payment: Payment): Promise<ApplyResult> {
  if (payment.status !== "succeeded") return { status: "not_paid", paymentStatus: payment.status ?? null };

  const uid = typeof payment.metadata?.uid === "string" ? payment.metadata.uid : null;
  const plan = getPlan(String(payment.metadata?.planId ?? ""));
  if (!uid || !plan) return { status: "ignored", reason: "Payment has no IREWIN uid/planId metadata" };

  const expectedProduct = productIdFor(plan.id);
  if (expectedProduct && !payment.product_cart?.some((item) => item.product_id === expectedProduct)) {
    return { status: "ignored", reason: `Payment is not for the ${plan.id} plan product` };
  }

  const db = adminDb();
  const paymentRef = db.collection("payments").doc(payment.payment_id);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction<ApplyResult>(async (tx: Transaction) => {
    const [paymentSnap, userSnap] = await Promise.all([tx.get(paymentRef), tx.get(userRef)]);
    if (paymentSnap.exists) {
      return { status: "already_applied", expiresAt: paymentSnap.get("expiresAt").toDate().toISOString() };
    }
    if (!userSnap.exists) throw new Error(`users/${uid} not found for payment ${payment.payment_id}`);

    const now = new Date();
    const current = userSnap.get("membership") as { status?: string; expiresAt?: Timestamp } | null;
    const currentExpiry = current?.expiresAt?.toDate();
    const from = current?.status !== "cancelled" && currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = Timestamp.fromDate(planExpiry(from, plan));

    tx.update(userRef, {
      membership: { planId: plan.id, status: "active", startedAt: Timestamp.fromDate(now), expiresAt, source, paymentId: payment.payment_id },
    });
    tx.set(paymentRef, {
      uid,
      planId: plan.id,
      amount: payment.total_amount,
      currency: payment.currency,
      environment: dodoEnvironment,
      checkoutSessionId: payment.checkout_session_id ?? null,
      customerEmail: payment.customer?.email ?? null,
      expiresAt,
      createdAt: Timestamp.fromDate(now),
    });
    return { status: "applied", expiresAt: expiresAt.toDate().toISOString() };
  });
}

/* ------------------------------------------------------------------ */
/* Subscriptions (recurring Premium)                                   */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
/** Renewals are charged at next_billing_date; keep access a little past it so a slightly late webhook never locks a paying member out. */
const RENEWAL_GRACE_MS = 2 * DAY;
/** While Dodo retries a failed renewal (past_due), the member keeps access this long past the billing date. */
const PAST_DUE_GRACE_MS = 3 * DAY;

export type SyncResult =
  | { status: "synced"; subscriptionStatus: string; active: boolean; expiresAt: string | null }
  | { status: "ignored"; reason: string };

/** Which IREWIN user a subscription belongs to: metadata first, then our own link, then the payment, then the customer's email. */
async function resolveUid(sub: Subscription, hintUid?: string | null): Promise<string | null> {
  if (typeof sub.metadata?.uid === "string" && sub.metadata.uid) return sub.metadata.uid;
  if (hintUid) return hintUid;
  const db = adminDb();
  const linked = await db.collection("subscriptions").doc(sub.subscription_id).get();
  if (linked.exists && typeof linked.get("uid") === "string") return linked.get("uid");
  const email = sub.customer?.email;
  if (email) {
    const byEmail = await db.collection("users").where("email", "==", email).limit(2).get();
    if (byEmail.size === 1) return byEmail.docs[0].id;
  }
  return null;
}

/**
 * Reads the subscription fresh from Dodo and mirrors it onto users/{uid}.membership
 * and subscriptions/{id}. Every subscription webhook, every renewal payment and the
 * return page call this, so it must be idempotent and safe in any order — it always
 * writes Dodo's current state, never applies a delta.
 */
export async function syncSubscription(subscriptionId: string, opts: { hintUid?: string | null } = {}): Promise<SyncResult> {
  const sub = await dodo().subscriptions.retrieve(subscriptionId);
  const plan = planForSubscription(sub);
  if (!plan) return { status: "ignored", reason: `Subscription ${subscriptionId} is not for an IREWIN plan (product ${sub.product_id})` };
  const uid = await resolveUid(sub, opts.hintUid);
  if (!uid) return { status: "ignored", reason: `No IREWIN user found for subscription ${subscriptionId}` };

  const now = Date.now();
  const nextBilling = new Date(sub.next_billing_date).getTime();
  const autoRenew = sub.status === "active" && !sub.cancel_at_next_billing_date;

  // Access window for this subscription right now. null = no access.
  let accessUntil: number | null = null;
  if (sub.status === "active") accessUntil = nextBilling + (autoRenew ? RENEWAL_GRACE_MS : 0);
  else if (sub.status === "past_due") accessUntil = nextBilling + PAST_DUE_GRACE_MS;
  const grantsAccess = accessUntil !== null && accessUntil > now;
  const membershipStatus = grantsAccess ? "active" : sub.status === "on_hold" || sub.status === "paused" ? "on_hold" : "cancelled";

  const db = adminDb();
  const userRef = db.collection("users").doc(uid);
  const subRef = db.collection("subscriptions").doc(sub.subscription_id);

  return db.runTransaction<SyncResult>(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error(`users/${uid} not found for subscription ${sub.subscription_id}`);
    const current = userSnap.get("membership") as
      | { subscriptionId?: string; startedAt?: Timestamp; autoRenew?: boolean; status?: string; expiresAt?: Timestamp }
      | null;
    const sameSub = current?.subscriptionId === sub.subscription_id;
    // Two subscriptions can overlap (an old plan with auto-renew off runs out while the new one starts).
    // The membership follows the auto-renewing one; an ending plan never replaces it.
    const currentRenews = !!current?.autoRenew && current.status === "active" && (current.expiresAt?.toMillis() ?? 0) > now;
    const yieldsToCurrent = !sameSub && currentRenews && !autoRenew;

    tx.set(
      subRef,
      {
        uid,
        planId: plan.id,
        productId: sub.product_id,
        customerId: sub.customer?.customer_id ?? null,
        customerEmail: sub.customer?.email ?? null,
        status: sub.status,
        cancelAtNextBillingDate: sub.cancel_at_next_billing_date,
        nextBillingDate: Timestamp.fromMillis(nextBilling),
        previousBillingDate: sub.previous_billing_date ? Timestamp.fromDate(new Date(sub.previous_billing_date)) : null,
        amount: sub.recurring_pre_tax_amount,
        currency: sub.currency,
        environment: dodoEnvironment,
        createdAt: Timestamp.fromDate(new Date(sub.created_at)),
        updatedAt: Timestamp.fromMillis(now),
      },
      { merge: true },
    );

    // An old, ended subscription must never overwrite a different, current membership.
    if ((!sameSub && !grantsAccess) || yieldsToCurrent) {
      return { status: "synced", subscriptionStatus: sub.status, active: false, expiresAt: null };
    }

    const expiresAt = Timestamp.fromMillis(grantsAccess ? accessUntil! : now);
    tx.update(userRef, {
      membership: {
        planId: plan.id,
        status: membershipStatus,
        startedAt: sameSub && current?.startedAt ? current.startedAt : Timestamp.fromDate(new Date(sub.created_at)),
        expiresAt,
        source,
        paymentId: null,
        subscriptionId: sub.subscription_id,
        subscriptionStatus: sub.status,
        autoRenew,
        nextBillingDate: autoRenew ? Timestamp.fromMillis(nextBilling) : null,
      },
    });
    return { status: "synced", subscriptionStatus: sub.status, active: grantsAccess, expiresAt: expiresAt.toDate().toISOString() };
  });
}

/**
 * Re-syncs every active subscription this customer has in Dodo (newest last), not just the one on
 * their membership — so a new plan is picked up even if its return page or webhook never arrived.
 */
export async function syncAllSubscriptions(uid: string, customerId: string): Promise<SyncResult[]> {
  const subs: Subscription[] = [];
  for await (const s of dodo().subscriptions.list({ customer_id: customerId, status: "active" })) {
    subs.push(s as unknown as Subscription);
  }
  subs.sort((a, b) => a.created_at.localeCompare(b.created_at));
  const results: SyncResult[] = [];
  for (const s of subs) {
    if ((await resolveUid(s, null)) !== uid) continue; // never touch someone else's subscription
    results.push(await syncSubscription(s.subscription_id, { hintUid: uid }));
  }
  return results;
}

/** The subscription on this user's membership, verified to belong to them. */
export async function ownedSubscription(uid: string): Promise<Subscription | null> {
  const user = await adminDb().collection("users").doc(uid).get();
  const subscriptionId = user.get("membership.subscriptionId");
  if (typeof subscriptionId !== "string" || !subscriptionId) return null;
  const sub = await dodo().subscriptions.retrieve(subscriptionId);
  return (await resolveUid(sub)) === uid ? sub : null;
}
