import DodoPayments from "dodopayments";
import type { Payment } from "dodopayments/resources/payments";
import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";
import { getPlan } from "@/lib/data/plans";
import { addMonths } from "@/lib/format";
import type { PlanId } from "@/lib/types";

/**
 * Dodo Payments (server only). DODO_PAYMENTS_ENVIRONMENT=test_mode uses the
 * test API and test cards; switch to live_mode (with live keys and live
 * product ids) to take real payments.
 */
export const dodoEnvironment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

let client: DodoPayments | undefined;

export function dodo(): DodoPayments {
  client ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
    environment: dodoEnvironment,
  });
  return client;
}

/** One one-time Dodo product per plan, created in the Dodo dashboard with the same EUR price as src/lib/data/plans.ts. */
export function productIdFor(planId: PlanId): string | undefined {
  const ids: Record<PlanId, string | undefined> = {
    "1m": process.env.DODO_PRODUCT_1M,
    "3m": process.env.DODO_PRODUCT_3M,
    "6m": process.env.DODO_PRODUCT_6M,
    "12m": process.env.DODO_PRODUCT_12M,
  };
  return ids[planId];
}

export type ApplyResult =
  | { status: "applied" | "already_applied"; expiresAt: string }
  | { status: "not_paid"; paymentStatus: string | null }
  | { status: "ignored"; reason: string };

/**
 * Turns a succeeded Dodo payment into Premium on users/{uid}. Called by both
 * the webhook and the return-page confirm route, so it is idempotent: each
 * payment is recorded in `payments/{paymentId}` and only ever applied once.
 * Buying again while Premium is active extends from the current expiry.
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
    const expiresAt = Timestamp.fromDate(addMonths(from, plan.months));
    const source = dodoEnvironment === "test_mode" ? "dodo_test" : "dodo";

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
