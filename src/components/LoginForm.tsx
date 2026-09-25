"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { KeyRound, Mail, User } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { safeNext } from "@/lib/safe-redirect";

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, isLoggedIn, signIn } = useSession();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get("next"));

  // Already signed in → go straight on.
  useEffect(() => {
    if (ready && isLoggedIn) router.replace(next);
  }, [ready, isLoggedIn, next, router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim() || email.split("@")[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setError(null);
    // TEST MODE: any email/password is accepted. Replace with real auth later.
    signIn({ name, email });
    router.replace(next);
  }

  const input =
    "h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-base text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none";

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-surface p-1" role="tablist" aria-label="Account">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={clsx(
              "h-11 rounded-lg font-display text-[15px] font-semibold transition",
              mode === m ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {m === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your free account"}</h1>
      <p className="mt-1.5 text-[15px] text-muted">
        {next === "/premium" ? "Then choose a Premium plan to unlock every job." : "Log in to manage your membership."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {mode === "register" && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Full name
            <span className="relative flex items-center">
              <User className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
              <input name="name" autoComplete="name" placeholder="Aoife Murphy" className={input} />
            </span>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <span className="relative flex items-center">
            <Mail className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" className={input} required />
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Password
          <span className="relative flex items-center">
            <KeyRound className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
            <input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="At least 6 characters"
              className={input}
              required
            />
          </span>
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="h-12 rounded-xl bg-brand-600 font-display text-base font-semibold text-white hover:bg-brand-700">
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 rounded-lg bg-gold-soft px-3 py-2 text-center text-[13px] text-amber-900">
        Test mode: any email and password (6+ characters) will sign you in.
      </p>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/jobs" className="font-semibold text-brand-600">
          Browse jobs first
        </Link>
      </p>
    </div>
  );
}
