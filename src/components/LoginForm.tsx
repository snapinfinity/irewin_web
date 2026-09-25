"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Shamrock } from "@/components/Logo";
import { useSession } from "@/lib/auth/useSession";
import { safeNext } from "@/lib/safe-redirect";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, isLoggedIn, signInWithGoogle } = useSession();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get("next"));

  // Already signed in → go straight on.
  useEffect(() => {
    if (ready && isLoggedIn && !busy) router.replace(next);
  }, [ready, isLoggedIn, busy, next, router]);

  async function onGoogle() {
    setBusy(true);
    setError(null);
    const result = await signInWithGoogle({ marketingOptIn });
    if (result.ok) {
      router.replace(result.isNewUser && next === "/jobs" ? "/premium" : next);
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dark">
          <Shamrock className="h-8 w-8 text-accent" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Sign in to IREWIN</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {next === "/premium" ? "Then choose a Premium plan to unlock every job." : "New here? Your free account is created automatically."}
        </p>
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy || !ready}
        className="mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 font-display text-base font-semibold text-ink shadow-sm transition hover:border-brand-600 hover:bg-surface disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
        {busy ? "Signing in…" : "Continue with Google"}
      </button>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-3.5 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#0f766e]"
        />
        <span>Email me new jobs, career tips and IREWIN offers. You can unsubscribe any time from your account.</span>
      </label>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        We only use your Google name, email and photo to create your IREWIN account.
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/jobs" className="font-semibold text-brand-600">
          Browse jobs first
        </Link>
      </p>
    </div>
  );
}
