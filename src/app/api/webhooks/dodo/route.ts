import { NextResponse } from "next/server";
import { applyPayment, dodo, syncSubscription } from "@/lib/server/dodo";

/**
 * Dodo Payments webhook (Dodo dashboard → Developer → Webhooks →
 * https://<your-site>/api/webhooks/dodo). The signature is checked against
 * DODO_PAYMENTS_WEBHOOK_KEY using the raw body. A non-2xx reply makes Dodo
 * retry, so only real failures return 500.
 *
 * - subscription.* (active, renewed, on_hold, past_due, cancelled, expired,
 *   failed, paused, plan_changed, updated…) → re-sync that subscription.
 * - payment.succeeded for a subscription (every renewal) → re-sync it too.
 * - payment.succeeded without a subscription → legacy one-off plan.
 */
export async function POST(request: Request) {
  const body = await request.text();
  let event;
  try {
    event = dodo().webhooks.unwrap(body, {
      headers: {
        "webhook-id": request.headers.get("webhook-id") ?? "",
        "webhook-signature": request.headers.get("webhook-signature") ?? "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      },
    });
  } catch (err) {
    console.warn("[IREWIN] Rejected Dodo webhook (bad signature):", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (event.type.startsWith("subscription.")) {
      const sub = event.data as { subscription_id: string; metadata?: Record<string, unknown> };
      const result = await syncSubscription(sub.subscription_id);
      console.info(`[IREWIN] Dodo ${event.type} ${sub.subscription_id}:`, result);
      return NextResponse.json({ received: true, result });
    }

    if (event.type === "payment.succeeded") {
      const payment = event.data;
      if (payment.subscription_id) {
        const uid = typeof payment.metadata?.uid === "string" ? payment.metadata.uid : null;
        const result = await syncSubscription(payment.subscription_id, { hintUid: uid });
        console.info(`[IREWIN] Dodo renewal payment ${payment.payment_id}:`, result);
        return NextResponse.json({ received: true, result });
      }
      const result = await applyPayment(payment);
      console.info(`[IREWIN] Dodo payment ${payment.payment_id}:`, result);
      return NextResponse.json({ received: true, result });
    }
  } catch (err) {
    console.error(`[IREWIN] Handling Dodo ${event.type} failed:`, err);
    return NextResponse.json({ error: "Could not apply event" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
