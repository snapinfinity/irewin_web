"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";

const FAILED = new Set(["failed", "cancelled"]);
const RETRY_MS = 3000;
const MAX_TRIES = 10;

/**
 * Where Dodo sends the visitor back after checkout (?payment_id=…&status=…).
 * The URL status is only a hint: the server re-checks the payment with Dodo
 * and grants Premium. If there's no payment id, we wait for the webhook to
 * update the membership, which the live session picks up.
 */
export function CheckoutSuccessView() {
  const params = useSearchParams();
  const router = useRouter();
  const { membership, confirmPayment } = useSession();
  const paymentId = params.get("payment_id");
  const [outcome, setOutcome] = useState<"waiting" | "failed" | "slow">(
    FAILED.has(params.get("status") ?? "") ? "failed" : "waiting",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A Dodo-paid membership started in the last 15 minutes = this checkout landed (covers the webhook-only path).
    const paidNow =
      !!membership?.source.startsWith("dodo") &&
      (paymentId ? membership.paymentId === paymentId : Date.now() - new Date(membership.startedAt).getTime() < 15 * 60_000);
    if (paidNow) router.replace("/account?activated=1");
  }, [membership, paymentId, router]);

  useEffect(() => {
    if (outcome !== "waiting") return;
    if (!paymentId) {
      const t = setTimeout(() => setOutcome("slow"), RETRY_MS * MAX_TRIES);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async (attempt: number) => {
      try {
        const result = await confirmPayment(paymentId);
        if (cancelled) return;
        if (result.status === "applied" || result.status === "already_applied") return; // the live session redirects
        if (result.status === "not_paid" && FAILED.has(result.paymentStatus ?? "")) return setOutcome("failed");
        if (result.status === "ignored") return setError(result.reason);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
      if (attempt >= MAX_TRIES) setOutcome("slow");
      else timer = setTimeout(() => check(attempt + 1), RETRY_MS);
    };
    check(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentId, outcome, confirmPayment]);

  return (
    <div className="container-page flex max-w-xl flex-col items-center gap-4 py-20 text-center">
      {outcome === "failed" ? (
        <>
          <CircleAlert className="h-10 w-10 text-red-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">Payment didn&apos;t go through</h1>
          <p className="text-muted">No money was taken. You can try again with another card.</p>
          <Link href="/premium" className="mt-2 flex h-11 items-center rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700">
            Back to Premium plans
          </Link>
        </>
      ) : outcome === "slow" ? (
        <>
          <LoaderCircle className="h-10 w-10 text-brand-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">Still confirming your payment</h1>
          <p className="text-muted">
            This is taking longer than usual. Premium will switch on automatically once Dodo Payments confirms it — check{" "}
            <Link href="/account" className="font-semibold text-brand-600 underline">My account</Link> in a minute.
          </p>
          {error && <p className="text-sm text-muted">Details: {error}</p>}
        </>
      ) : (
        <>
          <LoaderCircle className="h-10 w-10 animate-spin text-brand-600" />
          <h1 className="text-2xl font-extrabold tracking-tight">Confirming your payment…</h1>
          <p className="text-muted">Please keep this page open. It only takes a few seconds.</p>
        </>
      )}
    </div>
  );
}
