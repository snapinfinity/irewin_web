import { NextResponse } from "next/server";
import { applyPayment, dodo } from "@/lib/server/dodo";

/**
 * Dodo Payments webhook (Dodo dashboard → Developer → Webhooks →
 * https://<your-site>/api/webhooks/dodo). The signature is checked against
 * DODO_PAYMENTS_WEBHOOK_KEY using the raw body. A non-2xx reply makes Dodo
 * retry, so only real failures return 500.
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

  if (event.type !== "payment.succeeded") return NextResponse.json({ received: true });

  try {
    const result = await applyPayment(event.data);
    console.info(`[IREWIN] Dodo payment ${event.data.payment_id}:`, result);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error(`[IREWIN] Applying Dodo payment ${event.data.payment_id} failed:`, err);
    return NextResponse.json({ error: "Could not apply payment" }, { status: 500 });
  }
}
